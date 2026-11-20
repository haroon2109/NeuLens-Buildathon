#!/usr/bin/env python3
"""Preprocess audio clips for speech preprocessing/language experiments.

- Loads audio files (mp3/wav/flac/ogg/etc via librosa/audioread/soundfile as available)
- Converts to mono, resamples to target sample rate (default 16 kHz)
- Writes WAV files and a manifest CSV
- Optionally joins metadata from a Common Voice TSV (validated.tsv) by clip filename

Research use only. Keep data/provenance out of git.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
import soundfile as sf
from tqdm import tqdm

AUDIO_EXTS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm"}


def load_audio(path: Path, sr: int) -> np.ndarray:
    try:
        import librosa  # type: ignore

        y, _ = librosa.load(str(path), sr=sr, mono=True)
        return y.astype(np.float32)
    except Exception:
        # fallback: soundfile (may not resample or read mp3 without libsndfile codecs)
        data, file_sr = sf.read(str(path), always_2d=False)
        y = np.asarray(data, dtype=np.float32)
        if y.ndim > 1:
            y = np.mean(y, axis=1)
        if file_sr != sr:
            try:
                import librosa  # type: ignore

                y = librosa.resample(y, orig_sr=file_sr, target_sr=sr).astype(np.float32)
            except Exception:
                # simple linear resample fallback
                if len(y) == 0:
                    return y
                x_old = np.linspace(0, 1, num=len(y), endpoint=False)
                x_new = np.linspace(0, 1, num=int(len(y) * sr / file_sr), endpoint=False)
                y = np.interp(x_new, x_old, y).astype(np.float32)
        return y


def main() -> int:
    p = argparse.ArgumentParser(description="Resample/preprocess audio clips to mono WAV + manifest")
    p.add_argument("--input-dir", required=True, help="Directory containing audio clips")
    p.add_argument("--out-dir", required=True, help="Output directory (wav/ and manifest.csv)")
    p.add_argument("--metadata-tsv", default="", help="Optional Common Voice TSV (e.g. validated.tsv) to join by filename/path")
    p.add_argument("--sample-rate", type=int, default=16000)
    p.add_argument("--max-clips", type=int, default=0, help="0 = all")
    p.add_argument("--glob", default="**/*", help="Glob under input-dir")
    args = p.parse_args()

    in_dir = Path(args.input_dir)
    out_dir = Path(args.out_dir)
    wav_dir = out_dir / "wav"
    wav_dir.mkdir(parents=True, exist_ok=True)

    meta: Dict[str, dict] = {}
    if args.metadata_tsv:
        tsv_path = Path(args.metadata_tsv)
        if tsv_path.exists():
            df = pd.read_csv(tsv_path, sep="\t", dtype=str).fillna("")
            # common voice has 'path' column with filename
            key_col = "path" if "path" in df.columns else df.columns[0]
            for _, row in df.iterrows():
                key = str(row.get(key_col, "")).strip()
                if key:
                    meta[key] = row.to_dict()
                    meta[Path(key).name] = row.to_dict()

    files = [p for p in sorted(in_dir.glob(args.glob)) if p.is_file() and p.suffix.lower() in AUDIO_EXTS]
    if args.max_clips and len(files) > args.max_clips:
        files = files[: args.max_clips]

    rows: List[dict] = []
    for src in tqdm(files, desc="preprocess"):
        try:
            y = load_audio(src, args.sample_rate)
            rel = src.relative_to(in_dir) if src.is_relative_to(in_dir) else Path(src.name)
            out_name = rel.with_suffix(".wav").name if rel.parent == Path('.') else (str(rel.with_suffix("")).replace("/", "_").replace("\\", "_") + ".wav")
            out_path = wav_dir / out_name
            sf.write(out_path, y, args.sample_rate)
            m = meta.get(src.name) or meta.get(str(rel)) or {}
            row = {"path": str(out_path.relative_to(out_dir)), "source_file": str(src), "duration_sec": round(len(y) / args.sample_rate, 4) if args.sample_rate else ""}
            # carry common fields if present
            for k in ["sentence", "text", "client_id", "accent", "locale", "age", "gender", "up_votes", "down_votes"]:
                if k in m:
                    row[k] = m[k]
            if "sentence" in row and "text" not in row:
                row["text"] = row["sentence"]
            rows.append(row)
        except Exception as e:
            rows.append({"path": "", "source_file": str(src), "error": str(e)})

    manifest_path = out_dir / "manifest.csv"
    # collect all keys
    keys = []
    for r in rows:
        for k in r.keys():
            if k not in keys:
                keys.append(k)
    with manifest_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"Done. Wrote {len(rows)} rows to {manifest_path}, WAVs in {wav_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
