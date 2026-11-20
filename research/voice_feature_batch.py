"""Offline voice feature batch.

Extracts the same acoustic features the FastAPI service computes, from a folder
of WAV files, so published acoustic directions can be reproduced and compared
with local recordings. Research use only; no clinical claim.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ai-service"))

from app.services.acoustics import analyze_audio  # noqa: E402

FEATURES = [
    "duration_seconds",
    "speech_duration_seconds",
    "voiced_ratio",
    "speech_segment_count",
    "pause_count",
    "pause_total_seconds",
    "speech_rate_syllables_per_minute",
    "speech_rate_words_per_minute",
    "word_count",
    "pitch_mean_hz",
    "pitch_sd_hz",
    "jitter_percent",
    "shimmer_percent",
    "quality.score",
    "quality.level",
    "quality.comparable",
]


def flatten(result: dict) -> dict:
    flat = {"file_name": None}
    for key in FEATURES:
        if "." in key:
            parent, child = key.split(".", 1)
            flat[key] = (result.get(parent) or {}).get(child)
        else:
            flat[key] = result.get(key)
    return flat


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch acoustic feature extraction.")
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--metadata", type=Path, default=None)
    args = parser.parse_args()

    rows = []
    for wav in sorted(args.input_dir.glob("*.wav")):
        try:
            result = analyze_audio(wav)
            row = flatten(result)
            row["file_name"] = wav.name
            row["error"] = None
        except Exception as exc:  # keep one bad file from stopping the batch
            row = {"file_name": wav.name, "error": str(exc)}
        rows.append(row)

    metadata = {}
    if args.metadata and args.metadata.exists():
        with args.metadata.open(newline="", encoding="utf-8") as handle:
            for item in csv.DictReader(handle):
                metadata[item["file_name"]] = item

    fieldnames = ["file_name", *FEATURES, "error"]
    if metadata:
        extra = sorted({key for value in metadata.values() for key in value if key != "file_name"})
        fieldnames.extend(extra)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            if row.get("file_name") in metadata:
                row.update({key: value for key, value in metadata[row["file_name"]].items() if key != "file_name"})
            writer.writerow({key: row.get(key) for key in fieldnames})
    print(f"Wrote {len(rows)} rows to {args.output}")


if __name__ == "__main__":
    main()
