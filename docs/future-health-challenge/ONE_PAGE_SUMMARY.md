# NeuLens — one page

**Abu Dhabi Future Health Digital Innovation Challenge · Population Health — *Protecting Brain Health Earlier***

## What it is

NeuLens is a clinician-supervised, longitudinal brain-health screening and decision-support
platform. It establishes a personal baseline from **comparable** sessions, gates change
interpretation on language, education, task version and sensory/digital access, and turns an
out-of-range result into a review question rather than a diagnosis. Findings route to
prevention advice and clinician-owned referral; nothing reaches the patient as a score
without review.

## The problem, in one person

> **Illustrative case — not a real patient record.** Fatima, 68, screens at baseline. She
> returns three times over the next two years; with three comparable repeat pairs the
> platform can measure her own session-to-session variability. Her latest score falls
> further than that spread accounts for, and because language, task version, education and
> sensory access match across all four sittings, the movement becomes a question for her
> clinician — not a diagnosis, and not a number on a dashboard.

A one-off score can mislead. NeuLens is built so that a change claim is only possible when
the conditions were matched and the movement beat the person's own noise.

## Six numbers

From a fixed-seed simulated cohort — **simulated, not clinical evidence, not the jury demo
workspace** (120 patients, 302 sessions; reproduce with one command in the evidence sheet).

| Measure | Result |
| --- | --- |
| Completed assessments | 302 |
| Sessions completed in full | 86.4% |
| Sessions comparable (matched conditions) | 72.8% |
| Median time from session to clinical review | 17.8 h (p90 57.8 h) |
| Referral completion / non-completion | 54.3% / 45.7% |
| Repeat-session ICC(2,1) — provisional | 0.687 from 109 pairs |

Fairness is reported as comparability by age and education band, with sample sizes, and
with the caveat that a group difference is a prompt to investigate, not proof of bias.

## What it deliberately does not claim

- **No diagnosis, no risk score.** The output is a review prompt with the uncertainty attached.
- **No clinical validity yet.** No sensitivity, specificity or local cultural validity is
  claimed; that requires the Abu Dhabi pilot in the validation plan.
- **No substituted values.** If a camera, microphone or activity is unavailable, that domain
  is recorded as unmeasured with a reason and the composite is non-interpretable — never
  filled in with a default.
- **No validated Arabic.** The whole patient-facing battery — activity titles, intros,
  prompts, the spoken-repeat sentence and button labels — is administered in Arabic as a
  working translation; back-translation, cognitive pretesting and local clinical sign-off
  are pending, and administration is gated on a recorded acknowledgement.

## Every artifact, one link

| Need | Document |
| --- | --- |
| **Summary (this page)** | `ONE_PAGE_SUMMARY.md` |
| **Video walkthrough** | *Not yet recorded.* The recording plan and the rehearsed 60-second fallback beat are in [`../../docs/demo-script.md`](../../docs/demo-script.md); the deployed instance is currently unreachable, so record only after the deployment is fixed. |
| **Architecture** | [`../ARCHITECTURE.md`](../ARCHITECTURE.md) |
| **Deployed topology and trust boundaries** | [`SYSTEM_DIAGRAM.md`](SYSTEM_DIAGRAM.md) |
| **Evidence (numbers above)** | [`DEMONSTRABLE_VALUE.md`](DEMONSTRABLE_VALUE.md) |
| **Limitations and how they are enforced** | [`../../README.md`](../../README.md#limitations-and-how-they-are-enforced) · [`../../NEULENS_LIMITATIONS.md`](../../NEULENS_LIMITATIONS.md) |
| **Validation roadmap** | [`VALIDATION_STUDY_PLAN.md`](VALIDATION_STUDY_PLAN.md) |
| **Measurement definitions** | [`MEASUREMENT_AND_LOCAL_VALIDATION.md`](MEASUREMENT_AND_LOCAL_VALIDATION.md) |
| **Requirement-by-requirement fit** | [`SUBMISSION_FIT.md`](SUBMISSION_FIT.md) |
| **Arabic review state** | [`ARABIC_REVIEWER_WORKSHEET.md`](ARABIC_REVIEWER_WORKSHEET.md) |
| **Deployment** | [`UAE_DEPLOYMENT_CHECKLIST.md`](UAE_DEPLOYMENT_CHECKLIST.md) |
| **Responsible AI and data handling** | [`RESPONSIBLE_AI_AND_DATA_HANDLING.md`](RESPONSIBLE_AI_AND_DATA_HANDLING.md) |

## Why the honesty is the product

Every panel asks the same reasonable question: *how do you know it works?* The answer here is
a stated measurement plan, a platform that refuses to substitute a number for a missing
measurement, and published limitations with the code locations that prove them. That posture
is not a hedge on the pitch — it is what makes a screening aid safe to put in front of an
older adult before validation is complete.
