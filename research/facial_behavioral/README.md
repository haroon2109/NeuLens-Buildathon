# Facial and behavioural research (landmarks, pose, eye-region, quality)

Offline **research resources** for developing and testing NeuLens facial/behavioural technology: **face landmark detection, head pose estimation, eye-region tracking, movement consistency, video quality, and task-related response timing**. This is for signal-quality and behavioural observation research only — **not** emotion detection and **not** a determinant of brain-health/cognitive status.

## Dataset and data-source guidance

- **Freely explore general-purpose facial landmark and video datasets** (respect each dataset’s licence/terms and consent scope). Prefer datasets suited to landmarks, pose, eye-region tracking, and video-quality robustness.
- **Do not prioritize dementia-labelled facial datasets from Kaggle** (or similar). Emotion/disease relabelling is invalid for this use; facial analysis remains supplementary and observational.
- **Primary development data:** your own **consented test recordings** and **synthetic examples**. Any pilot/recording requires ethics approval where applicable, informed consent covering intended research use, de-identification, access controls, retention/deletion plan, and secure storage (engineering controls like private storage are not ethics approval).

## Focus areas (initial)

| Focus | What to measure (examples) | Notes |
| --- | --- | --- |
| Face landmark detection | Detection rate, landmark stability/jitter, tracking continuity | Across lighting, distance, pose, eyewear, skin tone |
| Head pose estimation | Yaw/pitch/roll range, pose stability during task | Quality-gate extreme poses/dropouts |
| Eye-region tracking | Eye openness/region visibility, blink/occlusion signals, tracking quality | Use for signal quality, not clinical inference |
| Movement consistency | Frame-to-frame motion magnitude/variance, steadiness over task windows | Describe observable behaviour during guided tasks |
| Video quality | Resolution/FPS, brightness/blur/exposure proxies, face size/centering, dropout rate | Gate non-comparable/low-quality sessions |
| Task-related response timing | Onset/response latencies aligned to task events, segment durations | Requires timestamped task markers |

## 1) Environment

```bash
cd research/facial_behavioral
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Notes: `mediapipe` and `opencv-python` enable landmark/head-pose/eye-region analysis in the provided script. Install platform-appropriate builds if needed; without them, run basic video-quality/timing checks or use your own tooling.

## 2) Analyze consented/synthetic recordings

Run on a local video file (or folder of videos/frames) from consented test recordings or synthetic examples:

```bash
python scripts/analyze_recording.py --input path/to/recording.mp4 --out-dir runs/sample
```

Outputs (when dependencies available): per-frame/per-segment metrics and a summary (`summary.json`, `frame_metrics.csv`) covering detection/landmark presence, head-pose estimates, eye-region proxies, movement consistency, basic video quality, and timing/duration. Treat outputs as **research observations**.

## 3) Provenance and safety

- Keep raw consented recordings outside git in controlled storage; commit only code/configs and de-identified/derived summaries where permitted.
- Record provenance: source (consented/synthetic), consent/ethics reference, device/lighting conditions, preprocessing, and code commit.
- **Do not** classify emotions or infer cognitive/brain-health status from facial behaviour. **Do not** relabel datasets. Report low-quality or non-comparable sessions as such.

## Related

- `../../docs/research-datasets.md` — facial/behavioural dataset guidance and priorities.
- `../../ai-service/README.md` — in-product facial/behavioural observations (non-diagnostic).
- `../../client/src/features/screening/` — client-side capture/behavioural session hooks.
