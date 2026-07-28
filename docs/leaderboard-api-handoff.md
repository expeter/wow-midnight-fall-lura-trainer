# Leaderboard/API laptop handoff

Branch: `handoff/leaderboard-api-fr057`

This branch packages the in-progress optional Battle.net leaderboard work for
continuation on another laptop. It deliberately leaves `FR-057` marked **In
progress**: the requested start-page and Top 10 redesign has only its backend
standings slice so far.

## Security and files to transfer separately

- `api/deploy/backup-recipient.pem` is a **public certificate**. It is safe and
  intentional to commit. The VPS backup job uses it to encrypt SQLite exports.
- The matching **private** recovery key is not in this repository. On the old
  machine it is:
  `/home/pschulz.guest/.ssh/lura_api_backup_recovery.pem`
- Transfer that private key separately through an encrypted channel or password
  manager, install it as `~/.ssh/lura_api_backup_recovery.pem`, and set mode
  `0600`. Never add it to Git.
- The repository-root `.env` and `api/.env` are ignored. Recreate the local
  Battle.net and session settings on the new laptop rather than committing
  them.
- VPS/GitHub deployment SSH keys also remain outside Git.

The public certificate fingerprint currently documented for operator
verification is:

```text
1A:1B:64:3A:A8:8A:E0:D4:9F:33:41:79:13:EC:78:7F:D8:41:D1:75:DF:D7:72:DD:F1:17:16:FB:07:7F:25:98
```

## Implemented in the working branch

- Battle.net authorization-code login, short-lived provider access, opaque
  trainer sessions, CSRF protection, logout, and verified character import.
- Character selection, privacy modes, complete account deletion, and public
  searchable EU/US-shared leaderboards.
- Server-issued one-use attempts with server-side score recomputation and
  verified achievements.
- Frontend API client, online attempt integration, privacy UI, and initial
  leaderboard/profile UI.
- SQLite backup encryption and a workflow intended to copy only encrypted
  generations off the VPS.
- `/v1/me` now computes the signed-in account's best current-version position
  in each Normal/Hard crystal-duty division. Public character leaderboard rows
  include their region only when character identity is public.

The first five items have focused tests in the branch. The last standings and
region additions were started for `FR-057` and still need their complete
frontend regression pass.

## FR-057 remaining work

The accepted page structure is:

1. Header and compact achievement/current-standing summary.
2. Practice target and Game settings.
3. Remaining trainer configuration.
4. A quieter, scrollable Top 10 leaderboard.
5. Search beneath the Top 10 and a link to a dedicated full leaderboard view.
6. One `Login with Battle.net` button with a small EU/US region selector.

Also:

- Move `Your player name` out of `Difficulty & movement` and into selected
  assignment/player identity.
- Add localhost-only dummy leaderboard rows, without masking production
  failures or production empty states.
- Show the best current Normal and Hard position beside achievements.
- Link a public verified character to
  `https://raider.io/characters/{region}/{realm}/{character}`.
- Keep anonymous and alias rows unlinked.
- Update `OnlinePanel` tests, API privacy/region assertions, layout browser
  coverage, and add coverage for the dedicated full leaderboard.

Relevant files:

- `src/online.ts`
- `src/OnlinePanel.tsx`
- `src/App.tsx`
- `src/styles.css`
- `api/src/app.ts`
- `api/src/leaderboards.ts`
- `api/tests/api.test.ts`
- `e2e/layout.spec.ts`

## Verification and release checklist

From the repository root:

```bash
cd api && npm test
cd ..
npm test
npm run build
npm run test:e2e:local
```

Before marking `FR-057` implemented, all four must pass and the focused tests
must cover the requested hierarchy. Update `CHANGELOG.md` and
`docs/README.md`, then make a normal descriptive commit (never a `yeet` commit
message).

After pushing, monitor both GitHub Pages and the API deployment. The encrypted
backup path still needs one production restore drill:

1. Install/activate the backup unit, public certificate, export directory, and
   `lura-backup` group changes from this branch.
2. Run the VPS backup service once.
3. Copy only the encrypted `.p7m` generation off the VPS.
4. Decrypt it locally with the separately transferred private key.
5. Run `PRAGMA integrity_check;` and require `ok`.
6. Trigger and verify the GitHub encrypted-backup workflow/artifact.

Do not alter the existing Caddy blog configuration while finishing this work.
