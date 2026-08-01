# L'ura Trainer changelog

## Unreleased

## 0.9.2 · 2026-08-01

- BUG-157: Pin released/public Phase 2 cross beams exactly to the four raid
  markers so their display agrees with public axis-based crystal collision.
  Keep the complete moving-orb and player-aim preview on localhost.
- SPEC-018: Document and regress the server-recomputed score arithmetic behind
  the accepted 1,400-point Phase 1 example: 100 bounded Main Ability casts,
  five 20-cast milestones, and one recovery pass add 400 points.

## 0.9.1 · 2026-07-31

- CR-228: Redesign copied result images to mirror the approved compact browser
  card, including its top Run-ID stamp and five phase cards, while removing the
  hostname, “Client checksum” footer, and embedded achievement list. Tracked
  from `INBOX-20260731-203647-31fd16`.
- CR-227: Keep copied result text concise and human-readable, ending with the
  Run-ID while omitting canonical JSON and the trainer URL.
- BUG-156: Compact Test previews, practice clears, and full completion results
  into one share-card-like desktop layout. Achievement unlocks remain popups
  instead of being duplicated inside the card, while the non-copyable Run-ID
  is branded near the top. Tracked from `INBOX-20260731-202036-2d506e`.

## 0.9.0 · 2026-07-31

- CR-225: Show cumulative end-of-phase scores on completion cards, copied
  summaries, generated images, and the Run-ID calculation, with each signed score
  delta explicitly labelled `Phase contribution`. Scoring and leaderboard
  comparability are unchanged.
- FR-071: Add a quiet offline browser-generated `Run-ID` to result cards and
  copied images. It checks versioned canonical result JSON with SHA-256, offers
  the exact run data in copied result text, and is stored with accepted API attempts
  when online without claiming to be an unforgeable server signature.

## 0.8.0 · 2026-07-31

- FR-070: Synchronize account-owned verified achievements and cumulative
  progress into the personal collection after login restoration and accepted
  completions, using account-scoped browser caching while retaining local-only
  records as unverified device data.
- CR-202: Retire obsolete maintainer and laptop-transfer handoff snapshots,
  consolidate their durable references into the repository instructions and
  specifications, and reconcile stale release-boundary documentation with
  v0.7.2.

## 0.7.2 · 2026-07-31

- BUG-155: Restore verified online-attempt issuance by aligning the API with
  trainer v0.7.2. Root trainer-version changes now trigger the independently
  tested API deployment, and production verification requires the public API
  health version to match. Leaderboard season `season-1` is unchanged.
- BUG-154: Keep Phase 2 moving-orb beam duty on NPCs in public play so a
  randomly selected controlled player cannot block the live run. The complete
  player-aiming and miss-wipe mechanic remains available on localhost for
  encounter validation.

## 0.7.1 · 2026-07-31

- BUG-152: Restore the public pre-tank encounter while retaining the complete
  Heaven's Lance and deterministic P4 tank-role implementation on localhost
  for user validation. Public hosts no longer expose or advance tank state,
  controls, assignments, achievements, protection ownership, cone ownership,
  or tank-based Starsplinter selection.
- CR-201: Make the focused Playwright wrapper the documented required workflow
  and give it an isolated dev-server port so another running worktree cannot
  silently supply the application under test.
- BUG-151: Stabilize the Phase 2 personal-circle/NPC-crystal browser scenario
  against the random beam-assignment mechanic so it reaches the intended
  collision assertion without changing either encounter failure rule.
- CR-199: Add a stable local focused-Playwright wrapper with named regression
  presets and a free-text fallback, using the repository-local Chromium install
  and zero retries by default.
- CR-198: Make every ordinary dropped crystal collectible after exactly one
  second during every mechanic, while retaining its six-second ground
  explosion. Only a correctly placed assigned Phase 3 protection crystal is
  committed and therefore cannot be recollected; remove the Phase 2 beam lock
  and the early silent return of wrongly picked crystals.
- BUG-150: Hold the Phase 4 NPC tank at the rendered group position throughout
  each active three-Starsplinter set, then resume its frontal route after the
  final Splinter resolves.
- FR-069: Add audited API-only exceptional achievements that do not generate
  public activity. Public rankings show a generic exceptional marker, while a
  profile reveals the achievement only to its owner or another account that
  owns the same secret. The first manually granted badge is the 10-point
  **Find a Bug** achievement.

## 0.7.0 · 2026-07-31

- BUG-148 / CR-196: Freeze each pull as verified, deliberately anonymous, or
  local-only. Signed-in players without an active character can no longer
  publish anonymous wipes by accident, and the controlled-player nameplate
  distinguishes the played name from its verified Battle.net identity.
- BUG-149: Keep a crystal dropped during the sequential Phase 2 beam grounded
  for the complete beam/orb event on every difficulty; normal recovery resumes
  in the following pull window. This shipped behavior is superseded by CR-198.
- CR-197: Require Phase 1 through Phase 4 for every new full-journey
  achievement and show compact saved progress on cumulative and multi-run
  badges. Already-earned records remain unchanged.
- FR-068: Add two persisted/shareable tank assignments. During boss-active
  Phase 1, Phase 2, and Phase 3, the tanks play the visible five-count
  Heaven's Lance burst, mitigation, Impaled, and post-impact-five swap loop;
  NPC tanks resolve it correctly while a controlled tank uses a recharging
  defensive and Taunt action under a two-strike failure rule. Suspend the loop
  through unavailable-boss transitions, support tank-plus-crystal duty and
  canonical achievements.
- CR-195: Give the configured Phase 4 tanks deterministic assignments: Tank 1
  owns the repeatable frontal add-clearing cone, Tank 2 carries the rendered
  moving protection zone, and the raid follows Tank 2. Exclude both tanks from
  Starsplinter and award a distinct achievement for completing either role.
- FR-050: Assign each Phase 2 beam set to four random non-crystal players and
  four unresolved continuously counterclockwise-orbiting orbs near the cross
  regions. NPCs intercept their predicted targets; a selected controlled
  player aims with their rendered position and wipes if that ray misses.
- FR-049: Regroup the raid on its configured Phase 2 personal circles after
  the final orb return, then launch every player into Phase 3 from their own
  rendered position without a hidden center teleport.

## 0.6.2 · 2026-07-31

- Stabilized the two release-gating opening/P2 browser assertions without changing encounter behavior.
- BUG-145: Revalidate the online session before every run and reject stale
  authenticated wipe submissions instead of silently publishing them as
  anonymous activity. A server-issued attempt remains bound to its account and
  character for wipes and completion even if the browser session expires
  during play. Align the deployed API's accepted trainer version with `0.6.2`
  while retaining leaderboard `season-1`. Deliberately signed-out Normal/Hard
  practice remains eligible for the generic anonymous wipe feed.
- CR-194: Open public identities in Recent activity as trainer player profiles
  instead of external Raider.IO character pages.

## 0.6.1 · 2026-07-31

- BUG-144: Keep the documented Phase 3 timings intact while allowing the
  terminal-wipe browser regression enough wall-clock time to complete on
  GitHub's software-rendered runner, unblocking the Pages release.
- BUG-136–BUG-143 / SPEC-016: Retain `season-1` while repairing ranking and
  achievement integrity: publish one best run per account with stable search
  ranks, use one current-season scope across boards and profiles, count actual
  direct-phase clears, restrict full-run feats correctly, bind completion to
  issued configuration with safe idempotent retry, throttle attempt issuance,
  hide guild identity in alias mode, restore local flawless Phase 1 awards,
  and store canonical/rank-one achievement points only once per account.
- FR-065 / CR-178: Add the persisted optional in-arena action strip for Main
  ability, Interrupt, Shield, Health potion, and Crystal drop, with its own
  draggable HUD anchor.
- CR-176–CR-177 / CR-183 / BUG-131: Extend live activity with accepted
  completions, default-on bottom-right messages across setup and arena screens,
  and matching recent-feed arrival animation.
- CR-179 / CR-181–CR-193 / BUG-120–BUG-121 / BUG-129 / BUG-132–BUG-135:
  Reconcile the Global podium, five-column ranking views, personal summaries,
  profiles, privacy controls, localhost fixtures, failure advice, and
  achievement navigation into one responsive online experience.
- BUG-123–BUG-125 / BUG-127–BUG-130: Correct Phase 3 landing occupancy and
  health feedback, Phase 1 Glaive lifetime, Phase 4 tank avoidance, Phase 2
  pull/crystal recovery, P3 Stars connection range, and authoritative
  Intermission positioning time.
- BUG-126: Award canonical server achievement points to eligible direct-phase
  achievements while retaining their exclusion from run leaderboards.
- BUG-134: End Normal attempts when accumulated penalties reduce the score to
  zero.
- SPEC-014: Require completed tickets to close with focused regression coverage
  and current durable documentation, record user-visible work under
  `Unreleased`, maintain SemVer at release time, and reserve leaderboard-season
  changes for explicit user approval after a ranking-impact reminder.
- SPEC-015: Reconcile the shipped trainer and API feature contracts, record
  known online correctness gaps as explicit bugs, normalize released Phase 1
  ticket statuses, and organize all remaining work into maintained milestones.

## 0.6.0 · 2026-07-30

- FR-064: Add privacy-aware public player profiles, account attempt/wipe
  counters, all four personal run-board positions, global ranking, and hidden
  rank-one achievements worth 50 points per board plus the 200-point
  four-board sweep. Keep leaderboard continuity in `season-1`.
- BUG-116: Make Intermission crystal pickup follow the player's continuous
  movement path and extend positioning to the measured 24-second legal-route
  window around the middle void.
- BUG-117/BUG-118: Label flawless clears correctly and publish anonymous
  Normal/Hard wipes without exposing player identity.
- BUG-121/BUG-122: Keep production podiums hidden when empty, populate
  localhost preview rankings, and repair stale illegal saved Phase 1 plans
  before they can spawn a player in the opening void.
- CR-168/CR-169: Make health pressure react faster while preserving a
  two-second recoverable red window, and extend Phase 1 glaives through the
  Intermission handoff without suppressing overlaps.
- CR-170–CR-175: Rework the setup hierarchy and leaderboard presentation around
  a dedicated Global Top 3 banner, compact player summaries, Global Top 10 plus
  own position and search, a simplified Achievement Hall, consistent visual
  anchors, and slightly tighter top spacing.

## 0.5.1 · 2026-07-29

- BUG-115: Decouple run-leaderboard seasons from trainer SemVer. Compatible
  releases now share the explicitly selected `season-1`, while exact historical
  version queries remain available and a fresh board requires a deliberate
  season change.

## 0.5.0 · 2026-07-29

- BUG-113: Restrict the legacy Intermission annulus check to its live beam and
  Splinter mechanics so Phase 2 and the Phase 2-to-Phase 3 handoff cannot emit
  the generic “Entered the void zone” message.
- BUG-114: Suppress player and NPC combat projectiles during the Phase
  1-to-Intermission handoff, then target centered Intermission L’ura.
- CR-165: Include each recorded wipe reason in the public activity feed.
- CR-166: Let a Phase 1 crystal carrier drop and recollect their assigned
  crystal through the normal six-second explosion countdown without treating
  the interaction itself as a failure.
- CR-167: Keep a small yellow ground glow visible beneath the controlled player
  whenever they actually carry a crystal, including Phase 2.
- CR-168: Show the front-page activity box only while it contains activity from
  the last ten minutes, leaving permanent records intact.

## 0.4.2 · 2026-07-29

- BUG-111: Restore production online-attempt issuance after the VPS retained an
  obsolete trainer-version override. The API now owns and reports its release
  compatibility version, and deployment verification rejects a mismatched
  frontend/API release.
- FR-060: Recover Pestivator's documented Normal/crystal result with one
  administrative production backfill after BUG-111 prevented attempt issuance,
  without adding a public bypass or awarding unverifiable achievements.
- CR-164: Correct the FR-060 backfill's duty from non-crystal to crystal after
  player confirmation, retaining the original score, duration, and identity.
- CR-163: Keep all five phase cards and wrapped completion details inside the
  copied result image.
- BUG-112: Store authenticated Normal/Hard wipes independently from profile
  visibility, resolve identity when reading the feed, and backfill the
  explicitly confirmed Pestivator Phase 4 wipe.
- FR-061: Add future-only first-earned achievement events to the same
  privacy-aware chronological activity feed without backfilling history.

## 0.4.1 · 2026-07-29

- CR-162: Hide an empty wipe feed and retain private-profile wipe activity
  only as “Anonymous”, without exposing a character link or mutable raid-plan
  position.

## 0.4.0 · 2026-07-29

- FR-059: Add a permanent privacy-aware public wipe feed backed by the API,
  refreshed every five seconds on the front page with timestamps and
  Raider.IO character links.
- BUG-108: Restore immediate visual confirmation on the raid-plan Save action.
- BUG-109: Keep Phase 2 player coordinates unchanged when crystal duty changes.
- BUG-110: Make NPC Starsplinters prioritize avoiding the player's dropped
  crystal and prevent one crystal impact from resolving twice.
- CR-161: Show recent release notes directly in the new-version prompt, retain
  the full changelog link, and adopt automatic SemVer/changelog release upkeep.
- FR-027 is complete; off-VPS backup replication is user-managed outside the
  project.

- CR-160: Clamp the shared P1–P3 boss pool at 3% behind visible Veil
  Protection until Phase 3 sequence two, while continuing to count damage,
  casts, and points; retain Phase 4's independent refreshed pool.
- CR-159: Remove the 200-cast result truncation and validate completed Main
  ability casts against simulated attempt duration instead.
- CR-158: Show a spinner and explicit Battle.net redirect status immediately
  after the login action is clicked.
- BUG-107: Canonicalize the localhost submission lab to `127.0.0.1` so the
  OAuth callback's loopback session cookie is included in API requests.
- BUG-106: Treat `localhost` and `127.0.0.1` as equivalent only for explicitly
  configured loopback CORS origins, fixing local verified submission requests.
- FR-058: Add the account-wide Achievement Hall of Fame with canonical
  weighted tiers, lifetime totals, highest-achievement timestamps, privacy
  filtering, local preview data, and Top 10/full/search presentations.
- CR-157: Add a Vite-development-only verified submission lab at
  `/dev/online-submit`, backed by the real attempt APIs and excluded from
  production builds.
- CR-156: Make time outside the Phase 4 protected stack visibly drain health
  and deduct ten points for every full unsafe second.
- CR-155: Polish leaderboard/profile controls, add distinct localhost
  categories, expose profile-linked practice naming and direct logout, and
  retain privacy-mode anonymous results without publishing them.
- CR-154: Simplify the rankings-only leaderboard and populate empty or
  unavailable localhost categories with 100 deterministic preview players,
  including a test position at rank 65 beneath the first ten.
- CR-153: Split setup into six one-active-section tabs, keep character choice
  and a compact current-category Top 10 in Game settings, and make Leaderboard
  a rankings-only view with four primary categories and the user's rank below
  the first ten rows.
- CR-152: Split online character/profile management from public rankings,
  explain visibility saves, leaderboard rows, filters, and search, and restyle
  the controls to match the trainer.
- CR-151: Increase L’ura's shared pre-Phase-4 health budget by 5% without
  changing encounter mechanics, phase sequencing, or Phase 4 health.
- CR-150: Replace the long setup scroll with Practice, Raid plan, and Online
  tabs; surface login and the selected character near the top, explicitly
  confirm automatic character selection saves, and clarify profile actions.
- CR-149: Remove GitHub-hosted API backup artifacts and their repository
  certificate; retain VPS-local rotation until separate storage is provided.
- FR-057: Rebalance the setup page around practice settings and present online
  standings as a compact Top 10 with a separate full leaderboard view.
- FR-027: Begin the optional highscore service with an isolated Node/SQLite
  backend, operator preparation guide, privacy-aware public leaderboard
  endpoints, migrations, backups, and VPS deployment scaffolding. Add
  Battle.net authorization-code login with one-use state, short-lived provider
  tokens, verified WoW character import and selection, opaque application
  sessions, authenticated profile lookup, and origin/CSRF-protected logout.
  Add privacy controls and complete cascading deletion, one-use
  character-bound attempts, server-side score recomputation, verified
  achievements, endpoint rate limits, and a plain-language privacy page.
  Integrate optional login, verified character/privacy management, searchable
  public leaderboards, online attempt submission, and verified achievements
  into the trainer while retaining complete offline/local play. Encrypt daily
  SQLite backup exports and archive rotating generations off the VPS.
- FR-056: Add an original favicon designed for clear recognition at
  browser-tab size.
- BUG-105: Prevent active Phase 3 memory-rune NPCs from running away when
  Stars avoidance or other positioning rules overlap their matching turn.
- CR-148: Integrate the persisted Phase 1 rune-panel orientation control into
  HUD settings instead of presenting it as a difficulty and movement option.
- BUG-104: Suppress Phase 2 carrier `Drop crystal` voice coaching on Hard
  while retaining the call in Test, Easy, and Normal.
- SPEC-011: Define the optional Battle.net-authenticated highscore and
  achievement API, including server-issued attempts, privacy and deletion,
  searchable versioned leaderboards, SQLite backups, and VPS deployment.

## 0.3.0 · 2026-07-28

- FR-030 / CR-144: Released the complete Phase 1 encounter in production:
  five assigned interrupts, two three-crystal pickup sets,
  ricocheting Heaven Glaives, the ordered TXOV+ memory sweep, rotating beams
  with reactive Soaks, a dedicated raid plan, and the Intermission handoff.
- BUG-072 / CR-103 / CR-104: Removed invisible P1/Intermission planner
  barriers, expanded P1 into a visibly collapsing outer annulus with L’ura
  moving between outside quarters, and changed Heaven Glaives to 60-second
  hazards that launch at triple speed and bounce from both arena boundaries.
- CR-105 / CR-106: Added a draggable lower-left P1 L’ura opening with a nearby
  safe-telegraph beam, split crystal pickups into two assigned trios, held NPC
  pickups until an assigned player acts, and exposed Kick plus pickup duty on
  the pull countdown.
- CR-107 / CR-108 / CR-109: Added a large red/orange/green interrupt tile,
  redirected P1 cosmetic attacks to the visible outside boss, and restored an
  evenly spaced five-direction glaive star that changes from triple speed to
  110% player speed only after its first ricochet.
- BUG-073 / FR-047: Anchored the P1 memory order and sweep to L’ura’s outward
  ray, then extended lasso-select-and-place editing to every raid plan.
- FR-048 / FR-049: Recorded the P3-entry crystal recovery/paired Soak and
  position-driven P2-to-P3 knockback refinements in the backlog.
- FR-050: Recorded the four-player P2 orb-aiming redesign: continuously
  orbiting targets near the cross marks, perfect NPC interception, no crystal
  carrier selection, and a wipe when a selected player misses their orb.
- CR-110 / CR-111 / BUG-074: Replaced P1 glaive orbs with larger flat flying
  saucers, added late-settling memory NPC motion and correct rotating-beam NPC
  movement, moved L’ura toward raid-plan tank positions 1/2, and preserved one
  continuous beam angle from the low safe telegraph into the lethal laser.
- CR-112: Replaced static P1 NPC downtime with deterministic cast-and-move
  waypoints around L’ura while preserving crystal pickups, memory alignment,
  and rotating-beam movement; tracked from the linked inbox capture.
- CR-113 / CR-114: Enlarged the spinning P1 Heaven Glaive saucers, aligned
  their collision radius, shortened lethal beams to one 45-degree sweep, and
  made the compact NPC raid follow L’ura along a tank-led arc; tracked from
  the linked inbox capture.
- BUG-075 / BUG-076: Unified P1’s configured L’ura origin across rendering,
  rune placement, memory validation, NPC movement, and rotating-beam movement.
  Wrong rune order now resolves after the visible sweep instead of silently
  passing or disagreeing with what the player saw.
- BUG-077 / CR-115: Rearmed Heaven Glaive contact after the player exits,
  exposed each disc during its direction telegraph, increased launch and
  return speeds by 1.5×, and accelerated their visible spin.
- CR-116 / CR-118: Reused the established ground-crystal and carried-crystal
  visuals in P1 while explicitly suppressing P3-style protection rings.
- CR-117: Separated the Interrupts label/count and anchored the 100×100
  red/orange/green kick tile directly beneath it.
- CR-119: Enabled vertical mouse-camera inversion by default for new users
  while preserving any existing saved preference.
- CR-120: Rendered P1’s memory verification as one 35-yard
  Starsplinter-style sweep beam.
- BUG-078: Changed lethal P1 rotating-beam collision from a single-frame ray
  sample to a swept-angle check, so a beam catching a player between frames
  reliably starts the reactive Soaks.
- CR-121 / CR-122: Kept memory NPCs chaotic until the final 1.5-second
  settling window, retained the new single 35-yard memory sweep, and moved the
  nearest rotating-beam opener from ten degrees to five degrees beside L’ura.
- BUG-079 / CR-123: Limited reactive P1 beam-hit Soaks to players who have
  collected a crystal. Non-carriers now lose points and continue, while
  carriers receive two P3-opening-style yellow circles; tracked from the
  linked inbox screenshot.
- BUG-080 / CR-124: Reworked P1 NPC movement into compact boss-relative
  roaming, moved crystal trios into readable boss-to-center lanes, anchored
  NPC beam movement to the real center ray, and standardized every rotating
  beam to one clockwise direction.
- BUG-081 / CR-126: Preserved both 60-second Heaven Glaive sets across the
  second sequence and let otherwise-free NPCs sidestep an approaching glaive;
  browser coverage verifies that the live overlap continues to advance.
- BUG-082: Kept non-carrier rotating-beam penalties from aborting the P1
  animation tick; only collected-crystal carriers enter reactive Soaks.
- CR-125 / CR-129: Extended the P1 memory sweep to a darker, slightly raised
  40-yard Starsplinter visual, clear each rune as it resolves, and keep all
  roaming NPC targets inside the playable arena.
- CR-127 / CR-128 / BUG-098: Warp L’ura directly to the Intermission center
  during the P1 handoff, and ship the reviewed P1 positions/boss marker as the maintained
  I Asgard I fallback for plans without P1 data.
- CR-130: Made the P1 memory sweep visually decisive after screenshot review:
  a 55-yard, 2.35-times wider dark Starsplinter blade with a stronger raised
  core now visibly sweeps through the rune formation.
- BUG-083: Reversed the P1 NPC center-beam crossing lane so the raid crosses
  counterclockwise during the safe telegraph and follows just ahead of the
  beam rather than running directly behind it.

## 0.2.0 — 2026-07-27

- Published the reviewed Main ability release sound as an opt-in production
  sound while leaving unfinished mechanic effects in the local soundboard.
- Added persistent achievement history, newly-earned completion celebrations,
  shareable achievement cards, five-run flawless Normal and Hard streaks, and
  cumulative 10/50/100 phase-clear milestones.
- Completed and stabilized the Phase 3 and Phase 4 encounter simulations,
  including plan-driven raid movement, crystal lights, Soaks, Stars, ordered
  runes, Dark Archangel protection, Starsplinters, Heaven & Hell movement,
  incoming adds, and the front-tank cone.
- Added the browser-local feedback inbox and maintained I Asgard I raid-plan
  loader for faster testing and guild sharing.
- Improved rendering performance and split the browser test workload for
  reliable deployment on GitHub Pages runners.
- CR-089: Keep the health bar under steady combat pressure while making critical potion/shield recovery windows occasional and short-lived.
- CR-088: Keep the Phase 3 rune partner from evading the player in every difficulty; assisted modes still approach after their reaction delay, while Hard waits in place for the player.
- Made health potion and shield permanent one-charge-per-phase actions, added
  continuously changing health with held low-health moments and three HUD
  color bands, and limited missed-recovery penalties to Hard mode.
- Split recovery achievements into using a recovery item at least once and
  completing a successful low-health response in every phase.
- Made the build identifier copyable and separated direct links to GitHub, the
  changelog, and the repository issue form.
- Added a localhost-only feedback inbox at `/inbox` that saves pasted,
  dropped, or selected screenshots together with short Markdown notes and
  stable reference IDs under `inbox/`.
- Rebuilt Phase 2 around one continuous twelve-orb roster: each beam now
  converts four existing purple orbs to yellow before those same orbs return,
  eliminating duplicate, colliding, or direction-changing orb sets.
- Stabilized the renderer-heavy P3/P4 CI shard on slower GitHub runners by
  testing the second P4 Splinter cycle directly, retaining pure-rule coverage
  for the full phase, and allowing one retry only for that heavy shard.
- Reduced per-frame Three.js allocation pressure by reusing stable transient
  ring, disc, beam-marker, Starsplinter, cone, add, and sector geometry without
  changing encounter timing, collision logic, placement, or appearance.
- Reset L’ura to a fresh 100% health pool for Phase 4 so damage dealt in
  earlier phases cannot skip the final encounter.
- End remaining Phase 3 mechanics at 0% player-dealt health and award “The
  Stars Can Wait” before Phase 4.
- Keep “The Stars Can Wait” focused on the 0% feat without revealing transition
  tactics, and visibly hold L’ura at exactly 0% during the Phase 3 damage clear.
- Add an in-arena Raidlead mute button that immediately toggles and persists
  raid-lead TTS without leaving the encounter.
- Replaced the pre-Phase-4 damage instruction beneath L’ura’s health with an
  atmospheric encounter line.
- Kept returning orbs visible in both Phase 2 sequences while making every orb
  continue counterclockwise through its normal and glowing states.
- Standardized the setup page around explicit Game settings, Keyboard
  settings, Interface, Raid planning, and phase-plan headings, with keyboard
  and mouse controls grouped beneath the Keyboard settings topic.
- Added a compact four-link setup menu for jumping to Game settings, Keyboard
  settings, HUD, or Raid planning without replacing shared raid-plan hashes.
- Restyled setup jumps as quiet inline navigation, added reduced-motion-aware
  smooth scrolling, and added a small Back to top action to each main setup
  section.
- Made the five-second opening movement boost permanent and removed its setup
  toggle and retired browser preference.
- Changed the difficulty selector to a two-by-two grid so every mode label
  remains readable without forcing adjacent Game settings cards to overlap.
- Consolidated Game settings into three desktop cards, reduced setup
  whitespace, and restored the Intermission raid-plan heading before its map.
- Moved raid-plan save, load, and sharing controls into a full-width section
  between HUD settings and the raid-planning maps.
- Prevented the creator card from overflowing its setup column and raised every
  visible card label to a minimum of 16 pixels.
- Added mode-, crystal-duty-, option-, and flawless-aware completion
  achievements, including the Superhuman Flawless full-run tier.
- Disabled background music through a feature flag while replacement ambience
  is being selected.
- Tightened Phase 4 to a 21-second Heaven & Hell cadence while retaining the
  shared 10% movement bonus and placing the last Starsplinter detonation one
  second before movement begins.
- Cleared the Phase 2 orb-return HUD at the Phase 3 boundary and aligned the
  entire final north gather plus Phase 4 knockup on one exact raid-stack point.
- Added durable component specifications and stable `SPEC` ticket handling.
- Added a fixed I Asgard I raid-plan loader so guild members can refresh the
  maintained plan without exchanging another long share link.
- Added automatic new-version detection using the deployed Git revision.
- Added the Git revision and this changelog beneath the application version.
- Restored a clearly labeled Twitch profile link alongside the Raider.IO and
  support links in Pestivator's creator card. The generic Discord application
  link was removed because it did not identify Pestivator's profile.
- Improved the creator card with larger readable typography, a stronger avatar,
  balanced spacing, and consistent external-link marks.
- Shared raid plans now replace stale locally saved assignments before the
  first render and remain active after a clean reload. The same loaded plan is
  passed into live Intermission, both Phase 2 assignments, Phase 3, and the
  shared Phase 4 roster.
- Phase 3 NPC movement, landing groups, crystal-light ownership, opening-side
  scoring, and safe-zone scoring now follow the loaded raid plan.

## 0.1.0

- Initial public movement trainer with Intermission, Phase 2, Phase 3, and
  Phase 4 practice; editable and shareable raid plans; Test through Hard
  difficulties; configurable controls and HUD; scoring; failure review; and a
  shareable completion certificate.
