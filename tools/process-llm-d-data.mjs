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


// tools/process-llm-d-data.mjs
// Use: node --env-file=.env.local tools/process-llm-d-data.mjs

import fs from 'fs';
import path from 'path';
import { processJsonArrayStream } from '../src/utils/jsonStreamParser.js';
import { createEntry } from '../src/utils/dataParser.js';

// Use the MIRROR directory now
const ARCHIVE_DIR = 'private/benchmark_data_mirror';
const REPORT_FILE = 'drive_scan_report.md';

// Helper to recursively find files
function findFiles(dir, fileName, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findFiles(filePath, fileName, fileList);
        } else if (file === fileName) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

// Locate Experiment Root (where 'setup' and 'workload' folders live)
// relative to metrics file: .../ExperimentRoot/results/RunFolder/metrics.json
// or .../ExperimentRoot/setup/logs
function findExperimentRoot(startDir) {
    let current = startDir;
    // Go up 4 levels max (metrics -> Run -> Results -> Experiment)
    for (let i = 0; i < 5; i++) {
        const setupPath = path.join(current, 'setup');
        if (fs.existsSync(setupPath)) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) break; 
        current = parent;
    }
    return null;
}

async function processFile(filePath) {
    const folderPath = path.dirname(filePath);
    const folderName = path.basename(folderPath); // Run ID

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalDurationMs = 0; 
    let totalTpot = 0;
    let tpotCount = 0;
    
    let minStart = Infinity;
    let maxEnd = -Infinity;
    let count = 0;

    await processJsonArrayStream(filePath, async (req) => {
        count++;
        const inTok = Number(req.info?.input_tokens || req.request?.prompt_len || 0);
        const outTok = Number(req.info?.output_tokens || req.response?.output_len || 0);
        
        totalInputTokens += inTok;
        totalOutputTokens += outTok;
        
        let s = req.start_time;
        let e = req.end_time;
        
        if (s && e) {
            if (s < minStart) minStart = s;
            if (e > maxEnd) maxEnd = e;
            
            let duration = (e - s); 
            if (duration < 10000 && duration > 0) duration *= 1000; 
            
            if (duration > 0) {
                totalDurationMs += duration;
                if (outTok > 0) {
                    totalTpot += (duration / outTok);
                    tpotCount++;
                }
            }
        }
    });

    if (count === 0) return null;

    // Derived Metrics
    const avgInputLen = count ? totalInputTokens / count : 0;
    const avgOutputLen = count ? totalOutputTokens / count : 0;
    const avgTpot = tpotCount ? totalTpot / tpotCount : 0; 
    
    let wallTimeSec = 0;
    if (minStart !== Infinity && maxEnd !== -Infinity) {
        let diff = maxEnd - minStart;
        if (minStart > 1e11) wallTimeSec = diff / 1000;
        else wallTimeSec = diff;
    }
    
    const outputTput = (wallTimeSec > 0) ? (totalOutputTokens / wallTimeSec) : 0;
    const inputTput = (wallTimeSec > 0) ? (totalInputTokens / wallTimeSec) : 0;
    const requestRate = (wallTimeSec > 0) ? (count / wallTimeSec) : 0;
    const latencyMean = totalDurationMs / count;

    // Metadata Extraction
    let modelName = 'Unknown Model';
    let hardware = 'Unknown';
    let variant = '';
    
    // 1. Infer Variant from Run ID
    // Format: inference-perf_TIMESTAMP-cache_tracking-run_IN_OUT_MODELNAME
    const parts = folderName.split('-run_');
    let runSignature = ''; // e.g., "100_100"
    if (parts.length > 1) {
        const segments = parts[1].split('_');
        if (segments.length >= 3) {
            variant = segments.slice(0, 2).join('/'); // "100/1000"
            runSignature = segments.slice(0, 2).join('_'); // "100_100"
            // Also try to get model name from folder as fallback
            const mParts = segments.slice(2).join('_');
            if (mParts) modelName = mParts; 
        }
    }
    
    // Find Experiment Root
    const expRoot = findExperimentRoot(folderPath);
    
    if (expRoot) {
        // 2. Hardware from Logs (setup/logs/llm-d-decode.log)
        // Only if hardware is unknown
        const logPath = path.join(expRoot, 'setup', 'logs', 'llm-d-decode.log');
        if (fs.existsSync(logPath)) {
            try {
                const logContent = fs.readFileSync(logPath, 'utf8');
                // Look for "Initial free memory: 78.59 GiB"
                const memMatch = logContent.match(/Initial free memory:\s*(\d+\.\d+)\s*GiB/);
                if (memMatch && memMatch[1]) {
                    const mem = parseFloat(memMatch[1]);
                    if (mem > 75) hardware = 'H100'; // 80GB variants
                    else if (mem > 35 && mem < 45) hardware = 'A100'; // 40GB
                    else if (mem > 20 && mem < 26) hardware = 'A10G'; // 24GB
                    // else hardware = `${mem.toFixed(0)}GB GPU`;
                }
            } catch (e) {
                // Ignore log read error
            }
        }

        // 3. Model Name from Profile YAML
        // Look in workload/profiles/inference-perf/
        // Match filename with runSignature (e.g. *run_100_100*.yaml)
        if (runSignature) {
            const profileDir = path.join(expRoot, 'workload', 'profiles', 'inference-perf');
            if (fs.existsSync(profileDir)) {
                const profiles = fs.readdirSync(profileDir);
                const profileFile = profiles.find(f => f.includes(`run_${runSignature}`) && f.endsWith('.yaml'));
                
                if (profileFile) {
                    try {
                        const content = fs.readFileSync(path.join(profileDir, profileFile), 'utf8');
                        const mMatch = content.match(/model_name:\s*([^\n]+)/);
                        if (mMatch && mMatch[1]) {
                            const raw = mMatch[1].trim();
                            const p = raw.split('/');
                            modelName = p[p.length - 1]; // "Qwen3-0.6B"
                        }
                    } catch (e) {}
                }
            }
        }
    }

    // 4. Fallback: Variables (in environment/variables)
    // Sometimes in experiment root
    if (expRoot) {
        const envVarFile = path.join(expRoot, 'environment', 'variables');
        if (fs.existsSync(envVarFile)) {
             try {
                const content = fs.readFileSync(envVarFile, 'utf8');
                // Extract Affinity if we didn't find hardware from logs
                if (hardware === 'Unknown') {
                    const affinityMatch = content.match(/LLMDBENCH_VLLM_COMMON_AFFINITY=([\w\.\-:\/]+)/);
                    if (affinityMatch && affinityMatch[1] && affinityMatch[1] !== 'auto') {
                        const val = affinityMatch[1];
                        if (val.toLowerCase().includes('h100')) hardware = 'H100';
                        else if (val.toLowerCase().includes('a100')) hardware = 'A100';
                    }
                }
                // Fallback Model Name
                if (modelName === 'Unknown Model') {
                    const mMatch = content.match(/LLMDBENCH_DEPLOY_MODEL_LIST=([\w\.\-:\/]+)/);
                    if (mMatch && mMatch[1]) {
                         const raw = mMatch[1];
                         const p = raw.split('/');
                         modelName = p[p.length - 1];
                    }
                }
             } catch(e) {}
        }
    }

    // Final Hardware Clean (if still unknown or raw)
    let lowerName = folderName.toLowerCase();
    if (hardware === 'Unknown') {
        if (lowerName.includes('gb200')) { hardware = 'GB200'; }
        else if (lowerName.includes('b200')) { hardware = 'B200'; }
        else if (lowerName.includes('a100')) { hardware = 'A100'; }
        else if (lowerName.includes('h100')) { hardware = 'H100'; }
    }

    // specific relative path for user
    // e.g. "private/benchmark_data_mirror/..." -> "1r2Z.../Experiment/results/RunID/file.json"
    // actually, let's just make it relative to the mirror root so it looks like the Drive structure
    // The mirror root is 'private/benchmark_data_mirror'
    const relativePath = path.relative(ARCHIVE_DIR, filePath);

    // Create Entry
    return createEntry({
        model_name: modelName, 
        run_id: folderName,
        timestamp: new Date().toISOString(),
        source: 'llm-d-results:google_drive',
        source_info: {
            type: 'google_drive',
            origin: 'llm-d Results Store',
            file_identifier: relativePath, // Expose the path here!
            raw_url: 'https://drive.google.com/drive/folders/1r2Z2Xp1L0KonUlvQHvEzed8AO9Xj8IPm' // Main folder link
        },
        metrics: {
            throughput: outputTput,
            output_tput: outputTput,
            input_tput: inputTput,
            request_rate: requestRate,
            tpot: avgTpot,
            time_per_output_token: avgTpot,
            latency: { mean: latencyMean, p50: 0, p99: 0 },
            error_count: 0
        },
        workload: {
            input_tokens: avgInputLen,
            output_tokens: avgOutputLen,
            request_count: count
        },
        metadata: {
            model_name: modelName,
            hardware: hardware,
            variant: variant 
        },
        _fileSizeKb: (fs.statSync(filePath).size / 1024).toFixed(1)
    });
}

(async () => {
    console.log("--- Prism Drive Processor (LLM-D) ---");
    
    if (!fs.existsSync(ARCHIVE_DIR)) {
        console.error("Mirror directory not found.");
        process.exit(1);
    }
    
    console.log("Scanning for metrics files...");
    const files = findFiles(ARCHIVE_DIR, 'per_request_lifecycle_metrics.json');
    console.log(`Found ${files.length} metrics files.`);
    
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        process.stdout.write(`[${i+1}/${files.length}] Processing ${path.basename(path.dirname(file))}...\r`);
        try {
            const result = await processFile(file);
            if (result) results.push(result);
        } catch(e) {
            console.warn(`\n   ❌ Failed to process ${file}: ${e.message}`);
        }
    }
    
    console.log(`\n✅ Processing Complete. Valid Benchmarks: ${results.length}`);
    
    // Export for Frontend
    const PUBLIC_JSON = 'public/results/archived_drive_data.json';
    try {
        fs.mkdirSync(path.dirname(PUBLIC_JSON), { recursive: true });
        fs.writeFileSync(PUBLIC_JSON, JSON.stringify(results, null, 2));
        console.log(`💾 Data exported for frontend: ${PUBLIC_JSON}`);
    } catch (e) {
        console.error(`❌ Failed to export JSON: ${e.message}`);
    }
    
    // Generate Report
    let report = `# Google Drive Benchmark Scan Report\n`;
    report += `**Date:** ${new Date().toLocaleString()}\n`;
    report += `**Files Scanned:** ${files.length}\n`;
    report += `**Valid Benchmarks:** ${results.length}\n\n`;
    
    report += `## Summary by Model\n`;
    const modelCounts = {};
    results.forEach(r => {
        modelCounts[r.metadata.model_name] = (modelCounts[r.metadata.model_name] || 0) + 1;
    });
    Object.entries(modelCounts).forEach(([m, c]) => {
        report += `- **${m}**: ${c} runs\n`;
    });
    
    report += `\n## Detailed Results\n`;
    report += `| Run ID | Model | Hardware | Throughput (tok/s) |\n`;
    report += `|---|---|---|---|\n`;
    
    results.sort((a, b) => a.metadata.model_name.localeCompare(b.metadata.model_name));
    
    results.forEach(r => {
        const hwDisplay = (r.metadata.hardware === 'Unknown' || !r.metadata.hardware) ? 'Unknown' : r.metadata.hardware;
        report += `| ${r.run_id} | ${r.metadata.model_name} | ${hwDisplay} | ${r.metrics.throughput.toFixed(2)} |\n`;
    });
    
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`📄 Report generated: ${REPORT_FILE}`);

})();


