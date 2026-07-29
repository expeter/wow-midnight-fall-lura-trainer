#!/usr/bin/env bash
set -euo pipefail

database_path="${LURA_API_DATABASE:-/var/lib/lura-api/lura.sqlite3}"
backup_directory="${LURA_API_BACKUP_DIRECTORY:-/var/backups/lura-api}"
retention_days="${LURA_API_BACKUP_RETENTION_DAYS:-14}"

install -d -m 0700 "${backup_directory}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="${backup_directory}/lura-${timestamp}.sqlite3"

sqlite3 "${database_path}" ".timeout 5000" ".backup '${destination}'"
chmod 0600 "${destination}"
find "${backup_directory}" -type f -name 'lura-*.sqlite3' -mtime "+${retention_days}" -delete
echo "created ${destination}"
