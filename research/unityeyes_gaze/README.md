# UnityEyes gaze estimation experiment

Offline **research experiment** for gaze-estimation model experiments using **UnityEyes** synthetic eye images (gaze direction labels, eye appearance variations). Useful for prototyping and robustness testing of gaze/eye models — **not** part of NeuLens clinical screening and **not** a clinical tool.

## Dataset

UnityEyes generates/provides synthetic eye images with gaze and related labels (e.g. gaze direction/look vector, head pose, eye region parameters) under varied appearance conditions.

- **Finding/access:** Google Dataset Search lists UnityEyes distributions (including an **Apache 2.0** distribution): https://datasetsearch.research.google.com/  
  **Confirm the exact version you use and its underlying asset rights/licence terms** (code vs generated assets/images may have different conditions). Record the source, version, and licence in `provenance.json`.
- **Format varies** by distribution (individual images with JSON/XML/label files, or packaged releases). Inspect the files you obtain and prepare a manifest for training.

## Important limitations

- **Synthetic ≠ real.** Performance on synthetic eyes does not transfer directly to real webcam footage or older-adult populations; validate on consented real data before any deployment claim.
- **Research only.** Outputs are experimental metrics, not clinical gaze assessments or NeuLens in-product decisions.
- **Licence diligence.** "Apache 2.0" on a distribution does not automatically confirm rights for all underlying assets; verify the exact release.

## 1) Environment

```bash
cd research/unityeyes_gaze
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install a CUDA-enabled PyTorch build for faster training: https://pytorch.org/get-started/locally/

## 2) Obtain data and prepare a manifest

1. Obtain UnityEyes from a verified source and confirm its licence/asset rights and version.
2. Prepare a CSV manifest (recommended, format-agnostic) with at least:
   - `image_path` – path to eye image (absolute or relative to `--data-root`)
   - `gaze_pitch`, `gaze_yaw` – gaze direction in radians (consistent convention).  
     If your labels provide a 3D look vector `(x,y,z)` instead, convert to pitch/yaw consistently (e.g. `pitch = asin(-y)`, `yaw = atan2(-x, -z)` depending on convention) and document it.

Optional: `head_pitch`, `head_yaw`, `head_roll`, `subject`/`id`.

Example:
```csv
image_path,gaze_pitch,gaze_yaw
imgs/000001.jpg,-0.05,0.21
```

## 3) Train (gaze estimation baseline)

```bash
python scripts/train.py \
  --manifest data/manifest.csv \
  --data-root data/raw \
  --output-dir runs/unityeyes_resnet18 \
  --epochs 20 \
  --batch-size 64 \
  --img-size 224 \
  --model resnet18 \
  --pretrained
```

Regresses `[gaze_pitch, gaze_yaw]`. Outputs: `best_model.pt` (best by val mean angular error), `metrics.json`, `history.csv`, `predictions_val.csv`, `provenance.json`.

Smoke test (not meaningful): `--epochs 1 --max-samples 512`.

## 4) Evaluate / infer

```bash
python scripts/predict.py --checkpoint runs/unityeyes_resnet18/best_model.pt --manifest data/manifest.csv --data-root data/raw
```

## Notes

- Keep `data/` and `runs/` out of git. Complete `provenance.json` with exact source/version/licence.
- Consider domain-randomization/appearance variation splits and later fine-tuning/validation on real eye data for gaze-estimation experiments.
