# Leaderboard/API laptop handoff

Branch: `handoff/leaderboard-api-fr057`

This branch packages the optional Battle.net leaderboard work continued on the
new laptop. `FR-057` is complete; the API handoff release is active on the VPS
and the trainer changes remain local until the user requests a push.

## Security and files to transfer separately

- Backup generations, certificates, recovery keys, and storage-specific
  replication workflows do not belong in Git.
- `CR-149` retains only the VPS-local SQLite backup timer. The user will provide
  the separate off-VPS storage destination and its secret handover.
- The repository-root `.env` and `api/.env` are ignored. Recreate the local
  Battle.net and session settings on the new laptop rather than committing
  them.
- VPS/GitHub deployment SSH keys also remain outside Git.

## Implemented in the working branch

- Battle.net authorization-code login, short-lived provider access, opaque
  trainer sessions, CSRF protection, logout, and verified character import.
- Character selection, privacy modes, complete account deletion, and public
  searchable EU/US-shared leaderboards.
- Server-issued one-use attempts with server-side score recomputation and
  verified achievements.
- Frontend API client, online attempt integration, privacy UI, and initial
  leaderboard/profile UI.
- Consistent rotating VPS-local SQLite backups; off-VPS storage is pending.
- `/v1/me` now computes the signed-in account's best current-version position
  in each Normal/Hard crystal-duty division. Public character leaderboard rows
  include their region only when character identity is public.

The first five items have focused tests in the branch. The last standings and
region additions were started for `FR-057` and still need their complete
frontend regression pass.

## FR-057 completed work

The implemented page structure is:

1. Header and compact achievement/current-standing summary.
2. Practice target and Game settings.
3. Remaining trainer configuration.
4. A quieter, scrollable Top 10 leaderboard.
5. Search beneath the Top 10 and a link to a dedicated full leaderboard view.
6. One `Login with Battle.net` button with a small EU/US region selector.

The completed follow-ups include:

- Move `Your player name` out of `Difficulty & movement` and into selected
  assignment/player identity.
- Add localhost-only dummy leaderboard rows, without masking production
  failures or production empty states.
- Show the best current Normal and Hard position beside achievements.
- Link a public verified character to
  `https://raider.io/characters/{region}/{realm}/{character}`.
- Keep anonymous and alias rows unlinked.
- Updated `OnlinePanel` tests, API privacy/region assertions, layout browser
  coverage, and coverage for the dedicated full leaderboard.

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

`FR-057` was verified with the API suite, all 284 client tests, the production
build, focused online regressions, and all 23 Playwright tests.

After a future user-requested push, monitor GitHub Pages and the API deployment.
The VPS-local backup service has run successfully. Complete the off-VPS restore
drill after the user supplies the separate storage destination; do not add that
backup data or its secrets to Git.

Do not alter the existing Caddy blog configuration while finishing this work.
