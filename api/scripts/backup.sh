#!/usr/bin/env bash
set -euo pipefail

database_path="${LURA_API_DATABASE:-/var/lib/lura-api/lura.sqlite3}"
backup_directory="${LURA_API_BACKUP_DIRECTORY:-/var/backups/lura-api}"
retention_days="${LURA_API_BACKUP_RETENTION_DAYS:-14}"
recipient_certificate="${LURA_API_BACKUP_RECIPIENT:-/etc/lura-api/backup-recipient.pem}"
export_directory="${LURA_API_BACKUP_EXPORT_DIRECTORY:-/var/backups/lura-api-export}"

install -d -m 0700 "${backup_directory}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="${backup_directory}/lura-${timestamp}.sqlite3"

sqlite3 "${database_path}" ".timeout 5000" ".backup '${destination}'"
chmod 0600 "${destination}"
if [[ -r "${recipient_certificate}" && -d "${export_directory}" ]]; then
  encrypted="${export_directory}/lura-${timestamp}.sqlite3.p7m"
  encrypted_temp="${encrypted}.tmp"
  openssl cms -encrypt -binary -aes-256-cbc \
    -in "${destination}" -outform DER -out "${encrypted_temp}" \
    -recip "${recipient_certificate}"
  chgrp lura-backup "${encrypted_temp}"
  chmod 0640 "${encrypted_temp}"
  mv "${encrypted_temp}" "${encrypted}"
  cp "${encrypted}" "${export_directory}/lura-latest.sqlite3.p7m.tmp"
  chgrp lura-backup "${export_directory}/lura-latest.sqlite3.p7m.tmp"
  chmod 0640 "${export_directory}/lura-latest.sqlite3.p7m.tmp"
  mv "${export_directory}/lura-latest.sqlite3.p7m.tmp" "${export_directory}/lura-latest.sqlite3.p7m"
  find "${export_directory}" -type f -name 'lura-*.sqlite3.p7m' ! -name 'lura-latest.sqlite3.p7m' -mtime "+${retention_days}" -delete
fi
find "${backup_directory}" -type f -name 'lura-*.sqlite3' -mtime "+${retention_days}" -delete
echo "created ${destination}"
