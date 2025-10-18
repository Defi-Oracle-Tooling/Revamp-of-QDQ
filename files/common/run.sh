#!/bin/bash
set -euo pipefail

# Revamp of QDQ network start script (hardened, normalized after ENOSPC recovery)
NO_LOCK_REQUIRED=true

# Resolve script directory to allow execution from any path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment defaults if present
if [ -f ./.env ]; then
    # shellcheck disable=SC1091
    . ./.env
else
    echo "[run.sh] WARNING: .env file not found; proceeding with defaults" >&2
fi

# Default lock file fallback
: "${LOCK_FILE:=.quorumDevQuickstart.lock}"

# Load shared helpers
if [ -f ./.common.sh ]; then
    # shellcheck disable=SC1091
    . ./.common.sh
else
    echo "[run.sh] ERROR: .common.sh missing; scripts may be corrupted." >&2
    exit 1
fi

# Prepare log directories (avoid permission issues inside containers)
mkdir -p logs/besu logs/quorum logs/tessera

# Guard against accidental double start
if [ -f "${LOCK_FILE}" ]; then
    echo "[run.sh] Detected existing lock file '${LOCK_FILE}'. If the network isn't running, remove it with ./remove.sh first." >&2
    exit 1
fi
echo "docker-compose.yml" > "${LOCK_FILE}"

echo "${bold}*************************************"
echo "Revamp of QDQ"
echo "*************************************${normal}"
echo "Start network"
echo "--------------------"

if [ -f "docker-compose-deps.yml" ]; then
    echo "Starting dependencies..."
    docker compose -f docker-compose-deps.yml up --detach
    # Allow dependencies (e.g., monitoring stack) to stabilize
    sleep 60
fi

echo "Starting network..."
docker compose build --pull
docker compose up --detach

# List services and endpoints (best-effort)
if [ -x ./list.sh ]; then
    ./list.sh || echo "[run.sh] WARNING: list.sh exited with non-zero status" >&2
else
    echo "[run.sh] INFO: list.sh not found or not executable; skipping service endpoint summary" >&2
fi

echo "[run.sh] Network started successfully."  
echo "${bold}*************************************"
echo "Revamp of QDQ"
echo "*************************************${normal}"
echo "Start network"
echo "--------------------"

if [ -f "docker-compose-deps.yml" ]; then
    echo "Starting dependencies..."
    docker compose -f docker-compose-deps.yml up --detach
    sleep 60
fi

echo "Starting network..."
docker compose build --pull
docker compose up --detach


#list services and endpoints
if [ -x ./list.sh ]; then
    ./list.sh || echo "[run.sh] WARNING: list.sh exited with non-zero status" >&2
else
    echo "[run.sh] INFO: list.sh not found or not executable; skipping service endpoint summary" >&2
fi
echo "[run.sh] Network started successfully." 
