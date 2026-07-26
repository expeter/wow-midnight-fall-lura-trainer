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

- After the second Dark Archangel sector, every actor gathers on one exact
  north-stack point.
- Normal spread, side, and raid-plan positioning rules no longer apply during
  this gather.
- The player and all NPCs use that same point as the Phase 4 knockup origin.
- Phase 2-only HUD counters must never remain visible in Phase 3 or Phase 4.

## SPEC-004 · Completion achievements

- Results identify the played difficulty and whether the selected position had
  crystal duty.
- Flawless means zero recorded mistakes.
- Enabled potion, shield, and main ability are listed as optional challenges.
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

## SPEC-007 · Setup-page hierarchy

- Game settings begin with Difficulty & movement, Selected assignment, and
  Optional combat actions in one desktop row; responsive layouts may stack
  these cards.
- Keyboard & mouse controls follow Game settings, followed by HUD placement.
- Raid planning begins with its full-width save/load/share controls.
- Every phase map retains its own visible heading, beginning with
  `INTERMISSION RAID PLAN`.
