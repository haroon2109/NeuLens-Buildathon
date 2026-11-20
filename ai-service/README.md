# Neulens AI service (FastAPI)

Python service for signal processing and assessment analysis. It sits between the React client and PostgreSQL:

```
React (Vite)  --Supabase access token-->  FastAPI  --service role-->  PostgreSQL / Storage
                                             |
                                             +-- voice processing
                                             +-- ocular processing
                                             +-- facial processing
                                             +-- cognitive analysis
                                             +-- longitudinal engine
```

## Secrets

| Secret | Where it lives |
| --- | --- |
| `SUPABASE_ANON_KEY` | Browser (public; protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | This service only |
| `SUPABASE_JWT_SECRET` / JWKS | This service only |
| `GNANI_API_KEY` and any model keys | This service only |

Never add a `VITE_`-prefixed variable for a service-role key or model key — Vite inlines `VITE_*` values into the browser bundle.

## Run locally

```bash
cd ai-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env          # fill Supabase values
.venv/bin/uvicorn app.main:app --reload --port 8000
```

OpenAPI docs: <http://localhost:8000/docs>

## Test

```bash
cd ai-service
.venv/bin/python -m pytest -q
```

Tests sign their own HS256 tokens with a local secret, so they never contact Supabase or any model provider.

## Endpoints

All `/v1/ai/*` routes require `Authorization: Bearer <supabase access token>`.

| Route | Purpose |
| --- | --- |
| `GET /health` | Liveness and configuration summary (no secrets) |
| `GET /v1/ai/capabilities` | Which pipelines are enabled |
| `POST /v1/ai/voice/analyze` | Pause cadence, jitter, shimmer from edge frames |
| `POST /v1/ai/voice/acoustics` | Uploaded clip: VAD timing, pitch, intensity, Praat jitter/shimmer, speech rate, word accuracy |
| `POST /v1/ai/ocular/analyze` | Saccades, fixation stability, blink rate |
| `POST /v1/ai/facial/analyze` | Bilateral symmetry, micro-tremor |
| `POST /v1/ai/facial/behaviour` | Head/facial movement, movement consistency, response timing, tracking quality |
| `POST /v1/ai/cognitive/analyze` | Exploratory domain scores from task responses |
| `POST /v1/ai/longitudinal/analyze` | Within-person observed range and review prompts (clinicians only) |

## Voice / speech analysis

The repeat-sentence activity records a short clip in the browser (Web Audio API + MediaRecorder) and passes it to `POST /v1/ai/voice/acoustics`. The browser also measures response latency and a coarse fallback feature set, so the activity still records timing when this service is unreachable.

| Stage | Component | Licence |
| --- | --- | --- |
| Capture | Web Audio API / MediaRecorder | browser standard |
| Decode | ffmpeg (WebM/Opus → mono 16 kHz WAV) | LGPL/GPL build-dependent |
| Timing, intensity, syllable rate | librosa | ISC |
| Pitch, jitter, shimmer, intensity | Praat via `praat-parselmouth` | GPLv3 (links Praat) |
| Speech/non-speech | Silero VAD (CPU `torch`) | MIT |

Notes for a commercial deployment:

* `praat-parselmouth` links Praat, so it is GPLv3. Review the obligations for your distribution model (or isolate/remove this stage) before shipping.
* Silero VAD decides what counts as speech, so the service measures the detected speech and marks a clip of noise or tones non-comparable rather than reporting it.
* `VAD_SPEECH_THRESHOLD` (default `0.5`, Silero's own) tunes that boundary. Lower it towards `0.35` when quiet, dysarthric or heavily accented speech is flagged as "little speech" and patients are asked to re-record; raise it when background noise is counted as speech. The trade-off is measurable: on the same noisy 8 s clip, `0.5` found 6.0 s of speech across 3 segments and `0.2` found 7.5 s merged into 1 segment, losing a real pause. Every response reports the value used in `vad_threshold`. It pulls in PyTorch, pinned to the CPU-only build in `requirements.txt` (the default wheel brings ~5 GB of CUDA libraries this service does not use). `"vad": "silero"` reports the model; `"energy"` only appears if the model fails to load and the energy fallback runs.
* openSMILE is deliberately not used: its open-source edition is not licensed for commercial products without a separate agreement.
* Whisper is not required. Transcription is optional (the existing Gnani STT route) and only feeds task-specific word accuracy.
* Every number is an exploratory acoustic observation, not a validated cognitive or clinical marker.

The Express API (`POST /api/v1/voice/acoustics`) forwards clips here with the `INTERNAL_API_KEY` shared secret, so platform sessions authenticated by the Express API can use the pipeline. Set `AI_SERVICE_URL` and `AI_SERVICE_INTERNAL_KEY` in the Express environment.

## Facial and behavioural analysis

The screening client records head pose and blendshape values from MediaPipe and builds an immediate behavioural summary (`useBehaviouralSession`): head movement, facial movement, movement consistency, task response timing, camera tracking quality and a plain engagement note. `POST /v1/ai/facial/behaviour` computes the same observations server-side from uploaded frames for research batches.

This is **not** an emotion detector and not a determinant of brain-health status. It describes observable behaviour during a guided task, and `model_inference` stays false.

## Research datasets (development/testing of individual technologies)

Public datasets for offline research and technology validation are documented in `../docs/research-datasets.md` and `../research/README.md`. Primary mappings:

- **MPIIGaze** → gaze estimation
- **UnityEyes** → eye detection
- **Common Voice** → audio processing
- **CDLI** (resource/licence-dependent) → speech/corpus preprocessing experiments
- **Kaggle MRI** (per-dataset licence) → research experimentation (imaging)

Use datasets only within their access/licence terms, keep provenance, and do not treat dataset results as clinical validation of NeuLens.

## What the service deliberately does not do

* It does not classify emotions or infer cognitive status from facial expression.
* It does not copy MoCA or MMSE items. MoCA has explicit intellectual-property and commercial-use requirements; NeuLens activities must be original and clinically reviewed before use.
* It does not return a disease probability. Every response carries observations plus `model_inference: false` until validated weights are configured (`ENABLE_MODEL_INFERENCE`).
* It does not read a role from the request body. Roles come from the verified JWT, and patient-scoped access is enforced again by Row Level Security in PostgreSQL.
* It does not treat a poor-quality session as a decline. Non-comparable sessions are excluded from comparison and produce `INSUFFICIENT_DATA`.

## Docker

```bash
docker build -t neulens-ai .
docker run --env-file .env -p 8000:8000 neulens-ai
```

The build is two-stage: `build-essential` compiles `praat-parselmouth` in the `builder` stage and is not copied into the runtime image, which saves roughly 310 MB. The runtime layer carries ffmpeg, the venv and the app. CI builds this image and fails if a dependency change reintroduces the CUDA/NVIDIA stack, since the pinned CPU-only torch is what keeps the image at a workable size.
