// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { listFolderRecursive, fetchFileContent, parseDriveMetadata, findFolderByName } from '../utils/googleDrive';
import { parseJsonEntry, parseLpgRequestLog, parseLpgLifecycleMetrics, normalizeModelName } from '../utils/dataParser';

export const useLLMD = ({ setData, setSelectedSources, setAvailableSources, setDriveLoading, setDriveStatus, setDriveProgress, setDriveError, enableLLMDResults, setSelectedBenchmarks, API_KEY }) => {
        const syncDriveData = async () => {
            if (!enableLLMDResults) return;
    
            console.log("[Drive Sync] Checking for local archives first...");
            
            setDriveLoading(true);
            setDriveProgress(0);
            setDriveError(null);
    
            try {
                // 1. Attempt to load from static JSON file first
                try {
                    setDriveStatus("Checking for local archive...");
                    const localRes = await fetch('/data/archive/llmd_results/archived_drive_data.json');
                    if (localRes.ok) {
                        const localData = await localRes.json();
                        if (Array.isArray(localData) && localData.length > 0) {
                            console.log(`Loaded ${localData.length} entries from local archive.`);
                            setDriveStatus(`Loaded ${localData.length} benchmarks from local archive.`);
                            
                            setData(prev => {
                                const others = prev.filter(d => d.source !== 'llmd_drive');
                                return [...others, ...localData.map((e, idx) => {
                                    const newE = { ...e, id: `drive-${idx}`, source: 'llmd_drive' };

                                    // Clean the model name for display
                                    newE.model = normalizeModelName(newE.model || newE.model_name || 'Unknown');

                                    // Hoist Metrics (Critical for Dashboard Chart/Aggregation)
                                    if (newE.metrics) {
                                        newE.throughput = Number(newE.metrics.throughput || newE.metrics.total_token_throughput || 0);
                                        newE.tokens_per_second = newE.throughput; // Chart compatibility
                                        
                                        newE.latency = newE.metrics.latency || newE.latency || { mean: 0, p50: 0, p99: 0 };
                                        if (newE.latency && typeof newE.latency.mean !== 'number') newE.latency.mean = Number(newE.latency.mean || 0);
                                        
                                        newE.ttft = newE.metrics.ttft || newE.ttft || { mean: 0, p50: 0 };
                                        if (newE.ttft && typeof newE.ttft.mean !== 'number') newE.ttft.mean = Number(newE.ttft.mean || 0);

                                        newE.qps = Number(newE.workload?.target_qps || newE.metrics.request_rate || 0);
                                        newE.time_per_output_token = Number(newE.metrics.time_per_output_token || newE.metrics.tpot || newE.metrics.mean_tpot_ms || 0);
                                        newE.tpot = newE.time_per_output_token;
                                        newE.ntpot = newE.time_per_output_token;
                                        
                                        // Ensure nested metrics match for chart getVal(metrics.ntpot)
                                        newE.metrics.ntpot = newE.ntpot;
                                        newE.metrics.throughput = newE.throughput;
                                        newE.metrics.tokens_per_second = newE.throughput;
                                    }

                                    // Hoist Workload (Critical for Grouping)
                                    if (newE.workload) {
                                        newE.isl = newE.workload.input_tokens || newE.isl || 0;
                                        newE.osl = newE.workload.output_tokens || newE.osl || 0;
                                    }

                                    // Ensure model_name is at root for filters
                                    newE.model_name = normalizeModelName(newE.metadata?.model_name || newE.model_name || 'Unknown Model');
                                    newE.hardware = newE.metadata?.hardware || newE.hardware || 'Unknown';
                                    return newE;
                                })];
                            });
                            
                            
                            setAvailableSources(prev => new Set([...prev, 'llmd_drive']));
                            setSelectedSources(prev => new Set([...prev, 'llmd_drive']));
                            setDriveLoading(false);
                            return;
                        }
                    }
                } catch (err) {
                    console.log("No local archive found or error loading it. Falling back to live Drive scan.", err);
                }
    
                // 1. Find BenchmarkData Folder
                // Use ID if provided (preferred for "Anyone with the link" folders which are not searchable)
                const FOLDER_ID = import.meta.env.VITE_BENCHMARK_FOLDER_ID || import.meta.env.REACT_APP_BENCHMARK_FOLDER_ID;
                let rootId = FOLDER_ID;
    
                if (!rootId) {
                    console.log("Searching for BenchmarkData folder (No ID provided)...");
                    rootId = await findFolderByName('BenchmarkData', null, API_KEY);
                } else {
                    console.log(`Using configured BenchmarkData ID: ${rootId}`);
                }
                
                if (!rootId) {
                    throw new Error("Folder 'BenchmarkData' not found. Please ensure it is shared with the API Key or Public. Try adding REACT_APP_BENCHMARK_FOLDER_ID to .env.local for direct access.");
                }
                
                // 2. Scan recursively
                setDriveStatus("Scanning folder structure...");
                console.log("Scanning files recursively...");
                const files = await listFolderRecursive(rootId, API_KEY, (filesFound, foldersScanned) => {
                    setDriveProgress(filesFound);
                    setDriveStatus(`Scanning... Found ${filesFound} metrics files (Scanned ${foldersScanned} folders)`);
                });
                console.log(`Found ${files.length} files.`);
                setDriveStatus(`Scan complete. Found ${files.length} total files.`);
                
                // 3. Filter for Lifecycle Metrics
                const metricsFiles = files.filter(f => f.name === 'per_request_lifecycle_metrics.json');
                
                if (metricsFiles.length === 0) {
                    console.warn("No lifecycle metrics found.");
                    setDriveError(`No 'per_request_lifecycle_metrics.json' files found in ${files.length} scanned files.`);
                    setDriveLoading(false);
                    return;
                }
    
                setDriveStatus(`Found ${metricsFiles.length} benchmark files. Parsing...`);
                const newEntries = [];
                
                // 4. Fetch & Parse Each
                // Batching to avoid rate limits
                const BATCH_SIZE = 5;
                for (let i = 0; i < metricsFiles.length; i += BATCH_SIZE) {
                    const batch = metricsFiles.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch.map(async (file) => {
                        try {
                            // Find parent folder name for metadata
                            // file.parents[0] is ID. We need name. 
                            // The listFolderRecursive returns flat list, we can try to find parent in it if it was scanned?
                            // Actually listFolderRecursive returns everything. 
                            const parentFolder = files.find(f => f.id === file.parents?.[0]);
                            const runName = parentFolder ? parentFolder.name : 'Unknown';
                            
                            // Parse Metadata from Folder Name
                            const runMeta = parseDriveMetadata(runName);
                            
                            const content = await fetchFileContent(file.id, API_KEY);
                            const json = JSON.parse(content);
                            
                            // Use appropriate parser based on JSON structure
                            let parsed = [];
                            if (Array.isArray(json)) {
                                 parsed = parseLpgRequestLog(json, runName, {
                                    model: runMeta?.model,
                                    timestamp: runMeta?.timestamp
                                 });
                            } else {
                                 parsed = parseLpgLifecycleMetrics(json, runName, {
                                    model: runMeta?.model,
                                    timestamp: runMeta?.timestamp,
                                    // Could map hardware if encoded in folder, but currently not in the parser defaults
                                });
                            }
                            
                            parsed.forEach(e => {
                                e.source = 'llmd_drive';

                                // Clean the model name for display
                                e.model = normalizeModelName(e.model || e.model_name || 'Unknown');

                                // Hoist Metrics (Critical for Dashboard Chart/Aggregation)
                                if (e.metrics) {
                                    e.throughput = Number(e.metrics.throughput || e.metrics.total_token_throughput || 0);
                                    e.tokens_per_second = e.throughput; // Chart compatibility
                                    
                                    e.latency = e.metrics.latency || e.latency || { mean: 0, p50: 0, p99: 0 };
                                    if (e.latency && typeof e.latency.mean !== 'number') e.latency.mean = Number(e.latency.mean || 0);
                                    
                                    e.ttft = e.metrics.ttft || e.ttft || { mean: 0, p50: 0 };
                                    if (e.ttft && typeof e.ttft.mean !== 'number') e.ttft.mean = Number(e.ttft.mean || 0);

                                    e.qps = Number(e.workload?.target_qps || e.metrics.request_rate || 0);
                                    e.time_per_output_token = Number(e.metrics.time_per_output_token || e.metrics.tpot || e.metrics.mean_tpot_ms || 0);
                                    e.tpot = e.time_per_output_token;
                                    e.ntpot = e.time_per_output_token;

                                    // Ensure nested metrics match for chart getVal(metrics.ntpot)
                                    e.metrics.ntpot = e.ntpot;
                                    e.metrics.throughput = e.throughput;
                                    e.metrics.tokens_per_second = e.throughput;
                                }

                                // Hoist Workload (Critical for Grouping)
                                if (e.workload) {
                                    e.isl = e.workload.input_tokens || e.isl || 0;
                                    e.osl = e.workload.output_tokens || e.osl || 0;
                                }

                                // Ensure model_name is at root for filters
                                e.model_name = normalizeModelName(e.metadata?.model_name || e.model_name || 'Unknown Model');
                                e.hardware = e.metadata?.hardware || e.hardware || 'Unknown';
                                e.source_info = {
                                    type: 'drive',
                                    origin: runName || 'unknown',
                                    file_identifier: runName,
                                    raw_url: `https://drive.google.com/drive/folders/${parentFolder?.id}`
                                };
                                if (runMeta) {
                                    e.workload.input_tokens = runMeta.input_tokens;
                                    e.workload.output_tokens = runMeta.output_tokens;
                                }
                                newEntries.push(e);
                            });
                            
                        } catch (err) {
                            console.warn(`Failed to parse ${file.name}`, err);
                        }
                    }));
                    
                    // Update Progress
                    setDriveProgress((i + batch.length));
                }
    
                console.log(`Parsed ${newEntries.length} drive benchmarks.`);
                
                setData(prev => {
                    // Remove old drive data if any
                    const others = prev.filter(d => d.source !== 'llmd_drive');
                    return [...others, ...newEntries.map((e, idx) => ({ ...e, id: `drive-${idx}` }))]; // ID conflict fix
                });
                
                
                setAvailableSources(prev => new Set([...prev, 'llmd_drive']));
                setSelectedSources(prev => new Set([...prev, 'llmd_drive']));
    
            } catch (e) {
                console.error("Drive Sync Failed:", e);
                setDriveError(e.message);
            } finally {
                setDriveLoading(false);
            }
        };
    return { syncDriveData };
};
