# 🚀 Agent Sandbox UX Kubernetes Deployment Guide

This directory contains manifests and scripts to deploy the Agent Sandbox UX console dashboard directly to your Google Kubernetes Engine (GKE) cluster.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Instructions](#deployment-instructions)
4. [Deployment Automation Script](#deployment-automation-script)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Accessing the Dashboard](#accessing-the-dashboard)

---

## 🔍 Overview

The Agent Sandbox UX (Prism) is a console hub that provides platform architects, security engineers, and AI developers with live insights into running sandboxes, warmpools, and resource usage.

To fetch live telemetry, the dashboard runs `kubectl` commands against the cluster API. To make this work seamlessly in-cluster:
- We installed `kubectl` in the Serve stage of the [Dockerfile](../Dockerfile).
- We added an [entrypoint.sh](../entrypoint.sh) script that dynamically configures a local kubeconfig context (`in-cluster`) using the pod's service account token, allowing `kubectl` queries to succeed out-of-the-box.

---

## 🛠 Prerequisites

Make sure you have:
1. Active credentials to the GCP project and GKE cluster:
   ```bash
   gcloud container clusters get-credentials my-gke-cluster --zone us-central1-a --project my-gcp-project-id
   ```
2. Docker installed and authenticated to Google Artifact Registry:
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
   ```

---

## 📦 Deployment Instructions

This deploys the Agent Sandbox UX as a separate deployment and service in the `agent-sandbox-system` namespace. It runs independently from the controller, has its own lifecycle, and uses the `agent-sandbox-controller` ServiceAccount for RBAC authorization.

Apply the deployment manifest:
```bash
kubectl apply -f deploy/kubernetes-deployment.yaml
```

---

## ⚡ Deployment Automation Script

We provide a script [deploy-k8s.sh](deploy-k8s.sh) that automates building, pushing, and deploying the application.

```bash
./deploy/deploy-k8s.sh --cluster my-gke-cluster --zone us-central1-a --project my-gcp-project-id
```

---

## ⚙️ Environment Variables Configuration

Both the deployment script and GKE manifests read configuration options from environment variables. You can export these variables in your shell before running the script:

| Environment Variable | Description | Default / Fallback |
| --- | --- | --- |
| `PROJECT_ID` | Google Cloud Project ID | Automatically detected from active `gcloud` config |
| `CLUSTER_NAME` | GKE Cluster Name | **Required** (must be set or passed as flag) |
| `ZONE` | GKE Cluster Zone (e.g. `us-central1-a`) | Automatically detected from active `gcloud` config |
| `REGISTRY` | Google Artifact Registry repository path | `us-central1-docker.pkg.dev/$PROJECT_ID/my-sandbox-repo` |
| `DEFAULT_BUCKETS` | GCS bucket for memory/state snapshots | `my-sandbox-snapshots-bucket` |
| `SITE_NAME` | Title header displayed in the dashboard | `Agent Sandbox Console` |

If you export these variables, you can run the deployment script without passing any command-line options:

```bash
export CLUSTER_NAME="my-gke-cluster"
# Optionally override other settings:
export DEFAULT_BUCKETS="my-custom-snapshots-bucket"

./deploy/deploy-k8s.sh
```

---

## 🌐 Accessing the Dashboard

Once deployed, you can access the dashboard via port-forwarding:
```bash
kubectl port-forward svc/agent-sandbox-ux 8080:80 -n agent-sandbox-system
```

Open [http://localhost:8080](http://localhost:8080) in your web browser to view the console.
