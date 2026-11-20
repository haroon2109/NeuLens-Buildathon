# Pilot Playbook (design partners → paid pilots)

Goal: turn NeuLens from a demo into **documented workflow value** at 3–5 sites, producing the evidence needed for pre-seed/seed funding and a path to clinical validation.

## 1. Target sites (first 3–5)

Prioritize sites where repeat screening/follow-up already happens and a champion will actually use the review record:

- **Memory clinic / geriatric neurology** — longitudinal follow-up of MCI / cognitive concerns (highest fit for within-person change).
- **Primary care with older-adult panel** — referral triage / annual cognitive screen workflow.
- (Optional) **Senior living wellness** — periodic check-ins, if a clinician reviews results.

**Qualify a site** on: a named champion, an identifiable patient cohort/workflow, willingness to run ≥10–20 real sessions, and agreement to give structured feedback (and, for validation, IRB/consent as applicable).

## 2. Pilot structure

| Phase | Duration | What happens | Exit criteria |
|---|---|---|---|
| **Scoping** | 1–2 wks | Confirm workflow, patient population, languages, device/setup, who reviews, what “useful” means, data/consent needs | Signed pilot scope + success metrics + point of contact |
| **Setup & training** | 1 wk | Configure accounts/roles, walkthrough, dry-run sessions, confirm environment (browser/camera/mic) and support path | Staff can run/review a session unassisted |
| **Run** | 4–8 wks | Real sessions in the agreed workflow; weekly check-in; capture issues and outcomes | Agreed session count completed; feedback collected |
| **Readout** | 1–2 wks | Analyze completion/quality/feedback; clinician review of value; decide convert/iterate/stop | Written readout + conversion decision |

Keep pilots **time-boxed and measured**. A free pilot must still have a scope, metrics, and a conversion trigger (e.g. “convert to paid at $X/month or $Y/patient on readout”).

## 3. What to measure (per pilot)

**Feasibility & usability**
- Session start→completion rate; drop-off step; average duration.
- Task/session quality rates (usable vs. insufficient-quality) and reasons.
- Support burden (help needed, device/language/access issues).
- Accessibility in practice: older adults, low digital literacy, language used, sensory/access accommodations recorded.

**Workflow value (clinician-reported + observed)**
- Time to run and to review vs. current practice.
- Did the within-person comparison / evidence summary influence a decision (reassure / repeat / refer / investigate context)? Capture as structured clinician feedback per reviewed case (not a diagnosis).
- Documentation usefulness (export/print/report used in the chart?).

**Signal (directional, not a validation claim)**
- Concordance of “change/review” flags with clinician judgment.
- Where feasible and consented, side-by-side with an accepted instrument (e.g. MoCA) or clinical impression — **for learning, not as a cleared claim**. Formal validation requires the protocol in `VALIDATION_AND_REGULATORY.md`.

## 4. Data, consent, and compliance in pilots

- Use the **minimum necessary** data; no raw audio/video retained by default (derived observations only), consistent with product policy.
- Obtain site-appropriate consent/authorization before any pilot involving real patients; involve the site’s compliance/IRB as required. Treat any research/validation activity as research (IRB/ethics), separate from operational quality improvement.
- Execute a **BAA** and confirm HIPAA-grade handling before storing PHI in a production environment; document data flow, access controls, retention, and breach process. Do not run real PHI through an environment that isn’t ready.
- Be explicit in all pilot materials: *research-stage screening aid, not diagnostic; clinician review required.*

## 5. Pilot package (what we provide)

- Configured clinician + patient access, guided onboarding, and a one-page run sheet.
- **Session data export** for the clinician/site (structured, for audit/research analysis) and printable review record.
- Weekly check-in + issue triage; a readout report at end of pilot.

## 6. Conversion & pricing hypotheses (to test, not assume)

- **Per-clinic subscription** (unlimited/pooled screens) or **per-completed-screen** pricing, benchmarked against staff time saved and current screening/referral workflow cost.
- **Paid pilot** with a defined success metric and a pre-agreed conversion path. Goal: at least one site converts, proving willingness to pay for this workflow (not the demo).

## 7. Evidence to collect for fundraising

- Pilot roster (site type, champion, cohort, # sessions) and the readout metrics above.
- 2–3 clinician quotes on workflow value (attributable where permitted).
- Documented examples of within-person change prompting a review decision (de-identified).
- A clear statement of what is *and isn’t* validated yet, tied to the validation plan. Credibility here matters more than inflated claims.
