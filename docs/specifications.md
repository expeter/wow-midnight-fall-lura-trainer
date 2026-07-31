# L'ura Trainer specifications

These contracts capture stable intent for the trainer’s main components. New
`FR`, `CR`, and `BUG` tickets should reference or amend the relevant contract.
If a request conflicts with one of these rules, clarify the intended spec
change before implementation.

## SPEC-001 · Ticket workflow

- Every new task receives a stable `FR`, `CR`, `BUG`, or `SPEC` ID.
- Record the request before implementation and mark it implemented only after
  focused automated regression coverage passes.
- Update the affected encounter contract, maintainer handoff, ticket register,
  and other durable documentation as part of the same change.
- Resolve each completed ticket in the register. Never silently abandon an
  unresolved ticket or leave verified completed work marked as open.
- Commit verified changes unless explicitly asked to leave them uncommitted.

## SPEC-002 · Creator business card

- Keep the card compact and aligned with the setup header.
- Preserve a readable avatar, BattleTag, Raider.IO, Twitch, and Buy me a coffee
  action.
- Keep every visible card label at 16 pixels or larger and prevent the card
  from extending beyond its setup column or viewport.
- Use one consistent external-link mark and avoid generic profile destinations.

## SPEC-003 · Phase 3 to Phase 4 transition

- The first post-Archangel sector relocation lasts six seconds and provides at
  least the normal doubled movement speed, independent of Hard-mode backward
  movement slowdown, so the next standard light/assignment is reachable.
- After the second Dark Archangel sector, every actor gathers on one exact
  north-stack point.
- Normal spread, side, and raid-plan positioning rules no longer apply during
  this gather.
- The player and all NPCs use that same point as the Phase 4 knockup origin.
- Phase 2-only HUD counters must never remain visible in Phase 3 or Phase 4.

## SPEC-004 · Completion achievements

- Results identify the played difficulty and whether the selected position had
  crystal duty.
- L’ura uses one shared damage pool from Phase 1 through the end of Phase 3.
  Before Phase 3 sequence two, Veil Protection clamps displayed health at 3%
  while casts, damage, and points continue accumulating. Protection ends only
  after the first Phase 3 sector relocation, allowing a qualified early clear
  to transition from a reachable position.
- Phase 4 starts with an independent refreshed health pool. Clearing during
  Phase 3 and killing early during Phase 4 award separate achievements.
- Verified Main ability telemetry is not truncated to a fixed cast count. The
  API accepts at most one completed cast per simulated encounter second.
- Flawless means zero recorded mistakes.
- Potion, shield, and main ability use are listed in the completion details;
  potion and shield are permanent phase-refilling actions rather than options.
- Result-card honors summarize the current completion. They are distinct from
  the canonical browser/API achievement catalogue and do not automatically
  create another permanent achievement.
- The result-card `SUPERHUMAN FLAWLESS` honor requires a full sequential clear,
  zero mistakes, successful potion and shield play, Main ability use, crystal
  duty, and more than 1100 points.
- Canonical achievements use stable IDs and point tiers. Browser-local records
  retain immutable first-earned timestamps; online records are awarded only
  from accepted server attempts.

## SPEC-005 · Background audio

- Music, encounter sounds, and raid-lead speech are independent persisted
  channels and default to off.
- Music offers the reviewed licensed tracks, preview, volume, looping, and an
  in-arena mute control.
- The live encounter-sound allowlist currently contains only Main ability
  release. Other reviewed samples remain available in the local soundboard and
  must not be re-enabled without explicit approval.
- Raid-lead assistance uses browser TTS except for the timing-critical
  prerecorded Phase 4 `Left`, `Right`, `Left`, `Move` sequence.
- Source-level feature flags may remove a channel. A disabled channel exposes
  no setup control, arena control, or playback initialization.

## SPEC-006 · Phase 4 cadence

- Phase 4 player and NPC movement uses the same global configured movement
  speed with one shared 10% phase bonus.
- Heaven & Hell resolves on a 21-second cycle.
- Three Starsplinters begin 1.1 seconds apart and each detonates after 3.5
  seconds.
- The final Starsplinter detonates exactly one second before Heaven & Hell.
- An NPC Starsplinter is lethal to the controlled player but does not wipe for
  crossing another NPC. The controlled player's own Starsplinter remains
  lethal to NPCs, preserving responsibility for the practiced mechanic.
- Every NPC remains inside the moving yellow protection zone. Active
  Starsplinter NPCs move to safe left/right/left positions within its edge,
  hold until detonation, and return to the stack before the next detonation.
- Pause/resume preserves the authoritative quarter and mechanic clock exactly;
  render timing must never infer a Phase 4 quarter transition.

## SPEC-007 · Setup-page hierarchy

- The setup shell exposes six one-active-panel tabs: Game settings,
  Keys & Mouse, HUD, Raid plan, Leaderboard, and Profile.
- Game settings contains difficulty/movement, selected assignment, permanent
  combat actions, audio, the current Global Top 3, and compact personal
  achievement/run/profile summaries.
- Keys & Mouse contains bindings, mouse inversion, keyboard turning, and
  rotation speed. HUD owns draggable placement and optional action buttons.
- HUD action buttons are an optional persisted display aid, off by default.
  When enabled, Main ability, Interrupt, Shield, Health potion, and Crystal drop
  default below the cast bar, have their own draggable HUD anchor, and invoke
  the same handlers and validity rules as their keyboard bindings.
- Raid plan begins with its full-width save/load/share controls.
- Every phase map retains its own visible heading, beginning with
  `PHASE 1 RAID PLAN`, then `INTERMISSION RAID PLAN`.
- A valid `#raidplan=` hash opens Raid plan without losing the hash or allowing
  an older browser-local plan to override it.

## SPEC-008 · Phase 3 Soak protection

- Where the active crystal roster permits it, every unfinished blue ground
  Soak has a crystal NPC positioned beside it.
- The carrier stays outside the puddle while its complete yellow light covers
  the puddle and its soaking players.
- Crystal NPCs attempt to preserve player and crystal-light separation, but
  guaranteed Soak coverage takes priority when the random layout cannot
  satisfy both.
- Crystal NPCs do not count as ground-Soak occupants. Rune-pair movement may
  temporarily override their support position during the memory game.

## SPEC-009 · Audio and raid-lead assistance

- The authoritative cue catalogue is [`audio-cues.md`](audio-cues.md).
- Direct phase entry may speak its visible `3`, `2`, `1`; seamless transitions
  use phase-specific calls without adding another countdown.
- Coaching that reveals a mechanic may be difficulty-restricted. Visual
  telegraphs and counters remain authoritative in every mode.
- Pausing freezes scheduled speech and prerecorded calls with the shared
  encounter clock. Resuming must not replay stale cues or skip the next call.

## SPEC-010 · Canonical achievements

- The browser and API share one canonical catalogue with stable IDs,
  meaningful non-repeatable badges, point tiers, and explicit availability.
- Related badges may unlock from one result. Already-earned badges never
  reappear as newly earned on a later result.
- The catalogue groups achievements into Foundations, Precision, Tools of the
  Trade, and Feats of Movement, with no more than two cards per row.
- Full-run streaks advance only from complete sequential clears. Direct phase
  practice may award that phase's flawless badge and increments only the phases
  actually cleared.
- Result-card honors are presentation summaries governed by `SPEC-004`; they
  are not additional canonical achievement IDs.
- Local achievements are browser records. Only achievements derived from an
  accepted server attempt are server-verified and contribute to the online
  Achievement Hall and Global ranking.

## SPEC-011 · API-backed highscores and achievements

- Anonymous play remains complete and does not require login.
- The privacy-aware activity stream includes wipes, accepted full runs, and
  newly earned achievements. Initial activity establishes a silent baseline;
  only later unseen event IDs trigger the default-on, dismiss-free,
  bottom-right fading message queue across trainer screens.
- On the start shell, those same genuinely new IDs briefly animate their
  persistent Recent activity row as it arrives. This feed-row signal remains
  active when the optional bottom-right message queue is disabled.
- Posting online results requires Battle.net authentication, a verified
  selected WoW character, and a one-use server-issued attempt.
- The server recomputes accepted scores from validated attempt inputs; OAuth
  proves identity but never proves gameplay legitimacy by itself.
- Normal and Hard each have separate crystal and non-crystal leaderboards,
  sorted by points with duration and acceptance time as tie-breakers.
- Test and Easy completions may earn server-verified achievements but never
  enter run leaderboards or alter a player's Normal/Hard standing.
- Direct phase practice may earn server-verified phase achievements and their
  canonical Achievement Hall/global-ranking points. Only a complete sequential
  run may enter one of the four run leaderboards.
- The Achievement Hall is account-wide and ranks public profiles by lifetime
  canonical achievement points. It shows the highest-value achievement and
  first-earned time; retired achievements retain their points. Catalogue
  entries carry season metadata, while season-specific UI remains deferred.
- Public identity is optional. Anonymous mode hides character, realm, and
  guild and excludes that account from public run and achievement rankings;
  published character, alias, realm, and guild fields are searchable.
- Guild visibility is not a separate privacy switch: character identity may
  publish the imported guild, alias identity does not expose the linked guild,
  and anonymous identity hides all identity/profile detail.
- Public trainer profiles use opaque identifiers and resolve for visitors only
  while the account publishes a character or alias. An authenticated owner may
  inspect their own profile in anonymous mode without making it public. The
  profile summarizes achievement progress, attempts, full runs, wipes, global
  position, all four board positions, and a styled Raider.IO action when a
  published character provides the required identity fields.
- The global ranking adds canonical lifetime achievement points to the best
  accepted score in each of the four current-season run divisions. It never
  includes more than one run score per account and division.
- The Leaderboard tab opens on Global and uses the same Top 10, ellipsis,
  personal-position, and public name/guild search pattern as each run board.
  Runs and Achievement Hall are peer views; the four Normal/Hard duty selectors
  exist only within Runs. Full-list controls remain deferred until paging.
- Run boards and Achievement Hall use stable rank, player, guild, result-points,
  and time/date columns on desktop, with compact responsive stacking. Dates are
  secondary text and Hard run-board selection retains its red treatment.
- Global uses the same five-column rhythm, and personal-position rows in all
  three leaderboard views align to their list columns. Missing guild data is
  shown as `—`; it is never inferred or fabricated.
- The shell's podium labels its score model as “Achievements + All Runs” and
  displays the score legibly over subdued trophy art. The player-summary row
  gives the compact Achievement card one share and gives Best runs and Online
  ranking two shares each, keeping the latter two aligned and equally useful.
- Achievement Hall rows show rank, linked public player name, optional guild,
  lifetime points, and earned date. The linked profile owns the detailed list
  of exact achievements instead of duplicating an arbitrary title per row.
- Global rows expose two server-derived credentials: a crystal glyph after any
  flawless accepted crystal-duty run, and an `H` seal after any accepted Hard
  clear. The banner uses oversized gold/silver/bronze trophy art only for its
  three podium players.
- The personal Best runs summary names all four boards and shows the signed-in
  player's position wherever one exists, plus their global position; missing
  positions remain blank.
- Reaching rank one on a current-season run board awards that board's hidden,
  server-verified 50-point crown. Holding rank one on all four boards awards
  the hidden 200-point Legendary `Four Boards, One Throne` achievement.
- Localhost uses representative Global Top 3 fixtures when its API has no
  rows. Outside localhost, an empty Global Top 3 line is omitted completely.
- A Normal/Hard wipe may appear in the activity feed as generic `Anonymous`
  without login. Such an event contains no account, character, realm, guild,
  or public-profile identifier and remains separately rate-limited.
- Results and verified achievements retain their exact trainer version/build
  so retired accomplishments can become future Feats of Strength.
- Logout and complete deletion are separate actions. Complete deletion removes
  every account-linked live record, including Blizzard identifiers, sessions,
  characters, scores, attempts, achievements, and guild cache.
- Milestone 1 uses backed-up SQLite and deploys independently to the existing
  Caddy-fronted VPS. Guild-wide tracking remains Milestone 2.

See [`api-highscores.md`](api-highscores.md) for the complete API, storage,
privacy, deployment, and acceptance contract.

## SPEC-012 · Phase 3 landing Soaks

- Either opening yellow landing pool counts as occupied by the controlled
  player or a rendered NPC; the required resolution wipes only when neither
  pool has an occupant.
- During the landing window, the controlled player's health visibly drains at
  18% per second outside both yellow pools and recovers at 4% per second while
  inside one. NPC occupancy can satisfy the raid Soak but never suppresses this
  personal positioning feedback.
- Phase 3 Stars-orb beams are local links: two orbs more than 48 yards apart
  never connect visually and never produce collision along that gap.

## SPEC-013 · Phase 2 center pull and crystals

- The five-second center pull remains weak enough through most of its duration
  for a non-carrier walking outward to hold outside the middle. Its final force
  exceeds normal walking speed.
- The transition preserves the controlled player's resolved position instead
  of teleporting everyone to the exact center.
- Touching another player's dropped Phase 2 crystal is recoverable like the
  Phase 1 wrong-pickup rule: drop it within five seconds for NPC recovery or
  wipe. An assigned crystal player treats a touched crystal as their own.

## SPEC-014 · Releases, changelog, and leaderboard seasons

- Add every user-visible feature, behavior change, and bug fix to
  `CHANGELOG.md` under `Unreleased` as part of the implementing change.
- A release moves the relevant Unreleased entries into a dated version,
  updates the package and lockfile version, uses the SemVer bump implied by the
  dominant change, and publishes a matching Git tag.
- A patch release contains compatible fixes, a minor release contains
  backward-compatible features, and a major release is reserved for breaking
  changes.
- Trainer SemVer and leaderboard seasons are independent.
- Only the user may authorize a leaderboard-season change. Never infer one
  from a SemVer bump or change it automatically.
- Before releasing changes that may affect scoring, mechanic difficulty,
  achievement eligibility, server validation, or accepted-run comparability,
  explicitly warn the user and ask whether to start a new season. Without
  explicit approval, retain the current season.

## SPEC-015 · Shipped trainer and service boundary

- The released sequential encounter is Phase 1, Intermission, Phase 2, Phase
  3, then Phase 4. Every phase is also directly playable for focused practice;
  direct entry uses a countdown while sequential handoffs preserve encounter
  movement.
- Phase 1 owns the detailed contract in
  [`p1-encounter.md`](p1-encounter.md). Intermission trains boss beams,
  six-ray Starsplinters, and crystal recovery. Phase 2 trains three cross-beam,
  orb-return, pull, and personal-circle cycles. Phase 3 trains split-side
  landing Soaks, crystal protection, ground Soaks, Stars, ordered runes, Dark
  Archangel, and the north gather. Phase 4 trains four protected
  counterclockwise quarters with sequential Starsplinters, adds, and Heaven &
  Hell.
- Test, Easy, Normal, and Hard share one simulation. Test records non-blocking
  failures, assisted modes may coach, and Hard removes selected help and makes
  failures terminal. Mechanics are never weakened solely for automated tests.
- Raid plans contain twenty profiles, all phase positions, movable Phase 1 and
  Phase 3 bosses, start slots, and six crystal assignments per applicable
  phase. Shared hash, explicit/browser-local, and bundled I Asgard I defaults
  follow the precedence in the maintainer handoff.
- Player-facing systems include persistent inputs/camera/HUD, optional HUD
  action buttons, phase-refilling potion and shield, one-second Main ability
  casts, cosmetic class projectiles, audio channels, exact failure review,
  local achievements, and shareable completion/achievement images.
- Anonymous offline play is complete. The optional service adds Battle.net
  identity, verified characters, one-use attempts, server score validation,
  four run boards, Global ranking, Achievement Hall, public profiles, privacy,
  activity events, logout, and full deletion.
- [`api-highscores.md`](api-highscores.md) is the detailed service contract and
  [`milestones.md`](milestones.md) owns the current delivery grouping. The
  historical request ledger remains in [`README.md`](README.md).
