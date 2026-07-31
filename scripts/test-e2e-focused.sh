#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
preset="${1:-}"

case "${preset}" in
  crystal)
    grep_pattern='recollects a transition-started Phase 2 crystal|non-carrier personal circle|Phase 3 crystal|crystal grounded'
    ;;
  p4-tank)
    grep_pattern='controlled Phase 4 tank|second Phase 4 tank|Phase 4 tank|three-Splinter set'
    ;;
  phase2)
    grep_pattern='Phase 2|P2'
    ;;
  main-ability)
    grep_pattern='Main ability visibly fills'
    ;;
  '')
    printf 'Usage: %s <crystal|p4-tank|phase2|main-ability|free text>\n' "$0" >&2
    exit 2
    ;;
  *)
    shift
    grep_pattern="${preset}${*:+ $*}"
    ;;
esac

cd -- "${repository_root}"
export LURA_E2E_PORT="${LURA_E2E_PORT:-4179}"
export LURA_E2E_ISOLATED=1
exec ./scripts/playwright-local.sh --grep "${grep_pattern}" --retries=0
