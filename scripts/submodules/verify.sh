#!/usr/bin/env bash
set -euo pipefail

# verify.sh
# Purpose: Ensure submodules are initialized, clean, and match recorded commits.
# Exits non-zero if:
#  - Submodule not initialized
#  - Submodule has uncommitted changes
#  - Submodule HEAD differs from superproject recorded commit
#
# Usage:
#   ./scripts/submodules/verify.sh            # standard checks
#   ./scripts/submodules/verify.sh --strict   # also check detached HEAD, missing main/master branch
#
STRICT=false
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=true ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

echo "== Submodule Verification =="

if ! git submodule status >/dev/null 2>&1; then
  echo "No submodules defined."; exit 0
fi

FAILURES=0

git submodule foreach --quiet 'set -e; \
  path="$name"; \
  recorded=$(git rev-parse HEAD 2>/dev/null || echo "<none>"); \
  super=$(git rev-parse :"$toplevel/$path" 2>/dev/null || echo "<unknown>"); \
  statusLine=$(git status --porcelain); \
  dirty=false; [ -n "$statusLine" ] && dirty=true; \
  mismatch=false; [ "$recorded" != "$sha1" ] && mismatch=true; \
  detached=false; ref=$(git symbolic-ref -q HEAD || true); [ -z "$ref" ] && detached=true; \
  mainBranch=""; if git show-ref --quiet refs/heads/main; then mainBranch=main; elif git show-ref --quiet refs/heads/master; then mainBranch=master; fi; \
  printf "Submodule: %s\n  Recorded Commit: %s\n  Superproject SHA: %s\n  Dirty: %s\n  Mismatch: %s\n" "$path" "$recorded" "$sha1" "$dirty" "$mismatch"; \
  if [ "$dirty" = true ]; then echo "  -> ERROR: Dirty working tree"; echo; exit 1; fi; \
  if [ "$mismatch" = true ]; then echo "  -> ERROR: HEAD differs from superproject pointer"; echo; exit 2; fi; \
  if [ "$STRICT" = true ]; then \
    if [ "$detached" = true ]; then echo "  -> ERROR: Detached HEAD"; echo; exit 3; fi; \
    if [ -z "$mainBranch" ]; then echo "  -> WARN: No main/master branch present"; echo; fi; \
  fi; \
  echo;'
rc=$?
if [ $rc -ne 0 ]; then
  echo "Verification failed (rc=$rc)." >&2
  exit $rc
fi

echo "All submodules verified successfully.";