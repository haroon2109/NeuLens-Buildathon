# Research datasets and validation plan

NeuLens uses publicly accessible datasets to **develop and test individual technologies** in isolation (signal quality, feature extraction, robustness). This document records the primary dataset-to-technology mapping, what each dataset can and cannot support, and the access/licensing rules that apply before any data is used.

## The central limitation

No single public dataset provides ocular, voice, facial and cognitive measurements from the same participants, with longitudinal follow-up and clinical labels. The work therefore uses several datasets, each for a narrow purpose, and never pools them into one "NeuLens model" without checking every licence and data-use agreement.

Dataset labels are research references, not ground truth for a webcam or microphone in NeuLens. A pipeline that performs well on a lab-grade or crowdsourced dataset does not establish clinical validity, and no disease probability is produced from dataset labels.

## Primary public datasets for technology development

| Dataset | Technology / purpose | What it supports | Access & terms (verify current) | Not suitable for |
| --- | --- | --- | --- | --- |
| **MPIIGaze** | **Gaze estimation** | Appearance-based gaze direction, calibration/normalization experiments, webcam-style gaze modeling under varied illumination and head pose | Public research dataset (MPII / Max Planck); registration/terms and citation required — check current licence before download/use | Clinical inference, longitudinal decline claims, or assuming lab-collected gaze transfers to every device without local validation |
| **UnityEyes** | **Eye detection / gaze-estimation experiments** | Synthetic eye images with gaze direction labels and appearance variations for detector/gaze-model experiments and robustness testing | Public research resource; distributions vary (e.g. Apache 2.0 listings exist via Google Dataset Search) — **confirm the exact version and underlying asset rights/licence** before use | Treating synthetic eyes as equivalent to real older-adult webcam footage; clinical labels (none exist); unverified asset rights |
| **Common Voice** (Mozilla) | **Audio processing / speech preprocessing & language experiments** | Multilingual speech recordings, transcriptions, different speakers/accents for ASR/audio robustness, VAD/resampling and preprocessing checks | Download: https://commonvoice.mozilla.org/en/datasets — **check the current release's license and speaker-data terms** (commonly CC0 for clips, but verify per release). Not a dementia dataset. (`research/common_voice_audio/`) | Any dementia or cognitive inference — no clinical labels; not a proxy for clinical speech |
| **CDLI Speech Datasets** (open datasets) | **Speech preprocessing / inclusive speech technology research** | Speech from people with different communication conditions; recordings, transcripts and metadata for preprocessing and inclusive speech experiments | Open datasets: https://cdli.ca/our-data/ (publicly downloadable resources). **Not Alzheimer's-labelled datasets. Verify individual repository licenses/terms** before use. (`research/cdli_speech/`) | Treating as Alzheimer's/dementia-labelled data or transferring labels to NeuLens; using without verifying per-dataset licence/terms |
| **Kaggle MRI** (e.g. public brain MRI classification datasets) | **Research experimentation** | Exploratory imaging experiments and model prototyping in a research setting (separate from NeuLens webcam/sensor pipelines) | Per-dataset Kaggle licence/terms; many are de-identified research sets but licences differ — verify provenance, consent, and permitted use | Validating NeuLens ocular/voice/facial/cognitive sensor engines; clinical diagnosis claims; mixing imaging labels with in-product screening outputs |

**Repository status:** no external dataset is downloaded or integrated into this repository yet. Any experiment must record provenance (dataset, release, licence/DUA, preprocessing and code version).

## Dataset register (extended)

Status values reflect this repository, not the dataset's availability.

### A. Cognitive and Alzheimer's research cohorts

| Dataset | What it contains | Longitudinal | Access | Relevant use | Not suitable for |
| --- | --- | --- | --- | --- | --- |
| **OASIS** (OASIS-3/4) | Clinical and cognitive information, MRI/PET in relevant releases, normal ageing and Alzheimer's cohorts | Yes | Open access with registration and data-use terms; check current licence | Studying cognitive trajectories, baseline/change modelling, report structure | Validating camera gaze, voice acoustics or facial behaviour — it has no such signals |
| **ADNI** | Cognitive assessments, clinical data, imaging, biomarkers and genetics in relevant collections | Yes | Application and acceptance of ADNI data-use terms | Longitudinal cognitive endpoints, cohort definitions, comparison with published models | Training NeuLens sensor pipelines; raw ocular/voice/facial data are not part of the core collection |
| **AD Data Initiative** | Catalogue of 100+ Alzheimer's and dementia research datasets | Varies | Per-dataset approval and terms | Discovery of additional cohorts and derived variables | Blanket reuse — each dataset has its own agreement |
| **Kaggle MRI** (public MRI datasets) | Brain MRI images/labels as published per dataset (varies) | Varies | Per-dataset licence on Kaggle | Research experimentation on imaging methods, separate from product sensor pipelines | NeuLens sensor validation or in-product diagnostic/decline outputs |

### B. Voice, speech, and audio preprocessing

| Dataset | What it contains | Access | Relevant use | Not suitable for |
| --- | --- | --- | --- | --- |
| **Common Voice** | Crowdsourced multilingual speech recordings, transcriptions, diverse speakers/accents | https://commonvoice.mozilla.org/en/datasets — check current release license and speaker-data terms (verify per release) | **Audio processing / speech preprocessing & language experiments** (`research/common_voice_audio/`) | Any dementia or cognitive inference — no clinical labels |
| **CDLI Speech Datasets** (open) | Speech recordings, transcripts and metadata from people with different communication conditions | https://cdli.ca/our-data/ — varies per resource; publicly downloadable where provided | **Speech preprocessing / inclusive speech technology research** (`research/cdli_speech/`) | Not Alzheimer's-labelled; do not transfer labels to NeuLens; verify individual repository licenses/terms |
| **ADReSS / ADReSSo** | Spoken picture-description recordings, transcripts and dementia-related labels | Research access; check redistribution and commercial-use terms | Acoustic feature experiments, speech-rate/pause/pitch comparisons, reproducibility checks against published work | Claiming clinical validity, or transferring performance to target populations without local data |
| **DementiaBank** | Conversational speech and transcripts across dementia-related corpora, including the Pitt Corpus | Controlled access, membership/agreement, research-only | Feature exploration, task design comparisons, transcript-based language measures | Redistribution, commercial training, or use as a diagnostic benchmark for NeuLens |
| **Pitt Corpus** (via DementiaBank/TalkBank) | Interview speech, transcripts and clinical research data | Controlled through TalkBank/DementiaBank | Studying pause and fluency features in conversational speech | Treating interview acoustics as equivalent to a guided repetition task |

ADReSS/ADReSSo and DementiaBank are the closest speech resources to the research question but are small, language-specific and not representative of all deployment populations.

### C. Eye, facial, and behavioural resources

**Facial/behavioural priorities (NeuLens):** freely explore **general-purpose facial landmark and video datasets** (respect each licence/terms and consent scope), but **do not prioritize dementia-labelled facial datasets from Kaggle**. Initial focus: **face landmark detection, head pose estimation, eye-region tracking, movement consistency, video quality, and task-related response timing**. Develop and test these with **your own consented test recordings and synthetic examples** (ethics approval/consent, de-identification, access controls, retention plan; engineering controls are not ethics approval). See `research/facial_behavioral/` for an offline analysis workflow.

| Resource | What it contains | Access | Relevant use | Not suitable for |
| --- | --- | --- | --- | --- |
| **MPIIGaze** | Appearance-based gaze data for gaze estimation research | Public research access with registration/terms; cite appropriately | **Gaze estimation** (calibration, gaze-direction modeling, robustness experiments) | Clinical inference or direct transfer claims without local validation |
| **UnityEyes** | Synthetic eye images with gaze direction labels and appearance variations | Public research release; **confirm exact version and underlying asset rights/licence** (see Google Dataset Search) | **Eye detection** / gaze-estimation experiments and robustness prototyping (`research/unityeyes_gaze/`) | Replacing validation on real, consented webcam data; clinical labeling; assuming synthetic performance transfers directly |
| **General-purpose facial landmark/video datasets** (e.g. landmark/pose/face-video benchmarks) | Landmarks, head pose, face/video variation (dataset-dependent) | Per-dataset licence/terms; verify consent and permitted use | **Face landmark detection, head pose estimation, eye-region tracking, movement/quality robustness** | Emotion/disease relabelling, dementia claims, or use beyond licence/consent |
| **NITRC** | Neuroimaging and neuroscience resources, including eye-tracking collections | Per-resource registration/terms | Finding gaze, fixation and saccade datasets with participant metadata | Treating an MRI resource as eye-tracking data |
| **OpenNeuro** | Open neuroscience datasets, including some eye-tracking and behavioural studies | Open licences varying by dataset; check each | Gaze-event definitions, calibration methods, task designs | Training a webcam model on lab-grade tracker data and assuming it transfers |
| **Kaggle eye-tracking sets** | General gaze and screen-facing datasets | Per-dataset licence | Prototyping calibration and fixation detection | Clinical inference or use without consent for the intended purpose |
| **Own consented test recordings / synthetic examples** | Task-aligned webcam/video with timestamps and consent | Locally collected under ethics/consent | **Primary data for landmarks, head pose, eye-region tracking, movement consistency, video quality, task-related response timing** (`research/facial_behavioral/`) | Use without consent/ethics approval, or sharing identifiable data improperly |

> **Eye-Tracking Dataset for Autism Research (e.g. Centific):** may include eye-tracking experiments, gaze-related records, and participant metadata useful for *exploring gaze-analysis pipelines* only. **This is autism-related research data, not dementia data — do not transfer its clinical labels to NeuLens** or make dementia/cognitive claims from it. Verify access, consent, and licence/terms before use and record provenance. See: https://data.centific.com/

| **DASH Lab resources** | Research resources related to dementia, speech and behaviour | Per-resource terms | Understanding behavioural observation protocols and annotation practice | Assuming a published resource is a validated facial-decline dataset |
| **PhysioNet** | Physiological and health research data, including some video and behavioural collections | Credentialed access and data-use agreements for restricted sets | Signal-quality and behavioural-timing methods where a suitable collection exists | Assuming any video collection carries dementia labels |

**Avoid:** dementia-labelled facial datasets from Kaggle for NeuLens facial development. There is no widely accepted, openly licensed dataset pairing facial behaviour with clinical cognitive outcomes; facial analysis remains a supplementary research module (observations such as head movement, task timing, tracking quality), never emotion or dementia classifications.

## Mapping datasets to NeuLens technologies

| NeuLens technology | Primary public dataset(s) | What is actually evaluated |
| --- | --- | --- |
| Gaze estimation | **MPIIGaze**, (plus NITRC/OpenNeuro/Kaggle gaze sets as applicable) | Calibration error, fixation/saccade/gaze-direction quality and robustness |
| Eye detection | **UnityEyes**, (plus real-data validation sets as available) | Detector/landmark robustness under pose, appearance, and lighting variation |
| Audio processing / speech preprocessing & language | **Common Voice** (`research/common_voice_audio/`) | ASR/audio robustness, VAD, resampling, language/accent coverage, preprocessing stability (not dementia-labelled) |
| Speech preprocessing / inclusive speech | **CDLI Speech Datasets** (open, per-resource licences) via `research/cdli_speech/`; DementiaBank/ADReSS/Pitt for audio+transcript preprocessing where permitted | Normalization, segmentation, timing/pause extraction, preprocessing pipelines (not Alzheimer's-labelled for CDLI) |
| Research experimentation (imaging) | **Kaggle MRI** (and other licensed MRI cohorts such as OASIS/ADNI when approved) | Exploratory imaging methods and analysis workflows, separate from in-product screening sensors |
| Facial/behavioural (quality & timing) | General-purpose facial landmark/video datasets; **own consented test recordings & synthetic examples** (`research/facial_behavioral/`) | Landmark detection, head pose, eye-region tracking, movement consistency, video quality, task-related response timing — not emotion/diagnosis; avoid dementia-labelled facial Kaggle sets |
| Cognitive/longitudinal (cohorts) | OASIS, ADNI, AD Data Initiative | Task scoring logic, cohort-level trajectories, comparable-session/change methods |

Sensor engines are validated first on technical signal quality, not on clinical labels.

## Access, licensing and ethics rules

1. **Read the current terms for every dataset, every time.** Terms change and differ between releases. "Open/public" does not imply commercial-use or redistribution rights.
2. **Do not redistribute restricted recordings.** Store only derived features where the agreement allows it.
3. **Do not pool datasets with incompatible licences.** Keep a provenance field for any research export: dataset name, release, access agreement, and permitted use.
4. **Check commercial-use restrictions before training anything that ships.** Review obligations for dependencies and derived models/weights.
5. **Do not relabel.** Emotion labels are not cognitive labels; MRI cohorts are not gaze cohorts; synthetic data is not consented clinical video.
6. **Local validation is mandatory before any deployment claim.** Language, accent, education, lighting, and device hardware all affect measurements.
7. **Ethics and consent come first for NeuLens-collected data.** Any pilot recording needs ethics approval, informed consent, de-identification, access controls and a retention plan.
8. **No disease probability is produced from dataset labels.** The product returns observations and review prompts for a clinician.

## Staged research plan

1. **Technical signal validation (no clinical claims):** repeated, consented sessions on target devices; measure test–retest stability (gaze calibration/fixations, speech timing/acoustics, landmark tracking); gate on quality.
2. **Feature and task experiments:** use MPIIGaze/UnityEyes for gaze/eye robustness; Common Voice for audio/VAD robustness; permitted speech corpora for acoustic/preprocessing experiments; report cross-dataset differences, not a single accuracy claim.
3. **Longitudinal and imaging experimentation:** use approved cohorts (OASIS/ADNI) for change-method studies and Kaggle MRI (or approved MRI sets) for separate imaging research; keep NeuLens baseline/comparability logic distinct.
4. **Clinical evaluation:** prospective, ethically approved study with the target population; pre-registered analysis; no diagnostic/marketing claim before completion and review.


## Repositories beyond Kaggle

Useful repositories for discovering speech, audio, facial, eye-tracking, neuroscience, clinical, and ML datasets (always verify per-dataset licence, consent, and permitted use):

| Repository | What to search for | Website |
| --- | --- | --- |
| Hugging Face | Speech, audio, facial and ML datasets | https://huggingface.co/datasets |
| Zenodo | Research datasets, eye tracking, neuroscience | https://zenodo.org/ |
| OpenNeuro | Neuroscience and brain research | https://openneuro.org/ |
| UCI ML Repository | Clinical and tabular ML datasets | https://archive.ics.uci.edu/ |
| PhysioNet | Physiological and clinical signals | https://physionet.org/ |
| Mendeley Data | Research datasets | https://data.mendeley.com/ |
| Google Dataset Search | Discover datasets across repositories | https://datasetsearch.research.google.com/ |

## India-relevant longitudinal cohort: LASI-DAD

**LASI-DAD (Longitudinal Aging Study in India – Diagnostic Assessment of Dementia)** is particularly relevant to NeuLens's Indian population research (aging and dementia-related assessment context). Access is controlled: **non-US researchers need to apply and sign a data-use agreement** (and other eligibility/approval requirements may apply). Review current access procedures, permitted use, and citation requirements before requesting or using data.

- Website: https://lasi-dad.org/


## Immediate next actions

1. Confirm the exact CDLI resource/release and licence for the intended preprocessing experiments (and document provenance).
2. Obtain/register access for MPIIGaze, UnityEyes, Common Voice, and selected Kaggle MRI dataset(s) per their current terms; record citations and permitted use.
3. Define the provenance record used by research exports before any dataset is joined to NeuLens assessments.
4. Establish a local, consented validation protocol for webcam gaze/eye, microphone audio, and guided tasks on target devices/populations.
5. Record every experiment with dataset release, preprocessing/feature version, and code commit for reproducibility.

## Related documents
- `research/ACCESS_AND_RUNBOOK.md` — access steps, train/validate commands, and integration notes for research pipelines.

- `docs/technology-stack.md` — analysis libraries and licensing notes.
- `docs/backend-architecture.md` — storage, RLS and access-control design.
- `research/README.md` — offline research experiment rules.
- `README.md` — product constraints and clinical safety rules.
