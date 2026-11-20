# Funding & Validation Pack

This folder contains the **commercialization-and-evidence operating plan** for NeuLens: the narrow wedge we're pursuing, how pilots produce evidence, how that evidence maps to clinical validation and regulatory posture, and the business model to test.

It exists because the product's current positioning (multimodal brain-health screening platform, research-stage, not diagnostic) is honest but not yet fundable at scale. The plan below is the path from "impressive prototype" to "evidence-backed clinical workflow with paying sites."

## Read in this order

1. **[WEDGE.md](WEDGE.md)** — the single job-to-be-done, initial ICP, why-now, and 12-month proof points.
2. **[PILOT_PLAYBOOK.md](PILOT_PLAYBOOK.md)** — how to recruit and run 3–5 design-partner pilots, what to measure, and how to convert to paid.
3. **[VALIDATION_AND_REGULATORY.md](VALIDATION_AND_REGULATORY.md)** — evidence roadmap (feasibility → measurement properties → validity → utility → equity) and the compliance/regulatory posture (HIPAA, QMS, SaMD path).
4. **[BUSINESS_MODEL.md](BUSINESS_MODEL.md)** — buyer, packaging/pricing hypotheses, go-to-market, unit-economics drivers.

## The one-paragraph story

NeuLens is a browser-based, clinician-supervised cognitive screening and **within-person longitudinal change** workflow for memory clinics and primary-care practices. Patients complete a short guided session (cognitive tasks, speech, ocular, behavioral observations); clinicians get an evidence-linked review record that compares the person to *their own* prior comparable screens and flags "review / repeat / refer" prompts — never a diagnosis. The wedge is specifically the follow-up workflow, where consistency and documentation are painful today. Pilots with 3–5 clinics will measure completion/usability across languages and older/low-literacy users, workflow time saved, and directional concordance with clinician judgment (and, where consented, an accepted reference instrument). Formal validation and any clinical claims follow the staged plan; the product ships today only as a research-stage screening aid.

## What this pack is not

- Not a claim that NeuLens is validated, diagnostic, or reimbursable today.
- Not a regulatory determination — classification depends on intended use and claims and requires regulatory counsel.
- Not a substitute for the existing clinical/safety constraints documented in the root `README.md` and `docs/`.

## Related in-repo material

- `docs/pitch.md` — short product/judge-facing narrative.
- `docs/judge-qa.md` — anticipated hard questions on claims, safety, and validation.
- `docs/research-datasets.md`, `research/README.md` — dataset access/licensing and research guardrails.
- `docs/backend-architecture.md`, `docs/ai-report-generation.md` — how observations are produced and kept separate from claims.

## Product support for pilots (implemented)

- **Structured JSON export** of a screening record for audit/pilot analysis: `GET /api/v1/doctor/reports/:id/export` (clinician-only, audited as `ASSESSMENT_EXPORT`), surfaced as **Export JSON** on the clinical report page. The export embeds the research-stage disclaimer so a downloaded file cannot be mistaken for a diagnostic result.
- Printable/PDF clinical review record (existing browser print layout).
- Server-side patient-visible data policy (allowlisted fields) unchanged: patients cannot see clinical classifications or unreviewed clinician notes.
