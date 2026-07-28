#!/usr/bin/env bash
set -euo pipefail

revision="${1:-}"
archive="${2:-}"
expected_archive="/tmp/lura-api-${revision}.tar.gz"
if [[ ! "${revision}" =~ ^[0-9a-f]{40}$ || "${archive}" != "${expected_archive}" || ! -f "${archive}" ]]; then
  echo "usage: activate-release <40-character-git-sha> <release-archive>" >&2
  exit 1
fi

release="/opt/lura-api/releases/${revision}"
previous="$(readlink -f /opt/lura-api/current 2>/dev/null || true)"
if [[ -e "${release}" ]]; then
  echo "release ${revision} already exists" >&2
  exit 1
fi

while IFS= read -r entry; do
  case "${entry}" in
    /*|../*|*/../*|*/..)
      echo "release archive contains an unsafe path: ${entry}" >&2
      exit 1
      ;;
  esac
done < <(tar -tzf "${archive}")

if tar -tvzf "${archive}" | awk 'substr($1, 1, 1) == "l" || substr($1, 1, 1) == "h" { found = 1 } END { exit found ? 0 : 1 }'; then
  echo "release archive must not contain symbolic or hard links" >&2
  exit 1
fi

install -d -o root -g root -m 0755 "${release}"
tar --extract --gzip --file "${archive}" --directory "${release}" \
  --no-same-owner --no-same-permissions
rm -f "${archive}"
chown -R root:root "${release}"
chmod -R go-w "${release}"

if [[ ! -f "${release}/dist/src/main.js" || ! -f "${release}/migrations/001_initial.sql" ]]; then
  echo "release is missing built service or migrations" >&2
  exit 1
fi

ln -sfn "${release}" /opt/lura-api/current
systemctl restart lura-api.service

healthy=false
for _attempt in 1 2 3 4 5; do
  if curl --fail --silent http://127.0.0.1:8787/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "${healthy}" != true ]]; then
  if [[ -n "${previous}" && -d "${previous}" ]]; then
    ln -sfn "${previous}" /opt/lura-api/current
    systemctl restart lura-api.service
  fi
  echo "new release failed local health check and application symlink was rolled back" >&2
  exit 1
fi

find /opt/lura-api/releases -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf -- {} +
echo "activated ${revision}"
