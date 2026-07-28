#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "setup.sh must run as root" >&2
  exit 1
fi

release_directory="${1:-}"
if [[ -z "${release_directory}" || ! -f "${release_directory}/package-lock.json" ]]; then
  echo "usage: setup.sh /opt/lura-api/releases/<release>" >&2
  exit 1
fi

if [[ ! -x /opt/lura-api/runtime/bin/node ]]; then
  echo "install the isolated Node 22 runtime at /opt/lura-api/runtime before setup" >&2
  exit 1
fi

if ! id lura-api >/dev/null 2>&1; then
  useradd --system --home /var/lib/lura-api --shell /usr/sbin/nologin lura-api
fi

install -d -o lura-api -g lura-api -m 0750 /var/lib/lura-api
install -d -o lura-api -g lura-api -m 0700 /var/backups/lura-api
install -d -o root -g root -m 0755 /opt/lura-api/releases
install -d -o root -g root -m 0755 /etc/lura-api

if [[ ! -f /etc/lura-api/env ]]; then
  install -o root -g root -m 0600 "${release_directory}/api/deploy/env.example" /etc/lura-api/env
  echo "created /etc/lura-api/env; replace placeholders before starting the service"
fi

cd "${release_directory}"
PATH="/opt/lura-api/runtime/bin:${PATH}" npm ci --omit=dev
install -o root -g root -m 0644 deploy/lura-api.service /etc/systemd/system/lura-api.service
install -o root -g root -m 0644 deploy/lura-api-backup.service /etc/systemd/system/lura-api-backup.service
install -o root -g root -m 0644 deploy/lura-api-backup.timer /etc/systemd/system/lura-api-backup.timer
install -d -o root -g root -m 0755 /opt/lura-api/bin
install -o root -g root -m 0755 scripts/activate-release.sh /opt/lura-api/bin/activate-release
systemctl daemon-reload
systemctl enable lura-api.service
systemctl enable --now lura-api-backup.timer
