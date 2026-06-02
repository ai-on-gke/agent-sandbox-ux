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

import express from 'express';
import compression from 'compression';
import { GoogleAuth, UserRefreshClient } from 'google-auth-library';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
const execAsync = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());
app.use(express.json());

// Trust the first proxy (Cloud Run Load Balancer) to properly resolve X-Forwarded-For
app.set('trust proxy', 1);

// Rate Limiting: 200 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50000, // Effectively unlimited for local dev
    standardHeaders: true, 
    legacyHeaders: false, 
});
app.use('/api', limiter);

// Google Auth Client
const auth = new GoogleAuth();

// --- API: Shared Configuration ---
app.get('/api/config', (req, res) => {
    // Parse environment variables for default data sources
    const defaultBuckets = process.env.DEFAULT_BUCKETS ? process.env.DEFAULT_BUCKETS.split(',') : [];
    const defaultProjects = process.env.DEFAULT_PROJECTS ? process.env.DEFAULT_PROJECTS.split(',') : [];

    res.json({
        buckets: defaultBuckets.map(b => b.trim()).filter(b => b),
        projects: defaultProjects.map(p => p.trim()).filter(p => p),
        hostProject: process.env.GOOGLE_CLOUD_PROJECT || null,
        siteName: process.env.SITE_NAME || null,
        gaTrackingId: process.env.GA_TRACKING_ID || null,
        contactUrl: process.env.CONTACT_US_URL || null
    });
});

// --- API: Dynamic Kubectl Context ---
app.get('/api/kube-context', (req, res) => {
    exec('kubectl config current-context', (error, stdout, stderr) => {
        if (error) {
            console.error('[Kubectl Error]', error);
            return res.json({ context: 'kubernetes-admin@cluster.local', error: error.message });
        }
        res.json({ context: stdout.trim() });
    });
});

app.get('/api/kube-contexts/list', (req, res) => {
    exec('kubectl config get-contexts -o name', (error, stdout, stderr) => {
        if (error) {
            console.error('[Kubectl List Error]', error);
            return res.json({ contexts: ['kubernetes-admin@cluster.local'], error: error.message });
        }
        const list = stdout.trim().split('\n').map(x => x.trim()).filter(x => x);
        res.json({ contexts: list.length > 0 ? list : ['kubernetes-admin@cluster.local'] });
    });
});

app.post('/api/kube-context/switch', (req, res) => {
    const { context } = req.body;
    if (!context) {
        return res.status(400).json({ error: 'Context name is required' });
    }
    exec(`kubectl config use-context ${context}`, (error, stdout, stderr) => {
        if (error) {
            console.error('[Kubectl Switch Error]', error);
            return res.status(500).json({ error: 'Failed to switch context', details: error.message });
        }
        res.json({ success: true, context: context });
    });
});

// --- API: Template Usage Report Metrics ---
app.get('/api/metrics/usage', (req, res) => {
    res.json({
        totalTemplates: 6,
        totalActiveSandboxes: 1057,
        popularity: [
            { name: 'python-agent-runner', sandboxes: 450 },
            { name: 'pytorch-model-evaluator', sandboxes: 290 },
            { name: 'node-sandbox-executor', sandboxes: 120 },
            { name: 'golang-crd-validator', sandboxes: 85 },
            { name: 'java-heavy-worker', sandboxes: 12 },
            { name: 'ruby-legacy-interpreter', sandboxes: 0 }
        ]
    });
});

// Helper to generate anchored simulated history
function generateAnchoredTimeSeries(range, endTime, liveCurrent) {
    const points = [];
    let count = 6; // default 1h
    let intervalMs = 10 * 60 * 1000; // 10 mins

    if (range === '12h') {
        count = 12;
        intervalMs = 60 * 60 * 1000; // 1 hour
    } else if (range === '24h') {
        count = 24;
        intervalMs = 60 * 60 * 1000; // 1 hour
    }

    let currentTime = endTime.getTime() - (count - 1) * intervalMs;

    // Backward generation anchored to liveCurrent
    let currentDesired = liveCurrent.desiredWarmPods;
    let currentReady = liveCurrent.readyWarmPods;
    let currentActive = liveCurrent.activeSandboxes;
    let currentLatency = liveCurrent.p99LatencySeconds;

    for (let i = 0; i < count; i++) {
        const d = new Date(currentTime);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const isLast = (i === count - 1);
        
        let desired = currentDesired;
        let ready = currentReady;
        let active = currentActive;
        let latency = currentLatency;

        if (!isLast) {
            // Apply simulated variation backwards
            desired = Math.max(10, Math.floor(currentDesired * (0.8 + 0.2 * Math.sin(i))));
            ready = Math.max(0, Math.min(desired, Math.floor(currentReady * (0.8 + 0.2 * Math.cos(i)))));
            active = Math.max(0, Math.floor(currentActive * (0.7 + 0.3 * Math.sin(i * 1.5))));
            latency = parseFloat((currentLatency * (0.5 + Math.random())).toFixed(2));
        }

        const blockedAttempts = Math.max(0, Math.round(active * 0.05 + Math.sin(i * 1.2) * 4 + 2));
        const allowedRequests = Math.max(10, Math.round(active * 1.8 + Math.cos(i) * 15 + 40));
        const warmHits = Math.max(0, Math.round(ready * 0.95));
        const coldStarts = Math.max(0, Math.round(active * 0.08 + 1));

        points.push({
            time: timeStr,
            timestamp: d.toISOString(),
            desired: desired,
            ready: ready,
            latency: latency,
            activeSandboxes: active,
            blockedAttempts: blockedAttempts,
            allowedRequests: allowedRequests,
            warmHits: warmHits,
            coldStarts: coldStarts
        });

        currentTime += intervalMs;
    }
    return points;
}

// --- API: Multi-State Observability Telemetry Summary (Live Shell) ---
app.get('/api/v1/telemetry/summary', async (req, res) => {
    const range = req.query.range || '1h';
    const now = new Date();
    
    try {
        // 1. Get active context
        const { stdout: contextStdout } = await execAsync('kubectl config current-context');
        const context = contextStdout.trim();

        // 2. Query custom resources from all namespaces
        const cmd = `kubectl get sandboxes,sandboxtemplates,sandboxwarmpools -A -o json --context=${context}`;
        const { stdout: resStdout } = await execAsync(cmd);
        
        const data = JSON.parse(resStdout);
        const items = data.items || [];

        let sandboxCount = 0;
        let activeSandboxCount = 0;
        let templateCount = 0;
        let warmPoolCount = 0;
        let readyWarmPods = 0;
        let desiredWarmPods = 0;

        const templates = [];
        const sandboxes = [];
        const warmPools = [];

        // Build warmpool to template map
        const warmPoolToTemplateMap = {};
        items.forEach(item => {
            if (item.kind === 'SandboxWarmPool') {
                const name = item.metadata?.name;
                const templateRef = item.spec?.sandboxTemplateRef?.name;
                if (name && templateRef) {
                    warmPoolToTemplateMap[name] = templateRef;
                }
            }
        });

        items.forEach(item => {
            const kind = item.kind;
            const status = item.status || {};
            const spec = item.spec || {};
            const metadata = item.metadata || {};

            if (kind === 'Sandbox') {
                sandboxCount++;
                const phase = (status.phase || status.state || '').toLowerCase();
                let isActive = false;
                if (phase === 'running' || phase === 'active' || phase === 'ready') {
                    activeSandboxCount++;
                    isActive = true;
                } else if (!status.phase && !status.state) {
                    activeSandboxCount++;
                    isActive = true;
                }

                // Resolve template
                const ownerName = metadata.ownerReferences?.[0]?.name;
                let templateName = 'unknown';
                if (ownerName && warmPoolToTemplateMap[ownerName]) {
                    templateName = warmPoolToTemplateMap[ownerName];
                } else {
                    if (metadata.name.startsWith('dog-agent-warmpool')) {
                        templateName = 'dog-agent-template';
                    } else if (metadata.name.includes('python-agent-runner')) {
                        templateName = 'python-agent-runner';
                    } else if (metadata.name.includes('node-sandbox-executor')) {
                        templateName = 'node-sandbox-executor';
                    } else if (metadata.name.includes('golang-crd-validator')) {
                        templateName = 'golang-crd-validator';
                    }
                }

                const container = spec.podTemplate?.spec?.containers?.[0];
                const cpuLimit = container?.resources?.limits?.cpu || container?.resources?.requests?.cpu || '0.5';
                const memoryLimit = container?.resources?.limits?.memory || container?.resources?.requests?.memory || '512Mi';
                
                const formattedCpu = cpuLimit.toString().includes('m') 
                    ? `${(parseInt(cpuLimit) / 1000).toFixed(1)} Core` 
                    : `${cpuLimit} Core`;
                const formattedMemory = memoryLimit.toString().includes('Mi') 
                    ? `${parseInt(memoryLimit)} MiB` 
                    : memoryLimit.toString().includes('Gi') 
                        ? `${parseFloat(memoryLimit)} GiB` 
                        : `${memoryLimit}`;

                const creationTime = new Date(metadata.creationTimestamp);
                const elapsedMs = now - creationTime;
                const elapsedMins = Math.floor(elapsedMs / 60000);
                let elapsed = `${elapsedMins}m active`;
                if (elapsedMins > 60) {
                    elapsed = `${(elapsedMins / 60).toFixed(1)}h active`;
                }

                sandboxes.push({
                    id: metadata.name,
                    template: templateName,
                    status: phase === 'suspended' ? 'Suspended' : (isActive ? 'Running' : 'Ready'),
                    cluster: context.split('_').pop() || context,
                    namespace: metadata.namespace,
                    cpu: formattedCpu,
                    memory: formattedMemory,
                    elapsed: elapsed
                });

            } else if (kind === 'SandboxTemplate') {
                templateCount++;
                if (spec.warmPool && spec.warmPool.minReplicas) {
                    desiredWarmPods += spec.warmPool.minReplicas;
                }

                templates.push({
                    id: metadata.name,
                    name: metadata.name,
                    status: 'Active',
                    cluster: context.split('_').pop() || context,
                    namespace: metadata.namespace,
                    activeClaims: 0
                });

            } else if (kind === 'SandboxWarmPool') {
                warmPoolCount++;
                const readyRep = status.readyReplicas || 0;
                const reqRep = spec.replicas || 0;
                if (status.readyReplicas) readyWarmPods += status.readyReplicas;
                if (spec.replicas) desiredWarmPods += spec.replicas;

                warmPools.push({
                    name: metadata.name,
                    templateRef: spec.sandboxTemplateRef?.name || 'unknown',
                    namespace: metadata.namespace,
                    replicas: reqRep,
                    readyReplicas: readyRep,
                    status: (readyRep === reqRep && reqRep > 0) ? 'Optimal' : 'Recovering'
                });
            }
        });

        // Compute active claims count for each template
        templates.forEach(t => {
            t.activeClaims = sandboxes.filter(s => s.template === t.name).length;
        });

        // Calculate dynamic resource aggregate utilization
        let totalCpu = 0;
        let totalMem = 0;
        sandboxes.forEach(s => {
            const cpuVal = parseFloat(s.cpu);
            if (!isNaN(cpuVal)) totalCpu += cpuVal;
            
            const memVal = parseFloat(s.memory);
            if (!isNaN(memVal)) {
                if (s.memory.includes('MiB')) {
                    totalMem += memVal / 1024;
                } else {
                    totalMem += memVal;
                }
            }
        });

        if (desiredWarmPods === 0) {
            desiredWarmPods = warmPools.reduce((sum, w) => sum + w.replicas, 0);
        }
        if (desiredWarmPods === 0) {
            desiredWarmPods = templateCount * 20 || 200;
        }
        if (readyWarmPods === 0) {
            readyWarmPods = warmPools.reduce((sum, w) => sum + w.readyReplicas, 0);
        }
        if (readyWarmPods === 0) {
            readyWarmPods = activeSandboxCount;
        }

        const liveCurrent = {
            activeSandboxes: activeSandboxCount,
            desiredWarmPods: desiredWarmPods, 
            readyWarmPods: readyWarmPods,
            cpuAllocationCores: parseFloat(totalCpu.toFixed(1)) || parseFloat((activeSandboxCount * 0.5).toFixed(1)), 
            memoryAllocationGb: parseFloat(totalMem.toFixed(1)) || parseFloat((activeSandboxCount * 0.5).toFixed(1)), 
            errorCount: 0, 
            p99LatencySeconds: 0.85, 
            claimsQps: activeSandboxCount > 0 ? Math.min(150, activeSandboxCount * 3) : 0
        };

        const timeSeries = generateAnchoredTimeSeries(range, now, liveCurrent);

        const response = {
            cluster: context, 
            range: range,
            summary: liveCurrent,
            crdCounts: {
                Sandbox: sandboxCount,
                SandboxTemplate: templateCount,
                SandboxWarmPool: warmPoolCount
            },
            timeSeries: timeSeries,
            templates: templates,
            sandboxes: sandboxes,
            warmPools: warmPools
        };

        res.json(response);

    } catch (error) {
        console.error('[Telemetry Live Fetch Error]', error);
        res.status(500).json({ 
            error: 'Failed to fetch live telemetry via kubectl', 
            details: error.message,
            cluster: 'unknown'
        });
    }
});

// --- API: SandboxTemplates Specification Registry ---
app.get('/api/templates', (req, res) => {
    res.json([
        {
            name: 'python-agent-runner',
            status: 'Active',
            projectId: 'cluster.local',
            cluster: 'cluster.local',
            namespace: 'agent-runtime-prod',
            warmPoolSize: 20,
            activeClaims: 450,
            yamlContent: `apiVersion: extensions.agents.x-k8s.io/v1alpha1\nkind: SandboxTemplate\nmetadata:\n  name: python-agent-runner\n  namespace: agent-runtime-prod\nspec:\n  runtimeClass: isolated-runtime\n  warmPool:\n    minReplicas: 20`
        },
        {
            name: 'pytorch-model-evaluator',
            status: 'Active',
            projectId: 'cluster.local',
            cluster: 'cluster.local',
            namespace: 'inference-eval-prod',
            warmPoolSize: 15,
            activeClaims: 290,
            yamlContent: `apiVersion: extensions.agents.x-k8s.io/v1alpha1\nkind: SandboxTemplate\nmetadata:\n  name: pytorch-model-evaluator\n  namespace: inference-eval-prod\nspec:\n  runtimeClass: isolated-runtime\n  warmPool:\n    minReplicas: 15`
        }
    ]);
});

// --- API: Alerts Defaults Policy Specs ---
app.get('/api/alerts/defaults', (req, res) => {
    res.json({
        policyId: 'alert-p2-drainage-default',
        severity: 'P2',
        rules: [
            { metric: 'warmpool_drainage_ratio', threshold: 0.85, window: '5m', description: 'Triggers alert if warmpool drainage exceeds 85% over 5 minutes window context.' },
            { metric: 'sandbox_creation_latency_seconds', threshold: 5.0, window: '1m', description: 'Triggers critical alert if cold start creation latency breaches 5 seconds targets.' }
        ]
    });
});

// --- API: GIQ Proxy (Backend-for-Frontend) ---
// Proxies requests to the Google Kubernetes Engine Recommender API (GIQ)
// Injects the Application Default Credentials (ADC) token.
app.all('/api/giq/*', async (req, res) => {
    try {


        let accessToken;
        const authHeader = req.headers['authorization'];
        
        // If client provides a specific token (e.g. valid length), use it.
        // Otherwise, fallback to ADC.
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20) {
             console.log('[Proxy] Using user-provided token');
             accessToken = authHeader.split(' ')[1];
        } else {
             console.log('[Proxy] Using Server ADC token');
             const client = await auth.getClient();
             const token = await client.getAccessToken();
             accessToken = token.token;
        }
        
        // Construct target URL
        // Incoming: /api/giq/v1/profiles:fetch
        // Target: https://gkerecommender.googleapis.com/v1/profiles:fetch
        const targetPath = req.params[0]; 
        const targetUrl = `https://gkerecommender.googleapis.com/${targetPath}`;
        
        console.log(`[Proxy] Forwarding to: ${targetUrl}`);

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            // User Project is required for quota attribution
            'X-Goog-User-Project': req.headers['x-goog-user-project'] || process.env.GOOGLE_CLOUD_PROJECT
        };

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { error: 'Non-JSON Response', raw: text };
        }

        if (targetUrl.includes('profiles:fetch')) {
            console.log(`[Proxy Debug] PROFILES Data string: ${JSON.stringify(data).substring(0, 200)}...`);
        }
        
        // Debug GIQ Cost Data
        if (targetUrl.includes('benchmarkingData')) {
            console.log(`[Proxy Debug] DETAILS Data string: ${JSON.stringify(data).substring(0, 200)}...`);
            if (req.body && req.body.pricingModel) {
            	console.log(`[Proxy Debug] Fetching Cost: ${req.body.pricingModel}`);
            	const p = (data.benchmarkingData || data.profile || [])[0];
            	if (p && p.performanceStats) {
            	     const stat = p.performanceStats.find(s => s.cost && s.cost.length > 0);
            	     if (stat) {
            	         console.log(`[Proxy Debug] Found Cost (${req.body.pricingModel}):`, JSON.stringify(stat.cost[0]));
            	     } else {
            	         console.log(`[Proxy Debug] No cost stats found for ${req.body.pricingModel}`);
            	     }
            	} else {
            	     console.log(`[Proxy Debug] No profiles/stats found.`);
            	}
			}
        }
        
        if (!response.ok) {
            console.log(`[Proxy Error] ${response.status}:`, JSON.stringify(data));
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.log('[Proxy Internal Error]', error);
        res.status(500).json({ error: 'Internal Proxy Error', details: error.message });
    }
});

// --- API: Local Benchmarks (Dev Mode) ---
app.get('/api/local/list', async (req, res) => {
    const fs = await import('fs');
    const dir = path.join(__dirname, '../private/benchmarks');
    if (!fs.existsSync(dir)) {
        return res.json({ items: [] });
    }
    const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
    const items = files.map(f => ({
        name: f,
        mediaLink: `/api/local/file/${f}`
    }));
    res.json({ items });
});

app.get('/api/local/file/:filename', async (req, res) => {
    const fs = await import('fs');
    const filename = req.params.filename;
    // Sanitization to prevent traversing up
    const safeFilename = path.basename(filename); 
    const filepath = path.join(__dirname, '../private/benchmarks', safeFilename);
    
    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).send('Not found');
    }
});

// --- API: GCS Proxy ---
// Proxies requests to Google Cloud Storage for private buckets.
// Uses server's ADC for authentication.
app.all('/api/gcs/*', async (req, res) => {
    try {
        let client;
        const adcPath = process.env.GOOGLE_APPLICATION_DEFAULT_CREDENTIALS;
        if (adcPath && fs.existsSync(adcPath)) {
            try {
                const creds = JSON.parse(fs.readFileSync(adcPath, 'utf8'));
                if (creds.type === 'authorized_user') {
                    client = new UserRefreshClient({
                        clientId: creds.client_id,
                        clientSecret: creds.client_secret,
                        refreshToken: creds.refresh_token
                    });
                }
            } catch (e) {
                console.warn('Failed to parse ADC file for explicit auth:', e);
            }
        }

        if (!client) {
            client = await auth.getClient();
        }
        const token = await client.getAccessToken();
        const accessToken = token.token;

        // Path format: /api/gcs/BUCKET_NAME/APP_PATH...
        // Target: https://storage.googleapis.com/BUCKET_NAME/APP_PATH...
        // Express decodes req.params[0], so we MUST re-encode the target path properly 
        // to handle files in folders (which require %2F instead of / in GCS Object API).
        const rawPath = req.params[0];
        
        // Re-encode object names for the /o/ endpoint
        let targetPath = rawPath;
        if (targetPath.includes('/o/')) {
             const parts = targetPath.split('/o/');
             // Encode the object name part
             targetPath = parts[0] + '/o/' + encodeURIComponent(parts[1]);
        }
        
        // Append query string if present (critical for ?alt=media)
        const queryString = new URLSearchParams(req.query).toString();
        const targetUrl = `https://storage.googleapis.com/${targetPath}${queryString ? `?${queryString}` : ''}`;

        console.log(`[GCS Proxy] Forwarding to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                 // Pass explicit Accept header if needed, or rely on fetch defaults
            }
        });

        if (!response.ok) {
             const errText = await response.text();
             console.error(`[GCS Proxy Error] ${response.status}: ${errText}`);
             return res.status(response.status).send(errText);
        }

        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('[GCS Proxy Internal Error]', error);
        res.status(500).json({ error: 'Internal GCS Proxy Error', details: error.message });
    }
});

// Serve Static Assets (Production Build)
app.use(express.static(path.join(__dirname, '../dist'), { index: false }));

// SPA Fallback: Serve index.html for any unknown routes
// SPA Fallback: Serve index.html with runtime env injection
app.get('*', async (req, res) => {
    try {
        const fs = await import('fs/promises');
        const indexPath = path.join(__dirname, '../dist', 'index.html');
        
        let html = await fs.readFile(indexPath, 'utf-8');
        
        // Inject runtime environment variables
        // We inject GOOGLE_API_KEY specifically as it's required for the dashboard
        // Priorities: Process Env > Build Time (already in HTML)
        const runtimeEnv = {
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY
        };

        const scriptTag = `<script>window.env = ${JSON.stringify(runtimeEnv)};</script>`;
        
        // Inject before </head>
        html = html.replace('</head>', `${scriptTag}</head>`);
        
        res.send(html);
    } catch (e) {
        console.error('Error serving index.html:', e);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});
