#!/bin/bash
# Deploy frontend and backend for ChainID 138 wallet integration

set -e

FRONTEND_DIR="files/common/dapps/quorumToken/frontend"
BACKEND_API="files/common/dapps/quorumToken/frontend/pages/api"

# Install dependencies
cd "$FRONTEND_DIR"
npm install

# Build frontend
npm run build

# Start frontend (Next.js)
npm run start &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"

# Wait for frontend to be ready
sleep 5

# Run backend API tests
cd ../../../..
npm run test -- tests/tatumApi.test.ts

# Kill frontend
kill $FRONTEND_PID

echo "Deployment and tests complete."
