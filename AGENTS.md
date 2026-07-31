# L'ura Trainer agent handoff

Before changing the trainer, read:

1. [`docs/maintainer-handoff.md`](docs/maintainer-handoff.md)
2. [`docs/specifications.md`](docs/specifications.md)
3. [`docs/p1-encounter.md`](docs/p1-encounter.md) for Phase 1 work
4. [`docs/README.md`](docs/README.md) for ticket history and open work
5. [`docs/milestones.md`](docs/milestones.md) for delivery order and release
   grouping

Every new request receives a stable `FR`, `CR`, `BUG`, or `SPEC` ID in
`docs/README.md` before implementation. Mark it implemented only after focused
regression coverage passes and its affected documentation is current. Do not
leave completed work recorded as open or silently drop an unresolved ticket.
Add every user-visible change to `CHANGELOG.md` under `Unreleased` in the same
change, then choose and apply the correct SemVer bump when cutting a release.
Commit each verified request or coherent ticket batch; do not push unless the
user asks.

This workspace uses the configured GitHub MCP for GitHub repository state,
Actions runs, job logs, reruns, and deployment monitoring. Do not probe for or
use `gh`, and do not invoke the Yeet workflow. When the user explicitly asks to
publish, local `git push` is the transport; hand the subsequent GitHub Actions
and production watch to a background agent using MCP so implementation work can
continue in parallel.

Never change the leaderboard season without the user's explicit approval.
When mechanics, scoring, achievement eligibility, validation, or accepted-run
comparability may affect rankings, warn the user and ask whether a new season
is wanted. A SemVer release never implies a leaderboard-season change.

Use `./scripts/test-e2e-focused.sh <preset-or-free-text>` for focused
Playwright regressions. Do not bypass it with direct `npx playwright` or ad-hoc
grep commands; the wrapper owns the repository-local browser path, server, and
zero-retry policy. Use `npm run test:e2e:local` only when the complete browser
suite or Playwright arguments outside the focused wrapper are required.

Do not change encounter mechanics merely to make a test pass. Rendering,
collision, NPC movement, timers, raid-plan assignments, and the documented
encounter contract must agree.
