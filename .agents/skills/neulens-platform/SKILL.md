---
name: neulens-platform
description: >-
  Comprehensive guide and operational runbook for NeuLens: early brain health monitoring,
  multimodal cognitive screening (ocular, voice, facial biometrics), longitudinal within-person
  change detection, and bilingual Arabic/English clinical workflows. Use whenever developing,
  verifying, testing, or updating NeuLens patient/doctor portals, screening batteries, or scoring pipelines.
---

# NeuLens Platform Skill

NeuLens is an AI-powered early neurocognitive screening and longitudinal brain-health monitoring system built for the Google Startup Buildathon, fully engineered, maintained, and supervised by the Google Antigravity agent.

This skill equips agents with the procedural knowledge, clinical safety rules, architecture patterns, Google product integrations (Google Gemini, Google MediaPipe, Google Cloud), and demo testing workflows needed to maintain and extend the platform.

---

## 1. Directory & Skill Assets

This skill includes structured assets in the `assets/` directory:

* [clinical-screening-rubric.json](./assets/clinical-screening-rubric.json): Multimodal scoring baselines, biometric boundaries (ocular, acoustic, facial), and longitudinal change thresholds.
* [demo-profiles.json](./assets/demo-profiles.json): Verified jury demonstration profiles for Patient **Haroon** (`CV-2026-HAROON`) and Clinician **Dr. Mohamed** (`doctor.demo@neulens.ai`).

---

## 2. Core Architecture & Tech Stack

```text
NeuLens/
├── client/              # React 18, TypeScript, Tailwind CSS, Vite, TanStack Query, Radix UI
│   ├── src/features/
│   │   ├── landing/     # Public multilingual landing page & showcase
│   │   ├── screening/   # Multimodal cognitive screening battery (MediaPipe, Audio, Vision)
│   │   ├── patient/     # Patient Portal (Dashboard, Brain Health Pathway, Timeline, Care Plan)
│   │   └── doctor/      # Clinician Portal (Dashboard, Directory, Patient Dossier, Review Queue)
│   └── dist/            # Statically served production frontend bundle
└── server/              # Node.js, Express, TypeScript, Prisma (PostgreSQL + In-Memory Fallback)
    ├── src/controllers/ # Auth, Patient, Doctor, Screening, Assessment, Appointment controllers
    ├── src/models/      # HospitalDataStore (unified patient and clinical data store)
    ├── src/services/    # Deterministic workflow orchestrator, change monitor, voice engine
    └── dist/            # Compiled backend server bundle (`dist/app.js`)
```

---

## 3. Operational Instructions & Procedures

### A. Building & Running the System

1. **Client Build**:
   After modifying any file in `client/src/`, always rebuild the Vite bundle and sync static brand assets:
   ```bash
   cd client
   node ./node_modules/.bin/vite build
   cp public/neulens-* dist/ && cp public/favicon.* dist/
   ```

2. **Server Build & Execution**:
   After modifying any TypeScript file in `server/src/`, compile and start:
   ```bash
   cd server
   node ./node_modules/.bin/tsc
   node dist/app.js
   ```

3. **Port & Fallback Policy**:
   * Express listens on port `5000` and serves both the REST API (`/api/v1/*`) and static client files from `client/dist/`.
   * When PostgreSQL is unavailable, `HospitalDataStore` seamlessly engages memory fallback (`inMemoryAssessments`, `inMemoryUsers`, etc.), ensuring zero disruption during evaluation.

---

### B. Screening Pipeline & Biometric Integration

When administering or processing an assessment:

1. **Multimodal Capture**:
   * **Ocular (Webcam)**: MediaPipe FaceMesh tracks gaze fixation stability, saccadic reaction latency, and blink cadence.
   * **Acoustic (Microphone)**: Web Audio API / Acoustic Analyzer measures verbal speech rate (WPM), pause cadence, jitter, and shimmer.
   * **Facial Expressivity**: Measures facial movement symmetry and tremor stability score.
2. **Deterministic Scoring**:
   * The composite score is derived strictly from recorded task responses via `scoreBatterySession()`. It is never supplied or trusted from the client.
3. **Workflow Orchestration**:
   * `runAssessmentCompletionWorkflow()` executes in sequence:
     1. **Safety & Accessibility**: Validates sensory accommodations, language readiness, and test setting quality.
     2. **History & Baseline**: Retrieves or establishes personal baseline anchors.
     3. **Longitudinal Intelligence**: Detects significant within-person change over time ($\Delta \le -5.0$).
     4. **Clinical Documentation**: Prepares source-linked draft observations for physician review.
     5. **Follow-up Coordination**: Flags review prompts and suggests lifestyle/prevention steps.

---

### C. Bilingual & Cultural Validation (Arabic & English)

* NeuLens is calibrated specifically for the Abu Dhabi healthcare ecosystem.
* Both portals support seamless switching between English and Modern Standard Arabic (العربية).
* Tasks, voice prompts, and clinical instructions must adhere to culturally validated norms (RUDAS and local reference adaptations) to avoid false positives.

---

### D. Verification Checklist

Before submitting or certifying changes:

- [ ] Client builds with zero TypeScript errors (`vite build`).
- [ ] Server builds with zero TypeScript errors (`tsc`).
- [ ] Patient Haroon (`CV-2026-HAROON` / PIN `246810`) loads longitudinal history in `/patient/dashboard`.
- [ ] Clinician Dr. Mohamed (`doctor.demo@neulens.ai`) accesses Haroon's record in `/doctor/patients/CV-2026-HAROON`.
- [ ] Completed patient assessments immediately appear in the doctor's review queue.
