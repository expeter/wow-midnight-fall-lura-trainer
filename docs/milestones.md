# Delivery milestones

This is the maintained grouping of open tickets. Individual requirements and
status remain authoritative in [`README.md`](README.md); stable behavior lives
in [`specifications.md`](specifications.md).

## Current release boundary

- Latest tagged and deployed release line: `v0.9.2`.
- `v0.9.2` pins released Phase 2 cross beams to the raid markers while keeping
  the moving-target beam mechanic and two-tank roles in localhost preview.
- Current leaderboard season: `season-1`. No milestone or SemVer bump changes
  it automatically.

## M0 · Online identity hotfix

Goal: ensure a run that starts authenticated remains attributable and that the
shell never silently mistakes an expired server session for a valid login.

- `BUG-145` — revalidate before issuance, bind the full run and its wipes to
  the issued attempt capability, reject stale-session anonymous downgrades, and
  align API/client version acceptance at `0.6.2`.
- `CR-194` — open public Recent activity identities in their trainer profile
  instead of navigating directly to Raider.IO.
- `BUG-148` — show whether the next pull is a verified attempt, deliberately
  anonymous, or local because the signed-in account lacks an active character.
- `CR-196` — show the played raid-plan name and selected verified Battle.net
  character together on the controlled-player nameplate without implying
  attribution when no active character is selected.
- `BUG-149` — keep a transition-started Phase 2 crystal grounded throughout
  the beam/orb event, matching direct entry and every difficulty.

This patch retains `season-1`: it repairs attribution and version acceptance
without changing encounter scoring or ranking order.

## M1 · Encounter completion

Goal: finish the remaining encounter mechanics and reconcile the NPC strategy,
visual state, collision, scoring, and accepted-run rules.

This is the next implementation milestone and today's priority.

### Phase 2 and Phase 3

Implement in dependency order:

1. `FR-048` — drop and recover the landing trio's crystal, then make the
   crystal carrier and one helper cover one opening Soak while the controlled
   player resolves the other.
2. `CR-051` — swap the second Phase 3 sequence's ground Soak and memory-game
   order after the exact overlap timing is confirmed.

Implemented for localhost review in this milestone:

- `CR-198` — every ordinary dropped crystal now follows the global one-second
  pickup and six-second explosion lifecycle, with only a correctly committed
  P3 protection crystal exempt.
- `FR-050` — four random non-crystal beam assignees now intercept four
  continuously orbiting unresolved orbs per set, with rendered player aim and
  a terminal miss rule.
- `FR-049` — the final Phase 2 regroup now uses configured personal circles,
  and each visible actor position becomes that actor's Phase 3 flight origin.

### Phase 4 roles

Completed in this milestone:

- `BUG-150` — the NPC tank now holds the rendered group position throughout an
  active three-Starsplinter set and resumes its frontal route afterward.
- `FR-068` — two explicit shared tank assignments drive the localhost P1/P2/P3
  Heaven's Lance mitigation/swap loop. This incorporates the playable-cone
  foundation previously tracked separately by `FR-022`; `CR-195` finalizes
  which configured tank owns each Phase 4 role.
- `FR-023` — superseded by deterministic two-tank ownership under `CR-195`.
- `CR-195` — on localhost, Tank 1 owns the frontal cone, Tank 2 owns the moving rendered
  protection zone, neither receives Starsplinter, and each controlled role has
  its own canonical achievement.
- `BUG-152` — public hosts retain the released pre-tank behavior while the
  complete tank-role implementation remains available for local validation.
- `CR-197` — full-journey achievements now require Phase 1 through Phase 4 and
  cumulative/multi-run badges display their saved progress.

All current M1 tickets affect mechanic difficulty, failures, scoring, or accepted-run
comparability. Before releasing this milestone, explicitly ask whether it
starts a new leaderboard season. Until the user says otherwise, retain
`season-1`.

## M2 · Ranking and achievement integrity — completed

Goal: make every public position, crown, profile, and lifetime achievement
agree before another SemVer release can mix results into the current season.

- `BUG-136` — one best run per account and board.
- `BUG-137` — stable authoritative ranks while searching run boards.
- `BUG-138` — actual phase-clear counts and full-run-only streaks.
- `BUG-139` — issued-configuration validation and idempotent completion retry.
- `BUG-140` — rate-limit attempt issuance.
- `BUG-141` — never expose a linked guild from alias identity.
- `BUG-142` — one current-season scope for public, personal, and profile ranks.
- `BUG-143` — award the missing browser-local flawless Phase 1 achievement.
- `SPEC-016` — retain `season-1` while making rank-one achievement points
  permanent, account-deduplicated, and finite.

Completed under `BUG-136`–`BUG-143` and `SPEC-016`. The repairs retain
`season-1`. Their visible ranking and lifetime-point effects still require the
explicit leaderboard reminder before a release.

## M3 · Developer and test tooling

Goal: make local verification faster without creating production bypasses.

- `FR-051` — remove avoidable runner warnings while retaining real diagnostics.
- `FR-038` — localhost-only `Gnomkaiser` admin mode for completion and
  achievement testing.
- `FR-067` — add a private, rate-limited live bug-report inbox with an audited
  promotion path to GitHub.
- `CR-199` — provide one stable local focused-Playwright wrapper with named
  regression presets and a free-text fallback.

This milestone is not leaderboard-visible. `FR-067` is a production support
surface, but it does not alter encounter or ranking behavior.

## M4 · Easter egg and activity polish

Goal: add optional flavor only after encounter and ranking correctness.

- `FR-039` — live `Gnomkaiser` crown, raid scale treatment, and hidden
  achievement.
- `FR-069` — API-only manually granted exceptional achievements, beginning
  with the hidden 10-point Find a Bug badge and concealed public credentials.
- `FR-066` — clearly fictional live-activity flavor using the prepared copy
  deck after frequency, injection, accessibility, and localization decisions.

`FR-039` changes achievement eligibility and therefore needs a leaderboard
season reminder before release. `FR-066` must remain visibly distinct from
verified player events and must never write fictional records into the API.

## Documentation milestone

`SPEC-015` owns the current specification/inventory/API reconciliation and this
milestone register. It is complete only when:

- the feature inventory matches the shipped trainer;
- the API document matches deployed routes and operations while listing known
  deviations as tickets;
- released Phase 1 tickets no longer claim localhost-only status;
- every open ticket appears in exactly one milestone;
- `CHANGELOG.md` contains the post-v0.6 work under `Unreleased`.
