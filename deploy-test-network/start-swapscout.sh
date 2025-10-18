#!/bin/bash
# Swapscout (LI.FI) startup script

echo "Starting Swapscout (LI.FI) Cross-Chain Analytics..."

# Check if LI.FI configuration is present
if [ ! -f "./swapscout-compose.yml" ]; then
    echo "❌ Swapscout configuration not found. Enable with --swapscout flag during generation."
    exit 1
fi

# Start Swapscout services
docker-compose -f swapscout-compose.yml up -d

echo "✅ Swapscout services starting..."
echo ""
echo "🔗 Swapscout Explorer: http://localhost:8082"
echo "🔗 Swapscout API: http://localhost:3001"
echo "🔗 Swapscout Web UI: http://localhost:3002"
echo ""
echo "⏳ Services may take 1-2 minutes to fully initialize..."
echo "📊 Monitor cross-chain transactions and bridge analytics"
echo ""
echo "To stop Swapscout: docker-compose -f swapscout-compose.yml down"
