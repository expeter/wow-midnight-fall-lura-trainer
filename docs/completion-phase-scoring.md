# CR-225 · Clarify completion phase scoring

Status: **Implemented**

## Problem

The completion screen currently presents every phase card as:

```text
1,000 + the score change during that phase
```

This repeated display baseline makes a flawless run appear to lose points
between phases. For example, these existing phase cards:

```text
Phase 1       1,342 pts
Intermission  1,180 pts
Phase 2       1,329 pts
Phase 3       1,117 pts
Phase 4       1,202 pts
```

represent a valid final score of 2,170 points, because the four additional
1,000-point phase baselines must be removed:

```text
1,342 + 1,180 + 1,329 + 1,117 + 1,202 - 4,000 = 2,170
```

The calculation is correct, but the presentation is ambiguous.

## Requested presentation

Make the primary value on each phase card the cumulative score at the end of
that phase. Show the score change attributable to that phase as an explicitly
labelled secondary value.

| Phase | Primary value | Secondary breakdown |
| --- | ---: | --- |
| Phase 1 | `1,342 pts` | `Phase contribution +342` |
| Intermission | `1,522 pts` | `Phase contribution +180` |
| Phase 2 | `1,851 pts` | `Phase contribution +329` |
| Phase 3 | `1,968 pts` | `Phase contribution +117` |
| Phase 4 | `2,170 pts` | `Phase contribution +202` |

This makes a zero-mistake run rise monotonically while retaining a useful
phase-by-phase breakdown.

## Requirements

- Apply the cumulative presentation consistently to the in-browser result
  screen, copied completion summary, and generated share image.
- Preserve the authoritative final score and every existing scoring rule.
- Do not change server score validation, leaderboards, achievements, encounter
  mechanics, recovery rules, Main Ability scoring, or boss-damage bonuses.
- Continue to show phase duration and recovery status.
- Label the smaller delta explicitly as `Phase contribution`.
- Allow the phase contribution to be negative when that phase contains more
  penalties than rewards.
- Ensure the final phase's cumulative value equals the final result score.
- Keep direct single-phase practice understandable: it begins with the normal
  1,000-point attempt baseline, and its cumulative result remains the final
  practice score.
- Do not describe the current phase-card values as individually additive
  scores during migration or compatibility handling.

## Suggested implementation model

The existing phase result stores its display-normalized value:

```text
phaseValue = 1,000 + endScore - startScore
```

Derive the contribution without changing score accounting:

```text
phaseContribution = phaseValue - 1,000
cumulativeScore = previousCumulativeScore + phaseContribution
```

Initialize `previousCumulativeScore` to 1,000 for the first phase. Prefer a
shared presentation helper so the browser result, copied text, and canvas
image cannot drift apart.

## Regression coverage

Add focused tests proving that:

1. Phase values no longer visually reset to 1,000 on every card.
2. Contributions of `+342`, `+180`, `+329`, `+117`, and `+202` render as the
   cumulative sequence `1,342 -> 1,522 -> 1,851 -> 1,968 -> 2,170`.
3. The final cumulative phase value equals the authoritative final score.
4. A negative phase contribution renders with its minus sign and reduces the
   next cumulative value correctly.
5. The browser result, copied summary, and generated share-image data use the
   same derived values.
6. Direct single-phase practice retains its normal 1,000-point starting
   baseline and final score.

## Completion condition

Mark `CR-225` implemented only after the focused scoring/presentation tests
pass. This ticket intentionally changes presentation only. The shared
presentation helper and focused browser regression now cover the result card,
copied text, generated image data, Run-ID proof JSON, negative contributions,
and direct-phase baseline.
