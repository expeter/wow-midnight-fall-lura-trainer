# L'ura Trainer agent handoff

Before changing the trainer, read:

1. [`docs/maintainer-handoff.md`](docs/maintainer-handoff.md)
2. [`docs/specifications.md`](docs/specifications.md)
3. [`docs/p1-encounter.md`](docs/p1-encounter.md) for Phase 1 work
4. [`docs/README.md`](docs/README.md) for ticket history and open work

Every new request receives a stable `FR`, `CR`, `BUG`, or `SPEC` ID in
`docs/README.md` before implementation. Mark it implemented only after focused
regression coverage passes. Commit each verified request or coherent ticket
batch; do not push unless the user asks.

Do not change encounter mechanics merely to make a test pass. Rendering,
collision, NPC movement, timers, raid-plan assignments, and the documented
encounter contract must agree.
