#!/usr/bin/env python3
"""Build deterministic Lura SFX auditions plus polished supplied candidates."""

from __future__ import annotations

import math
import random
import shutil
import struct
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUTPUT = HERE / "sfx"
RATE = 44_100


@dataclass(frozen=True)
class Tone:
    start: float
    duration: float
    frequency: float
    end_frequency: float
    gain: float
    wobble: float = 0


SOUNDS: dict[str, tuple[float, list[Tone], float]] = {
    "laser-void-sweep": (.72, [Tone(0, .72, 1700, 260, .55, 34), Tone(.02, .56, 820, 1850, .3, 17)], .09),
    "laser-prismatic-cut": (.48, [Tone(0, .48, 2450, 680, .48, 55), Tone(.04, .32, 3900, 1500, .22)], .045),
    "laser-arc-burn": (.64, [Tone(0, .64, 430, 2900, .42, 23), Tone(.12, .42, 2200, 520, .34, 41)], .075),
    "orb-orb-recall": (.82, [Tone(0, .82, 240, 1160, .42, 11), Tone(.18, .6, 610, 2100, .28, 29)], .035),
    "orb-gravity-pearl": (.7, [Tone(0, .7, 880, 190, .44, 19), Tone(.2, .48, 310, 1260, .28)], .04),
    "orb-celestial-return": (.94, [Tone(0, .94, 190, 780, .34, 8), Tone(.22, .7, 520, 1520, .27, 22)], .055),
    "cast-arcane-release": (.42, [Tone(0, .42, 310, 2200, .52, 24), Tone(.12, .28, 1200, 3400, .3)], .065),
    "cast-crystal-spark": (.34, [Tone(0, .34, 1800, 4200, .4, 66), Tone(.04, .22, 950, 2700, .32)], .025),
    "cast-spell-impact": (.5, [Tone(0, .22, 160, 720, .52), Tone(.12, .38, 980, 190, .42, 15)], .11),
    "success-rune-clear": (.58, [Tone(0, .45, 740, 740, .34), Tone(.12, .42, 1110, 1110, .3), Tone(.24, .3, 1480, 1480, .25)], .01),
    "success-soak-complete": (.66, [Tone(0, .5, 520, 680, .32), Tone(.14, .48, 780, 1040, .29), Tone(.3, .32, 1170, 1560, .24)], .012),
    "success-crystal-chime": (.76, [Tone(0, .7, 920, 940, .3, 3), Tone(.08, .6, 1380, 1400, .24), Tone(.2, .48, 1840, 1860, .2)], .008),
    "error-void-warning": (.42, [Tone(0, .42, 260, 150, .54, 12), Tone(.05, .32, 620, 240, .26)], .08),
    "error-rune-fail": (.34, [Tone(0, .15, 940, 410, .45), Tone(.17, .17, 760, 260, .45)], .055),
    "error-crystal-danger": (.54, [Tone(0, .54, 180, 180, .42, 46), Tone(.03, .48, 370, 190, .29, 31)], .085),
}

SUPPLIED = {
    "laser-magical-whoosh": ("u_hyed0v3ux9-magical-whoosh-148459.mp3", "atrim=start=0.02:end=0.95,afade=t=in:d=0.008,afade=t=out:st=0.82:d=0.13,loudnorm=I=-17:TP=-1:LRA=6"),
    "orb-arcane-laser": ("freesound_community-rayo-laser-101851.mp3", "atrim=start=0.08:end=1.35,atempo=1.08,afade=t=in:d=0.008,afade=t=out:st=1.05:d=0.15,loudnorm=I=-17:TP=-1:LRA=6"),
    "cast-light-loud": ("u_o6py8docsy-cast-light-288736.mp3", "atrim=start=0.02:end=1.1,volume=2,afade=t=in:d=0.008,afade=t=out:st=0.9:d=0.12,loudnorm=I=-15:TP=-0.5:LRA=5"),
    "success-small-bell": ("oxidvideos-ding-small-bell-sfx-411945.mp3", "atrim=start=0.02:end=0.65,afade=t=out:st=0.52:d=0.1,loudnorm=I=-18:TP=-1:LRA=6"),
    "error-pulse-fast": ("rikk_nextsoft-error_sound-221445.mp3", "atrim=start=0.1:end=0.92,atempo=1.18,afade=t=in:d=0.005,afade=t=out:st=0.58:d=0.1,loudnorm=I=-16:TP=-1:LRA=5"),
}


def envelope(age: float, duration: float) -> float:
    attack = min(1, age / .012)
    release = min(1, max(0, duration - age) / min(.16, duration * .35))
    return attack * release


def synthesize(name: str, duration: float, tones: list[Tone], noise_gain: float) -> None:
    rng = random.Random(f"lura-{name}")
    samples: list[bytes] = []
    phases = [0.0 for _ in tones]
    total = round(duration * RATE)
    for index in range(total):
        age = index / RATE
        value = 0.0
        for tone_index, tone in enumerate(tones):
            local = age - tone.start
            if local < 0 or local >= tone.duration:
                continue
            progress = local / tone.duration
            frequency = tone.frequency + (tone.end_frequency - tone.frequency) * progress
            frequency *= 1 + math.sin(local * math.tau * tone.wobble) * .025 if tone.wobble else 1
            phases[tone_index] += math.tau * frequency / RATE
            value += math.sin(phases[tone_index]) * tone.gain * envelope(local, tone.duration)
        noise = (rng.random() * 2 - 1) * noise_gain * envelope(age, duration)
        value = math.tanh((value + noise) * 1.45) * .86
        samples.append(struct.pack("<h", round(value * 32767)))
    with wave.open(str(OUTPUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b"".join(samples))


def polish_supplied(ffmpeg: str, name: str, source_name: str, audio_filter: str) -> None:
    source = ROOT / "sounds" / source_name
    if not source.exists():
        raise FileNotFoundError(source)
    subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-af", audio_filter, "-ac", "1", "-ar", str(RATE), "-c:a", "pcm_s16le",
        str(OUTPUT / f"{name}.wav"),
    ], check=True)


def main() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (duration, tones, noise_gain) in SOUNDS.items():
        synthesize(name, duration, tones, noise_gain)
        print((OUTPUT / f"{name}.wav").relative_to(HERE))
    for name, (source, audio_filter) in SUPPLIED.items():
        polish_supplied(ffmpeg, name, source, audio_filter)
        print((OUTPUT / f"{name}.wav").relative_to(HERE))


if __name__ == "__main__":
    main()
