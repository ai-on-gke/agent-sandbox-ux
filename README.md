# Agent Sandbox

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> **Secure, High-Performance Isolated Container Orchestration for Ephemeral AI Agent Workloads on Google Kubernetes Engine (GKE).**

---

## Overview

**Agent Sandbox** provides enterprise platform teams, SREs, and AI engineers with a modular, visually stunning console hub to deploy, audit, and contain autonomous AI agent scripts. 

When AI agents generate and execute arbitrary code blocks or interact with untrusted third-party software dependencies, they present dangerous threat vectors—including host node kernel breakouts and network data exfiltration. Agent Sandbox isolates these ephemeral workloads inside secure user-space containers, combining **sub-second cold start latency** with **zero-trust infrastructure constraints**.

---

## Core Capabilities & Workflows

### 🚀 Smart Warmpool Provisioner
Bypass standard Kubernetes container scheduling delays. Agent Sandbox manages dynamically scaled pools of pre-heated execution nodes using state queues, enabling instant container claim allocations in **under 1.0 seconds**.

### 🛡️ gVisor Kernel Containment
Every execution container runs isolated inside a custom user-space kernel layer (`runsc`). Guest application system calls are intercepted before reaching the host Linux kernel, guaranteeing that malicious exploits cannot breach tenant constraints.

### 🌐 Layer 7 Network Egress Filtering
Strict allowlist auditing blocks arbitrary outbound packet calls. Prevent data leakage by restricting agent egress to explicitly verified domain endpoints (e.g., OpenAI APIs, safe package repositories) while blocking malicious exfiltration targets instantly.

### 💾 State Capture Replication Engine
Leverage GKE native pod snapshots to freeze running memory contexts and serialize full state layers to secure Google Cloud Storage (GCS) destinations. Rehydrate warm footprints via fast-path resume bindings in **less than 1.8 seconds**, skipping baseline boot sequences.

---

## Persona Consoles Alignment

The dashboard console is structurally divided to support three primary enterprise personas:
1. **Platform Architects:** Optimize min/max warm pool replicas, audit resource constraints (CPU/Memory limits), and balance cluster utilization profiles against spend overhead.
2. **Security Engineers & SREs:** Hot-inject emergency dynamic egress bans via the Outbound Policy Interceptor, monitor trace spans through OpenTelemetry sidecars, and evaluate filesystem diff tracks.
3. **AI Software Engineers:** Browse environment catalog templates, trace execution runtime logs, and copy programmatic initialization templates.

---

## Getting Started

### Local Development Environment

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Unified Dev Server**:
   ```bash
   npm run dev
   ```
   * This launches the front-end Vite environment (`http://localhost:5173`) and back-end API proxy server concurrently.

---

## Technical Specifications & Schemas

### 1. SandboxTemplate Custom Resource Definition (CRD)
Define isolation runtime environments, warmpool dimensions, and approved domain lists:

```yaml
apiVersion: sandbox.gke.io/v1alpha1
kind: SandboxTemplate
metadata:
  name: python-agent-runner
  namespace: agent-runtime-prod
spec:
  runtimeClass: runsc
  warmPool:
    minReplicas: 20
    maxReplicas: 100
  limitEgress:
    allowlist:
      - api.openai.com
      - pypi.org
      - api.github.com
```

### 2. PodSnapshotStorageConfig Definition
Bind snapshot capture footprints to persistent cloud storage buckets:

```yaml
apiVersion: snapshot.gke.io/v1alpha1
kind: PodSnapshotStorageConfig
metadata:
  name: pssc-prod-backup-config
spec:
  storageProvider: GCS
  bucketURI: gs://agent-sandbox-runtime-snapshots
  encryption: GoogleManaged
```

---

## Programmatic Client Invocation (Python SDK)

AI developers can programmatically claim sandboxes or restore persistent golden checkpoints inside their autonomous scripts using the following client initialization syntax:

```python
import google.gke.sandbox as sdk

# 1. Connect to GKE Sandbox Operator API gateway
client = sdk.SandboxClient(project_id="prod-data-pipelines", cluster="gke-us-central-c1")

# 2. Claim a pre-warmed user-space runtime instance instantly
sandbox = client.claim(template="python-agent-runner", warm_timeout=1.5)

# 3. Safely execute untrusted code block with strict memory limits
response = sandbox.execute("agent_reasoning_script.py", memory_limit="1.1GiB")

print(f"Execution finished completely. Containment status: {response.status_code}")
```

---

## Contributing

We welcome open-source contributions to enhance warm pool scheduling queues, security diff layers, and SDK definitions! Please review our development guides in `CONTRIBUTING.md`.

---

## License

Distributed under the Apache License 2.0. See `LICENSE` for details.
