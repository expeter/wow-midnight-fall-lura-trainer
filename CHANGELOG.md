# L'ura Trainer changelog

## Unreleased

Phase 1 is the next planned encounter addition.

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
