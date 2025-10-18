#!/usr/bin/env bash
set -euo pipefail

echo "[submodules] Verifying working tree population" >&2

missing=()
while IFS= read -r line; do
  name=$(echo "$line" | awk '{print $2}' | tr -d '"')
  path=$(git config --file .gitmodules --get submodule.$name.path || true)
  [ -z "$path" ] && continue
  if [ -d "$path" ]; then
    # Consider unfetched if only .git file and <=2 entries
    entries=$(ls -1A "$path" | wc -l | tr -d ' ')
    if [ "$entries" -le 2 ]; then
      missing+=("$name:$path")
    fi
  else
    missing+=("$name:$path (absent)")
  fi
done < <(grep '^\[submodule "' .gitmodules || true)

if [ ${#missing[@]} -eq 0 ]; then
  echo "All submodules appear populated." >&2
else
  echo "Unpopulated / possibly private submodules:" >&2
  printf '  - %s\n' "${missing[@]}"
  echo "Hint: git submodule update --init --recursive (ensure credentials for private repos)." >&2
fi