#!/bin/bash
# Usage: ./scripts/submodules/add-submodule.sh <repo-url> <target-path>
# Example: ./scripts/submodules/add-submodule.sh https://github.com/Defi-Oracle-Tooling/tatum-connector src/integrations/tatum-connector

set -e

REPO_URL="$1"
TARGET_PATH="$2"

if [ -z "$REPO_URL" ] || [ -z "$TARGET_PATH" ]; then
  echo "Usage: $0 <repo-url> <target-path>"
  exit 1
fi

git submodule add "$REPO_URL" "$TARGET_PATH"
git submodule update --init --recursive "$TARGET_PATH"
echo "Submodule added: $REPO_URL at $TARGET_PATH"
