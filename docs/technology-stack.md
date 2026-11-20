# NeuLens technology stack

This document maps the agreed open-source stack to what is actually installed
and used in this repository. It is the reference for "are we using the right
tools?", separate from the clinical design rules in `README.md`.

Legend: **Active** = imported by application code; **Optional** = supported,
installed only when configured; **Research** = planned/experimental, not part
of the product runtime; **Not adopted** = deliberately excluded.

## Frontend

| Technology | Installed version | Where it is used | Status |
| --- | --- | --- | --- |
| React | 18.3 | All screens in `client/src` | Active |
| TypeScript | 5.9 | Client and Express server source | Active |
| Vite | 5.4 | `client/vite.config.ts`, dev/build scripts | Active |
| Tailwind CSS | 3.4 | `client/tailwind.config.js`, `client/src/styles/index.css` | Active |
| shadcn/ui | copied components | `client/src/components/ui/` (button, dialog, input), configured in `client/components.json` | Active |
| Lucide React | 0.368 | Icons across layouts, tasks and portal screens | Active |
| Recharts | 3.10 | Dashboard, analytics, results and report charts | Active |
| React Hook Form | 7.83 | Auth, patient login and portal forms | Active |
| Zod | 3.25 | `client/src/features/auth/schemas.ts` plus form resolvers; also used by Express validation | Active |
| TanStack Query | 5.107 | `client/src/lib/queryClient.ts`, `usePatientOverview`, `useDoctorPatient` | Active |

Supporting libraries already present: React Router, Zustand (local UI state),
Radix primitives (required by shadcn/ui), `class-variance-authority`,
`tailwind-merge`, `tailwindcss-animate`, Framer Motion, Axios and
`@supabase/supabase-js`.

`client/components.json` is present, so additional shadcn/ui components can be
added with the official CLI rather than hand-rolled.

## Backend, database and authentication

| Technology | Where it is used | Status |
| --- | --- | --- |
| Supabase PostgreSQL schema | `supabase/migrations/0001_init.sql` — profiles, care relationships, assessments, baselines, change detections, documents, notifications | Active (schema) |
| Supabase Auth | Browser client in `client/src/lib/supabase.ts`; FastAPI verifies Supabase JWTs (`ai-service/app/auth.py`) | Optional |
| Row Level Security | Policies in the Supabase migration; roles assigned server-side only | Active (schema) |
| Supabase Storage | Private `clinical-documents` and `assessment-reports` buckets, path-scoped to the patient | Active (schema) |
| Supabase Realtime | `notifications` streamed to the signed-in recipient | Active (schema) |
| FastAPI | `ai-service/app` — voice, ocular, facial, cognitive and longitudinal analysis APIs | Active |
| PostgreSQL + Prisma | `server/prisma/schema.prisma`, `server/src/models/dataStore.ts` — the working API's persistence | Active |
| Express | `server/src` — transitional API/BFF for auth, screening persistence and the voice proxy | Active |

**Why both Supabase and Express exist.** The repository is mid-migration. The
Supabase schema, RLS, storage and realtime layer are ready, and the browser can
hold a Supabase session (anon key only). The Express API still owns patient-ID
login and the screening records that the current screens use. The intended
end state, including the migration checklist, is in
`docs/backend-architecture.md`.

Secrets rule: the browser receives only `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY` and `VITE_AI_SERVICE_URL`. Service-role keys, JWT
signing secrets, `INTERNAL_API_KEY` and model provider keys live in
`server/.env` or `ai-service/.env`, never in a `VITE_*` variable.

## Ocular / eye-movement analysis

| Technology | Role | Status |
| --- | --- | --- |
| MediaPipe Tasks Vision | Face/eye landmarks, iris landmarks, blink and gaze-ratio sampling in `client/src/hooks/useFaceLandmarker.ts` | Active |
| Browser camera + calibration | `client/src/features/screening/ocular/` — 5-point affine calibration, target-following activity, quality gating | Active |
| OpenCV | Eye-region/pupil experiments; not required because landmark extraction happens in MediaPipe | Research |
| WebGazer.js | Alternative webcam gaze estimation | Not adopted — MediaPipe iris landmarks already provide the calibrated gaze signal used by the task |

The webcam limitation is explicit in the UI and reports: ordinary cameras
cannot produce clinical-grade eye tracking, and the session summary records
tracking quality alongside the measurements.

## Voice and speech analysis

| Technology | Role | Status |
| --- | --- | --- |
| Web Audio API | Browser capture in `client/src/services/voice/acousticCapture.ts` | Active |
| Librosa | Decoding, VAD support and signal features in `ai-service/app/services/acoustics.py` | Active |
| Parselmouth (`praat-parselmouth`) | Pitch, intensity, jitter and shimmer via Praat | Active |
| Silero VAD | Speech/non-speech detection for the voice pipeline (MIT, code and weights). Runs in-process via `torch`; findings are labelled `"vad": "silero"`. The speech threshold is set by `VAD_SPEECH_THRESHOLD` (default 0.5) | Active |
| Whisper | Speech transcription; not required for the acoustic measurements | Not adopted — transcription does not establish cognitive status, and Gnani Prisma supplies the current transcript path |

Licensing notes:

* librosa is ISC-licensed; `praat-parselmouth` links Praat, which is GPLv3.
* The optional speech-to-text and text-to-speech calls use the commercial
  Gnani Prisma/Timbre APIs. They are integration choices, not part of the
  open-source analysis stack; the acoustic measurements above do not depend on
  them and keep working if those credentials are removed.
* Silero VAD is MIT-licensed, including the weights. It requires PyTorch, so
  the service pins the CPU-only build from PyTorch's own wheel index; the
  default PyPI wheel would add several GB of unused CUDA libraries to the
  image. An energy segmenter remains as a fallback if the model fails to load,
  and the response records which one measured the clip.
* openSMILE's open-source edition is **not** licensed for commercial product
  use and is deliberately absent.

## Facial and behavioural analysis

| Technology | Role | Status |
| --- | --- | --- |
| MediaPipe Face Landmarker | 478-point mesh, head pose inputs and face presence | Active (browser) |
| NumPy | Numerical summaries in `ai-service/app/services/features.py` | Active |
| OpenCV | Image-processing experiments | Research |
| SciPy | Signal-processing experiments | Optional |
| scikit-learn | Experimental behavioural models | Research |

The module reports observable behaviour only: head movement, facial movement,
task response timing, movement consistency, camera quality and engagement. It
does not classify emotions or infer dementia, and it is supplementary to the
cognitive tasks.

## Cognitive assessment engine

| Technology | Role | Status |
| --- | --- | --- |
| React + TypeScript | Original browser tasks (memory, attention, executive, orientation, language) and timing capture | Active |
| Python + NumPy | Scoring and domain summaries in `ai-service/app/services/scoring.py` | Active |
| SciPy / scikit-learn | Statistical and experimental scoring work | Research |

Tasks are original. MoCA and MMSE questions are not reproduced: MoCA has
explicit intellectual-property and commercial-use requirements, and both
instruments require clinical review before any derivative use.

## AI and machine-learning models

No model output is a diagnosis or disease probability. The service returns
`model_inference: false` unless a validated model is explicitly enabled.

| Technology | Intended use | Status |
| --- | --- | --- |
| scikit-learn | Classical feature analysis and baseline experiments | Research |
| XGBoost | Structured-feature experiments | Research |
| PyTorch | Custom multimodal models | Later |
| TensorFlow | Alternative neural-network work | Not adopted |
| ONNX Runtime | Deployment of trained models | Later |
| Ollama (Qwen/Llama/Gemma/Mistral) | Local plain-language drafting from deterministic metrics; clinician review required | Optional |
| Hugging Face Transformers | Optional pretrained speech/text models | Optional |
| River | Online/incremental experiments | Later |

The five engine boundaries are already reflected in the API:
`/v1/ai/cognitive`, `/v1/ai/voice`, `/v1/ai/ocular`, `/v1/ai/facial` and
`/v1/ai/longitudinal`.

## Longitudinal monitoring

| Technology | Role | Status |
| --- | --- | --- |
| NumPy / Python statistics | Within-person observed range and change summary in `scoring.py` | Active |
| Pandas | Assessment-history experiments | Research |
| SciPy | Statistical tests | Research |
| statsmodels | Baseline and mixed-effects models | Later |
| scikit-learn | Baseline models | Research |
| sktime | Time-series experiments | Later |
| River | Incremental learning experiments | Later |

The current rule is intentionally conservative: only comparable sessions count,
and a poor-quality session is reported as `INSUFFICIENT_DATA`, never as decline.
A score is compared against the mean of up to three prior comparable scores, and
a decline is reported only when it exceeds 1.96 × the SD of that patient's own
consecutive within-person differences — a reliable change index estimated from
three or more repeat pairs. Below three pairs no change is reported at all. A
small change is never labelled decline; a population threshold still requires
clinical validation, test–retest reliability and practice-effect correction.

## Installing research extras

Research libraries are not runtime dependencies. They are listed separately so
production images stay lean:

```bash
cd ai-service
pip install -r requirements.txt          # runtime
pip install -r requirements-research.txt # optional experiments
```

## Related documents

- `docs/research-datasets.md` — dataset register, access/licensing rules and
  validation stages.
- `docs/ai-report-generation.md` — deterministic-vs-LLM boundary, local Ollama
  setup and explanation guardrails.
- `docs/backend-architecture.md` — Supabase schema, RLS and migration path.

## Verification

```bash
cd client && npm run type-check && npm run build
cd server && npx tsc --noEmit
cd ai-service && .venv/bin/python -m pytest -q
```

The frontend dependencies above are also verifiable with `npm ls --depth=0` in
`client/`.
