#!/usr/bin/env python3
"""Download an Alzheimer's MRI dataset from Kaggle for offline research experiments.

Supports 4-class Alzheimer MRI datasets used by this experiment, e.g.:
- Alzheimer's MRI Dataset (~6.4k):        sachinpatel21/azheimer-mri-dataset
- Augmented Alzheimer MRI Dataset (~40k):  uraninjo/augmented-alzheimer-mri-dataset (verify slug/terms)

Requires Kaggle API credentials and acceptance of the dataset's terms on Kaggle:
- Place kaggle.json at ~/.kaggle/kaggle.json (chmod 600), or set KAGGLE_USERNAME/KAGGLE_KEY.
- Accept the dataset rules on the dataset page before downloading.

Verify the dataset page/title, version, class layout, and licence match your intended use.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Download an Alzheimer's MRI dataset from Kaggle (4-class)")
    parser.add_argument(
        "--dataset",
        default="sachinpatel21/azheimer-mri-dataset",
        help=(
            "Kaggle dataset slug (owner/dataset). Examples: "
            "sachinpatel21/azheimer-mri-dataset (~6.4k), "
            "uraninjo/augmented-alzheimer-mri-dataset (~40k, verify). "
            "Always verify dataset and terms."
        ),
    )
    parser.add_argument("--out", default="data/raw", help="Output directory for downloaded/extracted data")
    parser.add_argument("--unzip", action="store_true", default=True, help="Unzip after download (default: true)")
    parser.add_argument("--no-unzip", dest="unzip", action="store_false", help="Do not unzip")
    parser.add_argument("--force", action="store_true", help="Force re-download")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    # Prefer kagglehub (simpler auth in some setups), fall back to kaggle API.
    try:
        import kagglehub  # type: ignore

        print(f"Downloading via kagglehub: {args.dataset}")
        path = kagglehub.dataset_download(args.dataset, force_download=args.force)
        print(f"Downloaded to cache: {path}")
        print(f"Copy/extract or point --data-dir to the cached path above. Target out: {out.resolve()}")
        # Best-effort copy into requested out dir for convenience.
        try:
            import shutil

            src = Path(path)
            if src.is_dir():
                for item in src.iterdir():
                    dest = out / item.name
                    if dest.exists() and not args.force:
                        continue
                    if item.is_dir():
                        if dest.exists():
                            shutil.rmtree(dest)
                        shutil.copytree(item, dest)
                    else:
                        shutil.copy2(item, dest)
                print(f"Copied dataset contents to: {out.resolve()}")
            print("Done. Verify class folders and record provenance (dataset, version, licence).")
            return 0
        except Exception as e:
            print(f"Note: could not copy to {out}: {e}. Use cached path directly.")
            return 0
    except Exception as e:
        print(f"kagglehub not available/failed ({e}); trying kaggle API...")

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi  # type: ignore

        api = KaggleApi()
        api.authenticate()
        print(f"Downloading via Kaggle API: {args.dataset} -> {out.resolve()}")
        api.dataset_download_files(args.dataset, path=str(out), unzip=args.unzip, force=args.force, quiet=False)
        print("Done. Verify class folders and record provenance (dataset, version, licence).")
        return 0
    except Exception as e:
        print("ERROR: Could not download dataset.")
        print(f"Reason: {e}")
        print("\nSetup steps:")
        print("  1) pip install kaggle kagglehub")
        print("  2) Accept dataset terms on Kaggle: https://www.kaggle.com/datasets/" + args.dataset)
        print("  3) Configure API token: ~/.kaggle/kaggle.json (chmod 600) or KAGGLE_USERNAME/KAGGLE_KEY")
        print("  4) Re-run this script")
        return 1


if __name__ == "__main__":
    sys.exit(main())
