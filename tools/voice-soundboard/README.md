# Lura voice soundboard

This is an isolated local audition tool. It does not replace the production
clips in `sounds/tts/`, and it is not imported by the game. It also presents
the current spell-effect candidates from `sounds/` without wiring them into
encounter mechanics.

Open `index.html` in a browser to compare individual **Left**, **Right**, and
**Move** commands. Each voice also has a left–right–left preview scheduled on
the Web Audio clock at `0.000s`, `1.000s`, and `2.000s`; this avoids the timing
drift of chained media-element playback. Notes, the preferred voice, and the
SFX shortlist are saved only in that browser's local storage. **Copy review**
exports that feedback as plain text.

Some browsers restrict `file://` audio loading. If the clips do not play, serve
this directory locally:

```sh
python3 -m http.server 8090
```

Then open <http://localhost:8090/tools/voice-soundboard/>. Serving the
repository root is required so the board can load the candidate files from
`sounds/`. Existing review data from the old URL remains available because
browser local storage belongs to the same `localhost:8090` origin.

## Spell-effect candidates

The lower board currently compares five locally supplied candidates:

| Candidate | Suggested mechanic |
| --- | --- |
| Arcane laser | Boss beams in P1/P2/P3 |
| Light cast | Cast completion, rune, or crystal activation |
| Magical whoosh | Starsplinter launch or returning orbs |
| Small bell | Soak or memory-game success |
| Error pulse | Mistake or wipe feedback |

Selection is intentionally separate from production integration. A shortlisted
clip still needs its source/license recorded before it is shipped with the
game.

## Candidates

| Key | Installed CMU voice | Audition character |
| --- | --- | --- |
| `slt` | CMU US SLT | Clear US female; smooth and compact |
| `rms` | CMU US RMS | Low US male; firm and authoritative |
| `awb` | CMU US AWB | Scottish male; distinct and characterful |
| `kal` | CMU US KAL | US male diphone; lean, retro, very direct |
| `kal16` | CMU US KAL16 | US male diphone; fuller KAL rendering |

Character descriptions are listening aids, not quality rankings. The soundboard
is designed to make the choice in context.

## Reproduce the clips

Prerequisites on this machine are the Ubuntu `libflite1` package and `ffmpeg`.
Regenerate all 15 clips from the repository root:

```sh
python3 tools/voice-soundboard/generate.py
```

The script calls the installed Flite 2.2 shared-library API through Python
`ctypes`, then uses `ffmpeg` to trim silence, add a short anti-click fade,
normalize loudness, and emit 44.1 kHz mono 16-bit PCM WAV files. Generated
files live only in `tools/voice-soundboard/audio/`.

## Source and licensing

The speech is generated with **CMU Flite**, the small run-time speech synthesis
engine from Carnegie Mellon University's Speech Group. Flite and the included
CMU voice data are distributed under a BSD-style permissive license. The
installed Ubuntu package ships its exact license text at:

```text
/usr/share/doc/libflite1/copyright
```

Upstream project and source: <https://github.com/festvox/flite>

Before redistributing chosen audio outside this project, retain the applicable
Flite/voice attribution and confirm the packaged copyright file for the exact
installed version.
