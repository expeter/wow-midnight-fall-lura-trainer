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
| `FR-004` | Implemented | Add a persistent player-name override for the controlled character and result certificate while retaining the raid-plan name and spot as smaller played-position information. |
| `FR-005` | Implemented | Give the non-Hard memory-game partner a seeded random reaction delay between one and six seconds before it starts moving to help the player. |
| `FR-006` | Implemented | Let P2 NPCs roam around their cross-beam assignments and avoid returning orbs during downtime, then walk back to their exact soak positions for the final three seconds before the next beam. |
| `FR-007` | Implemented | Add independently persistent horizontal and vertical mouse-camera inversion settings. |
| `FR-008` | Implemented | Add rebindable Q/E keyboard turning that immediately changes player facing and forward movement direction, plus a persistent rotation-speed slider. |
| `CR-002` | Implemented | Randomize the two P3 landing impacts per attempt and make a valid three-player Soak glow without revealing remaining progress outside Test/Easy. |
| `CR-003` | Implemented | Generate the two P3 landing impacts independently within their group area; the crystal carrier takes the nearer impact and the helper takes the farther one. |
| `CR-004` | Implemented | Add a subtle top-left version indicator with the package version and UTC build timestamp on every screen. |
| `CR-005` | Implemented | Retune Phase 2 to five seconds of initial positioning, seven-second cross beams, a five-second pull and spread, a one-second orb charge plus one-second return, and a fixed thirty-second beam cadence. |
| `CR-006` | Implemented | Add an out-of-game Season 2 recruitment banner linking to the German-speaking I Asgard I Raider.IO guild page. |
| `CR-007` | Implemented | Increase the setup, planner, in-game HUD, failure, and completion interface type scales for readability at native browser zoom. |
| `CR-008` | Superseded by CR-013 | Enlarge the desktop Phase 3 raid-plan canvas without transforming or resetting the saved player and boss world coordinates. |
| `CR-009` | Implemented | Link Pestivator's avatar and business card to Raider.IO and remove the redundant Solana-address copy control. |
| `CR-010` | Implemented | Link the version/build string to the public GitHub project. |
| `CR-011` | Implemented | Correct the Phase 3 planner guidance to say the second-sector assignments rotate toward the south. |
| `CR-012` | Implemented | Reclaim arena height with a three-column game header: phase context left, mechanic title centered, actions right; move the linked build string into the status bar. |
| `CR-013` | Implemented | Restore the Phase 3 planner to the standard content width and zoom its coordinate view further into the opening assignment area. |
| `CR-014` | Implemented | Place the two yellow landing soaks after the P2 transition at least 15 yards from the landing players and prevent their circles from overlapping. |
| `CR-015` | Implemented | Require all three ordered Phase 3 memory pairs to resolve before Big Boom; an incomplete memory game now wipes the attempt. |
| `CR-016` | Implemented | Increase each Phase 3 Soak health pool by 1.5×, from 42 to 63, so four-player groups cannot finish it too quickly. |
| `CR-017` | Implemented | Keep idle Phase 3 NPCs at least 7 yards apart around their boss while preserving active Soak and rune duties; crystal carriers reserve non-overlapping light-zone spacing and may therefore skip a Soak. |
| `CR-018` | Implemented | Keep Phase 3 Stars connections clear of the active Soak circles, including beam width, matching the updated encounter behavior. |
| `CR-019` | Implemented | Reduce the setup page’s top padding from viewport-scale whitespace to a compact 14-pixel start. |
| `CR-020` | Implemented | Give the Phase 3 planner an independent, non-repeating 325% arena background viewport with its normal horizontal alignment and a negative-1000-pixel vertical focus; legacy shared P3 placements may fall outside this focused view. |
| `CR-021` | Implemented | Reverse Phase 4 Heaven & Hell progression to counter-clockwise—north, west, south, east—and consume the matching arena quarters in the same order. |
| `CR-022` | Implemented | Partially reverse the previous 1.5× P3 Soak-duration increase: reduce each pool from 63 HP to 50 HP, making three-player completion take about 16.7 seconds instead of 21. |
| `CR-023` | Implemented | Align the creator-card actions into a consistent two-column link row with a full-width Buy me a coffee action beneath it. |
| `CR-024` | Implemented | Reduce each P3 Soak pool from 50 HP to 35 HP, allowing three correctly positioned players to finish it in about 11.7 seconds before the memory game begins. |
| `CR-025` | Implemented | Remove the player’s moving yellow P3 light and its health protection after their assigned Dark Archangel consumes the crystal; nearby NPC crystal lights remain usable. |
| `CR-026` | Implemented | Reduce P3 render overhead without mechanic changes by caching deterministic Stars fields, reusing Stars laser/orb geometry across frames, and removing repeated NPC raid-index array construction. |
| `CR-027` | Implemented | Show the assigned crystal-player roster directly beneath the spot selector as compact clickable spot/name chips for quick review and selection. |
| `CR-028` | Implemented | Keep the existing WoW-inspired class palette and change Monk from bright green to a darker petrol-jade color for clearer arena distinction. |
| `CR-029` | Implemented | Configure six independent crystal carriers beneath each Intermission, Phase 2, and Phase 3 raid plan; switch ownership on phase transitions with a short player notice and preserve legacy shared plans. |
| `CR-030` | Implemented | Present each phase crystal selector as a compact glowing duty card with a numbered crystal slot and clearer spot/name selection. |
| `BUG-008` | Implemented | Remove the premature 20-second P3 Soak failure; unfinished pools are now checked only when Big Boom resolves at 40 seconds. |
| `BUG-009` | Implemented | Enforce P3 Stars orb spacing and isolate the southwest/southeast fields with clearance from the room divider. |
| `BUG-010` | Implemented | Use the NPC protection bubble when the player's crystal duty belongs to the other Dark Archangel set; only consume the player's crystal on its assigned set. |
| `BUG-011` | Implemented | Keep the in-game version/build indicator in normal layout flow so it cannot overlap phase headlines. |
| `BUG-012` | Implemented | Give the failure-log clipboard control a distinct accessible name so it cannot collide with the Recent failures panel label. |
| `BUG-013` | Implemented | Put the Buy me a coffee action on its own business-card row so it cannot overlap the attribution links. |
| `BUG-014` | Implemented | Validate the Dark Archangel protection crystal against the full visible 24-yard protection area instead of rejecting valid drops beyond an invisible 15-yard limit. |
| `BUG-015` | Implemented | Widen the setup layout and creator card so Raider.IO and Twitch share the first link row while Buy me a coffee remains alone below. |
| `BUG-016` | Implemented | Correct the Phase 3 planner background to use a negative-1000-pixel vertical focus and remove the breaking explicit horizontal offset. |
| `BUG-017` | Implemented | Resolve the P1 opening positioning as a wipe when the player has not reached the playable dark annulus between the inner and outer rings; exact assignment accuracy remains advisory. |
| `BUG-018` | Implemented | Reset the mechanic clock and restack the raid in the middle before the P2-to-P3 flight, restoring the visible two-second outward knockback instead of teleporting actors to their landing positions. |
| `BUG-019` | Implemented | Resolve P2 personal-circle player hits against NPCs’ actual spread positions and the visible circle radius; another player is hit only when their center is inside the controlled player’s circle. |
| `BUG-020` | Implemented | Evaluate P3 light protection against the crystal NPCs’ actual rendered positions instead of their static planning anchors, keeping health behavior aligned with the visible yellow safe areas. |

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
