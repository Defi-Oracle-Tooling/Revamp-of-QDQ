#!/bin/bash

set -euo pipefail

# Copyright 2018 ConsenSys AG.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.

NO_LOCK_REQUIRED=false

# Resolve script directory and cd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f ./.env ]; then
    . ./.env
fi

: "${LOCK_FILE:=.quorumDevQuickstart.lock}"

if [ -f ./.common.sh ]; then
    . ./.common.sh
else
    echo "[stop.sh] WARNING: .common.sh missing; proceeding with best-effort stop." >&2
fi

echo "${bold}*************************************"
echo "Revamp of QDQ "
echo "*************************************${normal}"
echo "Stopping network"
echo "----------------------------------"


if docker compose ps >/dev/null 2>&1; then
    docker compose stop
else
    echo "[stop.sh] docker compose not available or docker not running" >&2
fi

if [ -f "docker-compose-deps.yml" ]; then
    echo "Stopping dependencies..."
        if docker compose -f docker-compose-deps.yml ps >/dev/null 2>&1; then
            docker compose -f docker-compose-deps.yml stop || echo "[stop.sh] WARNING: failed stopping dependencies" >&2
        fi
fi

echo "[stop.sh] Network stop sequence complete." 

