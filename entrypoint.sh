#!/bin/sh
set -eu

# If running inside a Kubernetes Pod, configure a local kubeconfig context
if [ -f /var/run/secrets/kubernetes.io/serviceaccount/token ]; then
  echo "Kubernetes environment detected. Initializing in-cluster kubeconfig..."
  
  KUBE_TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
  KUBE_CA=/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
  KUBE_SERVER="https://kubernetes.default.svc"
  
  kubectl config set-cluster in-cluster --server="$KUBE_SERVER" --certificate-authority="$KUBE_CA"
  kubectl config set-credentials in-cluster-user --token="$KUBE_TOKEN"
  kubectl config set-context in-cluster --cluster=in-cluster --user=in-cluster-user
  kubectl config use-context in-cluster
  
  echo "Kubeconfig context 'in-cluster' successfully configured and set as active."
else
  echo "No Kubernetes environment detected. Skipping kubeconfig setup."
fi

# Hand over to CMD
exec "$@"
