#!/usr/bin/env python3
"""Export a subset of Mozilla Common Voice from Hugging Face datasets to WAV + manifest.

Research/preprocessing use only. Not a dementia dataset.
Check the current Common Voice/HF dataset release licence and speaker-data terms before use.

Example:
  python scripts/export_hf_subset.py --dataset mozilla-foundation/common_voice_17_0 --config en --split train --max-clips 200 --out-dir data/cv_en_subset
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

import numpy as np
import soundfile as sf


def main() -> int:
    p = argparse.ArgumentParser(description="Export Common Voice subset from Hugging Face to WAV + manifest")
    p.add_argument("--dataset", default="mozilla-foundation/common_voice_17_0", help="HF dataset id (verify licence/terms)")
    p.add_argument("--config", default="en", help="Language/config, e.g. en, hi, ta")
    p.add_argument("--split", default="train", help="Split: train/validation/test/other (availability varies)")
    p.add_argument("--max-clips", type=int, default=200, help="Max clips to export (0 = all; can be very large)")
    p.add_argument("--out-dir", default="data/cv_subset", help="Output directory")
    p.add_argument("--sample-rate", type=int, default=16000, help="Target sample rate for exported WAV")
    args = p.parse_args()

    try:
        from datasets import Audio, load_dataset  # type: ignore
    except Exception as e:
        raise SystemExit(f"Missing dependency: pip install datasets huggingface_hub. Error: {e}")

    out_dir = Path(args.out_dir)
    wav_dir = out_dir / "wav"
    wav_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading {args.dataset} config={args.config} split={args.split} (this may download/cache data)...")
    ds = load_dataset(args.dataset, args.config, split=args.split, trust_remote_code=False)
    try:
        ds = ds.cast_column("audio", Audio(sampling_rate=args.sample_rate))
    except Exception:
        pass

    n = len(ds) if args.max_clips <= 0 else min(len(ds), args.max_clips)
    manifest_path = out_dir / "manifest.csv"
    fields = ["path", "text", "sentence", "client_id", "accent", "locale", "age", "gender", "up_votes", "down_votes"]
    rows = []
    for i in range(n):
        item = ds[i]
        audio = item.get("audio") or {}
        arr = audio.get("array")
        sr = int(audio.get("sampling_rate") or args.sample_rate)
        if arr is None:
            continue
        arr = np.asarray(arr, dtype=np.float32)
        if arr.ndim > 1:
            arr = np.mean(arr, axis=1)
        name = f"{args.config}_{args.split}_{i:06d}.wav"
        out_path = wav_dir / name
        sf.write(out_path, arr, sr)
        row = {k: item.get(k, "") for k in fields}
        row["path"] = str(out_path.relative_to(out_dir))
        # common voice uses 'sentence' in some releases
        if not row.get("text") and row.get("sentence"):
            row["text"] = row["sentence"]
        rows.append(row)
        if (i + 1) % 100 == 0:
            print(f"Exported {i+1}/{n}")

    with manifest_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})

    prov = out_dir / "provenance.txt"
    prov.write_text(
        "source: Mozilla Common Voice via Hugging Face\n"
        f"dataset={args.dataset} config={args.config} split={args.split} exported={len(rows)} sample_rate={args.sample_rate}\n"
        "CAUTION: Not a dementia dataset. Check current release licence and speaker-data terms. Record exact terms/version.\n"
    )
    print(f"Done. Exported {len(rows)} clips to {wav_dir} and manifest to {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
