#!/usr/bin/env python3
"""Generate local CMU Flite voice-command auditions.

This intentionally uses only Python's standard library. Ubuntu's libflite1
package includes the shared voices but not the `flite` CLI or development
headers, so ctypes calls the small public Flite API directly. ffmpeg performs
the reproducible trim/fade/loudness pass.
"""

from __future__ import annotations

import argparse
import ctypes
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_LIB_DIR = Path("/usr/lib/x86_64-linux-gnu")
COMMANDS = ("left", "right", "move")
VOICES = {
    "slt": "cmu_us_slt",
    "rms": "cmu_us_rms",
    "awb": "cmu_us_awb",
    "kal": "cmu_us_kal",
    "kal16": "cmu_us_kal16",
}


def load_library(path: Path) -> ctypes.CDLL:
    if not path.exists():
        raise FileNotFoundError(path)
    return ctypes.CDLL(str(path), mode=ctypes.RTLD_GLOBAL)


def synthesize(lib_dir: Path, voice_key: str, text: str, output: Path) -> None:
    # Voice libraries resolve symbols from these dependencies at load time.
    flite = load_library(lib_dir / "libflite.so.2.2")
    load_library(lib_dir / "libflite_usenglish.so.2.2")
    load_library(lib_dir / "libflite_cmulex.so.2.2")
    voice_name = VOICES[voice_key]
    voice_lib = load_library(lib_dir / f"libflite_{voice_name}.so.2.2")

    flite.flite_init.argtypes = []
    flite.flite_init.restype = None
    flite.flite_text_to_wave.argtypes = [ctypes.c_char_p, ctypes.c_void_p]
    flite.flite_text_to_wave.restype = ctypes.c_void_p
    flite.cst_wave_save.argtypes = [
        ctypes.c_void_p,
        ctypes.c_char_p,
        ctypes.c_char_p,
    ]
    flite.cst_wave_save.restype = ctypes.c_int
    flite.delete_wave.argtypes = [ctypes.c_void_p]
    flite.delete_wave.restype = None

    register = getattr(voice_lib, f"register_{voice_name}")
    register.argtypes = [ctypes.c_char_p]
    register.restype = ctypes.c_void_p

    flite.flite_init()
    voice = register(None)
    if not voice:
        raise RuntimeError(f"Flite could not register voice {voice_key}")
    wave = flite.flite_text_to_wave(text.encode("utf-8"), voice)
    if not wave:
        raise RuntimeError(f"Flite could not synthesize {voice_key}: {text}")
    try:
        result = flite.cst_wave_save(
            wave, str(output).encode("utf-8"), b"riff"
        )
        if result != 0:
            raise RuntimeError(f"Flite could not save {output} (status {result})")
    finally:
        flite.delete_wave(wave)


def polish(ffmpeg: str, source: Path, output: Path, speed: float = 1) -> None:
    # Keep a tiny leading cushion for reliable instant playback, remove the
    # long Flite tail, and make comparisons similar in perceived loudness.
    audio_filter = (
        "silenceremove="
        "start_periods=1:start_duration=0:start_threshold=-50dB:"
        "start_silence=0.012:"
        "stop_periods=-1:stop_duration=0:stop_threshold=-50dB:"
        "stop_silence=0.055,"
        + (f"atempo={speed}," if speed != 1 else "")
        +
        "afade=t=in:st=0:d=0.008,"
        "loudnorm=I=-20:TP=-2:LRA=7"
    )
    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-af",
            audio_filter,
            "-ac",
            "1",
            "-ar",
            "44100",
            "-c:a",
            "pcm_s16le",
            str(output),
        ],
        check=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lib-dir", type=Path, default=DEFAULT_LIB_DIR)
    parser.add_argument("--output-dir", type=Path, default=HERE / "audio")
    args = parser.parse_args()

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        parser.error("ffmpeg is required")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="lura-voice-board-") as temp:
        temp_dir = Path(temp)
        for voice_key in VOICES:
            for command in COMMANDS:
                raw = temp_dir / f"{voice_key}-{command}-raw.wav"
                final = args.output_dir / f"{voice_key}-{command}.wav"
                synthesize(args.lib_dir, voice_key, command.capitalize(), raw)
                polish(ffmpeg, raw, final, 1.14 if voice_key == "slt" and command == "move" else 1)
                print(final.relative_to(HERE))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
