# P1 encounter local preview

Ticket: `FR-030`

P1 is implemented before the existing Intermission as a localhost-only
playable preview. The production build continues to show the disabled teaser
until the encounter has been playtested and deliberately released.

The deterministic rules live in [`src/p1.ts`](../src/p1.ts). `FR-030` connects
them to the application, renderer, controls, phase results, TTS, and
phase-specific raid-plan persistence.

## Planning and assignments

- Add a dedicated P1 raid plan. When no P1 plan exists, initialize it from the
  maintained I Asgard I P1 assignments and outside L’ura marker.
- Track six phase-specific crystal carriers.
- Use a wider 260-yard P1 annulus around the existing 102-yard middle bubble.
  The arena visibly collapses to the smaller Intermission ring during handoff.
- Default the boss to the lower-left opening, 30 degrees from the southern
  center line. Expose that opening as a draggable P1 raid-plan marker, then
  move it one quarter around the room for the second simulated sequence.
- Treat planner rings as visual reminders rather than drag barriers. P1 and
  Intermission assignments may be placed anywhere on their maps; encounter
  resolution remains responsible for validating playable positions.
- Assign the controlled player one of five interrupt casts and reveal that
  assignment during the phase-start countdown.
- Add a configurable Interrupt action, defaulting to Numpad 2.

## Interrupt sequence

- Once the pull countdown ends, the encounter is live for four seconds before
  the first interrupt begins. All later mechanics retain their order and move
  four seconds later with it.
- The boss casts five times; each cast lasts two seconds.
- Between assigned actions, NPCs alternate short casts with irregular movement
  waypoints around L’ura instead of freezing on their raid-plan markers.
- Show the controlled player’s state in a compact box:
  - red: this is not the assigned interrupt;
  - yellow: the player is next;
  - green: the player has two seconds to interrupt.
- Missing the assigned interrupt wipes the attempt.
- The final visual representation of the cast remains open for design.

## Crystal pickup

- After the interrupts, three crystals spawn in a readable lane between L’ura
  and the center bubble. Slots 1–3 belong to sequence one; slots 4–6 to
  sequence two, and the configured carrier order determines each pickup lane.
- Assigned carriers have five seconds to collect them.
- If the controlled player belongs to the active trio, NPC carriers wait until
  the player collects their crystal before moving to their own pickups.
- Non-carriers keep the ambient cast-and-move orbit while active carriers
  override it to collect their assigned crystal.
- The pull countdown states both Kick 1–5 and Crystal pickup 1, Crystal pickup
  2, or no pickup.
- An uncollected crystal wipes the attempt, consistently with existing crystal
  expiration rules.

## Heaven Glaives

- The boss telegraphs five flying discs for two seconds as an evenly spaced
  five-direction star with a randomized rotation.
- The discs are already visible along their five directions during the
  telegraph, spin rapidly on launch, and leave from just outside L’ura instead
  of appearing from one overlapping point.
- Each disc launches from the outside boss at 4.5 times player/NPC speed,
  keeps that full speed until its first impact, then continues at 165% of
  configured player speed.
- Render each disc as a broad, flat luminous flying saucer rather than an orb.
  The reviewed version is 1.5 times larger and uses rotating surface markers
  so its spin remains readable from the play camera.
- Glaives reflect from both the 260-yard outer wall and the 102-yard middle
  bubble, so they never pass through the protected center.
- The glaives continue roaming while later mechanics occur.
- Unassigned NPCs make short sidesteps out of approaching glaive lanes when
  that does not conflict with a crystal, memory, or rotating-beam duty.
- Each glaive remains active for 60 seconds and then disappears. Keep
  the lifetime configurable for tuning and cap the live hazard field at two
  generated sets, allowing the first and second sequence sets to overlap.
- Contact is a 500-point wipe. Leaving a disc and touching that same disc again
  starts another contact and therefore another wipe; remaining continuously
  inside it does not spam duplicate failures every frame.

## Five-rune memory game

- Two seconds after the glaives launch, display a five-symbol sequence chosen
  from `T`, `X`, `O`, `V`, and `+`.
- Players have seven seconds to arrange around the boss in that order; radial
  distance is not scored.
- A single 55-yard dark-blue Starsplinter-style beam begins on the boss-to-outside ray
  and rotates clockwise 360 degrees around the boss. The first rune stands on
  that outward ray and the remaining symbols stand clockwise in displayed
  order. Each marked player touched by the beam must match the next symbol.
- Each resolved rune disappears as the sweep passes it. A slim raised laser
  core and a 2.35-times wider layered blade keep the moving verification
  unmistakable without changing its collision order.
- An incorrect controlled-player position triggers its wipe as soon as the
  sweep reaches that rune. The failed rune turns red in the frozen wipe scene.
- The configured P1 boss marker is the single origin for rendering, NPC rune
  placement, the visible sweep, and gameplay validation. Correct contact is
  locked when the sweep reaches the controlled player; incorrect contact
  resolves immediately with explicit red rune feedback.
- NPCs roam unpredictably during the positioning window, then settle into the
  correct clockwise order shortly before resolution. The controlled player
  remains responsible for finding their own slot.

## Rotating beams and reactive Soaks

- After the memory game, NPCs have a four-second positioning window to run
  behind the reference ray near the active crystal lane. No beam is shown or
  lethal during this staging window.
- Eight Intermission-style boss beams then telegraph for two seconds while
  already rotating at player speed.
- The safe telegraph is a low ground guide. It becomes the full lethal laser
  after two seconds without resetting or discontinuing its rotation.
- The lethal laser then sweeps exactly 45 degrees before all eight beams
  disappear.
- One beam begins seven degrees to the left/counterclockwise side of the
  center-to-boss outward reference. The intended movement is to cross that beam
  left, then follow it without being caught by another beam while continuing
  to dodge the glaives.
- All eight beams rotate clockwise in both sequences. NPCs play them perfectly:
  they stage near the active crystal lane just behind a nearby ray, cross
  counterclockwise during the low telegraph, reform compactly just ahead of
  it, and follow L’ura for the remainder of the same continuous sweep.
- Crystal pickup, assigned memory runes, and the initial beam crossing take
  priority over Heaven Glaive avoidance. Once NPCs are following the lethal
  rotating beam, they may make short glaive sidesteps while preserving their
  position ahead of that ray.
- Raid-plan positions 1 and 2 choose the tank-led direction for sequence one
  and sequence two. Each L’ura relocation covers one visible 45-degree arena
  arc, including when a tank marker happens to share L’ura’s opening angle.
- If a controlled player without a collected crystal is hit, the trainer
  deducts points and the rotating-beam sequence continues without spawning
  additional ground mechanics.
- If a controlled crystal carrier is hit, two fast yellow landing Soaks reuse
  the Phase 3 opening-circle treatment:
  - NPCs immediately resolve one;
  - NPCs speed out of the other, clearly assigning it to the player;
  - failing the remaining Soak wipes the attempt.
- The boss follows the rotating beam through one eighth of the room.

## Sequence and transition

- Simulate two complete sequences.
- Afterwards, give the raid 15 seconds to reach the existing Intermission
  assignments before that phase begins. L’ura moves smoothly from her final
  outside stop to the center during this handoff.

## TTS

- `Glaives` one second before the glaive telegraph.
- `Memory game` when the complete rune panel appears during the glaives.
- `Move beam` when the memory game resolves.
