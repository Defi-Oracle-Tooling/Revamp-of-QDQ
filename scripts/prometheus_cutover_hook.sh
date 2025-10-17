#!/usr/bin/env bash
set -euo pipefail
source .besu_env
PHASE="${1:-generic}"
BLOCK_NUMBER=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json' http://localhost:8545 | jq -r '.result' 2>/dev/null || echo 0x0)
BN_DEC=$((BLOCK_NUMBER)) || BN_DEC=0
PUSHGW=${PROM_PUSHGATEWAY:-}
if [[ -z "$PUSHGW" ]]; then
	echo "[prometheus] PROM_PUSHGATEWAY not set; skipping push"
	exit 0
fi
cat <<EOF | curl -s --data-binary @- "${PUSHGW}/metrics/job/besu_cutover/instance/${REMOTE_HOST}" || echo "[prometheus] push failed"
besu_cutover_phase{phase="$PHASE"} 1
besu_cutover_last_block $BN_DEC
EOF
echo "[prometheus] Emitted metrics phase=$PHASE block=$BN_DEC"
