# CDLI speech datasets (inclusive speech technology research)

Offline **research resources** for using **CDLI (Communication Disabilities and Language Impairment) open speech datasets** in speech preprocessing and inclusive speech-technology experiments. **Not part of NeuLens clinical screening.**

## Dataset

- **Open datasets / access:** https://cdli.ca/our-data/ (publicly downloadable resources; availability and format vary by dataset/repository)
- **Typical contents:** speech recordings from people with different communication conditions, transcripts, and metadata.
- **Useful for:** research on inclusive speech technologies, speech preprocessing, transcription/segmentation experiments, and robustness analysis across communication conditions.

## Important cautions

- **Not Alzheimer's-labelled datasets.** Do not use CDLI labels/conditions as Alzheimer's or dementia labels, and do not transfer them to NeuLens cognitive/dementia claims.
- **Verify individual repository licenses and terms** for each CDLI resource before download, use, or sharing derived artifacts. Access/consent conditions may differ per dataset.
- **Sensitive data.** Some recordings/metadata may be sensitive; handle per terms, minimize copies, and record provenance.

## 1) Environment

```bash
cd research/cdli_speech
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2) Obtain data

1. Visit https://cdli.ca/our-data/ and select the specific dataset/resource relevant to your experiment.
2. Review and accept the applicable licence/terms and download the data locally (e.g. `data/<dataset_name>/`).
3. Record provenance: dataset name, source URL, version/access date, licence/terms, and permitted use.

## 3) Preprocess and build a manifest

CDLI resources vary in layout (audio formats, transcript/metadata files). Use the provided scripts to normalize audio and create a manifest for experiments:

```bash
# Resample/convert audio to mono 16 kHz WAV and build a manifest
python scripts/preprocess_audio.py \
  --input-dir data/<dataset_name> \
  --out-dir data/<dataset_name>_wav16k \
  --sample-rate 16000

# Optionally join a metadata/transcript CSV or TSV by filename/id
python scripts/preprocess_audio.py \
  --input-dir data/<dataset_name> \
  --metadata-file data/<dataset_name>/metadata.csv \
  --join-key filename \
  --out-dir data/<dataset_name>_wav16k
```

Outputs: `--out-dir/wav/*.wav` and `--out-dir/manifest.csv`.

## 4) Use in experiments

- Use the manifest/WAVs for speech preprocessing, feature extraction, or inclusive-ASR experiments consistent with each dataset's terms.
- Keep `data/` and derived outputs out of git. Maintain provenance alongside results.

## Notes

- Inspect each dataset's README/structure first; adjust `--glob`, metadata file, and join key as needed.
- Do not mix datasets with incompatible licences, and do not relabel conditions as dementia/Alzheimer's.
