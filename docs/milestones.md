# Delivery milestones

This is the maintained grouping of open tickets. Individual requirements and
status remain authoritative in [`README.md`](README.md); stable behavior lives
in [`specifications.md`](specifications.md).

## Current release boundary

- Latest tagged release: `v0.6.0`.
- The deployed branch also contains the post-v0.6 HUD-action, live-activity,
  feedback, profile, and ranking changes listed under `Unreleased`.
- The next feature release is expected to be `v0.7.0`, but the version is cut
  only after its selected milestone scope passes focused and complete
  regression.
- Current leaderboard season: `season-1`. No milestone or SemVer bump changes
  it automatically.

## M1 · Encounter completion

Goal: finish the remaining encounter mechanics and reconcile the NPC strategy,
visual state, collision, scoring, and accepted-run rules.

This is the next implementation milestone and today's priority.

### Phase 2 and Phase 3

Implement in dependency order:

1. `FR-050` — choose four non-crystal beam players per Phase 2 set and make
   their continuously orbiting orb interception authoritative.
2. `FR-049` — return actors to their personal-circle positions at Phase 2 end
   and launch each one outward from that position into Phase 3.
3. `FR-048` — drop and recover the landing trio's crystal, then make the
   crystal carrier and one helper cover one opening Soak while the controlled
   player resolves the other.
4. `CR-051` — swap the second Phase 3 sequence's ground Soak and memory-game
   order after the exact overlap timing is confirmed.

### Phase 4 roles

Implement in dependency order:

1. `FR-022` — make the front tank cone playable when the controlled player owns
   that role, retaining the existing NPC behavior otherwise.
2. `FR-023` — randomize protection-zone ownership between player and NPC and
   make the raid follow the rendered carrier.

All six tickets affect mechanic difficulty, failures, scoring, or accepted-run
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

This milestone is not leaderboard-visible when its localhost boundary remains
strict.

## M4 · Easter egg and activity polish

Goal: add optional flavor only after encounter and ranking correctness.

- `FR-039` — live `Gnomkaiser` crown, raid scale treatment, and hidden
  achievement.
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
