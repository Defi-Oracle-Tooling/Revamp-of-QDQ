#!/usr/bin/env bash
set -euo pipefail

# Simple secret scanner for common token/key patterns.
# Exits non-zero if potential secrets are found.
# Usage: ./scripts/scan-secrets.sh [--staged]

TARGET="." # default scan whole repo
GIT_FLAGS=""
if [[ "${1:-}" == "--staged" ]]; then
  echo "[scan-secrets] Scanning only staged changes..."
  # Use git diff --cached to restrict content; dump to temp file for grep
  TMP_FILE=$(mktemp)
  git diff --cached > "$TMP_FILE"
  TARGET="$TMP_FILE"
fi

echo "[scan-secrets] Running pattern checks..."
declare -a PATTERNS=(
  'ghp_[A-Za-z0-9]{36}'              # GitHub PAT
  'github_pat_[A-Za-z0-9_]+'         # Newer GitHub fine-grained token prefix
  'AWS_ACCESS_KEY_ID'                # AWS key exposure indicator
  'AKIA[0-9A-Z]{16}'                 # Classic AWS access key format
  '-----BEGIN PRIVATE KEY-----'      # PEM private key
  '-----BEGIN EC PRIVATE KEY-----'   # EC private key
  'SECRET_KEY'                       # Generic secret key label
  'GCP_PROJECT='                     # Potential GCP env leakage marker
)

FOUND=0
for p in "${PATTERNS[@]}"; do
  if grep -R -E -n "$p" "$TARGET" 2>/dev/null | grep -v scan-secrets.sh; then
    echo "[scan-secrets] Potential secret match for pattern: $p" >&2
    FOUND=1
  fi
done

if [[ "$TARGET" != "." ]]; then
  rm -f "$TARGET"
fi

if [[ $FOUND -ne 0 ]]; then
  echo "[scan-secrets] FAIL: Potential secrets detected. Please remove or secure them." >&2
  exit 1
else
  echo "[scan-secrets] PASS: No obvious secrets found."
fi