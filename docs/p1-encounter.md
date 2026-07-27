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
  Phase 2 raid plan.
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

- The boss casts five times; each cast lasts two seconds.
- Show the controlled player’s state in a compact box:
  - red: this is not the assigned interrupt;
  - yellow: the player is next;
  - green: the player has two seconds to interrupt.
- Missing the assigned interrupt wipes the attempt.
- The final visual representation of the cast remains open for design.

## Crystal pickup

- After the interrupts, three crystals spawn at the assigned Phase 1 raid-plan
  positions. Slots 1–3 belong to sequence one; slots 4–6 to sequence two.
- Assigned carriers have five seconds to collect them.
- If the controlled player belongs to the active trio, NPC carriers wait until
  the player collects their crystal before moving to their own pickups.
- The pull countdown states both Kick 1–5 and Crystal pickup 1, Crystal pickup
  2, or no pickup.
- An uncollected crystal wipes the attempt, consistently with existing crystal
  expiration rules.

## Heaven Glaives

- The boss telegraphs five flying discs for two seconds as an evenly spaced
  five-direction star with a randomized rotation.
- Each disc launches from the outside boss at three times player/NPC speed,
  keeps that full speed until its first impact, then continues at 110% of
  configured player speed.
- Glaives reflect from both the 260-yard outer wall and the 102-yard middle
  bubble, so they never pass through the protected center.
- The glaives continue roaming while later mechanics occur.
- Each glaive remains active for 60 seconds and then disappears. Keep
  the lifetime configurable for tuning and cap the live hazard field at two
  generated sets.
- Contact is a 500-point wipe.

## Five-rune memory game

- Two seconds after the glaives launch, display a five-symbol sequence chosen
  from `T`, `X`, `O`, `V`, and `+`.
- Players have seven seconds to arrange around the boss in that order; radial
  distance is not scored.
- A single beam begins on the boss-to-outside ray and rotates clockwise 360
  degrees around the boss. The first rune stands on that outward ray and the
  remaining symbols stand clockwise in displayed order. Each marked player
  touched by the beam must match the next symbol.
- An incorrect order wipes the attempt.
- NPCs solve it with deliberately late movement and may change position during
  the final second, leaving the controlled player responsible for finding the
  correct slot.

## Rotating beams and reactive Soaks

- Two seconds after the memory game, eight Intermission-style boss beams
  telegraph for two seconds while already rotating at player speed.
- Crossing a telegraph during those two seconds is safe.
- One beam begins ten degrees to either side of the boss. The intended movement
  is to cross that beam, then follow it without being caught by another beam,
  while continuing to dodge the glaives.
- NPCs play the rotating beams perfectly.
- If the controlled player is hit, two fast landing Soaks appear:
  - NPCs immediately resolve one;
  - NPCs speed out of the other, clearly assigning it to the player;
  - failing the remaining Soak wipes the attempt.
- The boss follows the rotating beam. Completing it consumes one quarter of
  the room.

## Sequence and transition

- Simulate two complete sequences.
- Afterwards, give the raid 15 seconds to reach the existing Intermission
  assignments before that phase begins.

## TTS

- `Glaives` one second before the glaive telegraph.
- `Memory game` when the complete rune panel appears during the glaives.
- `Move beam` when the memory game resolves.
