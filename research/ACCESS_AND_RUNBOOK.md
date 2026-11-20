# NeuLens research access, training, and validation runbook

This runbook explains how to **follow/access** the listed repositories and datasets, and how to **train, validate, and operationalize** the research pipelines in this repo for NeuLens technology development.

## What I can and cannot do from this environment

- **Done here:** research guidance, dataset-to-technology mappings, and runnable offline pipelines/scripts are added under `research/` (all Python scripts compile-checked). See `research/README.md` and `docs/research-datasets.md`.
- **You must do (cannot be automated without you):** create accounts, accept dataset terms/licences, submit applications/data-use agreements (DUAs), complete ethics/consent approvals for locally collected data, provide credentials/tokens, download data to approved storage, and run training/validation on your machine (CPU/GPU/time). **I cannot access controlled datasets (e.g. LASI-DAD, ADNI, DementiaBank, restricted PhysioNet), cannot sign DUAs, and cannot bypass access controls.**

**Safety/constraints:** research outputs are for technical development/experimentation only — not clinical diagnosis, not disease probability, and not a validated NeuLens clinical result. Validate signal quality first, keep provenance, respect licences/consent, and do not transfer labels across conditions/populations (e.g. autism ≠ dementia).

---

## 1) Follow and access repositories (beyond Kaggle)

| Repository | Use for | How to follow/access | Website |
| --- | --- | --- | --- |
| Hugging Face | Speech, audio, facial, ML datasets/models | Create account as needed; search datasets; review dataset card/licence/terms; download via web or `datasets`/`huggingface-cli` | https://huggingface.co/datasets |
| Zenodo | Research datasets (eye tracking, neuroscience, etc.) | Search records; check licence/DOI/version; download files per record terms | https://zenodo.org/ |
| OpenNeuro | Neuroscience/brain research datasets | Browse datasets; review per-dataset licence/participants/terms; download via web, DataLad, or openneuro CLI | https://openneuro.org/ |
| UCI ML Repository | Clinical/tabular ML datasets | Review dataset description/licence/citation; download directly | https://archive.ics.uci.edu/ |
| PhysioNet | Physiological/clinical signals (some credentialed) | Register; complete required training/DUA for credentialed datasets; download approved data only | https://physionet.org/ |
| Mendeley Data | Research datasets | Search; review licence/version; download per terms | https://data.mendeley.com/ |
| Google Dataset Search | Cross-repository discovery | Find datasets, then follow source repository access/licence steps | https://datasetsearch.research.google.com/ |

**General access checklist:** confirm exact dataset/version → read licence & permitted use (incl. commercial/research-only) → accept terms / submit DUA or application if required → record provenance (name, version/DOI, URL, access date, terms, citation).

---

## 2) India-relevant cohort: LASI-DAD (controlled access)

**LASI-DAD (Longitudinal Aging Study in India – Diagnostic Assessment of Dementia)** is relevant to NeuLens’s Indian population research.

- **Website / access info:** https://lasi-dad.org/
- **Access:** controlled. **Non-US researchers must apply and sign a data-use agreement (DUA)** (additional eligibility/approval/citation requirements may apply). Follow the current procedures on the official site.
- **Action steps:** identify eligible PI/institution → review LASI-DAD data access policy and required forms → prepare/submit application and DUA as instructed → await approval → download only approved data → store securely and document provenance/permitted use. **I cannot submit or approve this on your behalf.**

---

## 3) Dataset pipelines: access, train, validate

All pipelines live under `research/`. Install per-folder requirements in a venv, place data under the folder’s `data/` (gitignored), and save outputs to `runs/` (gitignored). Complete `provenance.json`/records for every run.

### A. Alzheimer’s MRI (4-class) — `research/mri_alzheimers/`
- **Datasets (Kaggle, verify slug/terms):** Alzheimer’s MRI Dataset (~6.4k, `sachinpatel21/azheimer-mri-dataset`); Augmented Alzheimer MRI Dataset (~40k, `uraninjo/augmented-alzheimer-mri-dataset`).
- **Access:** Kaggle account + accept dataset terms + `~/.kaggle/kaggle.json` (or `KAGGLE_USERNAME/KAGGLE_KEY`).
- **Download:** `python scripts/download_data.py --dataset <slug> --out data/<name>`
- **Train:** `python scripts/train.py --data-dir data/<name> --output-dir runs/<exp> --epochs 15 --batch-size 32 --model resnet18 --pretrained`
- **Validate/evaluate:** review `runs/<exp>/metrics.json`, `classification_report.txt`, `confusion_matrix.csv`, `history.csv` (val accuracy/F1, confusion patterns). Run on a labeled/held-out folder: `python scripts/predict.py --checkpoint runs/<exp>/best_model.pt --data-dir <labeled_folder>`.
- **Smoke test (no meaningful result):** `--epochs 1 --batch-size 8 --max-samples 256`

### B. MPIIGaze (gaze estimation) — `research/mpiigaze_gaze/`
- **Dataset:** MPIIGaze (eye images, head pose, gaze direction) via a verified Kaggle package/slug; check licence/citation.
- **Access:** Kaggle terms + API credentials.
- **Download:** `python scripts/download_data.py --dataset <owner/mpiigaze-slug> --out data/raw`
- **Prepare manifest:** inspect annotations and create `data/manifest.csv` with `image_path,gaze_pitch,gaze_yaw[,subject,...]` (consistent units/convention).
- **Train:** `python scripts/train.py --manifest data/manifest.csv --data-root data/raw --output-dir runs/<exp> --epochs 20 --batch-size 64 --model resnet18 --pretrained`
- **Validate:** best checkpoint chosen by **mean angular error (deg)**; inspect `metrics.json`, `history.csv`, `predictions_val.csv`. Evaluate: `python scripts/predict.py --checkpoint runs/<exp>/best_model.pt --manifest data/manifest.csv --data-root data/raw --output runs/<exp>/preds.csv`.
- **Rigor:** use **subject-independent/leave-one-subject-out** splits for meaningful MPIIGaze evaluation (default is random split for quick experiments).

### C. UnityEyes (synthetic gaze/eye experiments) — `research/unityeyes_gaze/`
- **Dataset:** UnityEyes synthetic eye images with gaze labels/appearance variation. **Confirm exact distribution/version and underlying asset rights/licence** (e.g. Apache 2.0 listings via https://datasetsearch.research.google.com/, but verify).
- **Access/obtain:** from verified source per confirmed terms; prepare `manifest.csv` (`image_path,gaze_pitch,gaze_yaw`).
- **Train:** `python scripts/train.py --manifest data/manifest.csv --data-root data/raw --output-dir runs/<exp> --epochs 20 --batch-size 64 --model resnet18 --pretrained`
- **Validate:** mean angular error/MAE in `metrics.json`, `predictions_val.csv`; `scripts/predict.py` for evaluation. Validate later on **real consented** data (synthetic ≠ real webcam transfer).

### D. Mozilla Common Voice (audio preprocessing/language experiments) — `research/common_voice_audio/`
- **Dataset:** https://commonvoice.mozilla.org/en/datasets — **not a dementia dataset**. Check current release **license and speaker-data terms**.
- **Access/obtain:** official download per language/release, or scripted HF export: `python scripts/export_hf_subset.py --dataset mozilla-foundation/common_voice_17_0 --config en --split train --max-clips 200 --out-dir data/cv_en_subset` (verify HF terms).
- **Preprocess/validate pipeline:** `python scripts/preprocess_audio.py --input-dir <clips_dir> --metadata-tsv <validated.tsv> --out-dir data/<lang>_wav16k --sample-rate 16000` → produces mono 16 kHz WAVs + `manifest.csv`.
- **Validate/use:** spot-check durations/manifest alignment, run acoustic feature extraction (e.g. `../voice_feature_batch.py --input-dir data/<lang>_wav16k/wav --output features.csv`) where applicable. No clinical labels.

### E. CDLI speech datasets (inclusive speech preprocessing) — `research/cdli_speech/`
- **Dataset:** https://cdli.ca/our-data/ — **not Alzheimer’s-labelled**. **Verify individual repository licenses/terms** per resource.
- **Access/obtain:** select dataset, accept terms, download locally.
- **Preprocess/validate:** `python scripts/preprocess_audio.py --input-dir data/<dataset> --out-dir data/<dataset>_wav16k [--metadata-file ... --join-key ...]` → WAVs + `manifest.csv`. Inspect manifest/transcript joins and durations.

### F. Facial/behavioural (consented/synthetic recordings) — `research/facial_behavioral/`
- **Data:** own **consented test recordings** and synthetic examples (preferred); general-purpose facial landmark/video datasets only with proper licence/consent. **Do not prioritize dementia-labelled facial Kaggle datasets.**
- **Analyze/validate:** `python scripts/analyze_recording.py --input <recording.mp4> --out-dir runs/<sample>` → `frame_metrics.csv`, `summary.json` (detection rate, head pose, eye-region proxies, movement consistency, video quality, timing). Align with task timestamps for response timing; gate low-quality/non-comparable sessions.

### G. Voice feature batch (existing) — `research/voice_feature_batch.py`
- **Use:** batch acoustic features from WAV folders for reproducible preprocessing/feature experiments (research only). `python voice_feature_batch.py --input-dir <wavs> --output features.csv`.

---

## 4) How validated results "work" in NeuLens (responsible integration)

- **Technical validation artifacts** (metrics, confusion matrices, angular error, quality/timing summaries) inform whether a signal/component is stable and usable on target devices/populations — they do **not** become clinical decisions.
- **Integration principles:** keep deterministic scoring and conservative rules; no disease probability as main result; poor quality ≠ decline; first assessment = provisional baseline; clinicians own actions. Any model/feature change that could affect outputs requires offline validation, clear provenance, and clinical/statistical review before product use.
- **Product-facing changes:** prefer shipping quality/robustness improvements and observation features (with `model_inference`/exploratory labeling as designed) only after validation on consented, representative data. Do not copy MoCA/MMSE; do not claim diagnosis.

## 5) Practical "get it working" sequence

1. Pick a target technology (gaze/eye/audio/speech-preprocess/MRI/facial-quality) and the corresponding pipeline above.
2. Complete access (account/terms/DUA) and download data to `research/<experiment>/data/` (or approved storage); record provenance.
3. Create venv and `pip install -r requirements.txt` in the experiment folder.
4. Run a **smoke test** (small subset/1 epoch) to confirm environment and data format.
5. Run full **train** (if applicable) and **validate** (metrics, reports, held-out/subject-independent eval as appropriate).
6. Review results against quality/robustness goals; iterate on preprocessing/splits; document limitations and do not overclaim.
7. For NeuLens integration, treat results as engineering evidence and follow clinical/ethics review before any user-facing change.

If you tell me which dataset(s) you have access to locally (paths/manifests) and your environment (CPU/GPU), I can help you run the smoke tests/training/validation commands and debug any pipeline issues step by step.
