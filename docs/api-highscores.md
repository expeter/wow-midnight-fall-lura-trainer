# API-backed highscores and achievements

Ticket: `SPEC-011`

This specification defines the backend boundary for `FR-027`. It is a contract
for later implementation, not authorization to deploy a service or change the
VPS. The static trainer remains fully playable without an account or API.

## Product boundary

Milestone 1 adds an optional service at `https://api.asgard.website` for:

- Battle.net login;
- selecting one verified World of Warcraft character;
- issuing one-use attempt IDs before an eligible run;
- accepting validated Normal and Hard results;
- publishing searchable, versioned leaderboards;
- associating server-confirmed achievements with an account and character;
- showing the selected character's current guild when privacy permits;
- logout, visibility controls, and complete account deletion.

Reading public leaderboards does not require login. Login is required only to
post a result, synchronize online achievements, or manage online data. A player
who does not want online storage can avoid login and retain all current
browser-local functionality.

Milestone 2 may add guild-wide achievement views, guild membership refresh,
guild administration, and guild filters. Milestone 1 stores only enough guild
information to display and search the guild attached to a published character.

## Identity and display names

The service keeps these concepts separate:

1. **Battle.net account identity** is the private authentication owner.
2. **Selected character** is a verified WoW character belonging to that
   account, identified by region, realm ID/slug, character ID, and canonical
   name.
3. **Trainer player name** is an optional user-written alias used by the
   trainer and its easter eggs. It is never treated as verified identity.
4. **Public identity mode** controls what a leaderboard exposes.

Supported public identity modes:

| Mode | Leaderboard identity | Character/realm | Guild |
| --- | --- | --- | --- |
| `anonymous` | `Anonymous` | Hidden | Hidden |
| `alias` | Trainer player-name override, falling back to `Anonymous` | Hidden | Optional |
| `character` | Verified character name | Visible | Optional |

Guild display is a separate opt-in setting and is always suppressed in
`anonymous` mode. The server stores the verified character even when its
public representation is anonymous. Search results must respect visibility:
hidden character names, realms, account identifiers, and guilds are never
searchable through public endpoints.

The trainer may continue to use the player-name override for easter eggs even
when a verified character is selected. Selecting a character must not replace
or disable that alias.

## Battle.net authentication

The backend is a confidential OAuth client. The Battle.net client secret and
token exchange exist only on the VPS.

- Use the authorization-code flow with an unpredictable `state` value and the
  minimum WoW profile scope required to list account characters.
- The callback validates `state`, exchanges the code server-side, fetches the
  account identity and character list, then creates an opaque application
  session.
- Session identifiers use `Secure`, `HttpOnly`, and appropriate `SameSite`
  cookies. The API accepts credentialed requests only from the production
  trainer origin and explicitly configured local development origins.
- Access tokens are kept only long enough to complete login or an explicit
  character refresh. They are not retained as ordinary long-lived account
  data.
- Refresh tokens, if the provider supplies them and a later feature genuinely
  requires them, must be encrypted at rest and separately deletable. Milestone
  1 should prefer reauthentication over persistent provider tokens.
- BattleTags and OAuth tokens are private and never returned by public API
  responses.

An application session may outlive the short provider token because it
identifies the local API account, not continued permission to query Blizzard.
Character refresh can require a fresh Battle.net login.

## Character and guild association

After login, the API returns the authenticated account's eligible WoW
characters. A user selects one character for subsequent attempts.

The selected-character record contains:

- Battle.net region;
- character ID;
- realm ID and slug;
- canonical character name;
- class and faction when available;
- current guild ID, name, and realm when available;
- the time at which Blizzard data was last refreshed.

Guild data is a cached label in Milestone 1, not proof of permanent membership.
The leaderboard may display and search the cached guild only when the player
enabled guild visibility. Milestone 2 defines refresh policy and guild-wide
aggregation.

## Server-issued attempt protocol

Battle.net login proves ownership of an account and character; it does not
prove that a browser-submitted score is legitimate. Every online-eligible run
therefore begins with a server-issued attempt.

### Issue

`POST /v1/attempts` requires an authenticated session and selected character.
The request declares:

- difficulty (`normal` or `hard`);
- entry mode and intended phase scope;
- crystal or non-crystal duty;
- trainer version/build identifier;
- raid-plan/configuration fingerprint;
- enabled optional challenges.

The server returns an opaque attempt ID, random nonce, issue time, expiry time,
and the accepted configuration snapshot. An attempt is bound to the account,
selected character, version, difficulty, duty, and configuration.

Attempts expire after a short window suitable for one run and are single-use.
Issuing an attempt does not prevent anonymous/local play if the API is
unavailable.

### Complete

`POST /v1/attempts/{id}/complete` submits:

- the nonce;
- monotonic elapsed duration;
- phase results and mistake events;
- action usage and achievement inputs;
- final client-reported score;
- the trainer version/build identifier.

The server validates ownership, expiry, one-use state, configuration equality,
plausible duration, phase order, allowed event counts, and score inputs. It
recomputes the published score from accepted inputs instead of trusting the
client's total. Invalid or duplicate completions are rejected and never enter
the leaderboard.

This is deliberate anti-tampering, not a claim of cheat-proof execution. A
fully modified browser can still fabricate plausible events. Stronger
server-side encounter replay is outside Milestone 1.

## Leaderboards

Public leaderboards exist only for Normal and Hard. Each difficulty has
separate crystal-carrier and non-crystal divisions:

- Normal / crystal;
- Normal / non-crystal;
- Hard / crystal;
- Hard / non-crystal.

Rows sort by:

1. points descending;
2. completion duration ascending;
3. earliest accepted completion ascending.

The API records the trainer semantic version and exact build identifier with
every attempt and result. Public queries can select:

- current version/build policy;
- a specific version;
- all compatible versions;
- historical/legacy results.

This version history allows achievements or runs earned under retired mechanics
to become a future **Feats of Strength** category without rewriting their
original record. The service never silently recalculates an accepted historical
score under new rules.

Leaderboard search covers only public fields permitted by the identity mode:
published alias, published character name, realm, and visible guild. Search is
case-insensitive, paginated, rate-limited, and does not reveal private matches.

The initial public endpoint shape is:

```text
GET /v1/leaderboards?difficulty=hard&duty=crystal&version=current
GET /v1/leaderboards/search?q=character-or-guild
```

## Achievements

Online achievement records are derived from accepted attempt data using the
achievement definitions associated with that trainer version. Each record
stores:

- stable achievement ID;
- account and selected-character owner;
- first-earned timestamp;
- first-earned trainer version/build;
- source attempt ID;
- whether the achievement remains normally obtainable in the current version.

Browser-local achievements remain available without login. Milestone 1 may
offer an explicit synchronization action, but must not treat an arbitrary local
achievement list as server-verified. Only achievements derived from accepted
online attempts receive verified status.

Guild-wide achievement reporting is Milestone 2.

## Privacy, logout, and deletion

The setup and online-profile UI link to a plain-language privacy page hosted in
the repository and exposed through the trainer. It states:

- GitHub Pages hosts the trainer;
- `api.asgard.website` stores online identity, attempts, highscores, privacy
  settings, and verified achievements only after login;
- there are no advertising, analytics, fingerprinting, or unrelated tracking
  systems;
- anonymous play requires no login and sends no highscore data;
- public visibility is optional and can be changed later;
- the user can delete all online data.

Required account actions:

- **Log out** invalidates all active application sessions but retains the
  account's online records and privacy choices.
- **Delete online data** permanently removes sessions, provider tokens,
  Battle.net identifiers, characters, guild cache, attempts, scores,
  achievements, and privacy settings belonging to the account.
- **Log out and delete online data** performs deletion and session invalidation
  as one confirmed action.

Deletion must not leave a public `Anonymous` tombstone that can be correlated
back to the deleted user. Aggregate counts may be recomputed from remaining
records. Security/audit logs must avoid provider tokens and should retain only
short-lived, non-identifying operational data.

## API surface

The expected Milestone 1 routes are:

```text
GET    /health

GET    /v1/auth/battlenet/start
GET    /v1/auth/battlenet/callback
POST   /v1/auth/logout

GET    /v1/me
GET    /v1/me/characters
POST   /v1/me/characters/refresh
PUT    /v1/me/character
PUT    /v1/me/privacy
DELETE /v1/me

POST   /v1/attempts
POST   /v1/attempts/{attemptId}/complete
GET    /v1/me/attempts
DELETE /v1/me/attempts/{attemptId}

GET    /v1/leaderboards
GET    /v1/leaderboards/search
GET    /v1/me/achievements
```

Mutating cookie-authenticated routes require CSRF protection in addition to
origin checks. Authentication, attempt issuance/completion, search, and
deletion endpoints are rate-limited.

## SQLite storage

SQLite is the Milestone 1 database. It is suitable for this service when used
with:

- WAL journal mode;
- foreign keys enabled;
- a nonzero busy timeout;
- short transactions;
- prepared statements;
- one API service process with a bounded connection pool;
- serialized or retry-aware writes.

SQLite supports multiple simultaneous readers. Writes remain serialized; that
is acceptable for expected trainer traffic. The implementation must return a
controlled retryable response rather than exposing `database is locked`.
Horizontal multi-host writers and a large worker fleet are out of scope; those
would trigger reconsideration of PostgreSQL.

Minimum logical tables:

```text
accounts
sessions
characters
privacy_settings
attempts
attempt_events_or_summary
results
achievements
account_achievements
schema_migrations
```

Foreign-key cascades must make complete account deletion testable. Public
leaderboard queries use indexes covering difficulty, duty, version, score, and
public searchable identity fields.

### Backups

Backups use SQLite's online backup API, `VACUUM INTO`, or an equivalent
transactionally consistent mechanism. The deployment must not copy the live
database file by itself while WAL is active.

- Run an automated daily backup.
- Keep multiple rotating generations.
- Store at least one encrypted copy off the VPS.
- Exclude OAuth/session secrets from repository artifacts and CI logs.
- Document and periodically test restoration into a fresh service directory.

Deleting an account removes it from the live database immediately. Backup
retention and eventual expiry are disclosed in the privacy information.

## Repository layout and setup

The later implementation lives in a top-level `api/` directory, isolated from
the Vite client:

```text
api/
  README.md
  package.json
  src/
  migrations/
  tests/
  scripts/
    setup.sh
    backup.sh
  deploy/
    lura-api.service
    Caddyfile.example
    env.example
```

The setup script is idempotent and prepares application directories,
dependencies, database migrations, a locked-down service user where
appropriate, and a systemd service. It does not install secrets into the
repository or overwrite an existing Caddy installation. The Caddy example
contains only the `api.asgard.website` reverse-proxy block to merge into the
VPS's existing configuration.

Runtime secrets and writable data live outside the checked-out release:

```text
/etc/lura-api/env
/var/lib/lura-api/lura.sqlite3
/var/backups/lura-api/
```

The service binds to loopback; Caddy owns public TLS and reverse proxies to it.

## Deployment workflow

Backend implementation requires a separate GitHub Actions workflow from the
existing GitHub Pages deployment. A proposed `.github/workflows/api.yml`:

1. triggers on relevant `api/**` changes and manual dispatch;
2. installs the pinned backend runtime and dependencies;
3. runs API tests, migration checks, and a production build;
4. connects to the VPS using narrowly scoped deployment credentials stored as
   GitHub environment secrets;
5. uploads an immutable release directory without the database or environment
   file;
6. installs dependencies, runs forward migrations, and atomically switches the
   current release;
7. restarts the systemd service;
8. verifies `https://api.asgard.website/health`;
9. rolls back the application release if the health check fails.

The workflow uses a protected `production-api` GitHub environment. It must not
modify Caddy on every deployment, print secrets, replace the SQLite database,
or deploy untested client-only changes. Database migrations require compatible
forward behavior and a documented recovery path.

## Availability and failure behavior

The trainer treats the API as optional:

- API failure never prevents local play.
- Login, online attempt issuance, posting, and leaderboard UI show a clear
  unavailable state.
- A run without a successfully issued attempt remains local-only.
- A completion upload may retry safely with the same one-use attempt ID and an
  idempotency key.
- The server distinguishes an already accepted retry from a conflicting second
  completion.

## Milestone 1 acceptance criteria

- Anonymous users can play without API requests beyond an explicitly opened
  public leaderboard.
- Battle.net login lists only characters belonging to the authenticated
  account.
- A selected verified character and independent trainer alias coexist.
- Only authenticated, unexpired, one-use attempts can post results.
- Server validation and score recomputation reject malformed or duplicate
  completions.
- Normal/Hard and crystal/non-crystal leaderboards sort by points and support
  privacy-respecting character, alias, realm, and guild search.
- Every result and verified achievement retains its trainer version/build.
- Anonymous privacy mode publishes neither character nor guild.
- Logout invalidates sessions; complete deletion removes all account-linked
  live data and public results.
- SQLite concurrency, lock retry, backup, restore, migration, and cascading
  deletion behavior have automated coverage.
- The API deployment workflow passes tests, preserves database files, deploys
  through the existing Caddy proxy, and verifies production health.

