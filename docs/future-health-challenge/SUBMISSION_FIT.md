# Future Health Digital Innovation Challenge — fit map

**Track:** Population Health — *Protecting Brain Health Earlier*

This document maps the challenge's stated problem, objective and desired outcomes
to what NeuLens actually implements today, what it deliberately does not claim,
and what remains to be built. It is written to be quoted directly in a submission
and defended in front of judges.

## The problem, in the challenge's own terms

| Challenge statement | NeuLens position |
| --- | --- |
| Changes are gradual and easy to attribute to normal ageing until daily function is affected. | NeuLens is built around a **personal baseline** and within-person change over repeated comparable sessions, not a single score. Functional check-ins sit alongside cognitive observations. |
| A one-off score can mislead performance influenced by language, education, culture, sensory impairment, mood and digital familiarity. | Sessions carry recorded `language`, `educationYears`, `taskVersion`, `vision`, `hearing`, `motor` and `digitalFamiliarity`. Change is only interpreted between sessions where these **all match**; otherwise the result is `INSUFFICIENT_DATA`, never stability. |
| Assessments not validated for the local population generate false positives, anxiety or false reassurance. | The platform states plainly that its tasks are exploratory, that local language/cultural/age/education validity has not been established, and it does not output a diagnostic label. |
| Findings and risk factors remain fragmented. | Physical, metabolic, sleep, wellbeing, lifestyle, functional, family-history and (with consent) genomic context are recorded as source-labelled context inputs and shown to the reviewing clinician. |
| Uncertainty delays appropriate primary or specialist assessment. | The clinician workspace surfaces uncertainty, missing context and quality gates, and offers a clinician-owned referral / repeat-screen action rather than an autonomous decision. |

## Desired outcomes → implemented evidence

### 1. Culturally valid and accessible assessment

**Implemented**
- **Arabic (ar-AE) is a first-class portal language**, with right-to-left document direction (`dir="rtl"`), Arabic script fonts, and Arabic consent, navigation, check-in and results copy.
- Seven interface languages: English, Arabic, Tamil, Hindi, Telugu, Kannada, Malayalam.
- Large touch targets, scalable typography, high-contrast mode, spoken guidance and repeat/help controls.
- Accommodations (vision, hearing, motor, digital familiarity) are **recorded per session and enforced in comparability**, so a session completed with help is not silently compared with an unassisted one.
- Every session stores the language it was administered in. Changing language affects new sessions only.
- **Clinician Assessment Readiness screen** (`/doctor/assessment-readiness`) shows, per language, the separate status of portal interface, consent, results, task translation, independent back-translation, cognitive pretesting, local clinical sign-off and spoken voice. Task administration in a language whose required stages are incomplete is gated behind an explicit, recorded participant acknowledgement, and Arabic is surfaced explicitly rather than buried in documentation.
- **Arabic portal chrome** (navigation, consent, context pages) now renders in Arabic with RTL layout when the patient's language is Arabic, while task stimuli remain gated by the readiness screen.
- **Wearables & devices** are surfaced as an optional, consent-gated context source in the health context overview, linked to Privacy & sharing.
- **Referral completion and referral non-completion** are computed from recorded referral outcomes in `platformInsights` and surfaced on Quality & Equity. This is explicitly labelled as *non-completion*, not as false-referral burden, because knowing a referral was clinically unnecessary requires a reference standard.

**Deliberate limit**
- Arabic task wording is **delivered for the whole patient-facing battery**: activity titles, intros, prompts, button labels, screen-reader announcements, the spoken-repeat (verbal recall) sentence (`getTargetSentence()` in `client/src/features/screening/ScreeningPage.tsx`) and the piano-sequencing instructions are all Arabic (RTL), from one copy module (`client/src/features/screening/screeningCopy.ts`).
- Arabic task wording is **not validated**: it is a working translation. The registry marks stimulus translation `DONE` while independent back-translation, cognitive pretesting and local clinical sign-off stay `PENDING`, so a participant may proceed only after an explicit acknowledgement that is stored with the session and reported to the clinician, and the clinician readiness screen keeps showing the language as not approved.
- Tamil, Hindi, Telugu, Kannada and Malayalam are offered for navigation, consent and results only; their task stimuli are English. No language is presented as a validated translation. See `MEASUREMENT_AND_LOCAL_VALIDATION.md` §5 for the adaptation workflow.

### 2. Longitudinal change detection

**Implemented** (`server/src/services/changeMonitor.ts`, `server/src/services/workflow/`)
- A **personal baseline** is formed only from prior sessions that match the current session on language, education years, task version, vision, hearing, motor and digital familiarity.
- A score-based prompt requires **three comparable repeat pairs** (four comparable screens) and is raised only when the decline exceeds **1.96 × the SD of that patient's own change** across those pairs — a reliable change index computed from the patient's recorded repeats, not a fixed number.
- Below three pairs the reliability threshold is `null` and **no score-based decline is reported in either direction**; the record reads `NOT_ESTABLISHED` instead of "within range", because a spread is not a threshold. The observed spread is displayed descriptively.
- The prompt becomes a **review question**, not a diagnosis.
- Quality gate: a session is interpretable only when it is explicitly flagged comparable, is not partial, and has ≤2 interruptions. Missing quality metadata is treated as not comparable.
- Functional change and context change (sleep, activity, mood/stress) are separate review reasons; non-comparable or missing data is not read as stability.

**Deliberate limit**
- There is **no population-validated reliable-change statistic** yet: ICC(2,1) is computable from repeat administrations on the platform (`server/src/services/reliability.ts`) but is provisional, and is withheld entirely below three repeat pairs. The within-patient threshold above is that patient's own measured noise; it is not a population norm and it inherits the battery's unvalidated status. Section 4 below describes the study that replaces it with a pre-registered threshold.
- The former heuristic — flagging any score below the lowest of three earlier screens — has been removed. It could not distinguish a real change from ordinary session-to-session variation, and disclosure of that fact does not make the flag usable.

### 3. Integrated risk context

**Implemented**
- Source-labelled context inputs: `sleep`, `lifestyle_activity`, `wellbeing`, `clinical_metabolic`, `family_history`, `genomic`, plus the in-session functional check-in and context factors.
- **Family history** is captured in onboarding and the patient context screens and now persisted as a clinical context input, not just a local text field.
- **Genomic context is optional and consent-gated.** The patient explicitly opts in; only a consented record is returned to the clinician. NeuLens stores what the patient shared, states that it **does not interpret variants, calculate genetic risk, or change any score**, and shows it as discussion context only.
- Optional, per-session authorized **FHIR R4** import of blood pressure, glucose, cholesterol, weight, step count, sleep duration and PHQ-2, read-only and limited to the supported code list and previous 12 months.
- Context that may distort performance (short sleep, high stress, sensory difficulty) is surfaced to the clinician as a confounder, never used to change a score.

**Deliberate limit**
- Genomic data is **not interpreted**. Any variant-level interpretation or genetic-risk modelling is out of scope and would require separate clinical, ethical and regulatory work.

### 4. Personalized prevention and timely care

**Implemented**
- Plain-language explanation layer constrained to restate already-computed observations; deterministic fallback when the model is unavailable.
- Deterministic prevention signals (sleep, stress, mood, activity, social, sensory, medication review, nutrition) drawn only from recorded inputs.
- Clinician-owned follow-up: proposed repeat screen, context review, clinical review or daily-function support with optional date and notes. Only the qualified clinician confirms next steps.
- Referral pathways to primary care, neurology, geriatrics and mental health, plus a longitudinal review cadence.

### 5. Safety and human oversight

**Implemented**
- Every screening requires **clinician review**; the patient view is an explicit server-side allowlist and never shows internal risk classification, raw acoustic research features or unreviewed notes.
- Risk identification is explicitly separated from diagnosis in UI, reports, exports and the API response.
- Uncertainty is disclosed: missing context, non-comparable sessions and quality failures are named.
- Consent records are versioned and stored server-side; urgent/safety flags are extracted deterministically and escalated.
- Raw video is never uploaded. The speech clip is uploaded for acoustic analysis and transcription, held in memory (and as a deleted temp file in the AI service), and not retained; only derived measurements and the transcript are stored. Data flows are itemised in [`RESPONSIBLE_AI_AND_DATA_HANDLING.md`](RESPONSIBLE_AI_AND_DATA_HANDLING.md).

### 6. Validation and local population performance

**Implemented now** (`server/src/services/platformInsights.ts`)
- Completion rate (sessions explicitly recorded as fully complete).
- Comparability rate and non-comparable count.
- Repeat-session variability within a person (absolute score change between consecutive comparable sessions), clearly labelled descriptive, not a reliability coefficient.
- Median time from assessment to recorded clinical review.
- Referral completion and referral non-completion from recorded referral outcomes.
- Results segmented by **language, age band, education band and gender**, with an explicit caveat that group differences do not establish bias.
- Follow-up status (on track / due soon / overdue / not started).

**One-page evidence sheet** — [`DEMONSTRABLE_VALUE.md`](DEMONSTRABLE_VALUE.md) reports every measure in this list over a fixed-seed simulated cohort (120 patients, 302 sessions), together with the command that regenerates the figures and the standing of those numbers: they demonstrate that the measurement exists and is reported honestly, and they are **not** clinical evidence or a fairness finding.

**Not yet measurable without a reference-standard study**
- Sensitivity, specificity, true false-referral burden and validated reliable-change thresholds. These require an ethics-approved comparison against a reference instrument and/or clinician diagnosis in the intended population. The platform does not invent them. Provisional within-platform ICC is computed from real repeat pairs only; it is not a substitute for the study's reliability target.

See `MEASUREMENT_AND_LOCAL_VALIDATION.md` for operational definitions and `VALIDATION_STUDY_PLAN.md` for the Abu Dhabi pilot protocol (cohort, reference standard, sensitivity/specificity/ICC targets, and segment analysis by language, age and education).

## Next milestone — Arabic task-stimuli validation

The single highest-value next step is the Arabic task-stimuli pipeline:
forward translation, independent back-translation, cognitive pretesting with
Abu Dhabi participants across age and education bands, and local clinical
sign-off. The `/doctor/assessment-readiness` screen is the operational record
of this work: it lists each stage separately, gates task administration in a
language whose stages are incomplete behind a recorded participant acknowledgement,
and lets clinicians record sign-offs. This is
deliberate methodological honesty — the platform shows what is *not* yet valid
instead of hiding it behind a translated interface.

## Submission posture

This is a **research-stage, safety-first screening-support platform with a
validation roadmap**, not a validated diagnostic tool. The no-diagnosis posture
is the differentiator: every abnormal or rapidly changing result routes to
qualified clinician review, uncertainty is disclosed, and no sensitivity,
specificity or cultural-validity claim is made until the pilot produces it.

## One-paragraph submission summary

> NeuLens is a clinician-supervised, longitudinal brain-health screening and
> decision-support platform. It establishes a personal baseline from comparable
> sessions, gates change interpretation on language, education, task version and
> sensory/digital access, and turns an out-of-range result into a review prompt
> rather than a diagnosis. It integrates physical, metabolic, sleep, wellbeing,
> lifestyle, functional, family-history and — only with explicit patient consent —
> genomic context, and routes findings to personalized prevention and clinician-owned
> referral. Arabic is a first-class RTL portal language, and the validation plan
> measures completion, repeat-session stability, time to clinical review and
> performance across language, age and education bands, while stating plainly that
> sensitivity, specificity and local cultural validity still require a
> reference-standard study.
