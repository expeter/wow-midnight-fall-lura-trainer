#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
export PLAYWRIGHT_BROWSERS_PATH="${repository_root}/.tmp/ms-playwright"

cd -- "${repository_root}"
exec npm run test:e2e -- "$@"
