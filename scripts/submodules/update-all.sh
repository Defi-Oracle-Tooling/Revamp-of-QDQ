#!/usr/bin/env bash
set -euo pipefail

# update-all.sh
# Purpose: Synchronize and update all git submodules to their recorded commits,
# optionally pulling latest from their default branch.
# Usage:
#   ./scripts/submodules/update-all.sh            # init & sync
#   ./scripts/submodules/update-all.sh --pull     # also pull latest default branch
#   ./scripts/submodules/update-all.sh --status   # show submodule status summary
#
# Flags:
#   --pull    : After syncing, enter each submodule, checkout its default branch (main/master) and pull.
#   --status  : Only show status (paths & HEAD commit) and exit.
#
# Notes:
# - Does not change commits in superproject unless you stage updated submodule pointers manually.
# - For private submodules requiring PAT/SSH, ensure credentials are loaded before running.

PULL=false
STATUS=false

for arg in "$@"; do
  case "$arg" in
    --pull) PULL=true ;;
    --status) STATUS=true ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

if $STATUS; then
  echo "== Submodule Status =="
  git submodule status || { echo "No submodules found"; exit 0; }
  exit 0
fi

echo "[1/3] Initializing & updating submodules (recursive)";
git submodule update --init --recursive

echo "[2/3] Synchronizing submodule URLs with .gitmodules";
git submodule sync --recursive

if $PULL; then
  echo "[3/3] Pulling latest commits from each submodule default branch";
  git submodule foreach 'set -e; \
    branch=""; \
    if git show-ref --verify --quiet refs/heads/main; then branch=main; \
    elif git show-ref --verify --quiet refs/heads/master; then branch=master; \
    else echo "Skipping (no main/master): $name"; exit 0; fi; \
    echo "Updating $name on $branch"; \
    git checkout "$branch"; \
    git pull --ff-only'
  echo "Done. Stage submodule pointer changes if any advanced commits pulled:";
  echo "  git add path/to/submodule && git commit -m 'chore: update <submodule>'"
else
  echo "[3/3] Pull skipped (use --pull to fetch latest)."
fi

echo "Submodule management complete.";