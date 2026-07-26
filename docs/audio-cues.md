# Audio cue catalog

Status: `SPEC-009` planning reference. Music is available now and defaults to
off. Encounter sounds and TTS remain disabled until suitable short files and
final call timings are approved.

Keep the channels independent:

- **Music** is continuous ambience.
- **Sounds** are short nonverbal mechanic effects and must never hide a more
  important warning.
- **TTS** is optional raid-lead assistance. Visual counters remain authoritative.

## Raid-lead voice / TTS calls

| Phase | Call | Proposed trigger | Purpose |
| --- | --- | --- | --- |
| Intermission | `DODGE` | Boss laser telegraph becomes actionable | Remind the player to clear the wide center beam |
| Intermission | `DROP CRYSTAL` | Player is a carrier and their Starsplinter set begins | Start the drop–move–recover sequence |
| P2 | `SOAK BEAM` | Cross-beam telegraph begins | Move onto the assigned beam |
| P2 | `DROP CRYSTAL` | Carrier’s beam countdown reaches 3 seconds | Leave the crystal outside the beam before resolution |
| P2 | `SPREAD` | The pull finishes with the raid in the middle | Move to the personal-circle assignment |
| P2 | `DODGE` | Returning orbs are 3 seconds from reaching the middle | Clear the return path and recover the crystal |
| P3 | `SOAKS` | The three ground Soaks appear | Begin the group Soak assignment |
| P3 | `MEMORY GAME` | The full rune-order panel is visible | Read and retain the T/X/O order |
| P3 | `DROP CRYSTAL` | Dark Archangel begins and the player owns this drop | Create the protection bubble |
| P3 | `MOVE` | Dark Archangel protection ends | Rotate south into the next sector |
| P4 | `LEFT` | Player receives Starsplinter slot 1 | Take the first splinter left |
| P4 | `RIGHT` | Player receives Starsplinter slot 2 | Take the second splinter right |
| P4 | `LEFT` | Player receives Starsplinter slot 3 | Take the third splinter left |
| P4 | `MOVE` | The final Starsplinter of the set detonates | Begin Heaven & Hell relocation |

TTS should call only the player’s actual assignment. For example, a player
without a P4 Starsplinter should not hear `LEFT` or `RIGHT`.

## Sound-effect shopping list

| ID | Mechanic | Desired sound | Length | Reuse |
| --- | --- | --- | --- | --- |
| `laser-charge` | Boss beam telegraph | Low rising energy charge with a clear peak | 1–2s | Intermission and P2 |
| `laser-fire` | Boss beam becomes lethal | Tight, heavy sci-fi laser discharge | 0.4–1s | Intermission, P2, P3 Stars |
| `stars-connect` | P3 Stars lattice connects | Brighter electrical link or arc | 0.5–1s | P3 only |
| `splinter-mark` | Starsplinter assigned | Short crystalline warning/chime | 0.4–0.8s | Intermission and P4 |
| `splinter-detonate` | Starsplinter rays resolve | Sharp six-way energy burst | 0.5–1s | Intermission and P4 |
| `orb-charge` | P2 returning orbs start glowing | Pulsing magical charge | 0.8–1.2s | P2 |
| `orb-return` | P2 orbs jump inward | Fast inward whoosh | 0.5–1s | P2 |
| `pull` | P2 raid pull begins | Sustained suction/wind rise | 2–4s loop | P2 |
| `personal-circle` | P2 spread circles resolve | Soft area pulse, not an explosion | 0.4–0.8s | P2 |
| `soak-progress` | A P3 Soak reaches valid occupancy | Quiet confirming hum | Short loop | P3 |
| `soak-complete` | A P3 Soak finishes | Clean completion pulse | 0.4–0.8s | P3 |
| `rune-reveal` | Each memory rune is shown | Three related tonal notes | 0.25–0.5s each | P3 |
| `rune-match` | Correct rune partner resolves | Positive paired chime | 0.4–0.8s | P3 |
| `archangel-charge` | Dark Archangel begins | Dark sustained beam charge | 1–2s | P3 |
| `protection-active` | Crystal bubble protects raid | Warm shield activation | 0.5–1s | P3 |
| `heaven-hell` | P4 quarter becomes unsafe | Deep sector-wide impact | 0.8–1.5s | P4 |
| `add-destroyed` | Tank cone or splinter destroys an add | Small dry impact | 0.2–0.5s | P4 |
| `mistake` | Non-wipe point loss | Restrained error tick | 0.2–0.4s | All phases |
| `wipe` | Terminal failure | Distinct low failure hit | 0.8–1.5s | All phases |

Prefer WAV or high-quality OGG for short effects. Avoid long reverb tails,
spoken samples, copyrighted franchise sounds, or effects that are already
mixed with music. Normalize them conservatively so repeated laser mechanics do
not become fatiguing.
