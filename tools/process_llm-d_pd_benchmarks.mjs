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


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correctly resolve the private directory relative to scripts/
const PRIVATE_DIR = path.resolve(__dirname, '../private/PD Disaggregation');
const OUTPUT_FILE = path.resolve(__dirname, '../public/data/llm-d-benchmarks.json');

// Simplified Parser (Sync version for script)
function parseBenchmark(fileContent, folderName, filename) {
    let json;
    try {
        json = JSON.parse(fileContent);
    } catch (e) {
        console.warn(`Failed to parse JSON in ${filename}: ${e.message}`);
        return null; // Skip invalid JSON
    }

    // Default values
    let architecture = 'unknown';
    let pdRatio = 'N/A';
    let totalChips = 0;
    let hardware = 'H100'; // Assumption
    let prefillNodes = 0;
    let decodeNodes = 0;
    let configuration = 'Unknown';
    let prefillTp;
    let decodeTp;

    const parts = folderName.split('_');
    
    // Disaggregated Logic
    if (folderName.includes('setup_modelservice')) {
        architecture = 'disaggregated';
        const idx = parts.indexOf('modelservice');
        // Check array bounds closely based on split
        // e.g. pd-disaggregation.setup_modelservice_NA_NA_1_4_3_4
        // parts: [pd-disaggregation.setup, modelservice, NA, NA, 1, 4, 3, 4]
        // idx = 1
        
        if (idx !== -1 && parts.length >= idx + 7) {
            const pNodeStr = parts[idx + 3];
            const pTpStr = parts[idx + 4];
            const dNodeStr = parts[idx + 5];
            const dTpStr = parts[idx + 6];

            prefillNodes = parseInt(pNodeStr, 10) || 0;
            decodeNodes = parseInt(dNodeStr, 10) || 0;
            const pTp = parseInt(pTpStr, 10) || 8;
            const dTp = parseInt(dTpStr, 10) || 8;
            
            pdRatio = `${prefillNodes}:${decodeNodes}`;
            totalChips = (prefillNodes * pTp) + (decodeNodes * dTp);
            
            // Capture TP for metadata
            prefillTp = pTp;
            decodeTp = dTp;
            
            // Construct Configuration Label: "4: 1P-TP4 3D-TP4"
            configuration = `${prefillNodes + decodeNodes}: ${prefillNodes}P-TP${pTp} ${decodeNodes}D-TP${dTp}`;
        }
    } 
    // Aggregated Logic
    else if (folderName.includes('setup_standalone')) {
        architecture = 'aggregated';
        const idx = parts.indexOf('standalone');
        // e.g. pd-disaggregation.setup_standalone_1_2_NA...
        // parts: [pd-disaggregation.setup, standalone, 1, 2, NA...]
        if (idx !== -1 && parts.length >= idx + 3) {
             const nodes = parseInt(parts[idx + 1], 10) || 1;
             const tp = parseInt(parts[idx + 2], 10) || 8;
             totalChips = nodes * tp;
             pdRatio = 'Aggregated';
             
             // Construct Configuration Label: "1 TP8"
             configuration = `${nodes} TP${tp}`;
        }
    }

    // Metrics Extraction
    const throughput = json.total_token_throughput || json.output_throughput || 0;
    const reqRate = (json.request_rate === 'inf') ? (json.request_throughput || 0) : parseFloat(json.request_rate);
    const latency = json.mean_e2el_ms || 0;
    const ttft = json.mean_ttft_ms || 0;
    const tpot = json.mean_tpot_ms || 0;
    const itl = json.mean_itl_ms || 0;

    // Concurrency often in 'max_concurrency' or derived from file name? JSON has it.
    const concurrency = json.max_concurrency || 0;

    // Workload
    const isl = (json.total_input_tokens && json.completed && json.completed > 0) ? Math.round(json.total_input_tokens / json.completed) : 0;
    const osl = (json.total_output_tokens && json.completed && json.completed > 0) ? Math.round(json.total_output_tokens / json.completed) : 0;
    
    // Model ID cleanup
    let modelName = json.model_id || 'Unknown';
    if (modelName.includes('/')) modelName = modelName.split('/').pop();
    // Strip common suffixes
    modelName = modelName.replace(/-instruct$/i, '').replace(/-chat$/i, ''); 

    return {
        id: `llmd-${folderName}-${filename.replace('.json','')}`,
        model: modelName,
        model_name: modelName,
        hardware: hardware,
        accelerator_count: totalChips,
        accelerator_type: hardware, // Assuming H100 based on file context
        timestamp: json.date ? json.date : new Date().toISOString(),
        
        // Custom Fields for App Logic
        architecture: architecture,
        pd_ratio: pdRatio,
        configuration: configuration,
        prefill_node_count: prefillNodes,
        decode_node_count: decodeNodes,
        prefill_tp: prefillTp,
        decode_tp: decodeTp,
        
        metrics: {
            throughput: throughput,
            request_rate: reqRate,
            latency: { mean: latency, p50: json.median_e2el_ms || latency, p99: 0 },
            ttft: { mean: ttft, p50: json.median_ttft_ms || 0 },
            tpot: tpot,
            itl: itl,
            e2e_latency: latency,
            time_per_output_token: tpot, // Critical for chart rendering (x-axis)
            ttft_ms: ttft, // key for filter logic
            tpot_ms: tpot,
            itl_ms: itl,
            error_count: 0
        },

        workload: {
            input_tokens: isl,
            output_tokens: osl,
            target_qps: reqRate,
            concurrency: concurrency
        },
        
        source: 'llm-d-benchmark',
        source_info: {
            type: 'local_file', 
            origin: `llm-d:${folderName}`,
            file_identifier: filename
        },
        metadata: {
            tensor_parallelism: (architecture === 'disaggregated') ? Math.max(prefillTp || 8, decodeTp || 8) : (parseInt(folderName.split('_')[folderName.split('_').indexOf('standalone') + 2] || 8)),
            prefill_tp: (typeof prefillTp !== 'undefined') ? prefillTp : undefined,
            decode_tp: (typeof decodeTp !== 'undefined') ? decodeTp : undefined,
            configuration: configuration,
            model_name: modelName,
            hardware: hardware,
            precision: 'Unknown',
            backend: 'vllm'
        },
        filename: filename
    };
}

// Main Execution
try {
    console.log(`Scanning local benchmarks in: ${PRIVATE_DIR}`);

    if (!fs.existsSync(PRIVATE_DIR)) {
        console.error(`Error: Private directory does not exist at ${PRIVATE_DIR}`);
        console.error("Please unzip the benchmark data into 'dev/prism/private/PD Disaggregation'.");
        process.exit(1);
    }

    const scenarios = fs.readdirSync(PRIVATE_DIR).filter(file => {
        return fs.statSync(path.join(PRIVATE_DIR, file)).isDirectory();
    });

    console.log(`Found ${scenarios.length} scenario folders.`);

    const allData = [];

    scenarios.forEach(scenarioName => {
        const scenarioPath = path.join(PRIVATE_DIR, scenarioName);
        const resultsPath = path.join(scenarioPath, 'results');
        
        if (fs.existsSync(resultsPath)) {
            // results/ often has subfolders for each run, e.g. vllm-benchmark.../
            const runs = fs.readdirSync(resultsPath).filter(f => fs.statSync(path.join(resultsPath, f)).isDirectory());
            
            runs.forEach(runName => {
                const runPath = path.join(resultsPath, runName);
                const files = fs.readdirSync(runPath).filter(f => f.endsWith('.json'));
                
                files.forEach(file => {
                    const filePath = path.join(runPath, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const entry = parseBenchmark(content, scenarioName, file);
                    if (entry) {
                        allData.push(entry);
                    }
                });
            });
        }
    });

    console.log(`Parsed ${allData.length} total benchmark entries.`);
    
    // Ensure public/data exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`Successfully wrote data to: ${OUTPUT_FILE}`);

} catch (err) {
    console.error("Script failed:", err);
    process.exit(1);
}
