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
 * Google Drive API V3 Helper for accessing public benchmark folders.
 * 
 * Note: This uses API Key access only (no OAuth), which works for public folders.
 */

const API_Endpoint = 'https://www.googleapis.com/drive/v3/files';

/**
 * Lists all files in a folder recursively.
 * WARNING: This can be slow for large trees.
 * 
 * @param {string} folderId - The root folder ID to start scanning.
 * @param {string} apiKey - Google API Key.
 * @param {function} onProgress - Optional callback (count) => void.
 * @returns {Promise<Array>} List of file objects with { id, name, parents, mimeType }.
 */
export const findFolderByName = async (folderName, parentId, apiKey) => {
    const url = new URL(API_Endpoint);
    url.searchParams.append('key', apiKey);
    
    // Exact name match, is a folder, and not trashed
    const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ''}`;
    url.searchParams.append('q', q);
    url.searchParams.append('fields', 'files(id, name)');
    url.searchParams.append('supportsAllDrives', 'true');
    url.searchParams.append('includeItemsFromAllDrives', 'true');
    url.searchParams.append('supportsAllDrives', 'true');
    url.searchParams.append('includeItemsFromAllDrives', 'true');

    try {
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Drive API Error: ${res.status}`);
        const data = await res.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
    } catch (e) {
        console.warn(`Failed to find folder ${folderName}:`, e);
    }
    return null;
};

/**
 * Lists all files in a folder recursively.
 */
export const listFolderRecursive = async (folderId, apiKey, onProgress) => {
    let allFiles = [];
    let queue = [folderId]; // Queue of folder IDs to scan
    let foldersScanned = 0;

    // Helper to fetch one page
    const fetchPage = async (q, pageToken = null) => {
        const url = new URL(API_Endpoint);
        url.searchParams.append('key', apiKey);
        url.searchParams.append('q', q);
        url.searchParams.append('fields', 'nextPageToken, files(id, name, mimeType, parents)');
        url.searchParams.append('pageSize', '1000'); // Max page size
        url.searchParams.append('supportsAllDrives', 'true');
        url.searchParams.append('includeItemsFromAllDrives', 'true');
        if (pageToken) url.searchParams.append('pageToken', pageToken);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Drive API Error: ${res.status} ${res.statusText}`);
        return await res.json();
    };

    while (queue.length > 0) {
        // Pop one folder, scan it
        const currentFolderId = queue.shift();
        foldersScanned++;
        
        // OPTIMIZATION: Filter ONLY for folders OR the specific metrics file we need.
        // This avoids fetching thousands of irrelevant files (logs, images, etc.)
        const q = `'${currentFolderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or name = 'per_request_lifecycle_metrics.json')`;
        
        let nextPageToken = null;
        try {
            do {
                const data = await fetchPage(q, nextPageToken);
                const files = data.files || [];
                
                for (const file of files) {
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                        queue.push(file.id);
                        allFiles.push(file); // Ensure folders can be looked up by useLLMD.js
                    } else {
                        allFiles.push(file);
                    }
                }
                
                nextPageToken = data.nextPageToken;
                
                // Update Progress: (Files Found, Folders Scanned, Queue Size)
                if (onProgress) onProgress(allFiles.length, foldersScanned, queue.length);

            } while (nextPageToken);
        } catch (e) {
            console.warn(`Failed to scan folder ${currentFolderId}:`, e);
            // Continue scanning other folders even if one fails
        }
    }

    return allFiles;
};

/**
 * Fetches the content of a file.
 * 
 * @param {string} fileId 
 * @param {string} apiKey 
 * @returns {Promise<string>} Text content of the file.
 */
export const fetchFileContent = async (fileId, apiKey) => {
    const url = new URL(`${API_Endpoint}/${fileId}`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('alt', 'media');
    url.searchParams.append('supportsAllDrives', 'true');
    
    const res = await fetch(url.toString());
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch file ${fileId}: ${res.status} ${res.statusText} - ${errText}`);
    }
    return await res.text();
};

/**
 * Parses metadata from the llm-d benchmark folder naming convention.
 * Format: inference-perf_[Timestamp]-setup_[Config]-run_[In]_[Out]_[Model]
 * Example: inference-perf_1758823773-setup_inf_sche_kv_yaml-run_100_100_llm-d-0p6b-base
 */
export const parseDriveMetadata = (folderName) => {
    try {
        if (!folderName.includes('-run_')) return null;

        // Split by '-run_'
        const parts = folderName.split('-run_');
        if (parts.length < 2) return null;

        const runPart = parts[1]; // "100_100_llm-d-0p6b-base"
        const runSegments = runPart.split('_');
        
        // We expect at least [In, Out, Model...]
        if (runSegments.length < 3) return null;

        const input_tokens = parseInt(runSegments[0], 10);
        const output_tokens = parseInt(runSegments[1], 10);
        
        // Model might contain underscores, so join the rest
        const model = runSegments.slice(2).join('_');
        
        // Extract timestamp from the first part
        // inference-perf_1758823773...
        const prefixParts = parts[0].split('_');
        let timestamp = null;
        if (prefixParts.length >= 2) {
             const ts = parseInt(prefixParts[1], 10);
             if (!isNaN(ts)) {
                 timestamp = new Date(ts * 1000).toISOString();
             }
        }

        return {
            model,
            input_tokens,
            output_tokens,
            timestamp,
        };
    } catch (e) {
        console.warn("Failed to parse drive folder name:", folderName, e);
        return null; // Invalid format
    }
};
