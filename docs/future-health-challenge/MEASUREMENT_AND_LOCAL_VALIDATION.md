# Measurement & local population validation plan

This document defines, in operational terms, how NeuLens measures itself against
the challenge's validation requirements. It separates **what the platform computes
today from real recorded data** from **what requires an ethics-approved study**.
Nothing here is a claim of clinical validity.

## 1. Metric definitions and current instrumentation

| Challenge metric | Operational definition | Instrumentation | Status |
| --- | --- | --- | --- |
| **Completion** | Proportion of started sessions recorded with `quality.completion = FULL`; partial and unknown are counted separately, never treated as complete. | `taskResponses.quality.completion`; `platformInsights.safetyGates.completionRate` | **Computed** |
| **Test–retest reliability** | Agreement between repeated administrations under matched conditions (same language, education, task version, sensory access). Reported as within-person absolute score change, SD of change, and ICC(2,1) once at least three repeat pairs exist. | Consecutive comparable sessions per patient; `platformInsights.measurementProperties`; estimator in `server/src/services/reliability.ts` | **Descriptive statistic + provisional ICC computed; no coefficient is reported below three pairs** |
| **Sensitivity** | Among people confirmed by a reference standard (e.g. MoCA/MMSE plus clinician assessment), the proportion flagged for review. | Requires linked reference-standard outcomes — not collected in this build. | **Not yet computed (would be fabricated)** |
| **Specificity** | Among people confirmed unaffected by the reference standard, the proportion not flagged. | Same as above. | **Not yet computed** |
| **Ability to identify meaningful change** | Agreement between a NeuLens change prompt and an independent clinical determination of meaningful change over the same interval. | Change detections vs. reference assessment at follow-up. | **Requires prospective study** |
| **False-referral burden** | Proportion of review prompts that end in a clinical assessment finding no actionable concern; expressed per 100 screened. | Review outcomes and referral outcomes. | **Partially instrumented; needs completed outcome capture** |
| **Time to clinical assessment** | Median hours/days from completed screening to recorded clinical review, and separately to first specialist assessment. | `assessments.date` → `reviewedAt`; referral timestamps. | **Review time computed; specialist time requires referral outcome capture** |
| **Performance across segments** | All of the above reported by language, age band and education band (and gender for monitoring). | `platformInsights.fairnessMeasurement` | **Segment counts, comparability, review rate computed** |

## 2. Why the platform refuses to output some numbers

Sensitivity, specificity and meaningful-change accuracy are properties of a
**test against a reference standard in a defined population**. They cannot be
derived from the platform's own outputs. Reporting them before the study exists
would be exactly the "false reassurance" the challenge warns about. NeuLens
therefore reports only what its recorded data supports and names the rest as
pending.

## 3. Analysis plan (per metric)

- **Completion:** report numerator/denominator with 95% Wilson intervals, overall
  and by segment. Treat `UNKNOWN` separately from `PARTIAL`.
- **Repeat-session stability:** restrict to consecutive sessions passing the
  comparability gate. Report n pairs, mean absolute change, SD of change, and the
  proportion changing by more than each candidate threshold. Pre-register the
  threshold; do not tune it on the same data used to evaluate it.
- **Sensitivity / specificity:** pre-specify the reference standard, the index
  flag (review prompt), the interval, and the analysis population. Report with
  confidence intervals and the full 2×2 table. Report subgroup estimates only
  where the cell sizes support them.
- **False-referral burden:** count review prompts that led to assessment and
  resulted in no actionable finding; report per 100 screened and per 100 prompts.
- **Time to assessment:** median and interquartile range, not mean, given skew.
- **Equity:** for every metric, report by language, age band and education band;
  flag any band with fewer than the pre-specified minimum n as "insufficient
  data" rather than pooling silently.

## 3b. Administration coverage (implemented behaviour)

A measurement exists only where the activity produced one. The server derives a
coverage record from the submitted task responses and stores it as
`taskResponses.administration`:

| Field | Meaning |
| --- | --- |
| `measured` | Activities that returned a recorded score |
| `notMeasured` | Activities with no score, each with a reason: `CAMERA_UNAVAILABLE`, `MICROPHONE_UNAVAILABLE`, `SKIPPED`, `TIME_LIMIT`, `NOT_COMPLETED`, `NO_RECORDING`, `NOT_RECORDED` |
| `unmeasuredDomains` | Domains left without any contribution |

Rules the code enforces:

- No default score is ever substituted for a missing activity. The historical
  placeholder constants (50/60/70/75/80/85/88 by timeout or skip) are deleted.
- Any missing activity in a domain makes that domain null; a null domain makes the
  composite null and the review state `NOT_INTERPRETABLE`.
- The clinician's draft lists the unmeasured domains and their reasons under
  `evidence.limitations`.

Accessibility, as implemented rather than as claimed: the moving-target activity
is a focusable button, trail-making accepts the number keys 1–6 as well as taps,
and activity changes are announced through a live region. A participant may
continue without camera or microphone, in which case those domains are reported as
unmeasured. There is **no** telephone-only administration path, and no
screen-reader usability study has been conducted — both remain open, and Stage A
of the sequence below is where they belong.

## 4. Study sequence

1. **Feasibility & usability (Stage A).** Observational pilot in the intended
   Abu Dhabi population: completion, session quality, support burden, usability,
   across Arabic and English, older adults, low digital familiarity and sensory
   impairment. Output: "feasible and usable", no clinical claim.
2. **Measurement properties (Stage B).** Short-interval repeat administration
   under matched conditions; estimate within-person variability and an
   evidence-based reliable-change index per measure. Output: replaces the current
   three-session range heuristic with a justified threshold.
3. **Criterion validity (Stage C).** Ethics-approved comparison with a reference
   instrument and clinician impression in the local population; report
   sensitivity, specificity and agreement with confidence intervals.
4. **Clinical utility (Stage D).** Prospective comparison against usual care for
   time to assessment and detection of change.
5. **Equity (Stage E).** Stratified analysis and usability across language, age,
   education, sensory and digital-access segments; monitor subgroup failure and
   quality rates, not only accuracy.

## 5. Linguistic and cultural adaptation register

Each instrument × language must pass through: forward translation → independent
back-translation → reconciliation by a bilingual clinician → cognitive
pretesting with representative participants → local clinical review → documented
approval. Until a row is approved, the language is offered for navigation, consent
and results, and its task wording is a working translation administered only with a
recorded participant acknowledgement. Arabic has the whole patient-facing battery
delivered but unreviewed.

| Language | Portal UI | Consent | Results | Task instructions / stimuli | Status |
| --- | --- | --- | --- | --- | --- |
| English | Yes | Yes | Yes | Yes | In use (research build) |
| Arabic (ar-AE) | Yes (RTL) | Yes | Yes | Delivered — activity titles, intros, prompts, spoken-repeat stimulus and button labels are Arabic (RTL), as a working translation. Back-translation, pretesting and clinical review pending | Partially adapted |
| Tamil | Yes | Yes | Yes | No — pending | Partially adapted |
| Hindi | Yes | Yes | Yes | No — pending | Partially adapted |
| Telugu | Yes | Yes | Yes | No — pending | Partially adapted |
| Kannada | Yes | Yes | Yes | No — pending | Partially adapted |
| Malayalam | Yes | Yes | Yes | No — pending | Partially adapted |

**Spoken Arabic:** Gnani Arabic output (`ar-AE`, voice `Zahira`) is configured, but
the voice has not been clinically reviewed. Arabic speech *input* is not transcribed
— `isArabicVoiceAvailable()` returns false — so an Arabic spoken response falls back
to on-screen text rather than being routed to a different-language recogniser.
Reviewed Arabic output and Arabic transcription are both prerequisites for spoken
Arabic administration.

## 6. Ethics, governance and reporting

- Human-subjects work requires ethics approval, informed consent and a
  data-governance plan before Stages B–D.
- Derived observations only; no raw media leaves the device.
- Publish protocols and results, including null findings, and keep the
  claim-review gate: no performance claim ships without cited evidence.
