#!/usr/bin/env python3
"""Download an MPIIGaze dataset from Kaggle for offline gaze-estimation research.

MPIIGaze provides eye images, head pose, and gaze direction. Kaggle hosts
repackaged versions; verify the exact dataset slug, contents, and licence/terms.

Requires Kaggle credentials and acceptance of dataset terms:
- ~/.kaggle/kaggle.json (chmod 600) or KAGGLE_USERNAME/KAGGLE_KEY
- Accept rules on: https://www.kaggle.com/datasets/<owner/slug>
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Download MPIIGaze dataset from Kaggle")
    parser.add_argument("--dataset", required=True, help="Kaggle dataset slug (owner/dataset) for an MPIIGaze package. Verify contents and terms.")
    parser.add_argument("--out", default="data/raw", help="Output directory for downloaded/extracted data")
    parser.add_argument("--unzip", action="store_true", default=True, help="Unzip after download (default: true)")
    parser.add_argument("--no-unzip", dest="unzip", action="store_false", help="Do not unzip")
    parser.add_argument("--force", action="store_true", help="Force re-download")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    try:
        import kagglehub  # type: ignore

        print(f"Downloading via kagglehub: {args.dataset}")
        path = kagglehub.dataset_download(args.dataset, force_download=args.force)
        print(f"Downloaded to cache: {path}")
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
            print("Done. Inspect files/annotations and prepare a manifest (image_path,gaze_pitch,gaze_yaw,...). Record provenance.")
            return 0
        except Exception as e:
            print(f"Note: could not copy to {out}: {e}. Use cached path directly: {path}")
            return 0
    except Exception as e:
        print(f"kagglehub not available/failed ({e}); trying kaggle API...")

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi  # type: ignore

        api = KaggleApi()
        api.authenticate()
        print(f"Downloading via Kaggle API: {args.dataset} -> {out.resolve()}")
        api.dataset_download_files(args.dataset, path=str(out), unzip=args.unzip, force=args.force, quiet=False)
        print("Done. Inspect files/annotations and prepare a manifest (image_path,gaze_pitch,gaze_yaw,...). Record provenance.")
        return 0
    except Exception as e:
        print("ERROR: Could not download dataset.")
        print(f"Reason: {e}")
        print("\nSetup steps:")
        print("  1) pip install kaggle kagglehub")
        print("  2) Accept dataset terms on Kaggle: https://www.kaggle.com/datasets/" + args.dataset)
        print("  3) Configure API token: ~/.kaggle/kaggle.json (chmod 600) or KAGGLE_USERNAME/KAGGLE_KEY")
        return 1


if __name__ == "__main__":
    sys.exit(main())
