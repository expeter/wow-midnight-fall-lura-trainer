# L'ura Trainer specifications

These contracts capture stable intent for the trainer’s main components. New
`FR`, `CR`, and `BUG` tickets should reference or amend the relevant contract.
If a request conflicts with one of these rules, clarify the intended spec
change before implementation.

## SPEC-001 · Ticket workflow

- Every new task receives a stable `FR`, `CR`, `BUG`, or `SPEC` ID.
- Record the request before implementation and mark it implemented only after
  focused automated regression coverage passes.
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
- `SUPERHUMAN FLAWLESS` requires a full sequential clear, zero mistakes, all
  three optional challenges, crystal duty, and more than 1100 points.

## SPEC-005 · Background audio

- Background music is controlled by a source-level feature flag.
- While disabled, no music setup controls, arena mute control, or audio
  playback initialization is exposed.

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

- Game settings begin with Difficulty & movement, Selected assignment, and
  Optional combat actions in one desktop row; responsive layouts may stack
  these cards.
- Keyboard & mouse controls follow Game settings, followed by HUD placement.
- HUD action buttons are an optional persisted display aid, off by default.
  When enabled, Main ability, Interrupt, Shield, Health potion, and Crystal drop
  default below the cast bar, have their own draggable HUD anchor, and invoke
  the same handlers and validity rules as their keyboard bindings.
- Raid planning begins with its full-width save/load/share controls.
- Every phase map retains its own visible heading, beginning with
  `INTERMISSION RAID PLAN`.

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
