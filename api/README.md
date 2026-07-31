# L'ura Trainer API

This directory contains the optional Milestone 1 service from
[`SPEC-011`](../docs/api-highscores.md). Anonymous trainer play does not use
this service.

## What the operator must prepare

Do these items before the first production deployment. Keep every secret out
of Git and screenshots.

1. **DNS**
   - Create an `A` record for `api.asgard.website` pointing to the VPS IPv4
     address.
   - Add an `AAAA` record only if the VPS has working public IPv6.
   - Wait until `dig api.asgard.website` resolves to the VPS.
2. **Battle.net OAuth application**
   - Create a confidential client in the Battle.net developer portal.
   - Set **Service URL** to the player-facing trainer:
     `https://lura.asgard.website/` when that hostname is live, otherwise
     `https://expeter.github.io/wow-midnight-fall-lura-trainer/`.
   - Do not put an OAuth callback in the Service URL field.
   - Add the production callback
     `https://api.asgard.website/v1/auth/battlenet/callback`.
   - Add the local callback
     `http://127.0.0.1:8787/v1/auth/battlenet/callback` for development.
   - When the portal presents one multiline redirect field, enter those two
     exact URLs on separate lines.
   - Record the client ID and client secret. The secret belongs only in
     `/etc/lura-api/env` and the protected GitHub environment.
   - Enable only the WoW profile scope needed to read the account's characters.
3. **VPS access**
   - Install Node.js 22.13 or newer as the isolated runtime
     `/opt/lura-api/runtime/bin/node`; do not replace another site's global
     Node installation.
   - Confirm `systemd`, `sqlite3`, `curl`, `rsync`, and the existing Caddy
     installation.
   - Create a dedicated deployment user that may write only the L'ura release
     directory and restart `lura-api.service` through a narrow `sudoers` rule.
   - Create a dedicated SSH deployment key. Put only its public key on the VPS.
4. **Runtime configuration**
   - Copy `deploy/env.example` to `/etc/lura-api/env`, owner `root`,
     mode `0600`, and replace every placeholder.
   - Generate `SESSION_SECRET` and `CSRF_SECRET` independently with at least
     32 random bytes each.
   - Keep writable state in `/var/lib/lura-api` and backups in
     `/var/backups/lura-api`; neither path belongs inside a release checkout.
5. **Caddy**
   - Merge only the block from `deploy/Caddyfile.example` into the existing
     Caddy configuration.
   - Validate with `caddy validate`, reload Caddy, then confirm that TLS is
     issued for `api.asgard.website`.
6. **GitHub production environment**
   - Create the protected environment `production-api`.
   - Add secrets `API_DEPLOY_HOST`, `API_DEPLOY_USER`,
     `API_DEPLOY_SSH_KEY`, and `API_DEPLOY_HOST_KEY`.
   - `API_DEPLOY_HOST_KEY` is the complete trusted `known_hosts` line obtained
     through an out-of-band verified VPS fingerprint, not an unverified
     `ssh-keyscan` performed during deployment.
   - Require manual approval for this environment until the first restore and
     rollback drills have passed.
7. **Backups**
   - `lura-api-backup.timer` runs `api/scripts/backup.sh` daily.
   - The script creates consistent VPS-local SQLite generations with 14-day
     rotation.
   - Do not commit backup generations, recovery material, or a storage-specific
     replication workflow. The user will provide the separate off-VPS storage.
   - Perform a restore test into a fresh temporary data directory before
     accepting real accounts.

After the VPS bootstrap is complete, pushes under `api/**` test and deploy the
API through the protected `production-api` environment. Manual workflow
dispatch remains available for a reviewed redeployment.

## First VPS bootstrap

The deployment workflow expects its narrow root-owned activation helper to
already exist. For the first release only:

1. Build and upload one reviewed API release directory to the VPS.
2. Run `sudo api/scripts/setup.sh /path/to/the/release`.
3. Edit `/etc/lura-api/env` and replace all placeholders.
4. Merge and validate the Caddy block.
5. Start the service with `sudo systemctl start lura-api`.
6. Verify the loopback and public health endpoints.
7. Trigger the `Test and deploy API` workflow manually and confirm the atomic
   activation and rollback path.

## Local development

```bash
cd api
npm ci
npm run build
LURA_API_DATABASE=:memory: npm test
npm run start:local
```

`start:local` reads the repository-root `.env`. In addition to the Battle.net
client values, set distinct local `SESSION_SECRET` and `CSRF_SECRET` values of
at least 32 characters, `BATTLE_NET_CALLBACK_URL` to
`http://127.0.0.1:8787/v1/auth/battlenet/callback`, and
`LURA_API_DATABASE=./local.sqlite3`.

The server listens on `127.0.0.1:8787` by default. The current implementation
provides:

- `GET /health`
- `GET /v1/auth/battlenet/start?region=eu|us`
- `GET /v1/auth/battlenet/callback`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `GET /v1/me/characters`
- `PUT /v1/me/character`
- `POST /v1/me/characters/refresh`
- `PUT /v1/me/privacy`
- `DELETE /v1/me`
- `POST /v1/attempts`
- `POST /v1/attempts/{attemptId}/complete`
- `GET /v1/me/attempts`
- `DELETE /v1/me/attempts/{attemptId}`
- `GET /v1/me/achievements`
- `GET /v1/activity`
- `GET /v1/wipes`
- `POST /v1/wipes`
- `GET /v1/leaderboards`
- `GET /v1/leaderboards/search`
- `GET /v1/achievement-hall`
- `GET /v1/global-ranking`
- `GET /v1/profiles/{profileId}`

Battle.net access tokens are used only during the callback and are not stored.
For local development, `BNET_CLIENT_ID`/`BNET_SECRET` are accepted aliases for
the production `BATTLE_NET_CLIENT_ID`/`BATTLE_NET_CLIENT_SECRET` names.
The API recomputes accepted scores from bounded completion telemetry and rejects
expired, replayed, mismatched, or tampered attempts. Character refresh, trainer
integration, current standings, the Achievement Hall, Global ranking, public
profiles, and the privacy-aware activity UI are implemented under `FR-027` and
the later online feature tickets recorded in `docs/README.md`.

## Production paths

- Environment: `/etc/lura-api/env`
- Database: `/var/lib/lura-api/lura.sqlite3`
- Releases: `/opt/lura-api/releases/<git-sha>`
- Active release: `/opt/lura-api/current`
- Backups: `/var/backups/lura-api`

The SQLite database uses WAL, foreign keys, and a five-second busy timeout.
Never back up the live `.sqlite3` file with plain `cp` while WAL is active.
`lura-api-backup.timer` runs the SQLite online-backup script daily with a
randomized delay and catches up after downtime.

## Restore a VPS-local backup

Copy a selected generation from `/var/backups/lura-api` into a fresh temporary
directory and run `sqlite3 restored.sqlite3 'PRAGMA integrity_check;'`. Restore
only after it returns `ok`. Stop the API, preserve the current live database
separately, install the verified restored file as
`/var/lib/lura-api/lura.sqlite3` with owner `lura-api:lura-api` and mode
`0600`, then start the service and verify `/health`.

The separate off-VPS storage and restore procedure will be added when its
destination is provided. It must remain outside Git.
