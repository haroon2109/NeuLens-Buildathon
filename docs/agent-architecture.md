# NeuLens Intelligent Workflow (Deterministic Agent Architecture)

NeuLens uses a **central workflow orchestrator** coordinating **deterministic modules ("engines/agents")** rather than multiple independent autonomous AI agents. LLM-based assistance is added only where it adds genuine, reviewable value (e.g. drafting plain-language summaries from already-computed, source-linked facts) and **never** for diagnosis, disease inference, prescribing, or autonomous clinical decisions.

## Workflow

```
Patient / Caregiver Input
  (Symptoms · History · Consent · Function · Assessment task responses)

  1. Safety & Accessibility Engine
     Consent · Urgent flags · Missing context · Quality/comparability

  2. Cognitive Engine  (capture & standardized task results, client + recorded)
  3. Signal Engine     (ocular · voice · facial observations, recorded)
  4. Health Context Engine
     Physical · Sleep · Lifestyle · functional/context inputs (recorded)
  5. History Engine
     Baseline · Previous assessments · longitudinal records

  6. Longitudinal Intelligence Engine
     Change detection · Evidence · Uncertainty (within-person, quality-gated)

  7. Clinical Documentation Engine
     Source-linked observations · Draft report · pathway & prevention suggestions

  ── Human Approval Gate ──
     Qualified clinician reviews and decides (referrals/actions)

  8. Follow-up Coordination Engine
     Care plan · Referral tracking · Reassessment · closed-loop outcomes
```

## Modules (implemented priority)

| Agent/Engine | Responsibility | Implementation | Priority |
|---|---|---|---|
| **Safety & Accessibility** | Consent state, urgent concern flags, missing-context detection, session quality/comparability gating. Missing data stays missing. | Deterministic (`services/workflow/safetyAccessibilityEngine.ts`) | Critical |
| **Assessment (coordination)** | Coordinates assessment activities and recorded task responses. | Client screening flow + server assessment persistence | High |
| **Clinical/Health Context** | Organizes recorded health/functional/lifestyle/context information (no invention). | Deterministic (`services/workflow/clinicalContextEngine.ts`) | High |
| **Cognitive Analysis** | Standardized task/observation results from recorded responses. | Recorded task responses + deterministic scoring/summary | High |
| **Change Detection / Longitudinal Intelligence** | Compares to personal baseline and comparable history; emits evidence and uncertainty. Poor quality never treated as decline. | Deterministic (`services/workflow/longitudinalIntelligenceEngine.ts`, `services/changeMonitor.ts`) | Critical |
| **Evidence** | Source-linked observations and explicit limitations/uncertainty. | Deterministic (`services/workflow/clinicalDocumentationEngine.ts`) | High |
| **Clinical Documentation / Report** | Prepares clinician-review draft (interpretation, pathway, non-diagnostic prevention suggestions). | Deterministic (`services/workflow/clinicalDocumentationEngine.ts`, orchestrator) | High |
| **Follow-up Coordination** | Approved care actions, referral/outcome tracking, reassessment cadence (clinician-owned referrals). | Deterministic workflow output + `ReferralOutcome`/doctor APIs | High |
| **Quality & Equity** | Audits performance and disparities from recorded data only. | `services/platformInsights.ts` / analytics (extend over time) | Later |

## Central orchestrator

- `server/src/services/workflow/orchestrator.ts` — `runAssessmentCompletionWorkflow(...)` runs the deterministic sequence for assessment completion, persists longitudinal/change/profile records, and returns a **source-linked, safety-gated draft** plus `workflow` metadata (stages executed, `llmAssistance.used=false`).
- The controller (`assessmentcomplete.controller.ts`) persists the assessment and delegates to the orchestrator, keeping the API response compatible while making the architecture explicit.

## Principles

- **Deterministic first:** scoring, gating, comparability, baseline/change logic, and documentation structure are rule-based and auditable.
- **Safety-gated:** non-comparable/insufficient-quality sessions are not interpreted as change; urgent/missing/consent states are surfaced.
- **Clinician-in-the-loop:** outputs are observations/drafts for review; clinicians own decisions, referrals, and approved care actions (human approval gate before clinical action).
- **No fabrication:** missing data remains missing; no synthetic data presented as clinical performance.
- **LLMs (optional, constrained):** only for reviewable assistance over computed facts (e.g. wording of summaries) — never to diagnose, infer disease, or prescribe. Not enabled in the current deterministic path.
