# Validation, Evidence & Regulatory Path

NeuLens is a **clinician-supervised, research-stage screening and longitudinal change-monitoring aid — not a diagnostic device and not a validated clinical instrument** today. This document defines the evidence we must generate, how, and the regulatory/compliance posture required to make progressively stronger claims.

## 1. Principles (non-negotiable)

- **Clinician in the loop.** Outputs are observations and review prompts; a qualified professional interprets and decides. The product must never present a diagnosis or autonomous clinical recommendation.
- **No claim without evidence.** Performance, “meaningful change,” and equity statements require study data. Absence of evidence is stated plainly (as in the current MVP).
- **Within-person before between-person.** The core claim is longitudinal, comparable within-person change; population norms/cutoffs are a separate, higher-evidence claim.
- **Quality-gated.** Poor/insufficient-quality or non-comparable sessions are not interpreted as stability or decline (already a product principle; must hold in every analysis).
- **Safety over optimism.** When uncertain, surface uncertainty and route to clinician review.

## 2. Evidence roadmap

| Stage | Question | Design (illustrative) | Output / claim enabled |
|---|---|---|---|
| **A. Feasibility & usability** (now / pilots) | Can target users complete sessions with usable quality, across languages/devices/abilities? | Observational pilot at design-partner sites; task completion, quality, SUS/usability, support burden; diverse age/literacy/language/sensory profiles. | “Feasible and usable in workflow X” (no clinical-performance claim). |
| **B. Measurement properties** | Are observations reliable and comparable? | Test–retest (short interval) for stability; inter-session variability; define/estimate a *within-person* reliable-change index per measure under matched conditions (language, task version, education, access). Document minimum comparable sessions. | Replace heuristic range flags with an evidence-based change threshold (or justify the heuristic with data). |
| **C. Concurrent / criterion validity** | Do measures/flags relate to accepted references? | IRB-approved study comparing NeuLens measures and change flags to reference instruments (e.g. MoCA/MMSE, domain neuropsych tests) and/or clinician impression/diagnosis in the intended population. Report sensitivity/specificity/ agreement with CIs; pre-specify analysis. | “Measures are associated with / concordant with [reference] in [population]” — scoped and cited; still not diagnostic. |
| **D. Prospective / clinical utility** | Does use improve a decision or outcome? | Prospective cohort or pragmatic trial: does NeuLens-supported follow-up change referral timing, detection of change, or clinician efficiency vs. usual care? | Utility claims; strongest support for value/reimbursement. |
| **E. Equity & generalizability** | Does it perform and remain usable across groups? | Stratified analyses and usability across language, age, education, sensory/digital access, device/context; monitor subgroup performance and failure/quality rates. | Bounded, evidence-backed generalizability statements. |

**Notes**
- Formal studies involving human subjects/research data require appropriate ethics review/IRB, informed consent, and a data-governance plan. Engage clinical/biostat partners before B/C/D.
- Publish or make auditable the protocols and results (including negative/null findings) to build credibility.
- Current MVP explicitly lacks: population norms, validated cutoffs, a validated reliable-change statistic, and local language/cultural/age/education/sensory/digital-literacy validity — closing these gaps is the work.

## 3. Regulatory posture (to be confirmed with regulatory counsel)

Regulatory classification depends on **intended use and claims**, not just technology. The strategy is to sequence claims with evidence:

- **Today (research-stage screening aid, clinician-reviewed, no diagnostic/triage-autonomy claims):** position and label accordingly everywhere (UI, reports, marketing, exports). Avoid claims that would constitute a diagnostic/clinical-decision function without clearance. Confirm status for target markets with qualified regulatory counsel.
- **If/when claims become clinical (e.g. SaMD that informs diagnosis/management):** expect a regulated pathway (e.g. FDA 510(k)/De Novo or equivalent in other jurisdictions), a Quality Management System (e.g. ISO 13485-aligned), design controls, risk management (ISO 14971), software lifecycle (IEC 62304), cybersecurity, and clinical evidence commensurate with risk/claims. Plan for this early; do not bolt it on after the fact.
- **Language/accessibility & labeling:** claims must match the populations and conditions actually studied (languages, devices, age/education/sensory profiles).

> This is planning guidance, not legal/regulatory advice. Obtain jurisdiction-specific counsel before making clinical claims or commercializing as a medical device.

## 4. Privacy, security, and compliance (operational)

- **HIPAA (US, when handling PHI):** BAAs with covered entities/subprocessors, minimum-necessary access, encryption in transit/at rest, role-based access control, audit logging of access/changes/exports, defined retention & deletion, breach notification process, workforce training. Pilot/production environments holding PHI must meet this bar.
- **Data handling (product posture):** derived observations over raw media; no raw audio/video retained by default; explicit, scoped consent where applicable; patient-visible data policy enforced server-side (allowlisted fields) — preserve and extend these invariants.
- **Security engineering:** dependency/vuln management, secrets handling, least privilege, environment separation, logging/monitoring, incident response, and third-party/vendor risk review. Pursue independent security assurance (e.g. SOC 2 / HITRUST) as commercial deployment scales.
- **Transparency:** document model/signal provenance, known limitations, failure modes, and appropriate use in clinician- and patient-facing materials.

## 5. Immediate priorities (next 90 days)

1. Lock the v1 wedge & intended-use statement; align all UI/report/export copy to it.
2. Stand up pilot-grade consent/BAA/data-governance templates with counsel; ensure auditability of session review/export.
3. Draft IRB-ready feasibility/usability protocol (Stage A) and a measurement-properties plan (Stage B, test–retest) with a clinical/biostat collaborator.
4. Instrument and export the data needed for analysis (session quality, comparability flags, task metrics) in a structured, de-identified-friendly form.
5. Establish a claim-review gate: no new clinical/performance claim ships without cited evidence and sign-off.
