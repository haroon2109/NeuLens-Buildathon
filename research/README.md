# Research experiments

This directory holds **offline research code only**. Nothing here ships with the product, and nothing here may change a clinical score.

**Start here for access, training, and validation:** see [`ACCESS_AND_RUNBOOK.md`](ACCESS_AND_RUNBOOK.md).

## Rules

- One dataset, one narrow purpose. Do not pool datasets with incompatible licences and do not relabel (emotion labels are not cognitive labels).
- Keep raw restricted recordings outside this repository. Store only derived features where the data-use agreement allows it.
- Record provenance for every run: dataset name, release, access agreement, preprocessing version, feature version and code commit.
- Validate technical signal quality before any clinical comparison.

## Public datasets for technology development/testing

Use publicly accessible datasets to develop and test individual technologies (see `../docs/research-datasets.md` for full details, access, and limitations):

| Dataset | Technology |
| --- | --- |
| **MPIIGaze** | Gaze estimation |
| **UnityEyes** | Eye detection |
| **Common Voice** | Audio processing |
| **CDLI** (resource/licence-dependent) | Speech/corpus preprocessing experiments (confirm exact resource and terms) |
| **Kaggle MRI** (per-dataset licence) | Research experimentation (imaging, separate from NeuLens sensor pipelines) |

## Voice feature batch

`voice_feature_batch.py` extracts the same acoustic features the FastAPI service computes from a folder of WAV files. Use it for reproducible audio/acoustic preprocessing and feature experiments on permitted speech/audio data.

```bash
cd research
python -m pip install -r requirements.txt
python voice_feature_batch.py --input-dir /path/to/wavs --output features.csv
```

Optional metadata CSV (`--metadata metadata.csv`) must contain columns `file_name`, `group` and `age`. It is joined on file name without copying audio.

## Provenance template

Copy `provenance.example.json` next to every exported features file and fill in the fields before sharing results.

## UnityEyes (gaze estimation experiments)

`unityeyes_gaze/` provides a manifest-based gaze-estimation training baseline for **UnityEyes** synthetic eye images (gaze direction labels, appearance variations). See `unityeyes_gaze/README.md`.
- **Important:** confirm the exact UnityEyes distribution/version and underlying asset rights/licence (e.g. Apache 2.0 distributions exist per Google Dataset Search: https://datasetsearch.research.google.com/). Synthetic results do not transfer directly to real webcam data.

## Eye-tracking dataset for autism research (gaze pipeline exploration)

Centific lists an eye-tracking dataset (eye-tracking experiments, gaze-related records, participant metadata): https://data.centific.com/  
**Caution:** this is autism-related research data, **not dementia data**. It may be useful only for exploring gaze-analysis pipelines/engineering; **do not transfer its clinical labels to NeuLens** and do not use it to make dementia/cognitive claims. Verify access, consent, and licence/terms before use and record provenance.

## Mozilla Common Voice (audio processing / speech preprocessing)

`common_voice_audio/` provides download/export guidance and preprocessing scripts (resample to mono 16 kHz WAV + manifest) for **Mozilla Common Voice** (multilingual speech, transcriptions, diverse speakers/accents).
- Download: https://commonvoice.mozilla.org/en/datasets
- **Caution:** not a dementia dataset. Check the current release's license and speaker-data terms before use and record provenance. See `common_voice_audio/README.md`.

## CDLI speech datasets (inclusive speech preprocessing)

`cdli_speech/` provides guidance and generic preprocessing/manifest scripts for **CDLI open speech datasets** (speech from people with different communication conditions; recordings, transcripts, metadata).
- Open datasets: https://cdli.ca/our-data/
- **Caution:** not Alzheimer's-labelled datasets. Verify individual repository licenses/terms, do not transfer labels to NeuLens, and record provenance. See `cdli_speech/README.md`.

## Facial and behavioural research (landmarks, pose, eye-region, quality, timing)

`facial_behavioral/` provides guidance and an analysis script for developing/testing **face landmark detection, head pose estimation, eye-region tracking, movement consistency, video quality, and task-related response timing** using **own consented test recordings and synthetic examples** (preferred), plus general-purpose facial landmark/video datasets where permitted.
- **Priorities/cautions:** do not prioritize dementia-labelled facial datasets from Kaggle. Not emotion detection and not a cognitive/clinical determinant. Obtain ethics approval/consent and record provenance. See `facial_behavioral/README.md`.

## Repositories beyond Kaggle

- **Hugging Face** (speech/audio/facial/ML): https://huggingface.co/datasets
- **Zenodo** (research, eye tracking, neuroscience): https://zenodo.org/
- **OpenNeuro** (neuroscience/brain research): https://openneuro.org/
- **UCI ML Repository** (clinical/tabular ML): https://archive.ics.uci.edu/
- **PhysioNet** (physiological/clinical signals): https://physionet.org/
- **Mendeley Data** (research datasets): https://data.mendeley.com/
- **Google Dataset Search** (cross-repository discovery): https://datasetsearch.research.google.com/

**LASI-DAD (Longitudinal Aging Study in India – Diagnostic Assessment of Dementia):** relevant to NeuLens's Indian population research; access is controlled and **non-US researchers need to apply and sign a data-use agreement** (verify current procedures/terms). https://lasi-dad.org/
