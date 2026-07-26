# L'ura Trainer project record

This document is the durable feature and issue record for the trainer. It
summarizes what has been implemented, provides a home for the reference
screenshots, and defines the lightweight request convention used for future
work.

## Request convention

New requests can start with one of these prefixes:

| Prefix | Meaning | Example |
| --- | --- | --- |
| `FR` | Feature request: a new player-facing capability | `FR: Add a replay timeline` |
| `CR` | Change request: tune or alter existing behavior | `CR: Increase the P3 light radius` |
| `BUG` | Something behaves differently from the intended mechanic | `BUG: P4 adds stop during pause` |

When a request is implemented, record it here with a stable ID such as
`FR-001`, `CR-001`, or `BUG-001`. Useful statuses are **Planned**, **In
progress**, **Implemented**, and **Deferred**. A request can include a
screenshot filename from `images/`, reproduction notes, difficulty, entry
phase, and the expected behavior.

After an implemented request passes its relevant tests and build checks, commit
it as a focused Git commit. Leave verified work uncommitted only when explicitly
requested.

Example:

```text
BUG-008 · Implemented
P3 memory partners can clear in the wrong order.
Evidence: images/screen-p3-bug17.png
Expected: only the active T/X/O pair resolves; other contacts are ignored.
```

## Request log

| ID | Status | Request |
| --- | --- | --- |
| `CR-001` | Implemented | Adopt `CR`, `BUG`, and `FR` prefixes and maintain this project record. |
| `FR-001` | Implemented | Publish a comprehensive inventory of the implemented trainer behavior. |
| `FR-002` | Implemented | Add a Test-mode shortcut to inspect the full completion card without replaying the complete encounter. Preview exports are visibly marked as non-completions. |
| `FR-003` | Implemented | Make the bottom-left recent-failure text selectable and add a compact clipboard button for copying its visible entries. |
| `CR-002` | Implemented | Randomize the two P3 landing impacts per attempt and make a valid three-player Soak glow without revealing remaining progress outside Test/Easy. |
| `CR-003` | Implemented | Generate the two P3 landing impacts independently within their group area; the crystal carrier takes the nearer impact and the helper takes the farther one. |
| `CR-004` | Implemented | Add a subtle top-left version indicator with the package version and UTC build timestamp on every screen. |
| `CR-005` | Implemented | Retune Phase 2 to five seconds of initial positioning, seven-second cross beams, a five-second pull and spread, a one-second orb charge plus one-second return, and a fixed thirty-second beam cadence. |
| `CR-006` | Implemented | Add an out-of-game Season 2 recruitment banner linking to the German-speaking I Asgard I Raider.IO guild page. |
| `CR-007` | Implemented | Increase the setup, planner, in-game HUD, failure, and completion interface type scales for readability at native browser zoom. |
| `CR-008` | Implemented | Enlarge the desktop Phase 3 raid-plan canvas without transforming or resetting the saved player and boss world coordinates. |
| `CR-009` | Implemented | Link Pestivator's avatar and business card to Raider.IO and remove the redundant Solana-address copy control. |
| `CR-010` | Implemented | Link the version/build string to the public GitHub project. |
| `CR-011` | Implemented | Correct the Phase 3 planner guidance to say the second-sector assignments rotate toward the south. |
| `CR-012` | Implemented | Reclaim arena height with a three-column game header: phase context left, mechanic title centered, actions right; move the linked build string into the status bar. |
| `BUG-008` | Implemented | Remove the premature 20-second P3 Soak failure; unfinished pools are now checked only when Big Boom resolves at 40 seconds. |
| `BUG-009` | Implemented | Enforce P3 Stars orb spacing and isolate the southwest/southeast fields with clearance from the room divider. |
| `BUG-010` | Implemented | Use the NPC protection bubble when the player's crystal duty belongs to the other Dark Archangel set; only consume the player's crystal on its assigned set. |
| `BUG-011` | Implemented | Keep the in-game version/build indicator in normal layout flow so it cannot overlap phase headlines. |
| `BUG-012` | Implemented | Give the failure-log clipboard control a distinct accessible name so it cannot collide with the Recent failures panel label. |

## Implemented feature inventory

### Application and controls

- Player-focused 3D arena rendering with a high, behind-the-player camera.
- Left-drag changes the view without changing facing. Right-drag changes both
  view and facing immediately. The mouse wheel zooms within configured limits.
- Camera settings persist between attempts.
- Camera-relative `W/A/S/D` movement, a player-only jump, and pause/resume.
  Timers and actors stop while paused.
- Rebindable movement, jump, crystal, pause, health potion, shield, and main
  ability controls.
- Adjustable movement speed, global simulation timing, and optional opening
  movement bonus.
- Full-window game layout with compact in-arena score, mistake log, zoom/status
  bar, and draggable HUD elements.
- Test, Easy, Normal, and Hard modes. Test mode records failures without
  stopping the simulation.
- Optional ambience with track preview, mute, volume, persistence, and Pixabay
  attribution.

### Raid planning and sharing

- Twenty editable players with names, World of Warcraft class colors, and
  crystal assignments.
- Drag-and-drop Intermission, Phase 2 beam-soak, Phase 2 spread, and Phase 3
  initial-position plans.
- Mechanic-sized Phase 2 personal-circle overlays in the planner.
- Four editable Intermission entry slots and orientation-aware plan rotation.
- Phase 3 group lasso/multi-select movement and two movable boss positions.
- Local persistence for player profiles, plans, keybindings, camera, sound, and
  HUD placement.
- Shareable `#raidplan=` links containing names, classes, crystal duties, start
  slots, and all phase assignments.

### Intermission

- Ten-second positioning opener with rotated assignments and optional opening
  speed bonus.
- Six alternating boss-beam and Starsplinter sets based on the supplied event
  timings.
- Large randomized boss beams, narrow player-centered Starsplinter rays, void
  boundaries, world markers, and mobile NPC players.
- Crystal carriers drop a visible ground crystal, move clear of it, and recover
  it within the displayed pickup window.
- Player and NPC crystal interactions, collision penalties, crystal wipes, and
  a final recovery window before the Phase 2 transition.
- Starsplinter collisions with players and crystals are scored from the
  player's perspective.

### Phase 2

- Direct entry or continuous transition from Intermission.
- Twelve orbiting orbs arranged as three groups of four.
- Boss cross-beams destroy the assigned orbs; struck orbs glow, continue
  orbiting, charge for one second, and return to the center over one second.
- Beam countdowns, crystal drop/recovery, orb-return collision handling, and
  crystal safety checks.
- Increasing center pull followed by large blue personal circles and a
  dedicated spread assignment.
- Three complete cycles with walking NPC transitions and a successful flight
  into Phase 3.

The first cycle has five seconds of assignment positioning before its beam.
Each cross-beam cycle then follows this base timeline; the global timing
multiplier scales the complete simulation uniformly.

| Time from beam start | Event |
| ---: | --- |
| `0s` | Cross beams begin. |
| `7s` | Beams resolve and strike the four outside orbs; the five-second pull begins. |
| `12s` | The raid reaches the middle and the five-second personal-circle spread begins. |
| `17s` | Personal circles resolve. |
| `20s` | Struck orbs glow and charge. |
| `21s` | Orbs launch toward the middle. |
| `22s` | Orbs arrive and explode. |
| `30s` | The next cross beams begin. |

### Phase 3

- Direct entry or outward flight from Phase 2 into split three-player landing
  groups.
- Two yellow landing soaks per group, including crystal-player responsibility
  and difficulty-dependent NPC help.
- Two half-raids, a visible passable divider, a lethal center dome, and two
  editable boss positions.
- Persistent yellow carrier light zones with player health loss outside and
  recovery inside.
- Three non-overlapping dark soaks around each boss. Their progress scales with
  actual occupancy and must finish before the boom.
- Repeating irregular Stars lattices with local, non-crossing connections and
  spacing designed to cover the active player area.
- Ordered T/X/O memory matching with a preview panel, immediate correct-pair
  resolution, wrong-contact penalties, and NPC partner behavior.
- Dark Archangel group protection created by the assigned crystal carrier,
  followed by a lethal consumed sector and clockwise movement.
- Two playable sectors followed by the north regroup and Phase 4 transition.

### Phase 4

- Direct Test/Easy/Normal/Hard entry with a standard countdown, or an immediate
  transition after the Phase 3 north regroup.
- Opening knock-up, four 22-second quarters, moving yellow safe area, Heaven &
  Hell sector consumption, and a 92-second boss-health timeline.
- Three sequential Starsplinters in a left/right/left formation. Every quarter
  randomizes the player's slot and straight/angled ray pattern.
- Separate detonation timers, NPC return movement, and lethal group hits.
- A continuous, separated stream of floor fragments from the inner ring toward
  the active group, with collision penalties.
- A front soak/tank NPC with a recurring cone and persistent close-range add
  cleanup.
- Final completion after the fourth Starsplinter set when no room remains.

### Scoring, results, and resilience

- Points, exact mistake reasons, timestamps, phase counters, crystal timers,
  cast bars, health bars, and wipe explanations.
- Non-terminal failure recording in Test, a recoverable first wipe in
  Easy/Normal, and immediate terminal behavior in Hard.
- Optional health potion, shield, and one-second main-ability gameplay.
- Per-phase score and time tracking.
- A full-run “L'ura Movement Master” completion card with total score, time,
  mistakes, attempt number, optional challenges, and phase breakdown.
- Copyable result text and a generated result image for guild sharing.
- A Test-mode-only, clearly watermarked final-screen preview shortcut.

### Quality and delivery

- Unit tests for mechanic calculations and component tests for core UI flows.
- Playwright browser coverage for arena entry and important phase behavior.
- Production build validation through Vite.
- GitHub Pages deployment workflow.
- MIT license, unofficial fan-project notice, creator card, Twitch/BattleTag
  contact details, optional Solana support link, and Pixabay music credits.

## Historical issue groups

The project grew through rapid visual playtesting before adopting formal IDs.
These groups preserve the earlier bug evidence without pretending every tuning
message was a separate ticket.

| ID | Area | Resolution | Evidence |
| --- | --- | --- | --- |
| `BUG-001` | Early camera, movement, sizing, and arena-scale mismatches | Implemented through camera-relative controls, persisted zoom/facing, and repeated scale tuning | [`screen-bug6.png`](../images/screen-bug6.png), [`screen-v01.png`](../images/screen-v01.png) |
| `BUG-002` | P3 landing and initial assignment translation | Implemented with outward groups, southern opening plans, movable bosses, and sector rotation | [`screen-p3-bug01.png`](../images/screen-p3-bug01.png), [`screen-p3-bug02.png`](../images/screen-p3-bug02.png), [`screen-p3-bug03.png`](../images/screen-p3-bug03.png), [`screen-p3-bug04.png`](../images/screen-p3-bug04.png) |
| `BUG-003` | P3 soak overlap, occupancy, and NPC contribution | Implemented with randomized non-overlapping pools, occupancy-scaled drain, progress rules, and capped NPC help | [`screen-p3-bug05.png`](../images/screen-p3-bug05.png), [`screen-p3-bug13.png`](../images/screen-p3-bug13.png), [`screen-p3-bug-19.png`](../images/screen-p3-bug-19.png), [`screen-p3-bug21.png`](../images/screen-p3-bug21.png) |
| `BUG-004` | P3 assets disappearing at some camera angles | Implemented through depth/render-order and material adjustments | [`screen-p3-bug08.png`](../images/screen-p3-bug08.png), [`screen-p3-bug09.png`](../images/screen-p3-bug09.png), [`screen-p3-bug12.png`](../images/screen-p3-bug12.png), [`screen-p3-bug14.png`](../images/screen-p3-bug14.png), [`screen-p3-bug15.png`](../images/screen-p3-bug15.png) |
| `BUG-005` | P3 memory order and Stars topology | Implemented with ordered active pairs, contact guards, spaced nodes, and local non-crossing edges | [`screen-p3-bug17.png`](../images/screen-p3-bug17.png), [`screen-p3-bug18.png`](../images/screen-p3-bug18.png) |
| `BUG-006` | P4 stacking, safe-area movement, and add density | Implemented through group-relative targeting, tuned actors, separated streams, and tank cleanup | [`screen-p4-bug11.png`](../images/screen-p4-bug11.png), [`screen-p4-bug12.png`](../images/screen-p4-bug12.png), [`screen-p4-bug16.png`](../images/screen-p4-bug16.png), [`screen-p4-bug-20.png`](../images/screen-p4-bug-20.png) |
| `BUG-007` | P3 browser test could miss the Rune Order panel on GitHub's software renderer | Implemented by using the existing CI-aware mechanic timeout for both panel transitions | GitHub Actions failure at `e2e/arena-entry.spec.ts:123` |

## Visual reference index

These captures are design and mechanic references rather than application
assets:

- [Intermission reference](../images/screen-intermission.png)
- [Phase 2 personal circles](../images/screen-p2-circles.png)
- [Phase 3 arena reference](../images/screen-p3-reference01.png)
- [Phase 3 runic lattice](../images/screen-p3-runes.png)
- [Phase 3 memory game](../images/screen-p3-memory-game.png)
- [Phase 3 memory game, second view](../images/screen-p3-memory-game2.png)
- [Phase 4 reference](../images/screen-p4-reference01.png)

## Deferred ideas

- Text-to-speech mechanic warnings.
- Player-controlled Phase 4 tank cone.
- Per-phase refills and certificate scoring for optional potion/shield
  challenges.
- Verifiable completion links. A trustworthy proof cannot be created with a
  secret embedded in a static GitHub Pages client; it would require a backend
  or external signing service.
