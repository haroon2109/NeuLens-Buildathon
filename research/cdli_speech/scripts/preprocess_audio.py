#!/usr/bin/env python3
"""Preprocess speech recordings and build a manifest (CDLI/open datasets, research use).

- Converts audio to mono WAV at target sample rate
- Builds manifest.csv with paths and (optional) joined metadata/transcripts
- Generic over dataset layouts; adjust --glob/--metadata-file/--join-key per resource

Not Alzheimer's-labelled. Verify individual dataset licences/terms and record provenance.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
import soundfile as sf
from tqdm import tqdm

AUDIO_EXTS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".webm", ".aac", ".wma"}


def load_audio(path: Path, sr: int) -> np.ndarray:
    try:
        import librosa  # type: ignore

        y, _ = librosa.load(str(path), sr=sr, mono=True)
        return y.astype(np.float32)
    except Exception:
        data, file_sr = sf.read(str(path), always_2d=False)
        y = np.asarray(data, dtype=np.float32)
        if y.ndim > 1:
            y = np.mean(y, axis=1)
        if file_sr != sr and len(y) > 0:
            try:
                import librosa  # type: ignore

                y = librosa.resample(y, orig_sr=file_sr, target_sr=sr).astype(np.float32)
            except Exception:
                x_old = np.linspace(0, 1, num=len(y), endpoint=False)
                x_new = np.linspace(0, 1, num=max(1, int(len(y) * sr / file_sr)), endpoint=False)
                y = np.interp(x_new, x_old, y).astype(np.float32)
        return y


def load_metadata(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in {".tsv", ".tab"}:
        return pd.read_csv(path, sep="\t", dtype=str).fillna("")
    return pd.read_csv(path, dtype=str).fillna("")


def main() -> int:
    p = argparse.ArgumentParser(description="Preprocess speech audio to mono WAV + manifest")
    p.add_argument("--input-dir", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--metadata-file", default="", help="Optional CSV/TSV metadata or transcripts to join")
    p.add_argument("--join-key", default="", help="Metadata column to join on (matched against audio filename/stem/path). Auto-detected if empty.")
    p.add_argument("--sample-rate", type=int, default=16000)
    p.add_argument("--max-clips", type=int, default=0)
    p.add_argument("--glob", default="**/*")
    args = p.parse_args()

    in_dir = Path(args.input_dir)
    out_dir = Path(args.out_dir)
    wav_dir = out_dir / "wav"
    wav_dir.mkdir(parents=True, exist_ok=True)

    meta_index: Dict[str, dict] = {}
    meta_cols: List[str] = []
    if args.metadata_file:
        mpath = Path(args.metadata_file)
        if mpath.exists():
            mdf = load_metadata(mpath)
            meta_cols = list(mdf.columns)
            candidates = [args.join_key] if args.join_key else ["filename", "file", "path", "audio", "clip", "id", "recording", "wav", meta_cols[0] if meta_cols else ""]
            key_col = next((c for c in candidates if c and c in mdf.columns), (meta_cols[0] if meta_cols else None))
            if key_col:
                for _, row in mdf.iterrows():
                    key = str(row.get(key_col, "")).strip()
                    if not key:
                        continue
                    d = row.to_dict()
                    meta_index[key] = d
                    meta_index[Path(key).name] = d
                    meta_index[Path(key).stem] = d

    files = [f for f in sorted(in_dir.glob(args.glob)) if f.is_file() and f.suffix.lower() in AUDIO_EXTS]
    if args.max_clips and len(files) > args.max_clips:
        files = files[: args.max_clips]

    rows: List[dict] = []
    for src in tqdm(files, desc="preprocess"):
        try:
            y = load_audio(src, args.sample_rate)
            rel = src.relative_to(in_dir) if src.is_relative_to(in_dir) else Path(src.name)
            safe = str(rel.with_suffix("")).replace("/", "_").replace("\\", "_") + ".wav"
            out_path = wav_dir / safe
            sf.write(out_path, y, args.sample_rate)
            m = meta_index.get(src.name) or meta_index.get(src.stem) or meta_index.get(str(rel)) or {}
            row = {
                "path": str(out_path.relative_to(out_dir)),
                "source_file": str(src),
                "source_name": src.name,
                "duration_sec": round(len(y) / args.sample_rate, 4) if args.sample_rate else "",
            }
            for k, v in m.items():
                if k not in row:
                    row[k] = v
            rows.append(row)
        except Exception as e:
            rows.append({"path": "", "source_file": str(src), "source_name": src.name, "error": str(e)})

    keys: List[str] = []
    for r in rows:
        for k in r.keys():
            if k not in keys:
                keys.append(k)
    manifest_path = out_dir / "manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"Done. Wrote {len(rows)} rows to {manifest_path}, WAVs in {wav_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
