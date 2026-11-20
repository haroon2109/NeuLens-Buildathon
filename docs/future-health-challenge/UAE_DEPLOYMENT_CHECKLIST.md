# UAE deployment configuration — checklist

Status of item 5 ("UAE deployment config: set local clinic/contact details,
privacy/consent text, and care/referral pathways to UAE requirements; only
claim suitability/validation once evidenced").

NeuLens is a **developing prototype**. Nothing below claims a completed
UAE deployment; each line is either `DONE (code)` or `PENDING (human/legal)`.

## A. Clinic identity and contact details
- [DONE (code)] `client/src/config/deployment.ts` reads clinic identity from
  Vite env (`VITE_CLINIC_NAME`, `VITE_CLINIC_CITY`, `VITE_CLINIC_ADDRESS`,
  `VITE_CLINIC_PHONE`, `VITE_CLINIC_EMERGENCY`, `VITE_SUPPORT_EMAIL`) and
  falls back to neutral labels when unset. No fabricated hospital name,
  institution ID, or phone number ships in the bundle.
- [DONE (code)] `client/.env.example` documents the variables.
- [DONE (code)] Doctor portal footer and patient completion card use
  `deploymentConfig` instead of "Neulens General Hospital".
- [PENDING (human)] Supply real values for the deploying Abu Dhabi clinic.
- [PENDING (human)] Confirm DOH/Abu Dhabi facility licensing and any
  required registration numbers are displayed where mandated.

## B. Privacy, consent and data governance
- [DONE (code)] Consent screen exists (`ConsentPrivacyPage`) with required/
  optional items and "Screening support, not a diagnosis" framing.
- [PENDING (human/legal)] Privacy policy text reviewed against UAE PDPL
  (Federal Decree-Law No. 45 of 2021) and, where applicable, Abu Dhabi
  health-data regulations (ADHICS/DOH). Link via `VITE_PRIVACY_URL`.
- [PENDING (human/legal)] Consent wording reviewed for Arabic (MSA/Gulf) by
  a UAE-based reviewer; see `ARABIC_REVIEWER_WORKSHEET.md`.
- [PENDING (human/legal)] Data residency, retention, and cross-border
  transfer commitments documented and reflected in deployment config.
- [PENDING (human/legal)] Terms of use reviewed and linked via
  `VITE_TERMS_URL`.

## C. Care and referral pathways
- [DONE (code)] Referral model exists (doctor portal referrals, appointments,
  care plan). Destination/urgency/status fields are clinician-entered.
- [PENDING (human/clinical)] Local referral destinations (Abu Dhabi
  hospitals, memory clinics, geriatrics, social services) seeded for the
  deploying site; no fabricated destinations ship.
- [PENDING (human/clinical)] Emergency/urgent pathway wording and the
  emergency number (`VITE_CLINIC_EMERGENCY`) agreed with the deploying clinic.
- [PENDING (human/clinical)] Follow-up timeline and who contacts the patient
  defined and documented.

## D. Language and locale
- [DONE (code)] Arabic (`ar-AE`) selectable; `dir="rtl"` applied to `<html>`;
  date/time formatters read `document.documentElement.lang`.
- [DONE (code)] Doctor portal forced `dir="ltr"` so a patient's Arabic choice
  cannot invert the English clinical UI.
- [PENDING (human)] Full Arabic RTL/UX audit of every screen (see item 3
  notes); Arabic font loading verified on target devices.

## E. Accessibility
- [DONE (code)] Draft sensor-free Arabic pathway at
  `/patient/accessible-checkin` (word-list recall + 4-item daily-function
  check-in), RTL, large buttons, keyboard, screen-reader live region,
  optional browser TTS, no camera/mic/sensor. Stamped
  `DRAFT_NOT_VALIDATED` / `ACCESSIBLE_NO_CAMERA_NO_MIC`.
- [PENDING (human)] Screen-reader + target-user usability testing
  (`ARABIC_ACCESSIBLE_PATHWAY_VALIDATION.md`, section 4).
- [PENDING (human)] IVR/phone route: scripted only, not implemented or
  validated. Implement only if the target population needs it.

## F. Clinical evidence
- [BLOCKED] No licensed Arabic screener integrated, no reliability study,
  no pilot, no sensitivity/specificity. Do not claim suitability or
  validation until evidenced. See `README.md` "Limitations and how they are enforced".

## G. Patient voice copilot (bilingual)

The "Jarvis"-style assistant in the patient portal: wake word, background
listening, bilingual commands, LLM answers and streamed speech.

### Implemented in code
- [DONE (code)] Floating assistant (`VoiceCopilot.tsx`) mounted once in
  `PatientPortalLayout`; header mic toggle for hands-free/background
  listening, preference persisted in `localStorage`.
- [DONE (code)] Wake word "NeuLens" (plus "hey assistant" and Arabic
  variants) matched client-side with fuzzy tolerance, followed by a 12-second
  follow-up window. Opening the panel also arms the window.
- [DONE (code)] Permission explainer modal before the native microphone
  prompt, with allow / not-now / blocked states; explicit opt-out is
  remembered and is never overridden by later gestures.
- [DONE (code)] Commands and portal actions are deterministic on the client;
  open-ended questions go to the server (`/api/v1/assistant/chat`,
  `/api/v1/assistant/chat/stream`), which proxies any OpenAI-compatible
  endpoint and never exposes the key to the browser.
- [DONE (code)] Streaming: the server relays provider SSE with
  `X-Accel-Buffering: no`; the client speaks sentence-sized chunks as they
  arrive instead of waiting for the full answer.
- [DONE (code)] `render.yaml` declares `ASSISTANT_LLM_BASE_URL`,
  `ASSISTANT_LLM_API_KEY` and `ASSISTANT_LLM_MODEL` as `sync: false`
  secrets, so they are set in the dashboard rather than committed.
- [DONE (code)] Guardrails: patient-only routes, 1-800 character limit,
  12 questions per minute per session, trimmed answers, emergency/self-harm
  redirects in the system prompt.
- [DONE (code)] Prompt uses progressive disclosure (`assistantSkills.ts`):
  the base prompt carries only identity, hard safety rules and a one-line
  skill catalogue; a skill's detailed guidance (navigation, scores,
  appointments, privacy, daily life) is attached only when the question or
  the current route makes it relevant, and only for the matching UI language.
  Adding a capability means adding a skill entry, not growing every prompt.

### Required at deploy time (dashboard settings, not committed)
- [ ] `GNANI_API_KEY` — text-to-speech. Without it the assistant still
  wakes, listens and answers in writing, but replies are silent.
- [ ] `ASSISTANT_LLM_BASE_URL`, `ASSISTANT_LLM_API_KEY`,
  `ASSISTANT_LLM_MODEL` — open-ended answers. Without them the assistant
  keeps its scripted replies and open-ended questions get the
  "cannot answer here yet" fallback. Use an HTTPS provider reachable from
  the server; a local Ollama on a developer machine is not reachable from a
  hosted instance.
- [ ] `CLIENT_ORIGIN` must equal the deployed origin exactly, otherwise
  credentialed API calls (including the assistant) fail.
- [ ] `DEMO_ACCESS_ENABLED="true"` only on the public demo. Set `"false"` on
  any instance holding real patient records.
- [ ] `GNANI_DAILY_BUDGET` (default 1000/day, UTC reset) sized to the
  deployment's speech spend.
- [ ] Node 20 or newer (the root `engines` field requires it; the streaming
  proxy depends on global `fetch` and SSE streams).

### Browser and network caveats
- **HTTPS is required.** The Web Speech API and microphone only work in a
  secure context; Render provides HTTPS by default. A plain-HTTP deployment
  will leave the assistant permanently "unsupported".
- **Wake word and listening use the browser's own recogniser**, not the Gnani
  key. They work in Chrome, Edge and Safari (desktop and Android/iOS as
  available); **Firefox has no `SpeechRecognition`** and the assistant falls
  back to typed input there.
- On iOS Safari, continuous background listening can be paused when the
  screen locks or the tab is backgrounded; the assistant restarts listening
  when the patient returns and interacts.
- Wake-word recognition depends on the browser hearing "NeuLens" clearly.
  Fuzzy matching (tolerating "new lens", "nulens") and three recognition
  alternatives improve this, but a noisy room or strong accent can still
  miss it. Typing in the panel is always available.
- Render free-tier services spin down when idle, so the first request after
  a pause can take 30-60 seconds. That cold start affects the first spoken
  reply, not the wake word itself.
- The CSP already allows the assets the portal uses (jsDelivr, Google Fonts,
  wasm, `blob:` media) and no `Permissions-Policy` header blocks the
  microphone. If a reverse proxy is added in front of the app, it must not
  buffer `text/event-stream` responses.

### Verify after deploying
1. `GET /api/v1/assistant/status` returns `{"configured":true}` (signed in as
   a patient).
2. Sign in as the demo patient, allow the microphone in the explainer, and
   say "Hey NeuLens, open my brain health". The panel should open, navigate
   to `/patient/brain-health` and speak the confirmation.
3. Ask one open-ended question (e.g. "what is mild cognitive impairment?").
   Speech should begin before the answer finishes; check the server log for
   `assistant.chat.stream_failed` if it does not.
4. Test in Arabic: switch the portal language, repeat steps 2-3, and confirm
   the reply language follows the UI.

### Privacy notes before patient use
- [PENDING (human/legal)] Spoken questions are transcribed by the browser
  and the transcript text is sent to the configured LLM provider. Document
  that processor in the privacy notice and confirm it meets UAE PDPL
  expectations for health-adjacent data.
- [PENDING (code)] Assistant questions are not yet written to an audit log;
  add logging before any clinical pilot that requires traceability.
- [PENDING (human)] Arabic wake phrases, prompts and replies reviewed by a
  native Arabic clinician (`ARABIC_REVIEWER_WORKSHEET.md`).
