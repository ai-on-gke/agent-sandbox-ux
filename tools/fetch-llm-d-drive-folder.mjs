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
import { Readable } from 'stream';
import { finished } from 'stream/promises';

// --- CONFIG ---
const API_KEY = process.env.VITE_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
const ROOT_FOLDER_ID = '1r2Z2Xp1L0KonUlvQHvEzed8AO9Xj8IPm'; // "BenchmarkData"
const DOWNLOAD_DIR = 'private/benchmark_data_mirror'; // distinct from previous 'drive_data' to avoid conflict
const CONCURRENCY = 5; // Parallel downloads

if (!API_KEY) {
    console.error("❌ No API Key found.");
    process.exit(1);
}

// Ensure download dir exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- DRIVE HELPERS ---

async function listChildren(folderId) {
    let files = [];
    let pageToken = null;
    
    do {
        let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed = false&key=${API_KEY}&fields=nextPageToken,files(id,name,mimeType,size,md5Checksum)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Failed to list children of ${folderId}: ${res.statusText}`);
            break;
        }
        
        const data = await res.json();
        if (data.files) files = files.concat(data.files);
        pageToken = data.nextPageToken;
    } while (pageToken);
    
    return files;
}

async function downloadFile(fileId, destPath, size) {
    if (fs.existsSync(destPath)) {
        const stats = fs.statSync(destPath);
        // Simple skip logic: if defined size matches, skip.
        // If size is undefined/0 effectively, we might re-download to be safe or check checksum if available (complex).
        // For now, size check is decent.
        if (size && stats.size == size) {
            return 'SKIPPED';
        }
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
    
    let attempt = 0;
    while (attempt < 3) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            const fileStream = fs.createWriteStream(destPath);
            await finished(Readable.fromWeb(res.body).pipe(fileStream));
            return 'DOWNLOADED';
        } catch (e) {
            attempt++;
            await sleep(1000 * attempt);
        }
    }
    return 'FAILED';
}

// --- RECURSIVE SYNCHRONIZER ---

async function processFolder(folderId, localPath) {
    console.log(`📂 Scanning: ${localPath}`);
    
    // Ensure local folder exists
    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }
    
    const items = await listChildren(folderId);
    console.log(`   Found ${items.length} items.`);
    
    const files = items.filter(i => i.mimeType !== 'application/vnd.google-apps.folder');
    const folders = items.filter(i => i.mimeType === 'application/vnd.google-apps.folder');
    
    // Process Files (with concurrency)
    // Create chunks
    for (let i = 0; i < files.length; i += CONCURRENCY) {
        const chunk = files.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(async (f) => {
            const dest = path.join(localPath, f.name.replace(/[^a-zA-Z0-9._-]/g, '_')); // Sanitize name
            const status = await downloadFile(f.id, dest, f.size);
            if (status === 'DOWNLOADED') process.stdout.write(`+`);
             else if (status === 'SKIPPED') process.stdout.write(`.`);
             else process.stdout.write(`x`);
        }));
    }
    process.stdout.write('\n'); // Newline after checks
    
    // Process Subfolders (Sequentially to manage depth)
    for (const folder of folders) {
        const subPath = path.join(localPath, folder.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
        await processFolder(folder.id, subPath);
    }
}

// --- MAIN ---

(async () => {
    console.log("--- Starting Drive Fetch (LLM-D) ---");
    console.log(`Root ID: ${ROOT_FOLDER_ID}`);
    console.log(`Target: ${DOWNLOAD_DIR}`);
    
    await processFolder(ROOT_FOLDER_ID, DOWNLOAD_DIR);
    
    console.log("\n✅ Mirror Complete.");
})();
