# MPIIGaze gaze estimation experiment (Kaggle)

Offline **research experiment** for gaze estimation using the **MPIIGaze** dataset (eye images, head pose, gaze direction). Intended for ocular/gaze-estimation technology development and testing — **not** part of NeuLens clinical screening and **not** a clinical tool.

## Dataset (Kaggle / MPIIGaze)

MPIIGaze provides appearance-based gaze data (eye images with gaze direction and head pose). Kaggle hosts repackaged versions; **verify the exact Kaggle dataset page, contents, format, and licence/terms** before download/use.

- Typical contents: eye/face images, gaze direction (commonly pitch/yaw angles), head pose.
- **Licence/terms:** MPIIGaze is a research dataset with specific usage/citation requirements; Kaggle mirrors may have additional terms. Use only as permitted, do not redistribute raw data, and record provenance.

Example Kaggle slugs (verify): search “MPIIGaze” on Kaggle and select the dataset that includes gaze labels/head pose (slug varies by uploader/version).

## Important limitations

- **Research only.** Outputs (e.g. angular error) are experimental; not validated for clinical gaze assessment or NeuLens in-product decisions.
- **Evaluation protocol matters.** Proper MPIIGaze evaluation is often person-independent (e.g. leave-one-subject-out). The default training script uses a random train/val split for quick experiments unless you provide a subject-aware split; for publishable/meaningful results follow the dataset’s recommended protocol.
- **Domain gap.** Lab/normalized eye images differ from real-world webcam capture; local validation on target devices is required before any deployment claim.

## 1) Environment

```bash
cd research/mpiigaze_gaze
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install a CUDA-enabled PyTorch build for faster training: https://pytorch.org/get-started/locally/

## 2) Access and download

1. Accept the dataset’s terms on Kaggle and configure API credentials (`~/.kaggle/kaggle.json`, chmod 600, or `KAGGLE_USERNAME`/`KAGGLE_KEY`).
2. Download (replace `<owner/slug>` with the verified MPIIGaze Kaggle dataset slug):

```bash
python scripts/download_data.py --dataset <owner/slug> --out data/raw
```

If you already have the data locally, skip download and point scripts at it.

## 3) Prepare a training manifest (recommended)

Because Kaggle MPIIGaze packages vary in format, training uses a simple CSV manifest with at least:

- `image_path` – path to an eye/face image (absolute or relative to `--data-root`)
- `gaze_pitch` – gaze pitch (radians, or consistent units)
- `gaze_yaw` – gaze yaw (radians, or consistent units)
- optional: `head_pitch`, `head_yaw`, `head_roll`, `subject`

Example:
```csv
image_path,gaze_pitch,gaze_yaw,subject
p00/day01/image_0001.jpg,-0.12,0.34,p00
```

Create `data/manifest.csv` by parsing your dataset’s annotation files (`.mat/.h5/.npz/.txt/.csv` as provided by the specific Kaggle release). Inspect `data/raw` to confirm file/label format.

## 4) Train (gaze estimation baseline)

```bash
python scripts/train.py \
  --manifest data/manifest.csv \
  --data-root data/raw \
  --output-dir runs/mpiigaze_resnet18 \
  --epochs 20 \
  --batch-size 64 \
  --img-size 224 \
  --model resnet18 \
  --pretrained
```

The model regresses `[gaze_pitch, gaze_yaw]`. Outputs in `--output-dir`:
- `best_model.pt` – best checkpoint (by validation mean angular error)
- `metrics.json` – config and metrics (MAE per component, mean angular error in degrees)
- `history.csv` – epoch losses/metrics
- `predictions_val.csv` – validation predictions vs targets
- `provenance.json` – complete with dataset slug/release/licence/commit

Quick smoke test (not meaningful): `--epochs 1 --max-samples 512`.

## 5) Evaluate / infer

```bash
python scripts/predict.py --checkpoint runs/mpiigaze_resnet18/best_model.pt --manifest data/manifest_val.csv --data-root data/raw
```

## Notes

- Keep `data/` and `runs/` out of git (see root `.gitignore`).
- For rigorous results, use subject-independent splits (e.g. leave-one-subject-out) and report per-subject/angular-error statistics per MPIIGaze conventions.
- Record provenance: dataset slug/version, licence/terms, preprocessing, normalization, and code commit.
