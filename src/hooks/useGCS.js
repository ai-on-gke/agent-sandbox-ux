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

import { useCallback } from 'react';
import { CacheManager } from '../utils/cacheManager';
import { parseJsonEntry, parseLogFile } from '../utils/dataParser';

export const useGCS = ({ pendingRequests, addToast }) => {
    const fetchBucketData = useCallback(async (bucket, forceRefresh = false) => {
        const cleanBucketName = bucket.replace(/^gs:\/\//, '');

        if (pendingRequests.current.has(`gcs:${cleanBucketName}`) && !forceRefresh) {
             console.log(`[Dedupe] Already fetching ${cleanBucketName}, returning shared promise.`);
             return pendingRequests.current.get(`gcs:${cleanBucketName}`);
        }

        if (!forceRefresh) {
            const cached = await CacheManager.get('gcs', cleanBucketName);
            if (cached) {
                console.log(`[Cache Hit] Loading GCS bucket ${cleanBucketName} from cache.`);
                addToast(`[Cache] Loaded ${cleanBucketName}`, 'success');
                return cached;
            }
        }

        let usingProxy = false;
        
        const fetchPromise = (async () => {
            try {
                let response = await fetch(`https://storage.googleapis.com/storage/v1/b/${cleanBucketName}/o`);
                
                if (response.status === 401 || response.status === 403) {
                    console.log(`[Bucket] Public access denied for ${cleanBucketName}, trying proxy...`);
                    response = await fetch(`/api/gcs/storage/v1/b/${cleanBucketName}/o`);
                    if (response.ok) usingProxy = true;
                }

                if (response.status === 404) throw new Error('Bucket not found.');
                if (response.status === 401 || response.status === 403) throw new Error('Access denied. Bucket must be public or accessible by server service account.');
                if (!response.ok) throw new Error(`Failed to access bucket (${response.status}).`);
                
                const json = await response.json();
                if (!json.items) throw new Error('No files found in bucket.');

                const filesToProcess = json.items.filter(item => !item.name.endsWith('/'));
                if (filesToProcess.length === 0) throw new Error('No valid files found in bucket.');

                const newEntries = [];
                const fileMetadata = [];

                await Promise.all(filesToProcess.map(async (file) => {
                    try {
                        let fileUrl = file.mediaLink;
                        if (usingProxy && fileUrl.startsWith('https://storage.googleapis.com/')) {
                            const path = fileUrl.replace('https://storage.googleapis.com/', '');
                            fileUrl = `/api/gcs/${path}`;
                        }

                        const fileRes = await fetch(fileUrl);
                        if (!fileRes.ok) throw new Error(`Fetch failed: ${fileRes.status}`);
                        
                        const content = await fileRes.text();
                        let entries = [];

                        try {
                            const jsonContent = JSON.parse(content);
                            if (jsonContent.metrics || jsonContent.load_summary) {
                                const entry = parseJsonEntry({ ...jsonContent, source: `gcs:${cleanBucketName}` }, file.name);
                                entries = [entry];
                            }
                        } catch {
                            // Try parsing as log file
                        }
                        
                        if (entries.length === 0) {
                            entries = parseLogFile(content, file.name);
                        }
                        
                        if (entries.length > 0) {
                            entries.forEach(e => {
                                e.source = `gcs:${cleanBucketName}`; 
                                let type = 'storage';

                                if (e.source_info) {
                                    e.source_info.origin = `gcs:${cleanBucketName}`;
                                    e.source_info.type = type;
                                } else {
                                    e.source_info = {
                                        type,
                                        origin: `gcs:${cleanBucketName}`,
                                        file_identifier: file.name,
                                        raw_url: file.mediaLink
                                    };
                                }
                                e.raw_url = `https://storage.googleapis.com/${cleanBucketName}/${file.name}`;
                                
                                if (e.latency?.mean && e.latency.mean < 100) {
                                    e.latency.mean *= 1000;
                                    if (e.latency.p50) e.latency.p50 *= 1000;
                                    if (e.latency.p99) e.latency.p99 *= 1000;
                                    if (e.latency.min) e.latency.min *= 1000;
                                    if (e.latency.max) e.latency.max *= 1000;
                                }
                                if (e.ttft?.mean && e.ttft.mean < 100) {
                                    e.ttft.mean *= 1000;
                                    if (e.ttft.p50) e.ttft.p50 *= 1000;
                                    if (e.ttft.p99) e.ttft.p99 *= 1000;
                                    if (e.ttft.min) e.ttft.min *= 1000;
                                    if (e.ttft.max) e.ttft.max *= 1000;
                                }
                                newEntries.push(e);
                            });
                            fileMetadata.push({ name: file.name, entryCount: entries.length });
                        }
                    } catch (e) {
                        console.warn(`Failed to process ${file.name}:`, e);
                        fileMetadata.push({ name: file.name, entryCount: 0, error: e.message });
                    }
                }));

                const result = {
                    bucketName: cleanBucketName,
                    entries: newEntries,
                    profile: {
                        bucketName: cleanBucketName,
                        files: fileMetadata,
                        entryCount: fileMetadata.filter(f => f.entryCount > 0).length, 
                        loadedAt: new Date().toISOString(),
                        error: null
                    }
                };
                
                const saved = await CacheManager.set('gcs', cleanBucketName, result);
                if (!saved) {
                    addToast(`[Error] Cache Full - Could not save ${cleanBucketName}`, 'error');
                } else {
                    addToast(`[Network] Fetched ${cleanBucketName}`, 'info');
                }
                return result;

            } catch (err) {
                console.error(`Error fetching bucket ${bucket}:`, err);
                return {
                    bucketName: cleanBucketName,
                    entries: [],
                    profile: {
                        bucketName: cleanBucketName,
                        files: [],
                        entryCount: 0,
                        loadedAt: new Date().toISOString(),
                        error: err.message
                    }
                };
            }
        })();

        if (!forceRefresh) pendingRequests.current.set(`gcs:${cleanBucketName}`, fetchPromise);
        
        try {
            return await fetchPromise;
        } finally {
            pendingRequests.current.delete(`gcs:${cleanBucketName}`);
        }
    }, [addToast, pendingRequests]);

    return { fetchBucketData };
};
