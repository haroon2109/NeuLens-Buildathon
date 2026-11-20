# Mozilla Common Voice (speech preprocessing & language experiments)

Offline **research resources** for using **Mozilla Common Voice** in speech preprocessing and language experiments (multilingual speech recordings, transcriptions, different speakers/accents). **Not part of NeuLens clinical screening.**

## Dataset

- **Download:** https://commonvoice.mozilla.org/en/datasets (official releases)
- **Contents (varies by language/release):** crowdsourced voice clips, transcriptions/validated metadata, speaker/accent diversity.
- **Useful for:** audio processing, speech preprocessing, ASR/language robustness experiments, VAD/resampling pipelines, accent/language coverage checks.

## Important cautions

- **Not a dementia dataset.** Common Voice has no dementia/cognitive labels — **do not** use it for dementia or cognitive inference.
- **Check the current release's license and speaker-data terms** before download/use (voice clips are commonly CC0 under Mozilla terms, but verify per release and review metadata/speaker-data terms). Record provenance (release, language, date, licence/terms).

## 1) Environment

```bash
cd research/common_voice_audio
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2) Obtain data

**Option A — Official download (recommended):** download the desired language/release from https://commonvoice.mozilla.org/en/datasets and extract locally (e.g. `data/<lang>/clips/*.mp3` and `validated.tsv`).

**Option B — Hugging Face `datasets` (for scripted export/subsets):**
```bash
# Example: export a small subset to WAV + manifest (requires internet and HF datasets cache)
python scripts/export_hf_subset.py --dataset mozilla-foundation/common_voice_17_0 --config en --split train --max-clips 200 --out-dir data/cv_en_subset
```
Verify the dataset card/licence/terms for the exact HF dataset/config you use.

## 3) Preprocess audio for experiments

Convert/resample clips to mono 16 kHz WAV and build a manifest (useful for ASR/preprocessing pipelines and feature extraction):

```bash
python scripts/preprocess_audio.py \
  --input-dir data/<lang>/clips \
  --metadata-tsv data/<lang>/validated.tsv \
  --out-dir data/<lang>_wav16k \
  --sample-rate 16000 \
  --max-clips 0
```

Outputs: resampled WAV files in `--out-dir/wav/` and `--out-dir/manifest.csv` (`path,text,client_id,accent,locale,...` when available).

## 4) Use in experiments

- Run acoustic/preprocessing experiments on the generated WAVs (e.g. `../voice_feature_batch.py --input-dir data/<lang>_wav16k/wav --output features.csv` if applicable).
- Keep `data/` and outputs out of git. Complete a provenance record (release/language/licence/terms, preprocessing, commit).

## Notes

- Large releases can be many GB; export subsets for quick iteration.
- Speaker-data terms may restrict certain uses — review current Mozilla Common Voice terms for your intended experiment.
