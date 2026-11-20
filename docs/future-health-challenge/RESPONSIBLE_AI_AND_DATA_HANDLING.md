# Responsible AI and data handling — one page

**What this is.** A self-assessment of what this build actually does, mapped to ADHICS V2 (DoH, `DOH/SD/ICSO/ADHICS/V2/2024`, effective August 2024), the UAE Information Assurance Regulation (IAR v1.1, TDRA, March 2020) and the UAE PDPL (Federal Decree-Law No. 45 of 2021).

**What it is not.** Not a certification, audit outcome, DoH licence or AAMEN status. Control references are **domain-level**; exact ADHICS control IDs must be fixed against Appendix 2 during the deploying entity's scoping, since applicable controls depend on entity category (Basic / Transitional / Advanced, plus the Service Provider set that would apply to us as a technology supplier). ADHICS V2 already maps each control group to a UAE IAR reference; we have not re-derived that mapping.

**Claim discipline.** Screening support, never diagnosis. No risk score, no severity tier, no automated clinical decision. Review is a recorded administrative state (`NOT_REVIEWED`, `REVIEW_PROMPT`, `CLINICIAN_REVIEWED`) that a named clinician sets. Arabic task administration is gated, not validated.

## 1. What leaves the device, and what is stored

| Data | Processed where | Stored by NeuLens | Leaves the UAE |
|---|---|---|---|
| Camera frames | Browser only (MediaPipe wasm/model from the Google CDN). No frame-upload path in the participant flow. | **No** | Frames: no. CDN requests carry no patient data. |
| Derived vision features (blink rate, EAR, gaze ratio, head pose, blendshape summary, timing) | Computed in browser; only numbers sent | Yes — `taskResponses`, `EyeMetrics`, `FaceMetrics` | As database rows (§5) |
| Speech clip (WebM/Opus, ≤ 15 MB, one file per request) | Browser → `POST /voice/acoustics` and `/voice/transcribe`; held in server memory (multer), temp file in the AI service `unlink`ed in `finally` | **No** — never written to Postgres or object storage | Yes, transiently: Gnani/Vachana (`api.vachana.ai`) for transcription; AI service for VAD/Praat |
| Transcript, acoustic metrics | Server → database | Yes — `taskResponses`, `VoiceMetrics` | As database rows |
| Text-to-speech prompts | Task sentences to Gnani; audio back to browser | In-memory synthesis cache only | Prompt text only, no identifiers |
| Identity, assessments, baselines, care plans, referrals, consent, audit | Express + Prisma on PostgreSQL | Yes | As database rows |
| External clinical context (FHIR R4 `Observation`s) | Read-only `GET`, LOINC allowlist, previous 12 months, consent checked before any network call | Yes — `taskResponses.externalContext` | As database rows |

Consent records carry version, scopes, actor role, grant and withdrawal timestamps, IP and user agent. Audit records carry actor, role, action, resource, success, IP and user agent. Supabase appears in the AI service only for session-token verification via JWKS; no patient data or files are stored there.

## 2. Controls present in the build

| Area | Implementation | Evidence |
|---|---|---|
| Consent | Versioned scopes; withdrawal endpoint; both events audited | `prisma/schema.prisma`, `controllers/compliance.controller.ts` |
| Purpose limitation | Nothing trained on patient data; model inference disabled in deployment | `ENABLE_MODEL_INFERENCE=false` (`render.yaml`) |
| Minimisation | Derived measurements only; no raw video; no raw audio at rest; 15 MB / 1 file cap; FHIR code allowlist | `voice.routes.ts`, `services/fhirContext.ts` |
| Consent-gated imports | `importExternalContext(consentGranted, …)` returns before any network call unless consent is true | `services/fhirContext.ts` |
| Access control | JWT (12 h clinician, 24 h patient portal); bcrypt password and PIN hashes; lockout after failed attempts, persisted; role checks on every clinical route | `middleware`, `controllers`, `models/dataStore.ts` |
| Audit trail | 26 action types including reads and exports; failed writes logged, not swallowed | `services/audit.ts` |
| Transport and abuse | Helmet, production CSP (`frame-ancestors 'none'`, `object-src 'none'`), referrer policy; global per-IP ceiling plus stricter auth and voice limiters and a daily speech budget | `app.ts`, `middleware/rateLimit.ts` |
| Human oversight | No diagnosis; reviewer identity and timestamp stored; Arabic tasks require a recorded acknowledgement | `assessmentLanguageReadiness.ts`, readiness page |
| Transparency | Non-diagnostic framing in UI and reports; patient FAQ states what is and is not retained | `PatientAccountPages.tsx`, `docs/judge-qa.md` |
| Demo isolation | Demo accounts seeded only when `DEMO_ACCESS_ENABLED`; off by default in production; data fictional | `services/demoAccess.ts` |
| Availability / change control | `/livez`, `/readyz` (DB and migrations), `/health`; CI on every push | `app.ts`, `.github/workflows/ci.yml` |

## 3. AI-specific commitments

- **No diagnostic model in the participant path.** Acoustic features come from deterministic signal processing (VAD, Praat, librosa); vision features are MediaPipe landmarks and blendshapes. No learned weights produce a clinical conclusion.
- **No generative model writes to the record.** An optional evaluation endpoint drafts clinician text on request; the output is returned to the caller, not persisted or scored, and reaches no patient report unless a clinician saves it.
- **Comparability over guessing.** Sessions with mismatched task version, language, accessibility condition or quality are refused for comparison rather than silently normalised.
- **Review state is machine-enforced.** The language registry carries per-stage review status and the API refuses unapproved task language without a stored acknowledgement.

## 4. Not in place — stated so nobody assumes it

| Gap | Consequence | Status |
|---|---|---|
| No retention schedule or erasure workflow | Withdrawal is recorded and audited but does not delete prior records | PENDING |
| No processor agreements with Render, Gnani or Google; no transfer assessment | Transfers in §5 are not contractually covered | PENDING (legal) |
| No UAE data residency | API and database run in Render `oregon` | PENDING |
| No MFA for clinicians | Password-only clinician login | PENDING |
| No penetration test, independent audit, ISO 27001 or ADHICS certification, CISO or governance committee | Nothing here substitutes for the entity-level programme | PENDING (entity) |
| No field-level encryption; no backup/DR runbook; free-tier hosting | At-rest protection is the provider's disk encryption; no stated RPO/RTO | NOT IMPLEMENTED |
| Audit table append-only by convention, not privilege separation | The application database role could delete rows | NOT IMPLEMENTED |
| No log-scrubbing layer | Error paths can log identifiers | NOT IMPLEMENTED |
| Arabic wording not clinically reviewed; back-translation pending | Arabic administration is gated, not validated | PENDING |
| Bystander capture not addressed in UI or consent text | Camera and microphone sessions may include others in frame or earshot | PENDING |

## 5. Cross-border reality

Read this before quoting residency. The API and database run on Render in **Oregon (US)**, the acoustic service runs alongside it, speech clips are forwarded to Gnani/Vachana for transcription, and MediaPipe assets come from a Google CDN. UAE hosting is configuration plus a hosting move rather than a rewrite, but it has not been performed — until it is, patient data and audio leave the UAE.

## 6. Sign-off

| Role | Signs for | Name / date |
|---|---|---|
| Facility CISO or privacy officer | ADHICS scoping, control applicability, acceptance of §4 gaps | |
| Facility clinical lead | Review-state workflow, non-diagnostic framing, escalation path | |
| NeuLens engineering lead | Accuracy of §1–§3 against the deployed build | |

Deployed commit: `________` · Environment: `________` · Date: `________`
