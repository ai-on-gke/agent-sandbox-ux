# Agent Sandbox UX (Prism Console)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> **Visual dashboard and control console for managing and monitoring Ephemeral AI Agent Workloads on Google Kubernetes Engine (GKE).**

---

## 🔍 About the UX Console (Prism)

The **Agent Sandbox UX** (internally known as Prism) is a modern web console designed for platform administrators, SREs, and AI developers to observe, audit, and manage containerized agent runtimes in GKE.

### Key Features of the Dashboard:
- **Warmpool Monitor:** View real-time occupancy and capacity of pre-warmed sandbox pools.
- **Active Sandboxes List:** Browse all active sandbox leases, their resource consumption, lifecycle state (e.g. running, paused), and uptime.
- **Egress Violations Auditing:** Check telemetry logs for blocked egress calls to unapproved internet domains.
- **Templates Catalog:** View available `SandboxTemplate` configurations in the cluster.
- **Interactive Metrics:** Beautiful charts showing container startup latency percentiles, memory profiles, and pool claim counts.

The project is built as a single-page app (SPA) using **Vite, React, and Recharts** on the frontend, proxied by a lightweight **Express/Node.js backend** that runs high-performance Kubernetes API queries.

---

## ⚙️ Prerequisite: Agent Sandbox

This UX console serves as a visual client and monitor. It requires the **Agent Sandbox Operator** to be running inside your GKE cluster:
* **Core Sandbox Operator:** The operator manages the lifecycle of sandboxes and warm pools using custom controllers, gVisor container runtime sandboxing, and in-cluster networking filters.
* For more information on the core operator, SDKs, and CRD specifications, please refer to the main repository: [github.com/ai-on-gke/agent-sandbox](https://github.com/ai-on-gke/agent-sandbox).

---

## 💻 Getting Started (Local Development)

### 1. Install Node Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### 2. Launch Dev Server
```bash
npm run dev
```
This runs the frontend Vite development server (`http://localhost:5173`) and the backend Express proxy server concurrently.

---

## ☸️ GKE Kubernetes Deployment Guide

This guide explains how to deploy the Agent Sandbox UX console dashboard directly to your GKE cluster as a standalone Service and Deployment.

### 🔍 Overview
To fetch live telemetry, the dashboard runs `kubectl` commands against the cluster API. To make this work seamlessly in-cluster:
- We installed `kubectl` in the Serve stage of the [Dockerfile](Dockerfile).
- We added an [entrypoint.sh](entrypoint.sh) script that dynamically configures a local kubeconfig context (`in-cluster`) using the pod's service account token, allowing `kubectl` queries to succeed out-of-the-box.
- The UI runs under a dedicated, read-only `agent-sandbox-ux` ServiceAccount to enforce the Principle of Least Privilege.

### 🛠 Prerequisites
Make sure you have:
1. Active credentials to the GCP project and GKE cluster:
   ```bash
   gcloud container clusters get-credentials my-gke-cluster --zone us-central1-a --project my-gcp-project-id
   ```
2. Docker installed and authenticated to Google Artifact Registry:
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
   ```

### 📦 Deployment Instructions
This deploys the Agent Sandbox UX as a separate deployment and service in the `agent-sandbox-system` namespace. It runs independently from the controller, has its own lifecycle, and uses the restricted `agent-sandbox-ux` ServiceAccount.

Apply the deployment manifest:
```bash
kubectl apply -f deploy/kubernetes-deployment.yaml
```

### ⚡ Deployment Automation Script
We provide a script [deploy-k8s.sh](deploy/deploy-k8s.sh) that automates building, pushing, and deploying the application.

#### Default ClusterIP Deployment (Internal only)
```bash
./deploy/deploy-k8s.sh \
  --cluster my-gke-cluster \
  --zone us-central1-a \
  --project my-gcp-project-id \
  --registry us-central1-docker.pkg.dev/my-gcp-project-id/my-sandbox-repo
```

#### LoadBalancer Deployment (Exposes a public external IP)
To access the UI directly without port-forwarding, run with `--service-type LoadBalancer`:
```bash
./deploy/deploy-k8s.sh \
  --cluster my-gke-cluster \
  --zone us-central1-a \
  --project my-gcp-project-id \
  --registry us-central1-docker.pkg.dev/my-gcp-project-id/my-sandbox-repo \
  --service-type LoadBalancer
```

### 🔒 Securing with Identity-Aware Proxy (IAP)
To secure the console for enterprise production, you can enable Google Cloud Identity-Aware Proxy (IAP) to gate access to authorized users in your GCP organization.

#### 1. Prerequisites
1. **OAuth Consent Screen**: Set up an OAuth consent screen in your Google Cloud Console.
2. **OAuth Credentials**: Create an OAuth client ID of application type **Web application**. Add the following redirect URI to the client:
   `https://iap.googleapis.com/v1/oauth/clientIds/YOUR_CLIENT_ID:handleRedirect`
3. **Create Kubernetes Secret**: Create a Kubernetes secret containing your OAuth client ID and secret in the target namespace:
   ```bash
   kubectl create secret generic iap-oauth-client-secret \
     --namespace=agent-sandbox-system \
     --from-literal=client_id=YOUR_CLIENT_ID \
     --from-literal=client_secret=YOUR_CLIENT_SECRET
   ```
4. **SSL Certificate**: Make sure you have a pre-shared Google Cloud SSL Certificate name (or use a GKE-managed certificate).

#### 2. Deploying with IAP
Pass the `--iap` flag along with your custom `--domain` and `--ssl-cert` arguments:
```bash
./deploy/deploy-k8s.sh \
  --cluster my-gke-cluster \
  --zone us-central1-a \
  --project my-gcp-project-id \
  --iap \
  --domain console.example.com \
  --ssl-cert my-pre-shared-ssl-cert
```
This will automatically:
- Configure and apply the GKE `BackendConfig` and `Ingress` resources.
- Annotate the Service to route all external HTTPS traffic through the Identity-Aware Proxy.

### ⚙️ Environment Variables Configuration
Both the deployment script and GKE manifests read configuration options from environment variables. You can export these variables in your shell before running the script:

| Environment Variable | Description | Default / Fallback |
| --- | --- | --- |
| `PROJECT_ID` | Google Cloud Project ID | Automatically detected from active `gcloud` config |
| `CLUSTER_NAME` | GKE Cluster Name | **Required** (must be set or passed as flag) |
| `ZONE` | GKE Cluster Zone (e.g. `us-central1-a`) | Automatically detected from active `gcloud` config |
| `REGISTRY` | Google Artifact Registry repository path | `us-central1-docker.pkg.dev/$PROJECT_ID/my-sandbox-repo` |
| `DEFAULT_BUCKETS` | GCS bucket for memory/state snapshots | `my-sandbox-snapshots-bucket` |
| `SITE_NAME` | Title header displayed in the dashboard | `Agent Sandbox Console` |
| `SERVICE_TYPE` | GKE Service type: `ClusterIP` or `LoadBalancer` | `ClusterIP` |

If you export these variables, you can run the deployment script without passing any command-line options:
```bash
export CLUSTER_NAME="my-gke-cluster"
# Optionally override other settings:
export DEFAULT_BUCKETS="my-custom-snapshots-bucket"

./deploy/deploy-k8s.sh
```

### 🌐 Accessing the Dashboard
Depending on your deployment configuration, you can access the dashboard in the following ways:

#### 1. Port Forwarding (Default ClusterIP)
If you deployed using the default `ClusterIP` service type, use `kubectl` to port-forward to your localhost:
```bash
kubectl port-forward svc/agent-sandbox-ux 8080:80 -n agent-sandbox-system
```
Then, navigate to [http://localhost:8080](http://localhost:8080) in your web browser.

#### 2. External IP (LoadBalancer)
If you deployed with `--service-type LoadBalancer`, retrieve the external IP allocated by Google Cloud:
```bash
kubectl get service agent-sandbox-ux -n agent-sandbox-system
```
Look for the `EXTERNAL-IP` field and navigate to `http://<EXTERNAL-IP>` in your web browser.

#### 3. HTTPS Custom Domain (IAP Ingress)
If you enabled Identity-Aware Proxy (`--iap`), access the console using your configured custom domain (e.g. `https://console.example.com`). All requests will be intercepted by Google's OAuth consent gate to verify the user's identity before accessing the dashboard.

## 🧪 Testing

We maintain a robust suite of component unit tests and End-to-End (E2E) browser tests to guarantee visual and functional stability.

For instructions on how to install test browser binaries and execute unit/E2E test commands, please check the [Agent Sandbox UX Testing Guide](tests/README.md).

---

## 🤝 Contributing

We welcome open-source contributions to enhance warm pool scheduling queues, telemetry charts, and dashboard views! Please review our development guides in `CONTRIBUTING.md`.

---

## 📄 License

Distributed under the Apache License 2.0. See `LICENSE` for details.
