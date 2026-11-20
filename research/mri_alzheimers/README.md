# Alzheimer's MRI classification experiments (Kaggle)

Offline **research experiments** for 4-class Alzheimer MRI image classification on publicly accessible Kaggle datasets. This code is for technology development/testing and image-processing/classification practice only — **not** part of the NeuLens clinical screening product and **not** a diagnostic tool.

## Supported datasets (4 MRI categories)

| Dataset | Approx. size | Categories | Typical Kaggle slug (verify) |
| --- | --- | --- | --- |
| **Alzheimer's MRI Dataset** | ~6,400 images | Non-demented, Very mild, Mild, Moderate dementia | `sachinpatel21/azheimer-mri-dataset` |
| **Augmented Alzheimer MRI Dataset** | ~40,000 image files | 4 MRI image categories (same 4-class structure) | `uraninjo/augmented-alzheimer-mri-dataset` *(verify exact title/version/slug and terms on Kaggle)* |

**Always verify** the dataset page, version, class layout, and licence/terms match your intended use before downloading. Do not redistribute raw images. Record dataset name/release, licence, preprocessing, and code commit in `provenance.json`.

## Important limitations

- **Not a diagnostic tool.** Model outputs are experimental research metrics, not clinical decisions or NeuLens screening results.
- **Dataset terms and provenance.** Download and use datasets only under their current Kaggle licence/terms. Keep `data/` and `runs/` out of git.
- **Separate from NeuLens sensors.** MRI classification is independent of NeuLens webcam/voice/cognitive pipelines; do not mix imaging labels with in-product screening outputs.

## 1) Environment

```bash
cd research/mri_alzheimers
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` includes PyTorch/torchvision, scikit-learn, pandas, and Kaggle helpers. Install a CUDA-enabled PyTorch build for faster training on large datasets (see https://pytorch.org/get-started/locally/).

## 2) Access and download a dataset

1. Create a Kaggle account and **accept the dataset's terms/rules** on its Kaggle page.
2. Create an API token (Account → API → *Create New Token*) and place `kaggle.json` at `~/.kaggle/kaggle.json` (permissions `600`), or set `KAGGLE_USERNAME`/`KAGGLE_KEY`.
3. Download the dataset you need:

```bash
# Alzheimer's MRI Dataset (~6.4k images)
python scripts/download_data.py --dataset sachinpatel21/azheimer-mri-dataset --out data/alzheimers_mri

# Augmented Alzheimer MRI Dataset (~40k images) - verify slug/terms on Kaggle
python scripts/download_data.py --dataset uraninjo/augmented-alzheimer-mri-dataset --out data/augmented_alzheimers_mri
```

If you already downloaded/extracted data, point training at the folder containing the class subdirectories (or a parent the loader can scan). Expected/common class folders map to: `NonDemented`, `VeryMildDemented`, `MildDemented`, `ModerateDemented` (loader handles common variants).

## 3) Train

```bash
python scripts/train.py \
  --data-dir data/alzheimers_mri \
  --output-dir runs/exp1 \
  --epochs 15 \
  --batch-size 32 \
  --img-size 224 \
  --model resnet18 \
  --pretrained
```

For the **augmented (~40k)** dataset, consider GPU training and tuning for scale, e.g.:
```bash
python scripts/train.py \
  --data-dir data/augmented_alzheimers_mri \
  --output-dir runs/augmented_resnet18 \
  --epochs 20 \
  --batch-size 64 \
  --img-size 224 \
  --num-workers 4 \
  --model resnet18 \
  --pretrained
```

Outputs in `--output-dir`:
- `best_model.pt` – best checkpoint (by validation accuracy)
- `metrics.json` – summary metrics and config
- `classification_report.txt` – per-class precision/recall/F1
- `confusion_matrix.csv` – confusion matrix (rows=true, cols=pred)
- `history.csv` – epoch train/val loss and accuracy
- `provenance.json` – template to complete with dataset/licence/commit details

Quick smoke test (not meaningful): `--epochs 1 --batch-size 8 --max-samples 256`.

## 4) Evaluate / inference

```bash
python scripts/predict.py --checkpoint runs/augmented_resnet18/best_model.pt --data-dir <labeled_or_image_folder>
```

(Use a held-out/test folder if available; otherwise refer to validation metrics from training.)

## Notes

- Training uses a stratified train/validation split when explicit splits are not provided; class folders are auto-detected.
- Keep `data/` and `runs/` out of git (see root `.gitignore`).
- Reproducibility: set `--seed`, record the exact dataset slug/release and this repo's commit in `provenance.json`.
- Large augmented datasets may require more disk, RAM, and training time; adjust `--batch-size`/`--num-workers` to your hardware.
