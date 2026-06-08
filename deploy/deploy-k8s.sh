#!/bin/bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

# Resolve Dynamic Defaults (overridable by environment variables or command-line flags)
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
ZONE="${ZONE:-$(gcloud config get-value compute/zone 2>/dev/null)}"
CLUSTER_NAME="${CLUSTER_NAME:-}"
IMAGE_NAME="${IMAGE_NAME:-agent-sandbox-ux}"
TAG="${TAG:-latest}"
NAMESPACE="${NAMESPACE:-agent-sandbox-system}"
DEFAULT_BUCKETS="${DEFAULT_BUCKETS:-my-sandbox-snapshots-bucket}"
SITE_NAME="${SITE_NAME:-Agent Sandbox Console}"
SERVICE_TYPE="${SERVICE_TYPE:-ClusterIP}"

# IAP Configurations
ENABLE_IAP="false"
DOMAIN_NAME="${DOMAIN_NAME:-}"
SSL_CERT_NAME="${SSL_CERT_NAME:-}"

usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -p, --project <ID>      Google Cloud Project ID (default: ${PROJECT_ID:-None})"
  echo "  -c, --cluster <NAME>    GKE Cluster Name (default: ${CLUSTER_NAME:-None})"
  echo "  -z, --zone <ZONE>       GKE Cluster Zone (default: ${ZONE:-None})"
  echo "  --service-type <TYPE>   Kubernetes Service type: ClusterIP or LoadBalancer (default: ClusterIP)"
  echo "  --iap                   Enable GKE Identity-Aware Proxy (IAP)"
  echo "  --domain <HOST>         Custom domain name for HTTPS Ingress (required for --iap)"
  echo "  --ssl-cert <NAME>       Pre-shared SSL certificate name in GCP (required for --iap)"
  echo "  -h, --help              Show this help message"
  exit 1
}

# Parse options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -p|--project) PROJECT_ID="$2"; shift ;;
    -c|--cluster) CLUSTER_NAME="$2"; shift ;;
    -z|--zone) ZONE="$2"; shift ;;
    --service-type) SERVICE_TYPE="$2"; shift ;;
    --iap) ENABLE_IAP="true" ;;
    --domain) DOMAIN_NAME="$2"; shift ;;
    --ssl-cert) SSL_CERT_NAME="$2"; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown parameter: $1"; usage ;;
  esac
  shift
done

# Validation Checks
if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID is not set and could not be detected from gcloud configuration." >&2
  echo "Please set the PROJECT_ID environment variable or pass the -p/--project flag." >&2
  exit 1
fi

if [ -z "$CLUSTER_NAME" ]; then
  echo "Error: CLUSTER_NAME must be specified." >&2
  echo "Please set the CLUSTER_NAME environment variable or pass the -c/--cluster flag." >&2
  exit 1
fi

if [ -z "$ZONE" ]; then
  echo "Error: ZONE is not set and could not be detected from gcloud configuration." >&2
  echo "Please set the ZONE environment variable or pass the -z/--zone flag." >&2
  exit 1
fi

if [ "$ENABLE_IAP" = "true" ]; then
  if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: --domain <HOST> must be specified when using --iap." >&2
    exit 1
  fi
  if [ -z "$SSL_CERT_NAME" ]; then
    echo "Error: --ssl-cert <NAME> must be specified when using --iap." >&2
    exit 1
  fi
fi


# Define Registry and Image URL dynamically
REGISTRY="${REGISTRY:-us-central1-docker.pkg.dev/$PROJECT_ID/my-sandbox-repo}"
FULL_IMAGE_URL="$REGISTRY/$IMAGE_NAME:$TAG"

echo "=== GKE Deployment Script for Agent Sandbox UX ==="
echo "Project:          $PROJECT_ID"
echo "Cluster:          $CLUSTER_NAME"
echo "Zone:             $ZONE"
echo "Image URL:        $FULL_IMAGE_URL"
echo "Default Buckets:  $DEFAULT_BUCKETS"
echo "Site Name:        $SITE_NAME"
echo "Service Type:     $SERVICE_TYPE"
echo "=================================================="

# 1. Authenticate with GKE cluster
echo "Connecting to GKE cluster..."
gcloud container clusters get-credentials "$CLUSTER_NAME" --zone "$ZONE" --project "$PROJECT_ID"

# 2. Build the Docker Image
echo "Building the container image..."
docker build -t "$FULL_IMAGE_URL" --load .

# 3. Push to Artifact Registry
echo "Pushing image to Google Artifact Registry..."
docker push "$FULL_IMAGE_URL"

# 4. Deploy to Kubernetes
echo "Deploying as a standalone Service and Deployment..."

# Resolve Service annotations based on IAP enablement
if [ "$ENABLE_IAP" = "true" ]; then
  SERVICE_ANNOTATIONS="beta.cloud.google.com/backend-config: '{\"default\": \"agent-sandbox-ux-iap-config\"}'"
else
  SERVICE_ANNOTATIONS="kubernetes.io/change-cause: 'deploy'"
fi

# Replace placeholders on-the-fly and apply the standalone manifests
cat deploy/kubernetes-deployment.yaml \
  | sed "s|{{IMAGE}}|${FULL_IMAGE_URL}|g" \
  | sed "s|{{PROJECT_ID}}|${PROJECT_ID}|g" \
  | sed "s|{{DEFAULT_BUCKETS}}|${DEFAULT_BUCKETS}|g" \
  | sed "s|{{SITE_NAME}}|${SITE_NAME}|g" \
  | sed "s|{{SERVICE_ANNOTATIONS}}|${SERVICE_ANNOTATIONS}|g" \
  | sed "s|{{SERVICE_TYPE}}|${SERVICE_TYPE}|g" \
  | kubectl apply -f -

# Deploy GKE IAP BackendConfig & Ingress if enabled
if [ "$ENABLE_IAP" = "true" ]; then
  echo "Deploying GKE IAP BackendConfig and Ingress..."
  cat deploy/kubernetes-iap.yaml \
    | sed "s|{{DOMAIN_NAME}}|${DOMAIN_NAME}|g" \
    | sed "s|{{SSL_CERT_NAME}}|${SSL_CERT_NAME}|g" \
    | kubectl apply -f -
fi

# 5. Verify the Deployment
echo "Verifying the deployment..."
echo "Waiting for rollout to finish..."
if ! kubectl rollout status deployment/agent-sandbox-ux -n "$NAMESPACE" --timeout=120s; then
  echo "Error: Deployment rollout timed out or failed." >&2
  exit 1
fi

echo "Deployment is rolled out. Testing API accessibility..."

# Start port-forwarding to a test port in the background
TEST_PORT=28080
kubectl port-forward svc/agent-sandbox-ux ${TEST_PORT}:80 -n "$NAMESPACE" >/dev/null 2>&1 &
PF_PID=$!

# Cleanup port-forward on script exit
cleanup() {
  echo "Cleaning up test port-forward (PID $PF_PID)..."
  kill $PF_PID >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Wait a moment for port-forward to establish
sleep 3

# Send a test HTTP request to check server health
echo "Sending test query to telemetry API..."
API_RESPONSE=$(curl -s --max-time 10 http://localhost:${TEST_PORT}/api/v1/telemetry/summary || true)

if echo "$API_RESPONSE" | grep -q "cluster"; then
  echo "=================================================="
  echo "✅ Verification Success! Telemetry API is responding correctly."
  echo "=================================================="
else
  echo "=================================================="
  echo "❌ Warning: Telemetry API verification failed."
  echo "Response received: $API_RESPONSE"
  echo "=================================================="
  exit 1
fi

echo "Deployment completed successfully!"
echo "The console dashboard is running as a standalone deployment 'agent-sandbox-ux' on port 8080."
echo "To access it locally, run:"
echo "  kubectl port-forward svc/agent-sandbox-ux 8080:80 -n $NAMESPACE"
echo "Then navigate to http://localhost:8080 in your browser."
