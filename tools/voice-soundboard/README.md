# Lura voice soundboard

This is an isolated local audition tool. It does not replace the production
clips in `sounds/tts/`, and it is not imported by the game. It also presents
the current spell-effect candidates from `sounds/` without wiring them into
encounter mechanics.

Open `index.html` in a browser to compare individual **Left**, **Right**, and
**Move** commands. Each voice also has a left–right–left preview scheduled on
the Web Audio clock at `0.000s`, `1.000s`, and `2.000s`; this avoids the timing
drift of chained media-element playback. Notes, the preferred voice, and the
20-row encounter table are saved only in that browser's local storage.
Fourteen active rows compare the strongest prior candidate with three new
dark-arcane variants; the other six rows preserve the review decision to use no
effect. Candidate buttons show their exact duration. **Copy review** exports
the complete decision table as Markdown in one pass.

Some browsers restrict `file://` audio loading. If the clips do not play, serve
this directory locally:

```sh
python3 -m http.server 8090 --directory tools/voice-soundboard
```

Then open <http://localhost:8090>. All audition derivatives live inside this
tool, so playback does not depend on paths outside the served directory.

## Spell-effect review table

The lower board maps the complete SPEC-009 shopping list. The second audition
pass uses encounter-length variants: 2.8 seconds for a boss-beam charge, one
second for returning-orb travel, three seconds for the optional Soak hum, five
seconds for Dark Archangel, and compact sub-second resolution cues. The
deterministic `Veil`, `Rift`, and `Abyss` treatments share a dark arcane palette
without being identical.

| Group | Supplied starting point | Original alternatives |
| --- | --- | --- |
| Lasers & beams | Magical Whoosh | Void Sweep, Prismatic Cut, Arc Burn |
| P2 returning orbs | Arcane Laser | Orb Recall, Gravity Pearl, Celestial Return |
| Main Ability release | Louder Light Cast | Arcane Release, Crystal Spark, Spell Impact |
| Mechanic success | Small Bell | Rune Clear, Soak Complete, Crystal Chime |
| Mistake & wipe | Faster Error Pulse | Void Warning, Rune Fail, Crystal Danger |

Selection is intentionally separate from production integration. A selected
clip still needs its source/license recorded before it is shipped with the
game. Existing browser shortlist choices migrate into the first matching table
rows and remain gold-outlined for reference.

Regenerate all SFX derivatives from the repository root:

```sh
python3 tools/voice-soundboard/generate_sfx.py
```

The custom alternatives are synthesized deterministically with Python's
standard library. `ffmpeg` trims, accelerates, and normalizes the supplied
audition sources. SLT's `Move` command is also generated 14% tighter than its
other words in `generate.py`, following the first listening review.

## Review carried into this revision

- SLT is the preferred speech voice; its original `Move` felt too relaxed.
- Magical Whoosh belongs with lasers and beams.
- Arcane Laser belongs with P2's flying/returning orbs.
- Light Cast remains a possible Main Ability release and is auditioned with a
  2× louder normalized master.
- Error Pulse has the right character but needed a trimmed, faster attack.
- Error Pulse is the initial selection for ordinary mistake feedback.

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
