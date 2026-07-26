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
| `SPEC` | Stable component or mechanic contract used to interpret later FR/CR/BUG work | `SPEC: P4 transitions always begin from the north stack` |

When a request is implemented, record it here with a stable ID such as
`FR-001`, `CR-001`, or `BUG-001`. Useful statuses are **Planned**, **In
progress**, **Implemented**, and **Deferred**. A request can include a
screenshot filename from `images/`, reproduction notes, difficulty, entry
phase, and the expected behavior.

After an implemented request passes its relevant tests and build checks, commit
it as a focused Git commit. Leave verified work uncommitted only when explicitly
requested. Every incoming `BUG`, `CR`, or `FR` must be recorded as **Planned**
before implementation begins, even when several requests arrive in one message.
It may only move to **Implemented** after a focused automated regression test
has been added or updated for that request.

The stable component contracts live in [specifications.md](specifications.md).
When a new request contradicts a recorded specification, clarify or explicitly
revise that specification before implementing the change.

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
| `CR-031` | Implemented | Enforce unique keybindings: assigning an occupied key clears the previous action and marks its empty control red as Unbound. |
| `CR-032` | Implemented | Move camera inversion into a full-width Keyboard & mouse controls panel and align keyboard bindings, rotation speed, and mouse options on a responsive grid. |
| `CR-033` | Implemented | Keep the opposite Phase 3 raid half simulated and visible, but dim its actors to distinguish it from the player’s active side without removing useful encounter context. |
| `CR-034` | Implemented | Reduce backward player movement to 50% on Hard while preserving full forward and strafe speed in every phase. |
| `CR-035` | Implemented | Let player and NPC Starsplinters destroy any Phase 4 floor add crossed by one of their six rays. |
| `CR-036` | Implemented | Give players ten seconds after the P3 landing Soaks to reach their assigned side; being across the divider at resolution costs 50 points, while exact marker distance is not scored. |
| `FR-018` | Implemented | Allow five consecutive seconds outside P3 safe-zone protection, then deduct 10 points for every additional full second until the player returns to protection and resets the grace period. |
| `FR-019` | Implemented | Add a one-click “Load I Asgard I raid plan” action that uses the standard normalized loader and immediately replaces and persists the current local plan. |
| `FR-020` | Implemented | Emit Git-derived version metadata from every local or CI Vite build, periodically detect a newer deployed revision, offer an in-page reload prompt, display the running Git revision, and link a tracked changelog beneath the version. |
| `FR-021` | Implemented | Add a compact four-item setup menu for Game settings, Keyboard settings, HUD, and Raid planning; omit phase-plan sublinks and preserve active raid-plan share hashes while scrolling. |
| `FR-022` | Backlog | Make the Phase 4 front-player tank cone playable: expose the action to the controlled player when assigned, retain its intended cooldown and area, and destroy approaching adds caught by the cone. |
| `FR-023` | Backlog | Randomly assign the moving Phase 4 protection safe zone to a player or NPC so the controlled player may need to carry and position it while the raid follows. |
| `FR-024` | Implemented | Make Main ability permanently available without an enable checkbox and award its hit only when the one-second cast completes. Add a persisted global cosmetic-projectile switch: completed player casts fire toward L’ura, while a capped lightweight NPC stream uses WoW class colors and simple class-specific shapes without changing encounter mechanics. |
| `FR-025` | Implemented | Add a continuous encounter-length background theme that survives phase transitions and loops cleanly when necessary, with the existing audio feature flag and mute/volume controls restored only when suitable licensed music is selected. |
| `FR-026` | Implemented behind localhost preview | Add distinct, synchronized sound effects for major lasers, Stars, Starsplinter detonations, returning orbs, circles, completed Soaks/runes, Dark Archangel protection, destroyed adds, mistakes, and wipes. Provide an independent persisted mute and volume channel; keep it localhost-only while the mix is reviewed for v0.2.0. |
| `FR-027` | Backlog | Add an optional API-backed leaderboard and achievement tracker. Keep anonymous play fully available, optionally identify persistent/public results through Battle.net OAuth, and validate run timing and mechanics server-side rather than treating OAuth or a client-submitted score as proof of a legitimate run. |
| `FR-028` | Implemented | Restore optional background music with only the two newly selected licensed tracks, default playback to off, and add a dedicated Audio settings row for Music, future encounter Sounds, and deferred TTS. |
| `FR-029` | Implemented | Implement opt-in browser TTS for the approved phase-aware raid-lead calls, suppress repeated/stale speech across render updates and pause states, and gracefully disable the option when speech synthesis is unavailable. |
| `FR-030` | Backlog | Add the five-interrupt, crystal pickup, ricocheting glaive, ordered rune beam, and rotating-beam encounter before Intermission. Preserve the detailed mechanic contract in [`p1-encounter.md`](p1-encounter.md). |
| `FR-031` | Implemented | Add an isolated local voice soundboard with five CMU Flite voices, individual Left/Right/Move auditions, exact clocked rhythm previews, a preferred-voice choice, local notes, reproducible generation, and license guidance. |
| `FR-032` | Implemented | Prepare a standalone tested P1 rules module for later integration without changing the live game: interrupts, crystals, reflective expiring glaives, ordered runes, rotating beams, reactive Soaks, and the Intermission transition. |
| `FR-033` | Implemented | Add a persistent browser-local achievement collection beneath raid planning with immutable first-earned timestamps, run history for cross-duty feats, and a compact top-page badge summary linking to the full catalogue. |
| `FR-034` | Implemented | Expand the local audio soundboard with spell-effect candidates, mechanic suggestions, a persistent SFX shortlist, and a copyable review export; keep audition choices disconnected from gameplay until explicitly selected. |
| `FR-035` | Implemented | Replace the soundboard shortlist flow with a persistent event-by-event review table containing all 20 planned cues, four playable candidates per cue, one selected choice, one reviewer comment, old-shortlist migration, and a single copyable Markdown feedback export. |
| `FR-036` | Implemented | Add a second soundboard audition pass with three deterministic dark-arcane variants for each of 14 approved sound cues, align long and short effects to their actual mechanic windows, display clip durations, and mark the six rejected cue types intentionally silent. |
| `FR-037` | Implemented | Detect localhost and loopback runtimes so unfinished Phase 1 and encounter-sound work can be exposed for local development without enabling those gates on GitHub Pages. The sound-channel preference is locally testable and persisted; the P1 gate is ready for the `FR-030` renderer integration. |
| `FR-038` | Backlog after v0.2.0 | Add a localhost-only admin mode activated by playing as `Gnomkaiser`; wipe triggers are ignored, unlogged, and do not reduce points so completion and achievement paths can be tested. |
| `FR-039` | Backlog after v0.2.0 | In the live build, playing as `Gnomkaiser` adds a crown to the controlled player, renders the full raid at 50% scale, and unlocks a hidden achievement whose criteria remain concealed in the catalogue. |
| `CR-037` | Superseded | A direct Discord profile needs a numeric user ID. The generic Discord application link was removed again; Twitch remains the direct creator contact. |
| `CR-038` | Implemented | Link the displayed BattleTag to Pestivator’s Raider.IO profile because Battle.net has no stable public friend-add URL for a BattleTag. |
| `CR-039` | Implemented | Record every tagged request before implementation and require focused automated regression coverage before marking it implemented. |
| `CR-040` | Implemented | Restore the creator card’s visual hierarchy with larger readable type, a larger avatar, balanced spacing, and consistent `↗` marks on the Raider.IO and Twitch profile links. |
| `CR-041` | Implemented | Make the final Phase 3 north gather a true single-point raid stack: NPCs ignore their normal spread/positioning rules there and use the same origin as the Phase 4 knockup. |
| `CR-042` | Implemented | List completion achievements by difficulty, crystal duty, enabled optional challenges, and flawless status; award Superhuman Flawless only to a flawless full-run crystal player with potion, shield, main ability, and more than 1100 points. |
| `CR-043` | Implemented | Hide background music and its arena control behind a disabled feature flag until suitable replacement ambience is available. |
| `CR-044` | Implemented | Resolve Heaven & Hell every 21 seconds, retain the shared 10% Phase 4 movement bonus, and time the third Starsplinter to detonate exactly one second before Heaven & Hell. |
| `CR-045` | Implemented | Move raid-plan save/load/sharing into its own full-width section after HUD settings and immediately before the raid-planning maps. |
| `CR-046` | Implemented | Consolidate Game settings into three desktop cards, then order Keyboard & mouse, HUD, and Raid planning; restore the missing Intermission raid-plan heading before its map. |
| `CR-047` | Implemented | Standardize the setup-page hierarchy: add explicit Game settings and Keyboard settings sections, keep keyboard and mouse controls together beneath the latter, and remove spacing workarounds between topics. |
| `CR-048` | Implemented | Remove the Opening movement bonus option and make its existing 40% first-five-seconds positioning boost permanently active, ignoring and deleting the retired browser preference. |
| `CR-049` | Implemented | Restyle the setup jump menu as quiet inline “On this page” navigation, smoothly scroll between sections while respecting reduced-motion preferences, and add a compact Back to top link to each top-level setup section without adding links to phase subsections. |
| `CR-050` | Implemented | Position a Phase 3 crystal NPC beside each otherwise-uncovered ground Soak where possible, keeping the carrier outside the puddle while its yellow safe zone covers the players inside and preserving raid separation. |
| `CR-051` | Deferred | In the second Phase 3 sequence, swap the memory-game and ground-Soak ordering. Preserve the first sequence as currently timed and revisit the exact second-sequence overlap before implementation. |
| `CR-052` | Implemented | Increase the Phase 3 ground-Soak radius by 15% so nearby players can commit to the pool more reliably. |
| `CR-053` | Implemented | Increase the enlarged Phase 3 ground-Soak radius by another 10%, reduce its health by 15%, and preserve full crystal-light coverage from outside the pool. |
| `CR-054` | Implemented | Preserve the P2 orbs’ existing rotational direction as they transition into their inward return, and begin their glow telegraph one second earlier. |
| `CR-055` | Implemented | Speak the visible 3, 2, 1 countdown when TTS is enabled and a phase is entered directly; do not announce another countdown during seamless phase transitions. |
| `CR-056` | Implemented | Limit the Intermission `Dodge` and carrier `Drop crystal` TTS coaching calls to Easy mode; do not provide those two mechanic hints in Test, Normal, or Hard. |
| `CR-057` | Implemented | Announce `Phase 2`, `Phase 3`, and `Phase 4 stack` one second before their seamless transitions, independently from direct-entry countdown speech. |
| `CR-058` | Implemented | Follow the P2-to-P3 `Phase 3` transition announcement with a separate `Soak crystal` call for the opening landing mechanic. |
| `CR-059` | Implemented | Move the P3 `Memory game` and P2 personal-circle `Spread` TTS calls one second earlier so the spoken warning arrives before player movement is required. |
| `CR-060` | Implemented | Confirm completed P3 Soaks and memory games with state-driven TTS, and announce `Stack` three seconds before Dark Archangel begins. |
| `CR-061` | Implemented | Move the P3 `Move` TTS call one second earlier, from the start of sector movement to one second before Dark Archangel finishes. |
| `CR-062` | Implemented | Announce all three Phase 4 Starsplinter directions as `Left`, `Right`, `Left` one second before each visual telegraph, independently of the controlled player’s assigned splinter; announce `Move` one second before the final detonation. |
| `CR-063` | Implemented | Replace timing-critical Phase 4 browser-generated calls with pre-rendered `Left`, `Right`, `Left`, and `Move` clips scheduled on one audio clock, preserving the exact mechanic rhythm across game speed and pause/resume. |
| `CR-064` | Implemented | Add a compact disabled `P1 · Coming soon` phase teaser before Intermission without making the backlog encounter playable. |
| `CR-065` | Implemented | Exclude the workspace-local `.tmp/` Playwright browser cache from Git so Chromium may be installed beside the project without risking large generated binaries entering a commit. |
| `CR-066` | Implemented | Remove the partial-width border beneath each achievement-cluster header so it no longer duplicates the surrounding section divider. |
| `CR-067` | Implemented | On a first visit with empty browser storage and no shared hash, automatically fetch, normalize, apply, and persist the bundled I Asgard I plan with all twenty player profiles; explicit local and shared plans retain priority. |
| `CR-068` | Implemented | Present each newly earned achievement as a compact live card sliding down from the top with its icon, title, and flavor text, then fade the notification after five seconds without replaying stored achievements. |
| `CR-069` | Implemented | Give every visible NPC an independent one-to-three-second attack cadence and replace generic ambient bolts with recognizable class-themed firebolts, frostbolts, lightning arcs, arrows, spears, shadow bolts, nature bolts, and holy bolts. |
| `CR-070` | Implemented | Start each pre-rendered Phase 4 `Left`, `Right`, `Left` call exactly when its corresponding Starsplinter assignment appears now that the clips are sufficiently short; retain the separate one-second warning lead for `Move`. |
| `CR-071` | Implemented | Tune cosmetic attack motion by projectile family: arrows travel slowest, thrown weapons use an intermediate speed, and spell bolts travel fastest. Replace bomb-like bolt silhouettes with narrow luminous streaks and fan repeated attacks across varied approach angles so stacked Phase 4 casters no longer create one rigid stream. |
| `CR-072` | Implemented | Stop cosmetic attacks on the visible boss surface instead of sending them through its center, reuse pooled class-colored impact flashes for lightweight hit feedback, and show a larger, more opaque central L’ura model during Intermission and Phase 4. |
| `SPEC-001` | Implemented | Define the stable ticket lifecycle: assign an ID, record intent, add focused regression coverage, validate, and commit. |
| `SPEC-002` | Implemented | Define the creator business card’s stable content, readability, compact layout, and external-link behavior. |
| `SPEC-003` | Implemented | Define the P3-to-P4 north gather, shared knockup origin, and phase-local HUD boundary. |
| `SPEC-004` | Implemented | Define completion achievement inputs and the Superhuman Flawless requirements. |
| `SPEC-005` | Implemented | Define background audio as a feature-flagged component with no controls or playback while disabled. |
| `SPEC-006` | Implemented | Define Phase 4 movement parity and the 21-second Starsplinter/Heaven & Hell cadence. |
| `SPEC-007` | Implemented | Define the setup-page hierarchy and responsive grouping for game, input, HUD, sharing, and phase planning. Every top-level topic uses the same eyebrow, title, and helper-text pattern: Game settings / Practice configuration, Keyboard settings / Keyboard & mouse controls, Interface / HUD positions, Raid planning / Layouts and sharing, followed by an individually titled section for every phase map. The top setup menu links only to the four top-level topics and scrolls without replacing a shared raid-plan hash. |
| `SPEC-008` | Implemented | Define Phase 3 ground-Soak light coverage: crystal NPCs support from outside the puddle, coverage takes priority over ideal separation, and non-crystal players perform the Soak. |
| `SPEC-009` | Implemented | Define the independent Music, encounter Sounds, and TTS controls plus the phase-by-phase raid-lead and mechanic cue catalog before sound effects are sourced. See [`audio-cues.md`](audio-cues.md). |
| `SPEC-010` | Implemented | Replace repeatable difficulty/duty achievement variants with 20 meaningful canonical badges grouped into Foundations, Precision, Tools of the Trade, and Feats of Movement; allow related badges to unlock together, retain one future P1 teaser, and render at most two badge cards per row. |
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
| `BUG-021` | Implemented | Remove the invisible Phase 3 planner side-ownership clamp so players may be dragged across the visible divider while the divider and arena rings remain planning guides. |
| `BUG-022` | Implemented | Persist each phase crystal roster immediately so a configured Phase 3 carrier assignment survives reload/navigation before entering P3 directly. |
| `BUG-023` | Implemented | Let the phase crystal editor explanation use its available header width so its final word does not wrap alone on desktop. |
| `BUG-024` | Implemented | Hide the opposite ten-player half-raid and its crystal-light visuals during Phase 3 while continuing its off-screen simulation and restoring everyone for Phase 4. |
| `BUG-025` | Implemented | Give the three Phase 3 crystal carriers on each side distinct moving light anchors, then consume exactly one crystal per side after each resolved Dark Archangel. | [`screen-p3-bug23.png`](../images/screen-p3-bug23.png) |
| `BUG-026` | Implemented | Shorten the pause keybinding label to “(Un)pause” so it remains on one line in the keyboard grid. |
| `BUG-027` | Implemented | Determine Phase 3 side ownership, local carriers, lights, bosses, Soaks, Stars, runes, and movement from each raid-plan position relative to the divider instead of roster slots 1–10/11–20. |
| `BUG-028` | Implemented | Resolve every Phase 4 Starsplinter exactly once after its detonation threshold instead of relying on a skippable 0.3-second window, and align stack collisions with the visible group footprint at accelerated timing. |
| `BUG-029` | Implemented | Keep P3 NPC fallback movement anchored to the active raid plan and constrain actors plus their complete crystal-light footprints to their assigned side of the divider after landing. | [`screen-p3-bug-23.png`](../images/screen-p3-bug-23.png) |
| `BUG-030` | Implemented | Hold Intermission NPCs exactly on their loaded raid-plan anchors during positioning instead of adding idle roaming offsets before the mechanics begin. | [`screen-p1-bug01.png`](../images/screen-p1-bug01.png) |
| `BUG-031` | Implemented | Resolve a player’s P4 Starsplinter against the stack, front soaker, and both other active splinter players so hitting any player—not only the abstract stack center—wipes the attempt. |
| `BUG-032` | Implemented | Preserve interpolated actor movement after the initial P3 landing Soaks and fade the completed yellow indicators out over 250 ms instead of abruptly clearing and visually flashing the scene. |
| `BUG-033` | Implemented | Render active P3 crystal-carrier safe zones above the opaque blue Soaks so all three local carrier lights remain visible, and give NPCs a 50% opening approach-speed bonus. | [`screen-p3-bug24.png`](../images/screen-p3-bug24.png) |
| `BUG-034` | Implemented | Load, normalize, and persist shared hash plans before the first render so stale browser state cannot leak into the live Intermission snapshot. Intermission, both P2 maps, P3, P4’s shared roster, bosses, start slots, and per-phase crystals now receive the same loaded plan; mixed-roster P3 landing groups also follow the plan side instead of roster order. A browser regression enters all four phases from a stale-local/shared-hash scenario. |
| `BUG-035` | Implemented | Remove the misleading generic Discord destination entirely and restore a clearly labeled `Twitch.tv →` profile link. |
| `BUG-036` | Implemented | Clear and phase-gate the Phase 2 orb-return counter when Phase 3 begins, then anchor the P3-to-P4 player knockup to the same north stack used by the raid instead of the player’s leftover position. |
| `BUG-037` | Implemented | Keep the creator card inside its setup column at desktop and narrow widths, and enforce a 16-pixel minimum for every visible piece of card text. |
| `BUG-038` | Implemented | Keep all difficulty labels readable at narrow desktop widths and browser zoom by arranging Test, Easy, Normal, and Hard in a stable two-by-two grid without allowing the Game settings cards to overlap. |
| `BUG-039` | Implemented | Keep every Phase 4 NPC—including active Starsplinter players and the front soaker—inside the moving yellow protection zone, and keep collision positions aligned with their visible return to the stack. |
| `BUG-040` | Implemented | Keep a short Phase 4 pause/resume from being mistaken for a completed quarter when a queued clock render is slightly older than the previous frame. |
| `BUG-041` | Implemented | After the final Phase 2 orb return has resolved, replace the misleading next-beam countdown with a countdown toward the Phase 3 transition. |
| `BUG-042` | Implemented | During Phase 3 Soaks, let nearby assisting NPCs close the final gap into an active pool instead of holding spread spacing just outside it. Evidence: [`screen-p3-bug-25.png`](../images/screen-p3-bug-25.png). |
| `BUG-043` | Implemented | Initialize every Phase 3 ground Soak from the configured `P3_POOL_HEALTH` value instead of silently resetting all six pools to 100 HP at the start of an attempt. |
| `BUG-044` | Implemented | Ensure every P3 Stars orb has at least one visible closest-neighbour connection and key the rendered edge cache by the randomized Soak layout consumed by collision checks, preventing invisible-beam wipes. Evidence: [`screen-p3-bug26.png`](../images/screen-p3-bug26.png). |
| `BUG-045` | Implemented | Let both Phase 3 raid halves finish the final movement at the exact shared Phase 4 north stack instead of stopping at their former divider-side clearance. Evidence: [`screen-p3-bug27.png`](../images/screen-p3-bug27.png). |
| `BUG-046` | Implemented | During Intermission, wipe when the controlled player’s resolving Starsplinter hits an NPC who is currently carrying a crystal; an NPC whose crystal is visibly on the ground is not treated as still carrying it. |
| `BUG-047` | Implemented | Count entities whose bodies visibly overlap the Phase 3 ground-Soak rim as occupants in Test and all other modes, so a visually valid three-player Soak consistently drains its health. |
| `BUG-048` | Implemented | Preserve all Main-ability damage when Phase 4 starts, subtract that damage in addition to the scripted Heaven & Hell health loss without ever healing L’ura, grant +50 points for every 10% of player damage, and award a dedicated achievement when L’ura reaches 0% before the final sequence. |
| `BUG-049` | Implemented | Keep one Main Ability cast progressing visibly from 0–100% across live encounter event changes; only fire, damage, and score at completion, enforce a 0.1-second gap, and collapse repeated input into at most one queued cast. |
| `BUG-050` | Implemented | Guarantee that one Main Ability key press produces exactly one cast and one projectile: ignore additional input until its 1.0-second cast and 0.1-second recovery finish, and hide the cast bar during recovery instead of visually restarting it. |
| `BUG-051` | Implemented | Advance the one-second Main Ability cast from real elapsed frame time at the configured game speed instead of the physics loop’s 50-millisecond safety clamp, preventing slow or stuck casts on busy GitHub Actions runners while keeping movement and collision simulation capped. |
| `BUG-052` | Implemented | Replace the external I Asgard I TinyURL navigation with an in-app fetch of the bundled guild raid plan, then normalize, apply, and persist it without changing the current localhost or GitHub Pages location. |
| `BUG-053` | Implemented | Render the Main Ability as one uninterrupted compositor-driven 0–100% castbar that pauses with the game and cannot be visually reset by repeated input or busy encounter rerenders; damage, score, and the projectile still occur only at completion. |

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
- Opening knock-up, four 21-second quarters, moving yellow safe area, Heaven &
  Hell sector consumption, and an 88-second boss-health timeline.
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
- Git-revision build identification, a tracked GitHub changelog, and a
  five-minute deployed-version check with an explicit reload prompt.
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
  and Twitch contact details, optional Solana support link, and Pixabay music
  credits.

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

- `FR-022`: Player-controlled Phase 4 tank cone.
- `FR-023`: Random player/NPC ownership of the Phase 4 protection zone.
- `FR-026`: Laser, Starsplinter, and orb sound effects.
- `FR-027`: Optional API-backed highscores, achievements, and Battle.net login.
- Per-phase refills and certificate scoring for optional potion/shield
  challenges.
- Verifiable completion links. A trustworthy proof cannot be created with a
  secret embedded in a static GitHub Pages client; it would require a backend
  or external signing service.
