# Phase 4 timing voice

The short `left.wav`, `right.wav`, and `move.wav` files are deterministic
English timing cues generated locally with CMU Flite’s `cmu_us_slt` voice.
They are trimmed copies of synthesized output, not source voice databases or
Flite binaries.

Flite is maintained by Carnegie Mellon University and distributed under its
permissive license. Project and license:

- https://github.com/festvox/flite

The source used to reproduce these cues is
[`scripts/generate-flite-cues.c`](../../scripts/generate-flite-cues.c).
