#!/bin/bash
# Deployment script for Quorum Kubernetes cluster

set -e

# Configuration
NAMESPACE="quorum-network"
KUBECTL=${KUBECTL:-kubectl}

echo "🚀 Starting Quorum Kubernetes deployment..."

# Check if kubectl is available
if ! command -v $KUBECTL &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if connected to cluster
if ! $KUBECTL cluster-info &> /dev/null; then
    echo "❌ Not connected to Kubernetes cluster"
    exit 1
fi

echo "✅ Kubernetes cluster connection verified"

# Apply manifests in order
echo "📝 Creating namespace and configuration..."
$KUBECTL apply -f 00-namespace-config.yaml

echo "⏳ Waiting for namespace to be ready..."
$KUBECTL wait --for=condition=Ready namespace/$NAMESPACE --timeout=30s

echo "🏗️ Deploying validator nodes..."
$KUBECTL apply -f 01-validators.yaml

echo "🔌 Deploying RPC nodes..."
$KUBECTL apply -f 02-rpc-nodes.yaml

echo "🔍 Deploying Blockscout explorer..."
$KUBECTL apply -f 03-blockscout.yaml

echo "🌐 Setting up networking..."
$KUBECTL apply -f 04-networking.yaml

echo "📊 Setting up monitoring..."
$KUBECTL apply -f 05-monitoring.yaml

echo "⏳ Waiting for deployments to be ready..."
$KUBECTL wait --for=condition=Available deployment --all -n $NAMESPACE --timeout=300s

echo "⏳ Waiting for StatefulSets to be ready..."
$KUBECTL wait --for=condition=Ready statefulset --all -n $NAMESPACE --timeout=300s

echo "✅ Quorum network deployment completed successfully!"

echo ""
echo "📋 Deployment Summary:"
echo "Namespace: $NAMESPACE"
echo ""

echo "🔍 Validators:"
$KUBECTL get pods -n $NAMESPACE -l app=quorum-validator

echo ""
echo "🔌 RPC Nodes:"
$KUBECTL get pods -n $NAMESPACE -l app=quorum-rpc

echo ""
echo "🔍 Explorer:"
$KUBECTL get pods -n $NAMESPACE -l app=blockscout

echo ""
echo "📊 Monitoring:"
$KUBECTL get pods -n $NAMESPACE -l app=prometheus

echo ""
echo "🌐 Services:"
$KUBECTL get services -n $NAMESPACE

echo ""
echo "🔗 External Access:"
echo "RPC Endpoint: Get external IP with 'kubectl get service quorum-rpc-external -n $NAMESPACE'"
echo "Explorer: Port-forward with 'kubectl port-forward service/blockscout 4000:4000 -n $NAMESPACE'"
echo "Monitoring: Port-forward with 'kubectl port-forward service/prometheus 9090:9090 -n $NAMESPACE'"

echo ""
echo "🎉 Deployment completed! Your Quorum network is now running on Kubernetes."