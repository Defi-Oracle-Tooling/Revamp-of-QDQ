#!/usr/bin/env bash
set -euo pipefail

# externalize.sh
# Purpose: Convert an existing directory in the mono-repo into an external Git repo
#          and add it back as a submodule.
#
# Usage:
#   ./scripts/submodules/externalize.sh <directory> <github_org> <repo_name> [--push]
#
# Example:
#   ./scripts/submodules/externalize.sh manual-dapp-test Defi-Oracle-Tooling manual-dapp-test --push
#
# Requirements:
# - GitHub repo must exist or user must have permission to create it.
# - PAT or SSH auth must be configured for pushing.

if [ $# -lt 3 ]; then
  echo "Usage: $0 <directory> <github_org> <repo_name> [--push]" >&2
  exit 1
fi

DIR=$1
ORG=$2
REPO=$3
PUSH=false

if [ ! -d "$DIR" ]; then
  echo "Directory $DIR does not exist" >&2
  exit 2
fi

for arg in "$@"; do
  [ "$arg" = "--push" ] && PUSH=true || true
done

TMP_DIR=$(mktemp -d)
echo "Exporting $DIR to $TMP_DIR"
cp -R "$DIR"/* "$TMP_DIR"/

echo "Initializing new repository"
cd "$TMP_DIR"
git init -q
git add .
git commit -m "Initial extraction from mono-repo: $DIR" >/dev/null

REMOTE_URL="https://github.com/$ORG/$REPO.git"
echo "Setting remote: $REMOTE_URL"
git remote add origin "$REMOTE_URL"

if $PUSH; then
  echo "Pushing initial commit to $REMOTE_URL"
  git branch -M main
  git push -u origin main
else
  echo "Skipping push (omit --push if you will manually create/push later)."
fi

cd - >/dev/null

echo "Removing original directory from mono-repo tracking (if tracked)"
git rm -r "$DIR" 2>/dev/null || echo "Directory not tracked; continuing." 

echo "Committing removal"
git commit -m "chore(submodules): remove $DIR prior to submodule add" || echo "Nothing to commit for removal"

echo "Adding as submodule"
git submodule add "$REMOTE_URL" "$DIR"
git commit -m "chore(submodules): add $DIR as submodule"

echo "Externalization complete for $DIR."