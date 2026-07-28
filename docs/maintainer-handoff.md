# Maintainer handoff

This is the short operational context for continuing development without the
original chat history. It complements the detailed ticket log in
[`README.md`](README.md), the stable contracts in
[`specifications.md`](specifications.md), and the current Phase 1 contract in
[`p1-encounter.md`](p1-encounter.md).

## Current release boundary

- The package version is `0.2.0`.
- Intermission and Phases 2–4 are production features.
- Phase 1 is a playable preview only on `localhost`, `127.0.0.1`, and `::1`.
  Production deliberately keeps it hidden until it is playtested and released.
- `BUG-084` and follow-up `CR-132` make the memory sweep authoritative at
  contact: correct positions remain accepted, while an incorrect controlled
  rune fails immediately with red feedback.
- The maintained I Asgard I plan is bundled in
  [`public/raidplans/asgard.txt`](../public/raidplans/asgard.txt). Loading it is
  an in-app fetch and persistence operation, never a redirect to the hosted
  trainer. On empty browser storage it is the default plan.
- Encounter SFX candidates remain in the repository and soundboard, but the
  live encounter mix intentionally enables only Main ability release. P4
  `Left`, `Right`, `Left`, `Move` uses separate prerecorded raid-lead clips.

The source of truth for host gates is [`src/features.ts`](../src/features.ts).
Do not expose P1 in production as an incidental consequence of unrelated work.

## Product intent that is easy to lose

This trainer is for learning movement and overlap pressure, not merely watching
a scripted animation.

- NPCs should make the encounter viable and model the raid strategy, but they
  must leave the controlled player responsible for their mechanic.
- NPC movement may be imperfect, delayed, and human-looking. It must not make a
  required mechanic impossible, cross forbidden room dividers, leave mandatory
  protection, or reveal a memory solution too early.
- Raid-plan coordinates and phase-specific crystal assignments are
  authoritative. Never replace a valid shared/saved plan with old hard-coded
  positioning. Planner rings and dividers are visual guidance, not drag
  barriers.
- The opposite P3 half remains simulated for context, but each actor belongs to
  the side determined by its configured position. Actors do not cross the
  lethal divider during normal P3 play.
- P3 finishes by stacking everyone at one exact north point. Normal spread and
  side rules stop applying during that gather. P4 then starts with the knockup.
- P4 is a protected stack rotating counterclockwise through north, west, south,
  and east. NPCs stay inside the moving protection zone except for their short,
  safe Starsplinter positioning.
- Soaks must require meaningful player participation. NPCs can rescue coverage
  and close small gaps, but should not complete every pool before the player
  engages.
- Test mode records and exposes mistakes without blocking practice. Easy may
  provide extra coaching. Normal and Hard should not leak mechanic solutions.

When screenshots and prose appear to conflict with an old implementation,
preserve the newest explicit mechanic clarification as a `SPEC` or ticket
update instead of silently choosing one.

## Rendering and simulation invariants

Several hard bugs came from maintaining separate “ideal” gameplay positions and
visible positions.

- Collision must use the position and rotation the player can actually see.
  This is especially strict for all six Starsplinter rays in P1, Intermission,
  and P4.
- A visual hazard must not damage outside its visible shape, and a visible hit
  must not pass silently. Prefer shared geometry helpers over parallel render
  and collision formulas.
- Preserve the last rendered actor snapshot through a detonation when needed;
  do not reconstruct NPC locations from their intended destination.
- Phase clocks, NPCs, hazards, cast bars, health pressure, TTS, and queued
  transitions must all pause together. Pause/resume must not skip a mechanic or
  quarter.
- Game-speed changes accelerate the shared simulation. They must not grant the
  player a private movement advantage over the raid.
- Direct phase entry has a `3, 2, 1` countdown. Seamless transitions do not add
  another countdown; they use their encounter-specific movement/callout.
- Random mechanics should remain random per relevant sequence, while tests use
  stable state or pure helpers rather than weakening randomness in gameplay.

`src/App.tsx` currently owns the encounter state machine and HUD,
`src/GameScene.tsx` owns the Three.js view and reports rendered actor
positions, and `src/game.ts` contains most shared timings and geometry.
`src/p1.ts` contains deterministic P1 rules. Extract pure helpers when it
reduces duplicated logic, but avoid broad rewrites while tuning mechanics.

## Raid-plan precedence

Plan loading has caused regressions before. Preserve this order:

1. A valid `#raidplan=` shared hash loaded for the current page.
2. An explicitly loaded plan or existing browser-local plan.
3. The bundled I Asgard I plan on first load with empty storage.

Every complete plan includes profiles, start slots, phase positions, P1/P3 boss
positions, and phase-specific crystal assignments. Normalize legacy plans
without discarding fields they already provide. Saving or loading a plan must
persist immediately so direct phase entry sees the same assignments.

## Audio boundary

- Music, encounter sounds, and TTS are independent settings.
- Most experimental encounter samples were intentionally removed from the live
  mix because matching their transient to visuals consumed too much tuning
  time. Keep them available in the local soundboard.
- Only `main-ability-release` is currently in
  `ACTIVE_ENCOUNTER_SOUNDS`.
- P4 direction calls are timing-critical prerecorded media, not ordinary
  browser TTS. They must remain `Left`, `Right`, `Left`, then `Move`.
- Do not re-enable candidate sounds globally without explicit review.

See [`audio-cues.md`](audio-cues.md) and
[`tools/voice-soundboard/README.md`](../tools/voice-soundboard/README.md).

## Tickets, screenshots, and commits

- Assign every request a stable ID before implementation.
- Add a focused automated regression before marking a ticket implemented.
- Keep original screenshots and inbox notes linked from the ticket. The user
  explicitly permits committing these assets.
- The localhost `/inbox` tool accepts pasted, dragged, or selected screenshots
  and stores an `INBOX-*` Markdown/image pair under [`inbox/`](../inbox/).
- Do not interpret an inbox ID from chat without reading its Markdown and image.
- Make focused commits after verified bug, change, or feature work. The user
  normally pushes; do not push unless asked.
- Preserve unrelated dirty-worktree changes and user-provided assets.

## Validation and CI

Minimum checks for code changes:

```bash
npm test
npm run build
```

Run the focused Playwright test for the changed behavior. Run the complete
suite when changes cross phase/state-machine boundaries:

```bash
npm run test:e2e:local
```

The stable `test:e2e:local` wrapper owns `PLAYWRIGHT_BROWSERS_PATH`, changes to
the repository root, and forwards every argument to Playwright. Use the same
command prefix for focused runs instead of embedding a variable-length grep in
the shell command:

```bash
npm run test:e2e:local -- --grep "Phase 1 preview|terminal wipe"
```

This keeps recurring sandbox approval scoped to
`npm run test:e2e:local` while allowing different `--grep`, project, reporter,
or retry arguments. Chromium is intentionally installed under
`.tmp/ms-playwright`, and `.tmp/` is ignored. In WSL, use Playwright's native
Linux Chromium; do not introduce `chrome-launcher` path conversion. A process
sandbox may require narrowly scoped permission to bind the local test server.

GitHub Pages CI uses Node 22 and separates UI tests into:

- `opening-and-p2`: `--grep-invert=@late-arena`, no retry;
- `p3-and-p4`: `--grep=@late-arena`, one retry because free runners use slow
  software rendering.

Do not lengthen all timeouts or weaken mechanics to accommodate CI. Prefer
pure-rule coverage, direct phase entry, stable test state, and only a narrowly
targeted shared mechanic timeout for renderer-heavy transitions.

## Open work at this handoff

Start with the current statuses in the request log, not this snapshot. At the
time of writing, the meaningful non-complete work is:

- `CR-051`: deferred P3 second-sequence memory/Soak order swap.
- `FR-022` and `FR-023`: playable P4 tank cone and random protection carrier.
- `FR-027`: optional API-backed leaderboard/achievement verification.
- `FR-038` and `FR-039`: post-v0.2.0 `Gnomkaiser` admin/live easter eggs.
- `FR-048`–`FR-050`: P3 crystal recovery opening, P2-position-based push into
  P3, and the planned four-player P2 beam/orb assignment rework.

Before starting any of these, confirm whether newer inbox reports or user
clarifications supersede the recorded wording.
