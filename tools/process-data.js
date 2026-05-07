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

/**
 * tools/process-data.js
 * 
 * Purpose: 
 *   Aggregates dispersed benchmark result files into a single, consolidated 
 *   `public/data.json` file for the frontend to consume. This acts as a 
 *   build step for static data, ensuring the frontend doesn't need to fetch 
 *   hundreds of individual files.
 * 
 * Usage:
 *   node tools/process-data.js
 * 
 * Logic:
 *   1. Scans specific directories (public/results/vllm, lpg).
 *   2. Parses and normalizes various JSON formats (raw logs vs structured).
 *   3. Combines them into one large array.
 *   4. Sorts by QPS and writes to `public/data.json`.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseJsonEntry, parseLogFile } from '../src/utils/dataParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_RESULTS_DIR = path.resolve(__dirname, '../public/results');
const OUTPUT_FILE = path.resolve(__dirname, '../public/data.json');

async function processData() {
    try {
        // Ensure public/results exists
        await fs.mkdir(PUBLIC_RESULTS_DIR, { recursive: true });

        const directories = [
            { path: path.resolve(__dirname, '../public/results/vllm'), type: 'standard', noCopy: true, relDir: 'vllm' },
            { path: path.resolve(__dirname, '../public/results/lpg'), type: 'standard', noCopy: true, relDir: 'lpg' }
        ];

        const allFiles = [];
        
        for (const dirObj of directories) {
            try {
                const files = await fs.readdir(dirObj.path);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                         allFiles.push({
                             filename: file,
                             path: path.join(dirObj.path, file),
                             type: dirObj.type,
                             noCopy: dirObj.noCopy,
                             relDir: dirObj.relDir
                         });
                    }
                }
            } catch (err) {
                // console.warn(`Could not read directory ${dirObj.path}: ${err.message}`);
            }
        }

        if (allFiles.length === 0) {
            console.warn(`No benchmark files found.`);
        }

        const data = [];

        for (const fileObj of allFiles) {
            const { filename, path: filePath, type, noCopy, relDir } = fileObj;
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Copy file to public/results if needed
            if (!noCopy) {
                await fs.copyFile(filePath, path.join(PUBLIC_RESULTS_DIR, filename));
            }

            let fileEntries = [];
            // For raw_url, if it's in a subdir, prepend it
            const urlFilename = relDir ? `${relDir}/${filename}` : filename;

            try {
                const json = JSON.parse(content);
                
                if (json.metrics || json.load_summary) {
                     fileEntries.push(parseJsonEntry(json, urlFilename));
                }
            } catch (e) {
                // Not valid JSON, try parsing as log file
                fileEntries = parseLogFile(content, urlFilename);
            }

            if (fileEntries.length > 0) {
                data.push(...fileEntries);
            }
        }

        // Sort by QPS
        data.sort((a, b) => a.qps - b.qps);

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
        console.log(`Processed ${data.length} entries. Data written to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error processing data:', error);
    }
}

processData();
