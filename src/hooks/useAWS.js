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

export const useAWS = ({ pendingRequests, addToast }) => {
    const fetchAWSBucketData = useCallback(async (bucket, forceRefresh = false) => {
        const cleanBucketName = bucket.replace(/^s3:\/\//, '').replace(/\/$/, '');

        if (pendingRequests.current.has(`aws:${cleanBucketName}`) && !forceRefresh) {
             console.log(`[Dedupe] Already fetching AWS:${cleanBucketName}, returning shared promise.`);
             return pendingRequests.current.get(`aws:${cleanBucketName}`);
        }

        if (!forceRefresh) {
            const cached = await CacheManager.get('aws', cleanBucketName);
            if (cached) {
                console.log(`[Cache Hit] Loading AWS bucket ${cleanBucketName} from cache.`);
                addToast(`[Cache] Loaded AWS:${cleanBucketName}`, 'success');
                return cached;
            }
        }

        const fetchPromise = (async () => {
            try {
                // AWS S3 List Objects V2 (Public Access)
                // Note: This assumes the bucket is public and allows listing.
                const listUrl = `https://${cleanBucketName}.s3.amazonaws.com/?list-type=2`;
                let response = await fetch(listUrl);
                
                if (response.status === 404) throw new Error('AWS Bucket not found.');
                if (response.status === 403) throw new Error('Access denied. AWS Bucket must be public.');
                if (!response.ok) throw new Error(`Failed to access AWS bucket (${response.status}).`);
                
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const contents = xmlDoc.getElementsByTagName("Contents");
                
                if (contents.length === 0) throw new Error('No files found in AWS bucket.');

                const filesToProcess = [];
                for (let i = 0; i < contents.length; i++) {
                    const key = contents[i].getElementsByTagName("Key")[0]?.textContent;
                    if (key && !key.endsWith('/')) {
                        filesToProcess.push({ name: key });
                    }
                }

                if (filesToProcess.length === 0) throw new Error('No valid files found in AWS bucket.');

                const newEntries = [];
                const fileMetadata = [];

                await Promise.all(filesToProcess.map(async (file) => {
                    try {
                        const fileUrl = `https://${cleanBucketName}.s3.amazonaws.com/${file.name}`;
                        const fileRes = await fetch(fileUrl);
                        if (!fileRes.ok) throw new Error(`Fetch failed: ${fileRes.status}`);
                        
                        const content = await fileRes.text();
                        let entries = [];
                        try {
                            const jsonContent = JSON.parse(content);
                            if (jsonContent.metrics || jsonContent.load_summary) {
                                const entry = parseJsonEntry({ ...jsonContent, source: `aws:${cleanBucketName}` }, file.name);
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
                                e.source = `aws:${cleanBucketName}`; 
                                let type = 'storage';

                                if (e.source_info) {
                                    e.source_info.origin = `aws:${cleanBucketName}`;
                                    e.source_info.type = type;
                                } else {
                                    e.source_info = {
                                        type,
                                        origin: `aws:${cleanBucketName}`,
                                        file_identifier: file.name,
                                        raw_url: fileUrl
                                    };
                                }
                                e.raw_url = fileUrl;
                                
                                // Normalization heuristics (same as GCS)
                                if (e.latency?.mean && e.latency.mean < 100) {
                                    e.latency.mean *= 1000;
                                    if (e.latency.p50) e.latency.p50 *= 1000;
                                    if (e.latency.p99) e.latency.p99 *= 1000;
                                }
                                if (e.ttft?.mean && e.ttft.mean < 100) {
                                    e.ttft.mean *= 1000;
                                    if (e.ttft.p50) e.ttft.p50 *= 1000;
                                }
                                newEntries.push(e);
                            });
                            fileMetadata.push({ name: file.name, entryCount: entries.length });
                        }
                    } catch (e) {
                        console.warn(`Failed to process AWS:${file.name}:`, e);
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
                        error: null,
                        type: 'aws'
                    }
                };
                
                const saved = await CacheManager.set('aws', cleanBucketName, result);
                if (!saved) {
                    addToast(`[Error] Cache Full - Could not save AWS:${cleanBucketName}`, 'error');
                } else {
                    addToast(`[Network] Fetched AWS:${cleanBucketName}`, 'info');
                }
                return result;

            } catch (err) {
                console.error(`Error fetching AWS bucket ${bucket}:`, err);
                return {
                    bucketName: cleanBucketName,
                    entries: [],
                    profile: {
                        bucketName: cleanBucketName,
                        files: [],
                        entryCount: 0,
                        loadedAt: new Date().toISOString(),
                        error: err.message,
                        type: 'aws'
                    }
                };
            }
        })();

        if (!forceRefresh) pendingRequests.current.set(`aws:${cleanBucketName}`, fetchPromise);
        
        try {
            return await fetchPromise;
        } finally {
            pendingRequests.current.delete(`aws:${cleanBucketName}`);
        }
    }, [addToast, pendingRequests]);

    return { fetchAWSBucketData };
};
