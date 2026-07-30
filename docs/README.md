# L'ura Trainer project record

This document is the durable feature and issue record for the trainer. It
summarizes what has been implemented, provides a home for the reference
screenshots, and defines the lightweight request convention used for future
work.

For a concise continuation guide, read the
[maintainer handoff](maintainer-handoff.md) before the historical ticket log.

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
| `FR-027` | Implemented | Add an optional API-backed leaderboard and achievement tracker. Anonymous play remains complete; Battle.net login imports verified characters and optional cached guild labels; privacy modes, logout, complete deletion, EU/US shared searchable boards, one-use character/version/configuration-bound attempts, server-recomputed scores, verified versioned achievements, rate limits, daily VPS-local SQLite backups, and trainer integration follow [`SPEC-011`](api-highscores.md). Off-VPS backup storage and replication are user-managed outside this project; Git-backed backup certificates, workflows, and artifacts are explicitly excluded by `CR-149`. |
| `FR-057` | Implemented | Rebalance the setup page around practice: keep game settings near the top, move player name into assignment identity, reduce Battle.net login prominence, show a scrollable Top 10 with localhost fixtures and current Normal/Hard standings beside achievements, place search below it, link to a full leaderboard view, and link public verified characters to Raider.IO. Covered by focused online UI/integration tests and the complete browser regression suite. Tracked from [`INBOX-20260729-105518-e5a50c`](../inbox/INBOX-20260729-105518-e5a50c.md). |
| `FR-060` | Implemented | Perform one explicitly authorized administrative backfill for Pestivator's completed 1536-point, 385.7-second Normal/crystal run from [`INBOX-20260729-185527-3c7431`](../inbox/INBOX-20260729-185527-3c7431.md) after `BUG-111` prevented issuance of its required server-side attempt. Publish only this documented run, award no unverifiable achievements, and do not add or relax any public submission path. Verified against the production current-version leaderboard. |
| `FR-061` | Implemented | Extend the privacy-aware front-page activity feed with “earned achievement” events containing the canonical achievement title and first-earned timestamp. Record only achievements first earned after deployment, with no historical backfill, and apply the account's current character, alias, or anonymous identity whenever the feed is read. Covered by migration/API first-earned-event regression, mixed activity UI regression, full client suite, and production build. |
| `FR-062` | Implemented | Add privacy-aware trainer player profiles opened from leaderboard and achievement rankings instead of linking player names directly to Raider.IO. Public profiles show achievements, Raider.IO identity, attempts, and wipes; anonymous accounts cannot be looked up. Default the compact standings to Hard/crystal with a red Hard treatment. Add a global ranking scored as canonical achievement points plus each player’s best accepted score from each of the four Normal/Hard × crystal/non-crystal boards, show its top three between Achievements and the compact account panel, and reduce that panel to login/logout, profile management, and global position. Covered by API aggregation/privacy regression, focused online UI tests, the full client suite, production build, and complete browser regression. |
| `FR-063` | Implemented | Give the setup-page Achievements, Global ranking, and Online ranking area more breathing room. Present the global top three as a dedicated horizontal podium row showing points, place, and name, and preserve empty podium slots until three public players exist. Tracked from [`INBOX-20260730-160819-f0ea81`](../inbox/INBOX-20260730-160819-f0ea81.md); covered by focused UI tests, production build, and complete browser regression. |
| `FR-064` | Implemented | Expand the personal Best runs summary to all four Normal/Hard × crystal/non-crystal board positions plus global position. Add four hidden, server-verified 50-point achievements for reaching rank one on each board—`First Light, Crystal in Hand`, `First Light, Hands Free`, `Midnight’s Crystal Crown`, and `Midnight’s Unburdened Crown`—plus the hidden 200-point Legendary `Four Boards, One Throne` achievement for holding rank one on all four. Tracked from [`INBOX-20260730-162241-133327`](../inbox/INBOX-20260730-162241-133327.md); covered by server board/tie-break regression, focused UI tests, the full client suite, and production build. |
| `FR-065` | Implemented | Add a persisted, optional HUD action strip below the player cast bar, disabled by default. Its Main ability, Interrupt, Shield, Health potion, and Crystal drop buttons invoke the same existing action handlers as their keyboard bindings and introduce no separate encounter logic. Covered by focused action/persistence regression, the full client suite, and production build. |
| `BUG-119` | Implemented | Clicking the setup-page achievement summary opens the controlled player's personal achievement collection in an overlay. Covered by focused interaction tests, the full client suite, and complete browser regression. |
| `BUG-120` | Implemented | Keep the setup-page Online ranking card inside the shared page boundary at desktop widths by removing hard combined grid minima and allowing all three overview cards to shrink and wrap safely. Tracked from [`INBOX-20260730-161736-7244bb`](../inbox/INBOX-20260730-161736-7244bb.md); covered by a viewport-specific browser boundary regression and production build. |
| `BUG-121` | Implemented | Populate the localhost Global Top 3 from representative local players, and omit the complete global-ranking line outside localhost when the API reports no ranked public profiles instead of rendering a large empty card. Tracked from [`INBOX-20260730-162320-dd1937`](../inbox/INBOX-20260730-162320-dd1937.md); covered by focused UI and localhost browser regressions. |
| `BUG-122` | Implemented | Prevent stale or malformed smaller-arena coordinates from spawning a player inside the Phase 1 void at countdown. Persisted/shared P1 assignments are validated against the legal annulus; legacy P2-like formations restore the maintained P1 formation, isolated illegal slots restore their maintained defaults, and the P1 planner refuses illegal points. Tracked from [`INBOX-20260730-163627-243417`](../inbox/INBOX-20260730-163627-243417.md); covered by normalization unit tests and a Hard-mode browser countdown regression using a deliberately corrupted saved plan. |
| `CR-164` | Implemented | Correct the explicitly authorized FR-060 administrative backfill from Normal/non-crystal to the user's confirmed Normal/crystal duty, without changing its score, duration, identity, or achievement state. Verified against both production current-version Normal duty leaderboards. |
| `CR-176` | Implemented | Add accepted full-run completions to the privacy-aware public activity stream alongside wipes and newly earned achievements, with representative localhost simulation. Covered by API completion-activity regression, mixed client feed regression, full API/client suites, and production build. |
| `CR-177` | Implemented | Add a single bottom-right live-activity notification across every trainer screen. Enable it by default, simulate it on localhost, and provide a persisted HUD setting to disable it. Initial feed loads remain silent and only unseen event IDs enter the sequential fade queue. Covered by new-event selection and persisted-setting regression, the full client suite, and production build. |
| `CR-178` | Implemented | Give the optional HUD action strip its own draggable HUD-layout anchor, defaulting below the cast bar and restoring with the other HUD positions. Covered by HUD migration/reset and in-arena placement regression, the full client suite, and production build. |
| `FR-028` | Implemented | Restore optional background music with only the two newly selected licensed tracks, default playback to off, and add a dedicated Audio settings row for Music, future encounter Sounds, and deferred TTS. |
| `FR-029` | Implemented | Implement opt-in browser TTS for the approved phase-aware raid-lead calls, suppress repeated/stale speech across render updates and pause states, and gracefully disable the option when speech synthesis is unavailable. |
| `FR-030` | Implemented behind localhost preview | Add the five-interrupt, crystal pickup, ricocheting glaive, ordered rune beam, rotating-beam/reactive-Soak encounter, and Intermission handoff before the existing encounter. Includes a dedicated persisted P1 raid plan, six crystal assignments, Numpad 2 interrupt binding, TTS calls, and focused regression coverage. Preserve the mechanic contract in [`p1-encounter.md`](p1-encounter.md). |
| `CR-103` | Implemented behind localhost preview | Give P1 its own wider 260-yard annular arena, visibly collapse it into the smaller Intermission room during handoff, and keep L’ura outside the middle bubble while she advances one quarter for the second demonstrated sequence. |
| `CR-104` | Superseded by CR-109 | Launch each P1 Heaven Glaive from the outside boss at three times configured player speed, ricochet it from both the outer wall and middle bubble, and retain it for 60 seconds without generating a new set during the rotating-beam mechanic. CR-109 replaces the earlier continuous deceleration with a first-impact speed change. |
| `CR-105` | Implemented behind localhost preview | Default P1 L’ura 30 degrees into the lower-left opening, make her opening marker draggable and shareable on the P1 raid plan, rotate her one quarter for sequence two, and align the nearest safely telegraphed rotating beam ten degrees from her sector. |
| `CR-106` | Implemented behind localhost preview | Split the six configured P1 crystal carriers into sequence-one slots 1–3 and sequence-two slots 4–6. When the player owns the active pickup, NPCs wait for that collection; the pull countdown names both Kick 1–5 and Crystal pickup 1/2 duty. |
| `CR-107` | Implemented behind localhost preview | Show P1 interrupt state in a dedicated 100×100 HUD tile beside the pickup area: red means wait, orange means next, and green marks the controlled player’s two-second interrupt window. |
| `CR-108` | Implemented behind localhost preview | Aim P1 player and NPC cosmetic attacks at the visible outside L’ura model rather than the arena center. |
| `CR-109` | Implemented behind localhost preview | Emit each five-glaive set as an evenly spaced star around L’ura. Glaives retain triple player speed until their first wall/bubble impact, then continue every ricochet at 110% configured player speed. |
| `CR-110` | Implemented behind localhost preview | Render roaming P1 Heaven Glaives as larger, flat luminous flying saucers rather than spherical orbs, and align their collision radius with the wider visible disc. |
| `CR-111` | Implemented behind localhost preview | Make P1 NPCs roam unpredictably during memory positioning before settling into the correct clockwise order. During the rotating beam they cross its safe telegraph, follow a rotating ray with sufficient movement speed, and lead L’ura from her current position toward the sequence’s configured tank spot (raid-plan positions 1 then 2). |
| `CR-112` | Implemented behind localhost preview | Keep the P1 raid active between assigned mechanics with deterministic cast-and-move waypoints around L’ura during interrupts, crystal pickups, Glaives, and reactive Soaks. Active crystal carriers still override roaming to collect their assigned crystal; memory and rotating beams retain their dedicated movement rules. Tracked from [`INBOX-20260727-200417-465bff`](../inbox/INBOX-20260727-200417-465bff.md). |
| `CR-113` | Implemented behind localhost preview | Enlarge P1 Heaven Glaive saucers by another 1.5×, match their lethal contact radius to the new visual, and add three visibly rotating surface markers. Tracked from [`INBOX-20260727-203730-cad7f4`](../inbox/INBOX-20260727-203730-cad7f4.md). |
| `CR-114` | Implemented behind localhost preview | End the lethal rotating-beam window after a 45-degree sweep, cap each tank-led L’ura relocation to a 45-degree arena arc, and keep the NPC raid in a compact formation that crosses during the ground telegraph and follows the moving boss until the beams disappear. Tracked from [`INBOX-20260727-203730-cad7f4`](../inbox/INBOX-20260727-203730-cad7f4.md). |
| `CR-115` | Implemented behind localhost preview | Show each P1 Heaven Glaive during its direction telegraph, spin it rapidly on launch, and increase both its initial and reflected movement by 1.5×. Tracked from [`INBOX-20260727-205141-490baf`](../inbox/INBOX-20260727-205141-490baf.md). |
| `CR-116` | Implemented behind localhost preview | Replace P1’s oversized orb placeholders with the established Intermission/Phase 2 ground-crystal visual. The broader crystal redesign remains deferred. Tracked from [`INBOX-20260727-205349-5a6ef1`](../inbox/INBOX-20260727-205349-5a6ef1.md). |
| `CR-117` | Implemented behind localhost preview | Separate the P1 Interrupts label from its cast count and anchor the 100×100 kick-state tile directly beneath that mechanic counter. |
| `CR-118` | Implemented behind localhost preview | Show the established carried-crystal marker on every collected P1 carrier without adding a protection/safe-zone ring. |
| `CR-119` | Implemented | Default vertical mouse-camera inversion to enabled on empty browser storage while retaining an existing user’s saved selection. |
| `CR-120` | Implemented behind localhost preview | Use one 35-yard Starsplinter-style beam for the P1 memory-game verification sweep. |
| `CR-121` | Implemented behind localhost preview | Keep marked P1 NPCs roaming through most of the memory positioning window and only converge them during the final 1.5 seconds, preventing the correct order from being revealed too early. |
| `CR-122` | Implemented behind localhost preview | Start the nearest P1 rotating beam five degrees to either side of L’ura instead of ten, leaving a reachable step-through into the follow movement without changing its randomized side. |
| `CR-123` | Implemented behind localhost preview | Render a crystal carrier’s two P1 reactive Soaks with the same 12-yard yellow disc, ring, occupancy color, and pulse treatment as the Phase 3 opening circles. Tracked from [`INBOX-20260727-211710-9c3ffd`](../inbox/INBOX-20260727-211710-9c3ffd.md). |
| `CR-124` | Implemented behind localhost preview | Keep all eight P1 center beams rotating clockwise in both sequences. During the safe telegraph, NPCs step across a beam close to L’ura and then follow its continuous rotation instead of crossing the room or resetting with the lethal visual. Tracked from [`INBOX-20260727-213144-84bd36`](../inbox/INBOX-20260727-213144-84bd36.md), [`INBOX-20260727-213826-fc558e`](../inbox/INBOX-20260727-213826-fc558e.md). |
| `CR-125` | Implemented behind localhost preview | Render P1’s memory verification as one Starsplinter-style sweep from L’ura instead of the former generic beam. Tracked from [`INBOX-20260727-213316-c0c91b`](../inbox/INBOX-20260727-213316-c0c91b.md). |
| `CR-126` | Implemented behind localhost preview | Let unassigned P1 NPCs detect an approaching Heaven Glaive lane and make a short deterministic sidestep where their current mechanic duty allows it. Tracked from [`INBOX-20260727-213714-dde419`](../inbox/INBOX-20260727-213714-dde419.md). |
| `CR-127` | Implemented behind localhost preview | During the P1 handoff, move L’ura smoothly from her final outside stop into the Intermission center rather than teleporting at the phase boundary. Tracked from [`INBOX-20260727-214015-ef8287`](../inbox/INBOX-20260727-214015-ef8287.md). |
| `CR-128` | Implemented behind localhost preview | Add the reviewed P1 player positions and L’ura marker to the bundled I Asgard I raid plan. Use those maintained values when an older saved/shared plan has no P1 data, while preserving explicit P1 assignments. |
| `CR-129` | Superseded in part by CR-130 | Extend the P1 memory sweep by five yards to 40 yards, darken its blue Starsplinter wedge, add a slim raised laser core, remove each rune as the sweep resolves it, and clamp roaming NPC targets inside the playable P1 arena. CR-130 increases its reach and width after visual review. Tracked from [`INBOX-20260727-214658-47c3b4`](../inbox/INBOX-20260727-214658-47c3b4.md). |
| `CR-130` | Implemented behind localhost preview | Make the P1 memory verification unmistakably read as a sweeping laser through the rune players: extend it to 55 yards, widen the layered Starsplinter blade by 2.35×, and strengthen its raised core without changing the single-beam rotation. Tracked from [`INBOX-20260727-221905-a3fe33`](../inbox/INBOX-20260727-221905-a3fe33.md). |
| `CR-131` | Implemented | Add a concise maintainer and coding-agent handoff covering release gates, mechanic intent, visual-authority rules, raid-plan precedence, audio boundaries, inbox/ticket workflow, WSL/CI validation, and currently open work. |
| `CR-132` | Implemented behind localhost preview | Resolve an incorrect P1 memory position immediately when the sweep reaches the controlled player’s rune instead of delaying the wipe until the full rotation. Color the failed rune red at contact so the reason remains visually explicit in the frozen wipe scene. This revises the delayed-verdict wording in the P1 encounter contract. Tracked from [`INBOX-20260728-062219-d3659c`](../inbox/INBOX-20260728-062219-d3659c.md). |
| `CR-133` | Implemented behind localhost preview | Expand P1 Heaven Glaive avoidance so NPCs try to sidestep approaching discs during compatible movement, including rotating-beam follow, while crystal pickup, rune resolution, and required beam crossing remain higher-priority duties. |
| `CR-134` | Implemented | Give the complete encounter floor a subtle readable texture with a low-contrast grid and deterministic crack variation, so movement across the room has visible ground reference without obscuring hazards or planner markings. |
| `CR-135` | Implemented | Doubled the density of deterministic floor cracks and strengthened the shared grid/crack contrast while retaining the reviewed style and hazard readability. |
| `CR-136` | Implemented behind localhost preview | Replaced the linear P1 memory-order strip with a centered five-cell positional panel below the cast area, using the original-game reference to make each numbered rune and the controlled player's yellow-outlined required slot easier to read. Tracked from [`INBOX-20260728-072617-f46ae0`](../inbox/INBOX-20260728-072617-f46ae0.md). |
| `CR-137` | Implemented behind localhost preview | Reflected P1 Heaven Glaives now gain a smooth distance-based speed multiplier from 1.0 near the inner ring to 1.22 near the outer wall, returning long room crossings to the raid sooner without an obvious acceleration jump. |
| `CR-138` | Implemented behind localhost preview | Moved the P1 memory and kick-order panels out of the central play view into the lower HUD reference area, corrected the default raid pentagram orientation (1 top-right, 5 top-left), and added a persisted game setting that switches between pentagram and the prior positional panel orientation. Tracked from [`INBOX-20260728-074952-709830`](../inbox/INBOX-20260728-074952-709830.md). |
| `CR-139` | Implemented | Added and documented the stable `npm run test:e2e:local` repository wrapper, which owns `PLAYWRIGHT_BROWSERS_PATH` and forwards arbitrary Playwright arguments so focused `--grep` expressions no longer change the recurring approval command shape. |
| `CR-140` | Implemented behind localhost preview | Slowed the P1 interrupt orbs and gave all three their own cones that rotate with them. NPCs interrupt deterministically between 0.5–1.0 seconds, removing their cast bar/cones immediately; the controlled player's green kick window lasts 1.7 seconds, followed by a 0.3-second lethal completion delay. |
| `CR-141` | Implemented | Model pickups by a player outside the active P1 crystal trio as recoverable responsibility transfers: log/penalize the pickup, let the player carry and drop it within five seconds, then have the assigned NPC recover the dropped crystal; failing to drop wipes for playing the wrong assignment. A sequence-two carrier touching sequence-one crystals receives only the mistake/point penalty and leaves NPC pickups unchanged. |
| `CR-142` | Implemented | Treat the three active P1 crystals as one interchangeable pickup trio for a player assigned to that sequence. Picking any crystal in the active trio satisfies the player's duty and is not a wrong-assignment penalty; only missing the player's assigned sequence remains a failure. |
| `CR-143` | Implemented | Make all active P1 ground crystals remain readable while visually distinguishing the player’s interchangeable pickup trio from NPC pickups with a brighter player-duty glow. |
| `CR-144` | Implemented | Release the reviewed Phase 1 encounter in production as v0.3.0, remove localhost-preview wording and host gating, and update release documentation after the final focused and full regression passes. This promotes the P1 work historically recorded as “Implemented behind localhost preview” into the production release. |
| `CR-145` | Implemented | Default new users to Phase 1 as the practice target, persist every explicitly selected practice phase in browser-local storage, and restore that last selection on later visits. |
| `CR-146` | Implemented | In Phase 4, NPC Starsplinters may hit other NPCs without wiping the raid. They remain lethal to the controlled player and floor adds, while the controlled player remains responsible for keeping their own Starsplinter clear of NPCs. |
| `CR-147` | Implemented | Delay the Phase 2 returning-orb sequence by one second so the crystal recovery window is reliably playable without changing the fixed thirty-second cross-beam cadence. |
| `CR-148` | Implemented | Move the persisted Phase 1 rune-panel orientation control from general difficulty/movement settings into the HUD settings section, where the panel it configures belongs. |
| `CR-149` | Implemented | Remove the encrypted API backup certificate and GitHub Actions artifact workflow from the repository. Keep the consistent rotating VPS-local SQLite backup timer; off-VPS storage and replication are user-managed outside this project. |
| `CR-150` | Implemented | Replace the setup page's long single scroll with accessible Practice, Raid plan, and Online tabs. Keep Practice as the default, expose Online in the top navigation, show the authenticated character in the compact header summary, make character autosave explicit, and rename profile actions by outcome. Shared raid-plan links open their relevant tab automatically. |
| `CR-151` | Implemented | Increase L’ura's pre-Phase-4 health budget by 5% so high-output groups cannot end Phase 3 before its second sequence. Keep encounter mechanics and sequence timing unchanged. |
| `CR-152` | Implemented | Separate signed-in character/profile management from the public leaderboard, explain what profile visibility settings and leaderboard rows do, clarify search/filter controls, and style the online controls consistently with the trainer. Tracked from [`INBOX-20260729-132547-7af25e`](../inbox/INBOX-20260729-132547-7af25e.md). |
| `CR-153` | Implemented | Restore one-active-section setup navigation with separate Game settings, Keyboard settings, HUD, Raid plan, Leaderboard, and Profile tabs. Default to Game settings, show its current difficulty/duty/position beneath Start, keep character selection there, and place a compact current-filter Top 10 below the game controls. Keep login and character controls in Profile only; give the leaderboard four prominent difficulty/duty categories, secondary search controls, and a separate signed-in position after the Top 10. Covered by focused online/setup component tests and browser layout regression coverage. |
| `CR-154` | Implemented | Simplify the public leaderboard hierarchy and provide a deterministic 100-player localhost preview for every category. Keep the primary view to ten rows, support the full/search views, and show a localhost test player at position 65 beneath the Top 10. Covered by focused online component tests, the production build, and browser layout regression coverage. Tracked from [`INBOX-20260729-135334-0d3524`](../inbox/INBOX-20260729-135334-0d3524.md). |
| `CR-155` | Implemented | Polish leaderboard/profile consistency, make each localhost category visibly distinct, repair the Profile privacy link, login alignment, and guild/privacy control layout, and style leaderboard search actions consistently. Exclude privacy-mode anonymous results from public rankings while retaining their stored attempts/results. In Game settings, show signed-in state, let players choose their raid-plan name, selected Battle.net character, or a custom practice name, and link directly to Profile. Add a quiet direct logout action to the top online summary. Covered by focused UI/API tests, the production build, and browser layout regression coverage. Tracked from [`INBOX-20260729-145929-313108`](../inbox/INBOX-20260729-145929-313108.md), [`INBOX-20260729-150029-a448df`](../inbox/INBOX-20260729-150029-a448df.md), [`INBOX-20260729-150057-3b38df`](../inbox/INBOX-20260729-150057-3b38df.md), [`INBOX-20260729-150345-4f2540`](../inbox/INBOX-20260729-150345-4f2540.md), [`INBOX-20260729-151527-16cc2a`](../inbox/INBOX-20260729-151527-16cc2a.md), and [`INBOX-20260729-151636-a793a1`](../inbox/INBOX-20260729-151636-a793a1.md). |
| `CR-156` | Implemented | During the Phase 4 safe-spot mechanic, being outside the safe area drains 30 health per second and deducts 10 points for every full unsafe second, using the existing damage/mistake/score contract without changing safe-spot geometry or timing. Covered by focused mechanic and app regression tests plus the production build. Tracked from [`INBOX-20260729-151750-6795a1`](../inbox/INBOX-20260729-151750-6795a1.md). |
| `CR-157` | Implemented | Add a separate localhost-only verified submission lab at `/dev/online-submit`. It requires a real logged-in session and selected character, exposes editable completion inputs, and uses the real issue/completion/Hall APIs so point submission can be tested without playing the encounter. The Vite serve-only plugin and production-build absence check ensure it cannot ship. |
| `CR-158` | Implemented | Give the Battle.net login action immediate visible progress feedback. After it is clicked, retain the redirect but replace the idle label with a spinner and “Redirecting to Battle.net…” so authentication does not appear unresponsive while navigation is pending. Covered by focused profile UI regression. |
| `CR-159` | Implemented | Remove the fixed 200-cast online telemetry ceiling. Accept every legitimate completed Main ability cast, validate it against the attempt’s simulated duration at no more than one cast per second, and retain a one-hour absolute boundary rather than truncating long runs and their points. Covered by client build and API acceptance/rejection regressions above and below the old ceiling. |
| `CR-160` | Implemented | Protect the shared P1-through-P3 L’ura health pool at 3% until Phase 3 sequence two begins after the first sector relocation. Continue counting casts, damage, and points behind the visibly labelled shield; then release the protection so an earned P3 early clear transitions from a reachable position. Keep Phase 4’s refreshed health pool and separate early-kill achievement unchanged. Covered by focused health/early-clear rules and app regressions. |
| `CR-161` | Implemented | Add a compact “What’s changed” disclosure to the new-version prompt with recent release entries and a link to the full changelog. Adopt automatic SemVer selection and changelog updates for releases, and flag achievement-rule changes before release so a new leaderboard season can be considered. Covered by the update-prompt regression and production build. |
| `CR-162` | Implemented | Hide the front-page wipe-feed section when it has no entries. Retain authenticated anonymous-profile wipes as anonymized activity without a character link; keep mutable raid-plan positions out of the permanent feed. Covered by API privacy/storage tests, front-page integration coverage, and the production build. |
| `CR-163` | Implemented | Repair the copied completion image layout shown in [`INBOX-20260729-185450-1391a7`](../inbox/INBOX-20260729-185450-1391a7.md): fit all five phase cards inside one safe-width row, wrap achievement and optional-challenge text, and enlarge the canvas so exported content no longer clips or overflows horizontally. Covered by focused completion-image layout regression and the production build. |
| `CR-165` | Implemented | Show the recorded wipe reason in each wipe activity-feed entry in addition to its phase and difficulty, preserving the existing privacy-aware identity treatment. Covered by mixed activity-feed integration regression and the full browser suite. |
| `CR-166` | Implemented | Allow a controlled crystal carrier to drop a carried crystal at any time that carrying is valid, including after a Phase 1 pickup; dropping starts the normal explosion countdown and the player may recollect it without the drop/recollection itself counting as a failure. Covered by focused pickup/drop rules, the full client suite, and the full browser suite. |
| `CR-167` | Implemented | Keep the small yellow carried-crystal glow indicator visible on controlled crystal carriers whenever they actually carry a crystal, including Phase 2, so pickup state remains readable while L’ura occupies the center and after circle spreads. Covered by focused carry-state rendering rules, the full client suite, and the full browser suite. |
| `CR-168` | Implemented | Only send the combat health bar into the red recovery zone while the player still has a potion or shield available. After both actions are spent, health pressure cycles through orange, yellow, and green. Downward changes now run at twice the recovery rate for more reactive damage, while a red target holds for two seconds after arrival. Covered by focused target-selection, rate, and hold-window regressions, the full client suite, production build, and full browser suite. |
| `CR-169` | Implemented | Extend each Phase 1 Heaven Glaive lifetime by ten seconds and keep surviving glaives active, visible, and lethal through the P1-to-Intermission handoff and early Intermission, even when they overlap later mechanics. Preserve existing seeded launch angles, trajectories, and speeds. Covered by focused simulation tests and a full browser regression that verifies the first set survives into the second sequence. |
| `CR-170` | Implemented | Establish the setup-page information order as game start first, then a dedicated full-width global Top 3 leaderboard line, then a three-card player row for personal achievements, best runs, and login/profile state. Detailed run standings remain in the Leaderboard tab instead of being embedded beneath Game settings. Covered by focused component tests, explicit browser DOM-order and desktop-boundary regressions, the full client suite, and production build. |
| `CR-171` | Implemented | Rebalance the player-summary row so the compact achievement count does not consume an equal third, while Best runs receives a readable two-level layout with its action in the header and four unabbreviated board labels beneath. Tracked from [`INBOX-20260730-163100-60217e`](../inbox/INBOX-20260730-163100-60217e.md); covered by a browser width/readability regression, focused UI tests, full client suite, and production build. |
| `CR-172` | Implemented | Polish the ranking hierarchy around a shared alignment grid: Global is the default dedicated Leaderboard view beside Runs and Achievement Hall; it shows Top 10 plus the signed-in player's own position, while four board selectors appear only inside Runs. Gold/silver/bronze trophies identify the top banner without repeated numeric positions, crystal-flawless and Hard-clear credentials decorate global rows, controls share visual anchors, and the compact achievement label stacks safely inside its border. Tracked from [`INBOX-20260730-164018-673992`](../inbox/INBOX-20260730-164018-673992.md) and [`INBOX-20260730-164827-1dfd75`](../inbox/INBOX-20260730-164827-1dfd75.md); covered by API credential regression, focused UI tests, browser layout/navigation checks, and production build. |
| `CR-173` | Implemented | Make Global use the same Top 10, ellipsis, own-position, and public-player search structure as the run boards. Remove the premature full-leaderboard actions from the ranking views; paging can be added later. Tracked from [`INBOX-20260730-165138-7fd0d1`](../inbox/INBOX-20260730-165138-7fd0d1.md); covered by API search, focused component, and full browser regressions. |
| `CR-174` | Implemented | Simplify Achievement Hall rows to position, linked player name and optional guild, lifetime points, and earned date. Keep the profile link as the route to the player's exact achievement list instead of repeating one achievement title in every row. Tracked from [`INBOX-20260730-165333-dec775`](../inbox/INBOX-20260730-165333-dec775.md); covered by focused component and full browser regressions. |
| `CR-175` | Implemented | Move the setup shell slightly higher to recover vertical space while retaining comfortable separation from the viewport edge. Tracked from [`INBOX-20260730-165538-3d8cea`](../inbox/INBOX-20260730-165538-3d8cea.md); covered by production build and full desktop/mobile browser layout regressions. |
| `CR-168` | Implemented | Treat the front-page activity box as a live-play signal: display only wipes and achievements from the last ten minutes and hide the entire box when no activity is that recent, without deleting permanent activity records. Covered by exact ten-minute boundary rules, mixed activity integration regression, and the production build. |
| `BUG-111` | Implemented | Production could not issue online attempts after the v0.4.x release because the VPS environment still overrode the deployed API's current trainer version with `0.3.0`. Removed the stale deployment pin, made release compatibility code-owned, exposed the running version in health checks, and made deployment verification fail when the API and frontend release versions differ. Covered by API configuration/health regression and the production build. |
| `BUG-112` | Implemented | Record authenticated Normal/Hard wipes regardless of profile visibility, then let the API render them using current character, alias, or anonymous privacy. Removed the public-character-only client gate and backfilled Pestivator's explicitly confirmed Phase 4 wipe from [`INBOX-20260729-185527-3c7431`](../inbox/INBOX-20260729-185527-3c7431.md). Covered by anonymous-profile client eligibility, API privacy, full client suite, and production verification. |
| `BUG-113` | Implemented | Prevent a full-pull Normal attempt from reporting “Entered the void zone” during Phase 2 or the Phase 2-to-Phase 3 transition when the player remains in the valid encounter arena. The legacy annulus check is now explicitly limited to live Intermission beam/Splinter mechanics; Phase 2 and transition states retain their own arena contracts. Covered by focused event-boundary regression and the full browser suite. |
| `BUG-114` | Implemented | During the Phase 1-to-Intermission handoff, suppress controlled-player and NPC cosmetic Main-ability projectiles until centered Intermission L’ura is authoritative; subsequent Intermission attacks target the current center boss without changing damage, scoring, or encounter timing. Covered by projectile-event regression and the full browser suite. |
| `BUG-115` | Implemented | Releasing trainer v0.5.0 without starting a new leaderboard season made the UI's `version=current` query exclude valid v0.4.2 results, leaving all four run leaderboards empty even though Pestivator's documented Normal/crystal result remains stored. Leaderboard continuity is now controlled by an explicit server-side season identifier, independent of trainer SemVer; existing and new compatible results remain in `season-1`, while exact historical-version queries remain available. A fresh board now requires an intentional season identifier change. Covered by cross-version current-season API regression and production verification. |
| `BUG-116` | Implemented | A crystal carrier playing Intermission position 12 could visibly walk across the sixth-pack dropped crystal without recovering it, and the maintained assignments were not all reachable during positioning at default movement speed when routing legally around the middle void. Pickup now resolves against the player’s continuous movement path while preserving the one-second unlock and three-yard radius. Both direct Intermission positioning and the P1 handoff last 24 seconds: the minimum whole-second window covering the 457.9-yard worst maintained route with only 0.56 seconds of margin. Covered by focused position-12 pickup and legal-route regressions, the full client suite, production build, and full browser suite. |
| `BUG-117` | Implemented | A zero-mistake full clear with no newly unlocked achievement showed the generic `L’URA CONQUERED` result title. Flawless full clears now show `L’URA CONQUERED FLAWLESSLY` on the result screen and generated share image, with image text scaled to remain inside the card. Tracked from [`INBOX-20260730-153958-c1c7f0`](../inbox/INBOX-20260730-153958-c1c7f0.md) and covered by focused title regression, the full client suite, production build, and full browser suite. |
| `BUG-118` | Implemented | Normal/Hard wipes from non-logged-in players now reach the live activity feed, and authenticated accounts using anonymous visibility are published there generically. Identity-free wipe activity is rate-limited and exposes only `Anonymous`, without a profile, character, realm, guild, or account identifier. Covered by client eligibility/recording tests and API privacy regression. |
| `FR-058` | Implemented | Add an account-wide Achievement Hall of Fame with canonical 10/25/50/100/200-point tiers, lifetime totals, each player’s highest-value achievement and first-earned time, Top 10/full/search views, and the signed-in player’s position below the public rows. Anonymous profiles remain stored but unpublished; retired feats retain points; season metadata is stored without exposing a season filter yet. Test/Easy attempts can earn verified achievements but remain excluded from run rankings. |
| `FR-059` | Implemented | Record authenticated public-profile wipes through the API and show a permanent timestamped activity feed on the front page, refreshed every five seconds. Each player links to Raider.IO; switching away from public-character identity or deleting the account removes its wipe-feed entries. Covered by API privacy/storage tests, front-page integration coverage, and the production build. |
| `FR-031` | Implemented | Add an isolated local voice soundboard with five CMU Flite voices, individual Left/Right/Move auditions, exact clocked rhythm previews, a preferred-voice choice, local notes, reproducible generation, and license guidance. |
| `FR-032` | Implemented | Prepare a standalone tested P1 rules module for later integration without changing the live game: interrupts, crystals, reflective expiring glaives, ordered runes, rotating beams, reactive Soaks, and the Intermission transition. |
| `FR-033` | Implemented | Add a persistent browser-local achievement collection beneath raid planning with immutable first-earned timestamps, run history for cross-duty feats, and a compact top-page badge summary linking to the full catalogue. |
| `FR-034` | Implemented | Expand the local audio soundboard with spell-effect candidates, mechanic suggestions, a persistent SFX shortlist, and a copyable review export; keep audition choices disconnected from gameplay until explicitly selected. |
| `FR-035` | Implemented | Replace the soundboard shortlist flow with a persistent event-by-event review table containing all 20 planned cues, four playable candidates per cue, one selected choice, one reviewer comment, old-shortlist migration, and a single copyable Markdown feedback export. |
| `FR-036` | Implemented | Add a second soundboard audition pass with three deterministic dark-arcane variants for each of 14 approved sound cues, align long and short effects to their actual mechanic windows, display clip durations, and mark the six rejected cue types intentionally silent. |
| `FR-037` | Implemented | Detect localhost and loopback runtimes so unfinished Phase 1 and encounter-sound work can be exposed for local development without enabling those gates on GitHub Pages. The sound-channel preference is locally testable and persisted; the P1 gate is ready for the `FR-030` renderer integration. |
| `FR-038` | Backlog after v0.2.0 | Add a localhost-only admin mode activated by playing as `Gnomkaiser`; wipe triggers are ignored, unlogged, and do not reduce points so completion and achievement paths can be tested. |
| `FR-039` | Backlog after v0.2.0 | In the live build, playing as `Gnomkaiser` adds a crown to the controlled player, renders the full raid at 50% scale, and unlocks a hidden achievement whose criteria remain concealed in the catalogue. |
| `FR-040` | Implemented | Add a compact clipboard action to the achievement collection that renders the full earned/locked ledger as a branded shareable PNG, copies it to the system clipboard when supported, and downloads it as a fallback. |
| `FR-041` | Implemented | Add a localhost sound timing lab to the existing soundboard with looping mechanic visuals, an exact event-boundary flash, adjustable and persisted sound-start offset and playback rate, measured reset values, and one-click Markdown export for the complete calibration table. |
| `FR-042` | Implemented | Profile and optimize renderer and simulation hot paths without changing encounter mechanics, timings, collision rules, or visual meaning. Stable transient P3/P4 geometry is reused across frames while genuinely animated geometry remains dynamic. |
| `FR-043` | Implemented | Add a localhost-only feedback inbox at `/inbox`: paste a clipboard screenshot or drag/drop/select an image, add a short note, and save both under `inbox/` with one stable reference ID while the normal Vite demo is running. |
| `FR-044` | Implemented | Make health potion and shield permanently available with one charge each per phase; continuously vary player health with occasional held low-health windows, color the health bar green/orange/red at the specified thresholds, refill both charges at phase transitions, award recovery achievements for first use and every-phase success, and penalize a missed phase recovery only on Hard. |
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
| `CR-072` | Superseded by CR-075/076 | Initially stopped cosmetic attacks directly on the visible boss surface and added pooled class-colored impact flashes plus a larger central L’ura model. The visible stopping behavior was replaced by natural opaque-model occlusion. |
| `CR-073` | Implemented | Stretch the Intermission/P2 Magical Whoosh beam cue to twice its source duration, start it late enough to finish exactly when the beam resolves, scale playback with global game speed, and remove the duplicate beam-fire playback while its fit is evaluated. |
| `CR-074` | Implemented | Delay the Phase 2 returning-orb sound by one second after inward movement begins so the cue aligns more closely with the orbs landing in L’ura. |
| `CR-075` | Implemented | Make the P2/P3 and enlarged Intermission/P4 boss models opaque with depth writing, send attacks slightly inside the boss so the model naturally occludes them, remove the falling arc from magical bolts and lightning, retain a small physical arc for arrows/spears, and shorten the pooled impact flash. |
| `CR-076` | Implemented | Aim cosmetic attacks at varied boss-torso heights instead of the boss’s feet, preserving readable fanned impacts when the raid is stacked. |
| `CR-077` | Implemented | Remove the P3 Soak-complete sound because its delayed transient does not fit the mechanic; preserve visual progress and TTS completion feedback, and keep Rune Clear only for actual rune matches. |
| `CR-078` | Implemented | Replace the P3 Stars connection’s long Arc Burn with a quieter Rift laser discharge accelerated to roughly 0.28 seconds, producing a short buzz exactly when the lattice beams appear. |
| `CR-079` | Implemented | Delay the five-second Dark Archangel charge sound until one second into its six-second cast so the cue finishes at the impact instead of fading before the missing pop. |
| `CR-080` | Superseded by CR-081 | Initially moved the shared Intermission and Phase 4 Starsplinter detonation sound 0.1 seconds before ray disappearance; waveform analysis showed that lead was too large. |
| `CR-081` | Implemented | Measure the Starsplinter waveform and align its main attack with ray disappearance: the source begins immediately and reaches full level about 0.02 seconds into 2× playback, so use a 0.02-second visual lead instead of 0.1 seconds and align Intermission to its actual three-second visual end. |
| `CR-082` | Implemented | Explain each mechanic’s visual boundary in the sound timing lab and expose the complete generated SFX library in every timing selector, with the cue-specific recommendations grouped first. |
| `CR-083` | Implemented | When player damage reduces L’ura to 0% during Phase 3, end the remaining mechanics and send the raid through the existing north regroup into Phase 4; award “The Stars Can Wait” for doing so. |
| `CR-084` | Implemented | Replace the pre-Phase-4 boss-health instruction with the atmospheric line “The veil shudders with every step.” |
| `CR-085` | Implemented | Keep “The Stars Can Wait” focused on reducing L’ura to 0% during Phase 3; remove north-regroup and Phase 4 tactical directions from the achievement and legacy certificate text. |
| `CR-086` | Implemented | Add an accessible in-arena Raidlead mute button that immediately toggles the separately persisted TTS preference without affecting music or encounter sounds. |
| `CR-087` | Implemented | Make the displayed version/build identifier copyable while keeping GitHub as a direct repository link and adding separate Changelog and File an issue links to the project’s tracked pages. |
| `CR-088` | Implemented | Keep the Phase 3 rune partner from evading contact in every difficulty; assisted modes approach after their reaction delay, while Hard waits in place for the player. |
| `CR-089` | Implemented | Keep health under steady combat pressure while making critical potion/shield recovery windows occasional instead of repeatedly returning to full health. |
| `CR-090` | Implemented | Apply the approved soundboard timing review to encounter audio: persist all ten selected clips and playback rates, and align beam, Stars, Starsplinter, orb-return, personal-circle, rune, Archangel, protection, mistake, and wipe cues to their calibrated visual boundaries. |
| `CR-091` | Implemented | Apply the second soundboard timing pass, including exact-boundary boss beams, a 95ms-early Stars pop, a post-impact Archangel pulse, and the revised protection playback rate. Preserve boundary sounds across encounter event transitions. |
| `CR-092` | Implemented | Prevent Intermission and P2 beam/Starsplinter sounds from feeling swapped across consecutive mechanics: start each selected clip by its effective playback duration so it ends at the visual resolution and does not carry into the following spell. |
| `CR-093` | Implemented | Reduce the live encounter mix to the reviewed error/wipe, orb-return, and Starsplinter cues. Keep all other candidates in the local soundboard for further tuning without playing them during encounters. |
| `CR-094` | Implemented | Extend the soundboard timing lab’s playback-rate slider and exact number input from 3× to 8× while retaining 0.01× precision for very short impact tuning. |
| `CR-095` | Implemented | Sort cue recommendations, review candidates, and the complete soundboard timing library from shortest to longest clip, placing candidates without measured durations last. |
| `CR-096` | Implemented | Add a soundboard action that copies only the currently active cue’s sound, offset, and playback rate while retaining the separate full-board export. |
| `CR-097` | Implemented | Move the reviewed Starsplinter sound another 20ms earlier and play the selected 7× Error Pulse once when the player’s completed Main ability cast fires its projectile. |
| `CR-098` | Implemented | Add independent bass-boost and treble-reduction controls to the visual soundboard without changing cue timing, and apply the initial 6dB/5dB deeper mix only to the live Starsplinter sound. |
| `CR-099` | Implemented | Remove every live encounter, mistake, and wipe sound except the Main ability release; preserve the deferred candidates and timing work in the local soundboard. |
| `CR-100` | Implemented | Move the Phase 4 “Move” raidlead call one second later so it plays exactly when the final Starsplinter finishes; preserve the existing Left / Right / Left timing. |
| `CR-101` | Implemented | Present only achievements newly unlocked by the current attempt in the completion summary, copied text, and share image. Previously stored achievements remain visible in the permanent achievement collection but are not celebrated again as new. |
| `CR-102` | Implemented | Release v0.2.0 as the stable pre-P1 trainer: publish the reviewed Main ability sound in production while keeping it opt-in, preserve unfinished Phase 1 behind localhost, finalize release notes and version metadata, and tag the validated release. |
| `FR-045` | Implemented | Add Main ability release to the soundboard review and visual timing lab with a one-second filling cast bar, projectile-release boundary, complete effect library, and initial cast candidates; keep it out of production until reviewed. The current trial is Error Pulse at −10ms and 7×. |
| `FR-046` | Implemented | Add persistent long-term achievement counters without overcrowding the ledger: **The Impossible** for five consecutive flawless full runs on Normal, **Beyond the Impossible** for five on Hard, plus 10/50/100 total phase-clear milestones ending in **Can’t Get Enough**. A failed full run resets only the matching difficulty streak; direct phase practice adds phase clears but neither advances nor resets streaks. Full-run streak tracking currently begins with Intermission and will move to P1 when P1 becomes the encounter entry. |
| `FR-047` | Implemented | Add the Phase 3 lasso-select-and-place interaction to the Intermission, P1, P2 Soak, and P2 spread raid plans so every player layout supports moving a selected group while retaining individual player and boss/start-marker dragging. |
| `FR-048` | Backlog | At P3 entry, make the knockback drop the trio’s crystal. Its assigned crystal NPC/player must recover it and provide one yellow safe-zone Soak; the second NPC commits to that same Soak while the controlled player resolves the other. |
| `FR-049` | Backlog | End P2 by returning all entities to their configured personal-circle positions, then launch each one outward from that individual circle into P3 while keeping every landing inside the arena. |
| `FR-050` | Backlog | Rework each P2 cross-beam set around four randomly selected non-crystal players. Assign each beam to intercept one continuously counterclockwise-orbiting orb near—not exactly on—the four cross-mark regions; never slow or pause the orbit. NPC assignees aim perfectly. If the controlled player is selected, their beam may naturally hit them while aiming, but missing the assigned orb is a wipe. Crystal carriers are never eligible. |
| `FR-051` | Backlog | Remove avoidable Node and test-runner warnings when they pollute developer or agent output, beginning with the conflicting `NO_COLOR` and `FORCE_COLOR` environment configuration reported by Playwright. Preserve useful diagnostics rather than hiding actionable warnings globally. |
| `FR-052` | Implemented | When an attempt ends in a real terminal wipe, lay the controlled player and the complete NPC raid on the ground as a visibly defeated, scattered group. Test-mode “would wipe” mistakes do not trigger the defeated pose. |
| `FR-053` | Implemented behind localhost preview | Each P1 interrupt cast now synchronizes casts 1–5 with three fast orbs orbiting L’ura, a charging dangerous frontal cone, a two-second boss cast bar, NPC/player interruption feedback, and immediate lethal resolution when the controlled player misses their assigned kick. |
| `FR-054` | Implemented behind localhost preview | Keep the three P1 cast orbs visible through all five interrupts, removing only each cast's cones/bar on interruption, then animate the persistent orbs down into the three ground crystals used by the active pickup sequence. |
| `FR-055` | Implemented | Add a persistent Raidlead voice selector and preview to the TTS settings, list only English speech voices installed in the current browser and operating system, and prefer Google US English by default when available. |
| `FR-056` | Implemented | Add an original, high-contrast favicon for the trainer that remains recognizable at browser-tab size. |
| `SPEC-001` | Implemented | Define the stable ticket lifecycle: assign an ID, record intent, add focused regression coverage, validate, and commit. |
| `SPEC-002` | Implemented | Define the creator business card’s stable content, readability, compact layout, and external-link behavior. |
| `SPEC-003` | Implemented | Define the P3-to-P4 north gather, shared knockup origin, and phase-local HUD boundary. |
| `SPEC-004` | Implemented | Define completion achievement inputs and the Superhuman Flawless requirements. |
| `SPEC-005` | Implemented | Define background audio as a feature-flagged component with no controls or playback while disabled. |
| `SPEC-006` | Implemented | Define Phase 4 movement parity and the 21-second Starsplinter/Heaven & Hell cadence. |
| `SPEC-007` | Implemented | Define the setup-page hierarchy and responsive grouping for game, input, HUD, sharing, and phase planning. Every top-level topic uses the same eyebrow, title, and helper-text pattern: Game settings / Practice configuration, Keyboard settings / Keyboard & mouse controls, Interface / HUD positions, Raid planning / Layouts and sharing, followed by an individually titled section for every phase map. The top setup menu links only to the four top-level topics and scrolls without replacing a shared raid-plan hash. |
| `SPEC-008` | Implemented | Define Phase 3 ground-Soak light coverage: crystal NPCs support from outside the puddle, coverage takes priority over ideal separation, and non-crystal players perform the Soak. |
| `SPEC-009` | Implemented | Define the independent Music, encounter Sounds, and TTS controls plus the phase-by-phase raid-lead and mechanic cue catalog before sound effects are sourced. See [`audio-cues.md`](audio-cues.md). |
| `SPEC-010` | Implemented | Replace repeatable difficulty/duty achievement variants with meaningful canonical badges grouped into Foundations, Precision, Tools of the Trade, and Feats of Movement; allow related badges to unlock together, retain one future P1 teaser, and render at most two badge cards per row. |
| `SPEC-011` | Implemented | Define the optional `api.asgard.website` Battle.net-authenticated highscore and achievement service, including server-issued attempts, verified character selection, privacy/deletion, SQLite storage and backups, versioned leaderboards, VPS deployment, and deferred guild tracking. See [`api-highscores.md`](api-highscores.md). |
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
| `BUG-048` | Superseded by BUG-055 | Initially preserved all Main-ability damage when Phase 4 started and subtracted it from the scripted health pool. Phase 4 now intentionally begins as a fresh full-health encounter while its own damage tiers remain scoreable. |
| `BUG-049` | Implemented | Keep one Main Ability cast progressing visibly from 0–100% across live encounter event changes; only fire, damage, and score at completion, enforce a 0.1-second gap, and collapse repeated input into at most one queued cast. |
| `BUG-050` | Implemented | Guarantee that one Main Ability key press produces exactly one cast and one projectile: ignore additional input until its 1.0-second cast and 0.1-second recovery finish, and hide the cast bar during recovery instead of visually restarting it. |
| `BUG-051` | Implemented | Advance the one-second Main Ability cast from real elapsed frame time at the configured game speed instead of the physics loop’s 50-millisecond safety clamp, preventing slow or stuck casts on busy GitHub Actions runners while keeping movement and collision simulation capped. |
| `BUG-052` | Implemented | Replace the external I Asgard I TinyURL navigation with an in-app fetch of the bundled guild raid plan, then normalize, apply, and persist it without changing the current localhost or GitHub Pages location. |
| `BUG-053` | Implemented | Render the Main Ability as one uninterrupted compositor-driven 0–100% castbar that pauses with the game and cannot be visually reset by repeated input or busy encounter rerenders; damage, score, and the projectile still occur only at completion. |
| `BUG-054` | Implemented | Remove the misleading Phase 4 add-destroyed sound and its render counter: clustered tank and Starsplinter removals can be coalesced into a delayed cue, while the adds visually disappear rather than producing a readable impact. |
| `BUG-055` | Implemented | Always reset L’ura to 100% health and clear accumulated player damage at the P3-to-P4 boundary, so defeating her image before Phase 4 can never skip the final phase. |
| `BUG-056` | Implemented | Preserve the active resolved-orb set through both Phase 2 sequences and render all four glowing orbs throughout their inward return window, matching the second-sequence `Dodge` warning. |
| `BUG-057` | Superseded in part by BUG-059 | Give every resolved Phase 2 orb set a new stable random seed, with independent angular offsets, speeds, and rotational travel; only the beam resolution starts their shared return clock. BUG-059 standardizes the travel direction. |
| `BUG-058` | Implemented | Clamp pre-Phase-4 boss health to the full 0–100% range and explicitly hold it at 0% when the Phase 3 damage clear begins, restoring 100% only at the Phase 4 boundary. |
| `BUG-059` | Implemented | Keep all Phase 2 orbs rotating continuously counterclockwise with no direction reversal when struck orbs become yellow and enter the glowing return telegraph. |
| `BUG-060` | Implemented | Make the renderer-heavy late-arena CI shard reliable on GitHub’s free software-rendered runners: test the second P4 Splinter cycle directly instead of coupling it to the remaining full phase playback, retain pure-rule coverage for the complete 88-second lifecycle, and retry only this heavy shard once for transient runner stalls. |
| `BUG-061` | Implemented | Model Phase 2 as one continuous twelve-orb roster: each beam converts exactly its four existing purple targets to yellow, those same indexed orbs keep orbiting counterclockwise during the return timer, then all four travel inward. The next beam handles the next four, with no duplicate sets, randomized replacement lanes, or purple/yellow overlap. |
| `BUG-062` | Implemented | Resolve incoming Phase 4 NPC Starsplinters from the NPCs’ actual rendered/interpolated positions instead of their ideal scripted destinations, keeping lethal collision rays aligned with the visible beams. |
| `BUG-063` | Implemented | Restore the Phase 4 “Left, Right, Left, Move” raidlead through preloaded browser media elements on exact timers—the same proven playback route as the Main ability—and fall back to browser speech if a clip is rejected. Browser regression coverage verifies all four files play in order. |
| `BUG-064` | Implemented | Resolve the player’s Phase 4 Starsplinter exclusively against the renderer’s current positions for all 19 NPCs—without reconstructing or falling back to scripted locations—including an NPC visibly behind the player during the first Splinter of the second quarter. |
| `BUG-065` | Implemented | Make every Intermission/P1 Starsplinter collision consume the renderer’s current 19-NPC position snapshot for player hits, NPC beam origins, and crystal-carrier hits. Share one six-beam geometry rule between rendering and collision instead of recomputing where NPCs should be. |
| `BUG-066` | Implemented | Resolve every Phase 4 Starsplinter in the exact frame that renders its six beams. NPC casts check the controlled player and every other rendered NPC while excluding only the caster, so a beam cutting through the raid cannot pass silently. |
| `BUG-067` | Implemented | Give the prerecorded P4 Left/Right/Left/Move browser regression the shared mechanic timeout, covering the intentionally later Move cue on slower GitHub software-rendering runners. |
| `BUG-068` | Implemented | Preserve each P4 Starsplinter’s last rendered raid snapshot through detonation and replace the 1.8-second soft-wipe lock with same-frame deduplication. Splinters resolving 1.1 seconds apart can now each detect and report player/NPC hits instead of silently suppressing the following cast. |
| `BUG-069` | Implemented | Keep the third marked P4 Starsplinter NPC stacked until the first Starsplinter detonates. Its mark and explosion retain the original global timing, leaving a shorter but sufficient movement window and preventing it from blocking the first player’s escape beam. |
| `BUG-070` | Implemented | Keep P4’s second marked NPC stacked until the first Starsplinter has visibly detonated, then accelerate its short move into the right-side position without changing its own explosion timer. The same post-detonation guard remains on the third marked NPC from BUG-069; tracked from [`INBOX-20260727-150659-22eff2`](../inbox/INBOX-20260727-150659-22eff2.md). |
| `BUG-071` | Implemented | Make the visible P4 front-tank cone authoritative: every add intersecting its 30-yard, 90-degree area is permanently destroyed on any active frame. Rendering and gameplay now share the same collision rule instead of separately hiding selected group-targeted adds; tracked from [`INBOX-20260727-151636-f9f0f2`](../inbox/INBOX-20260727-151636-f9f0f2.md). |
| `BUG-072` | Implemented behind localhost preview | Remove the invisible inner-annulus projection from P1 and Intermission player assignments. Their visual planner rings no longer prevent placing or persisting a marker in the middle area. |
| `BUG-073` | Implemented behind localhost preview | Anchor the P1 memory sweep and first displayed rune to the ray pointing outward from L’ura. Place the remaining four runes clockwise from that ray so the rendered positions match the order checked by gameplay; tracked from [`INBOX-20260727-183629-019e73`](../inbox/INBOX-20260727-183629-019e73.md). |
| `BUG-074` | Implemented behind localhost preview | Keep one uninterrupted P1 beam rotation clock across its two-second safe telegraph and lethal activation. Render only a low ground guide while safe, then replace it with the full laser without resetting its angle; gameplay collision and NPC following consume the same continuous time. |
| `BUG-075` | Implemented behind localhost preview | Use the configured P1 boss marker as the shared origin for rendered rune slots, the visible sweep, and gameplay validation; resolve correct and incorrect rune order after the sweep so neither false wipes nor missed wrong-order wipes can result from two different boss locations. Tracked from [`INBOX-20260727-205141-490baf`](../inbox/INBOX-20260727-205141-490baf.md). |
| `BUG-076` | Implemented behind localhost preview | Drive the visible P1 boss and NPC beam-follow movement from the configured opening and guarantee one 45-degree relocation even when the tank target shares the opening angle. Tracked from [`INBOX-20260727-205459-ee34c7`](../inbox/INBOX-20260727-205459-ee34c7.md). |
| `BUG-077` | Implemented behind localhost preview | Treat a Heaven Glaive collision as contact entry rather than a once-per-run flag: continuous overlap stays deduplicated, but exiting and re-entering the same roaming disc triggers another wipe. |
| `BUG-078` | Implemented behind localhost preview | Check the full angle swept by every lethal P1 rotating beam between simulation frames. A beam that catches a player following behind it now reliably registers the hit even when its narrow visual ray moved across the player between frame samples. |
| `BUG-079` | Implemented behind localhost preview | Branch a P1 rotating-beam hit by actual collected-crystal ownership: a non-carrier receives only a point penalty and remains in the beam sequence, while a carrier starts the two reactive Soaks. Tracked from [`INBOX-20260727-211710-9c3ffd`](../inbox/INBOX-20260727-211710-9c3ffd.md). |
| `BUG-080` | Implemented behind localhost preview | Replace P1 NPCs’ oversized static orbit with compact boss-relative roaming, spawn each active crystal trio in a readable lane between L’ura and the center bubble, and keep rotating-beam movement anchored to the real center ray. Tracked from [`INBOX-20260727-213144-84bd36`](../inbox/INBOX-20260727-213144-84bd36.md), [`INBOX-20260727-213826-fc558e`](../inbox/INBOX-20260727-213826-fc558e.md). |
| `BUG-081` | Implemented behind localhost preview | Preserve the first 60-second Heaven Glaive set when sequence two launches its second set, capped at the intended two simultaneous sets. Browser coverage verifies the live set count and continuing simulation. Tracked from [`INBOX-20260727-213447-7788b3`](../inbox/INBOX-20260727-213447-7788b3.md). |
| `BUG-082` | Implemented behind localhost preview | A non-carrier hit by a P1 rotating beam now records only its point penalty and continues the animation tick; only a crystal carrier branches into reactive Soaks. Tracked from [`INBOX-20260727-213851-b74802`](../inbox/INBOX-20260727-213851-b74802.md). |
| `BUG-083` | Implemented behind localhost preview | Reverse the P1 NPC center-beam crossing side: start behind the ray, cross it counterclockwise during the safe telegraph, then remain just ahead of and follow the continuously rotating beam instead of trailing directly behind it. Tracked from [`INBOX-20260727-221948-3b6da6`](../inbox/INBOX-20260727-221948-3b6da6.md). |
| `BUG-084` | Implemented behind localhost preview | Validate the controlled player when the memory sweep reaches their rune, preserve that contact verdict until the sweep finishes, and remove swept runes from the same authoritative threshold. A correct earlier position can no longer become a late false wipe after the player moves, and an earlier `+` cannot remain visible after a later rune resolves. Tracked from [`INBOX-20260727-222452-2e7d45`](../inbox/INBOX-20260727-222452-2e7d45.md). |
| `BUG-085` | Implemented | Rename the achievement UI component module to avoid its case-only filename collision with the achievement data module, restoring local builds and tests on case-folding filesystems without changing achievement behavior. |
| `BUG-086` | Implemented behind localhost preview | Start the P1 rotating-beam opening five degrees farther from L’ura so it cannot sweep the stacked raid before the player has to react. NPCs gather near the active crystal lane, cross the safe telegraph promptly, and follow that ray into the next section. Tracked from [`INBOX-20260728-062714-9305e6`](../inbox/INBOX-20260728-062714-9305e6.md). |
| `BUG-087` | Implemented | Made the grid/crack floor texture explicit in Phase 2 and darkened the shared textured floor treatment across the other phases without reducing hazard contrast. |
| `BUG-088` | Implemented | After the direct-entry/full-pull Phase 1 countdown ends, the encounter now holds a four-second live pull window before the first interrupt cast. The complete mechanic order remains intact and all later P1 timings shift naturally. |
| `BUG-089` | Implemented | Moved the first P1 center rotating-beam ray to the referenced left/counterclockwise side, correcting BUG-086's signed offset. After memory resolves, NPCs receive four seconds to run behind that reference near the player, then cross it left during the safe telegraph and follow it. Tracked from [`INBOX-20260728-071107-856663`](../inbox/INBOX-20260728-071107-856663.md). |
| `BUG-090` | Implemented behind localhost preview | P1 NPCs now naturally roam behind L’ura during the hidden post-memory window without revealing the beam angle. Once the beams appear, they face and fight the boss while remaining safely centered between adjacent rays with visible clearance, then return to normal positioning after the beams disappear. Tracked from [`INBOX-20260728-072708-4e9489`](../inbox/INBOX-20260728-072708-4e9489.md). |
| `BUG-091` | Implemented behind localhost preview | Moved the first P1 rotating-beam ray another ten degrees left/counterclockwise, from a seven-degree to a seventeen-degree signed offset, so the player must judge and execute a more meaningful crossing after the hidden staging window. |
| `BUG-092` | Implemented behind localhost preview | Each P1 Heaven Glaive set now despawns when its memory game ends, before the next sequence launches a fresh set, instead of carrying old discs into the rotating-beam section and later sequence. |
| `BUG-093` | Implemented behind localhost preview | P1 Heaven Glaive contact now uses the complete 11.92-yard visible saucer boundary plus the controlled player's 3.5-yard body radius, so visually touching the disc edge reliably triggers the wipe condition. |
| `BUG-094` | Implemented behind localhost preview | During the safe P1 rotating-beam telegraph, NPCs now cross left through the reference ray before spreading with safe clearance between adjacent beams and L’ura; their centered safe-lane follow remains intact afterward. |
| `BUG-095` | Implemented behind localhost preview | The P1 memory sweep now resolves from the live angular order in which the beam crosses players, not proximity to exact prescribed rune coordinates. A controlled player correctly placed immediately before the next rune player passes even with a different radial distance. Tracked from [`INBOX-20260728-081841-052412`](../inbox/INBOX-20260728-081841-052412.md). |
| `BUG-096` | Implemented behind localhost preview | P1 NPCs now move to the controlled player's side of the opening rotating beam before following, rather than briefly running in front of the ray on the opposite side. Tracked from [`INBOX-20260728-082134-af06c6`](../inbox/INBOX-20260728-082134-af06c6.md). |
| `BUG-097` | Implemented behind localhost preview | Stop P1 from falling through to the smaller Intermission annulus check, which incorrectly logs “Entered the void zone” for valid movement beyond the Intermission outer radius. Validate only the real 102–260 P1 annulus during Phase 1. |
| `BUG-098` | Implemented | During the P1-to-Intermission arena collapse, stop visibly sliding L’ura across the room. Warp her directly to the center with a short disappear/reappear treatment while the raid performs the handoff. |
| `BUG-099` | Implemented | Keep the Main Ability browser regression from missing its one-second castbar on software-rendered release runs by pausing immediately after cast start for visual assertions, then resuming the unchanged live mechanic. |
| `BUG-100` | Implemented | Stabilize the GitHub opening/P2 browser shard without changing encounter timing: give only the two long Phase 2 resolution assertions enough time for the free runner’s capped software-rendered simulation, while retaining the shard’s no-retry policy. |
| `BUG-101` | Implemented | Allow a crystal player to recover their dropped crystal during the final Intermission recovery window before Phase 2; the Phase 1-specific pickup guard must not block `p1-recover`. |
| `BUG-102` | Implemented | Give the raid a reliably reachable first post-Archangel Phase 3 relocation window before the next sector begins, including the furthest standard light/assignment move. |
| `BUG-103` | Implemented | Keep the Phase 2 pull, personal circles, and orb sequence on fixed encounter timing when a crystal player forgets to recover their crystal after a beam. Missing the pickup remains the player's mechanic failure but must not stall later mechanics while the orb clock continues. |
| `BUG-104` | Implemented | Suppress the Phase 2 carrier `Drop crystal` TTS instruction on Hard while retaining it in Test, Easy, and Normal. Hard players must recognize the mechanic without that coaching call. |
| `BUG-105` | Implemented | Give active Phase 3 memory-rune duties final movement priority. The controlled player's matching NPC and both members of an NPC pair must never be displaced by formation, Soak, crystal-support, side-clamp, or Stars avoidance while their unresolved rune is active. |
| `BUG-106` | Implemented | Allow the loopback hostname twin of a local trainer origin (`localhost` or `127.0.0.1`) through API CORS. The development submission lab works when OAuth returns to `localhost:5173` even if the API configuration names `127.0.0.1:5173`, without broadening production origins. Covered by an API CORS regression and a live preflight check against the restarted local service. |
| `BUG-107` | Implemented | Canonicalize the development submission lab from `localhost` to `127.0.0.1` before it calls the local API. OAuth session cookies issued by the `127.0.0.1:8787` callback now reach the lab submission request instead of producing a misleading `{"authenticated":false}` response. Covered by the serve-only lab regression and production-absence build check. |
| `BUG-108` | Implemented | Restore immediate visual confirmation when the complete raid plan is saved, without changing persistence or raid-plan contents. Covered by component and browser regressions. |
| `BUG-109` | Implemented | Changing Phase 2 crystal-player assignments updates crystal ownership without moving players or rewriting their saved raid-plan positions. Covered by component and browser regressions. |
| `BUG-110` | Implemented | Intermission NPC Starsplinters prioritize avoiding the controlled player's crystal, and a crystal hit resolves at most once. Covered by focused Starsplinter and client regressions. Tracked from [`INBOX-20260729-180740-846945`](../inbox/INBOX-20260729-180740-846945.md). |

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
- Always-available per-phase health potion and shield charges plus one-second
  main-ability gameplay.
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
- Per-phase potion/shield refills, Hard-mode recovery requirements, and
  certificate scoring for successful low-health responses.
- Verifiable completion links. A trustworthy proof cannot be created with a
  secret embedded in a static GitHub Pages client; it would require a backend
  or external signing service.
