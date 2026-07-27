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
- Keep the boss at the Intermission S1 position.
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
  positions.
- Assigned carriers have five seconds to collect them.
- An uncollected crystal wipes the attempt, consistently with existing crystal
  expiration rules.

## Heaven Glaives

- The boss telegraphs five flying discs for two seconds in randomized
  star-like angles.
- Each disc travels in a straight line at player/NPC speed, reflects from an
  arena ring, and returns into the room at a calculated angle.
- The glaives continue roaming while later mechanics occur.
- Each glaive remains active for roughly 30 seconds and then disappears. Keep
  the lifetime configurable for tuning and cap the live hazard field at two
  generated sets.
- Contact is a 500-point wipe.

## Five-rune memory game

- Two seconds after the glaives launch, display a five-symbol sequence chosen
  from `T`, `X`, `O`, `V`, and `+`.
- Players have seven seconds to arrange around the boss in that order; radial
  distance is not scored.
- A single outward beam then rotates 360 degrees around the boss. Each marked
  player it touches must match the next symbol in the displayed order.
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
