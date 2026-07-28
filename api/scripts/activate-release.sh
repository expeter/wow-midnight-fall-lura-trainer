#!/usr/bin/env bash
set -euo pipefail

revision="${1:-}"
archive="${2:-}"
if [[ ! "${revision}" =~ ^[0-9a-f]{40}$ || ! -f "${archive}" ]]; then
  echo "usage: activate-release <40-character-git-sha> <release-archive>" >&2
  exit 1
fi

release="/opt/lura-api/releases/${revision}"
previous="$(readlink -f /opt/lura-api/current 2>/dev/null || true)"
install -d -o root -g root -m 0755 "${release}"
tar -xzf "${archive}" -C "${release}"
rm -f "${archive}"

if [[ ! -f "${release}/dist/src/main.js" || ! -f "${release}/migrations/001_initial.sql" ]]; then
  echo "release is missing built service or migrations" >&2
  exit 1
fi

sudo -u lura-api /usr/bin/node --env-file=/etc/lura-api/env "${release}/dist/src/migrate.js"
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
