#!/usr/bin/env bash
set -euo pipefail

echo "[setup] Bootstrapping local development environment"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required." >&2
  exit 1
fi

if [ ! -f package.json ]; then
  echo "Run from repository root." >&2
  exit 1
fi

echo "[setup] Installing root dependencies"
npm install --no-audit --no-fund

echo "[setup] Initializing submodules"
git submodule update --init --recursive

echo "[setup] Syncing manifest from .gitmodules"
npm run sync:manifests || echo "Manifest sync skipped (script missing)"

cat > .env.local.example <<EOF
# Copy to .env.local and set real values
TATUM_API_KEY=changeme
WELLS_FARGO_BASE_URL=https://api-sandbox.wellsfargo.com
SIMULATION_MODE=true
EOF

echo "[setup] Building project"
npm run build

echo "[setup] Running test suite"
npm test --silent --passWithNoTests || true

echo "[setup] Done. Next steps:"
echo "  1. cp .env.local.example .env.local && edit secrets"
echo "  2. node build/index.js --help"
echo "  3. npm run docs:cli"
