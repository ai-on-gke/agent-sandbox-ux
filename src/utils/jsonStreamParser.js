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
import readline from 'readline';

/**
 * Parses a large JSON array file by streaming and extracting top-level objects.
 * Assumes the file structure is `[ { ... }, { ... } ]`.
 * 
 * @param {string} filePath - Path to the JSON file
 * @param {function} onEntry - Callback for each parsed object
 * @returns {Promise<void>}
 */
export async function processJsonArrayStream(filePath, onEntry) {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
    
    let buffer = '';
    let depth = 0;
    let inString = false;
    let escaped = false;
    let entryStart = -1;
    
    // We can't use readline easily because objects span lines.
    // We process chunk by chunk.
    
    for await (const chunk of fileStream) {
        for (let i = 0; i < chunk.length; i++) {
            const char = chunk[i];
            
            if (escaped) {
                escaped = false;
                buffer += char;
                continue;
            }
            
            if (char === '\\') {
                escaped = true;
                buffer += char;
                continue;
            }
            
            if (char === '"') {
                inString = !inString;
                buffer += char;
                continue;
            }
            
            if (!inString) {
                if (char === '{') {
                    if (depth === 0) {
                        // Start of a new object
                        buffer = ''; // Reset buffer at start of object
                        entryStart = i; // Mark start (symbolic, since buffer is reset)
                    }
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 0) {
                        // End of an object
                        buffer += char;
                        try {
                            const entry = JSON.parse(buffer);
                            await onEntry(entry);
                        } catch (e) {
                            console.warn("Stream parse error on entry:", e.message);
                        }
                        buffer = ''; // Clear after processing
                        continue; 
                    }
                } else if (char === '[' || char === ']' || char === ',') {
                    // Ignore array brackets and commas between objects at root
                    if (depth === 0) continue;
                }
            }
            
            // Accumulate char if inside an object (depth > 0)
            if (depth > 0) {
                buffer += char;
            }
        }
    }
}
