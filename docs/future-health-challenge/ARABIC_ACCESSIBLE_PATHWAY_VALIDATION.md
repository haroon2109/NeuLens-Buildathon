# Arabic accessible pathway — validation and evidence record

**Status: NOT VALIDATED. No part of this pathway may be described as validated, locally adapted, or clinically reviewed until every item below is completed and the evidence is attached.**

This document is the evidence container for the pathway requested for the Abu Dhabi "Protecting Brain Health Earlier" submission: an end-to-end Arabic administration of **(1) word-list recall** and **(2) a daily-function (functional) check-in**, completable without camera, microphone, or vision (large-button, keyboard, screen-reader, and browser text-to-speech), with a telephone/IVR script designed as a non-camera administration route.

The software can render the draft wording and record the session. The software cannot translate, interview participants, or sign off. Those steps are human work and are recorded here, not inferred.

## Scope

| Element | In scope | Out of scope |
| --- | --- | --- |
| Tasks | Word-list recall (immediate recognition), daily-function check-in (4 everyday activities) | The 5-activity camera/microphone battery, the Neulens composite, diagnosis, risk scoring |
| Language | Arabic (draft wording provided in `client/src/features/accessible/draftArabicCheckin.ts`) | Any other language; any claim of cross-language equivalence |
| Administration | `/patient/accessible-checkin`: on-screen buttons + keyboard + screen reader + optional browser text-to-speech (audio output only, no microphone). No camera, no microphone, no motion sensor. | Camera/mic/sensor tasks; unassisted completion by a person who cannot operate any input device |
| Telephony | Script designed in §7 (IVR/phone). **Not implemented in software.** | A live IVR/SMS/voice service |
| Interpretation | A recorded response set for clinician review, with draft-status and administration-mode stamped on the record | Any validated score, cut-off, diagnostic claim, or "earlier detection" claim |

## 1. Forward translation (DRAFT — pending review)

Forward translation must be performed by a qualified bilingual translator familiar with cognitive/health wording, working from the English source. The draft below is a **working proposal** to be reviewed, not an approved translation.

| ID | English source | Draft Arabic (proposed) | Translator | Date | Notes / alternatives considered |
| --- | --- | --- | --- | --- | --- |
| wl.title | Word list recall | تذكّر قائمة الكلمات | _pending_ | _pending_ |  |
| wl.study.body | These words will be read to you. Listen carefully. You can ask to hear them again. Afterwards, choose every word you remember. | سيتم قراءة هذه الكلمات لك. استمع جيدًا. يمكنك طلب سماعها مرة أخرى. بعد ذلك، اختر كل كلمة تتذكرها. | _pending_ | _pending_ |  |
| wl.study.readAgain | Read the words again | أعد قراءة الكلمات | _pending_ | _pending_ |  |
| wl.study.continue | I am ready to choose | أنا جاهز للاختيار | _pending_ | _pending_ |  |
| wl.recall.prompt | Select every word that was in the list. | اختر كل كلمة كانت في القائمة. | _pending_ | _pending_ |  |
| wl.recall.helper | Choose all that apply. There is no time limit. | اختر كل ما ينطبق. لا يوجد حد للوقت. | _pending_ | _pending_ |  |
| wl.word.river | River | نهر | _pending_ | _pending_ | Check familiarity across dialect/education |
| wl.word.lamp | Lamp | مصباح | _pending_ | _pending_ |  |
| wl.word.bread | Bread | خبز | _pending_ | _pending_ |  |
| wl.word.chair | Chair | كرسي | _pending_ | _pending_ |  |
| wl.word.garden | Garden | حديقة | _pending_ | _pending_ |  |
| wl.word.pencil | Pencil | قلم رصاص | _pending_ | _pending_ |  |
| wl.word.window | Window | نافذة | _pending_ | _pending_ |  |
| wl.word.basket | Basket | سلة | _pending_ | _pending_ |  |
| wl.word.spoon | Spoon | ملعقة | _pending_ | _pending_ |  |
| wl.word.market | Market | سوق | _pending_ | _pending_ |  |
| wl.word.clock | Clock | ساعة | _pending_ | _pending_ |  |
| wl.word.key | Key | مفتاح | _pending_ | _pending_ |  |
| fn.title | Daily activities check-in | متابعة الأنشطة اليومية | _pending_ | _pending_ |  |
| fn.intro | This asks about everyday activities. It is not a test and it is not a diagnosis. There are no right or wrong answers. | هذه الأسئلة عن الأنشطة اليومية. ليست اختبارًا وليست تشخيصًا. لا توجد إجابات صحيحة أو خاطئة. | _pending_ | _pending_ |  |
| fn.prompt | Compared with your usual ability, how are these activities going? | مقارنةً بقدرتك المعتادة، كيف تسير هذه الأنشطة؟ | _pending_ | _pending_ |  |
| fn.act.appointments | Remembering appointments | تذكّر المواعيد | _pending_ | _pending_ |  |
| fn.act.medication | Managing medicines | إدارة الأدوية | _pending_ | _pending_ |  |
| fn.act.finances | Handling money or bills | التعامل مع المال أو الفواتير | _pending_ | _pending_ |  |
| fn.act.household | Preparing a simple meal or doing household tasks | إعداد وجبة بسيطة أو القيام بالأعمال المنزلية | _pending_ | _pending_ |  |
| fn.ans.same | About the same | كما المعتاد تقريبًا | _pending_ | _pending_ |  |
| fn.ans.harder | More difficult | أصبح أصعب | _pending_ | _pending_ |  |
| fn.ans.help | I need more help | أحتاج مساعدة أكبر | _pending_ | _pending_ |  |
| fn.skip | Skip this question | تخطَّ هذا السؤال | _pending_ | _pending_ |  |
| fn.submit | Finish check-in | إنهاء المتابعة | _pending_ | _pending_ |  |

**Completion criterion:** every row has a named translator, date, and either "approved as drafted" or a revised Arabic string with rationale. The revised strings must be copied into `draftArabicCheckin.ts` and this table updated to match.

## 2. Independent back-translation (PENDING)

Back-translation must be performed by a bilingual reviewer **independent of the forward translator**, who has not seen the English source. The back-translator renders the Arabic into English; discrepancies against the source are resolved before pretesting.

| ID | Arabic (as approved in §1) | Back-translated English (independent) | Discrepancy vs source? | Resolution | Back-translator | Date |
| --- | --- | --- | --- | --- | --- | --- |
| wl.* | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| fn.* | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

**Completion criterion:** a full, item-level back-translation with discrepancies documented and resolved; no unresolved meaning change.

## 3. Cognitive interviews (PENDING — 5 participants required)

Goal: confirm that each item is understood as intended, is answerable without vision/camera/microphone using the provided modality (screen reader / large-button / read-aloud / phone script as applicable), and does not carry unintended difficulty, offence, or ambiguity.

### 3.1 Required participant mix

| Participant | Education | Sensory / access profile | Administration mode used | Completed |
| --- | --- | --- | --- | --- |
| P1 | Low education (state years/level) | None specified | _pending_ | ☐ |
| P2 | Low education (state years/level) | None specified | _pending_ | ☐ |
| P3 | High education (state years/level) | None specified | _pending_ | ☐ |
| P4 | High education (state years/level) | None specified | _pending_ | ☐ |
| P5 | Any | Sensory impairment (specify: low vision / blindness / hearing / motor — and the assistive route used) | _pending_ | ☐ |

"Low/high education" and the specific impairment must be defined and recorded per participant; do not collapse them into a single category.

### 3.2 Interview protocol (per participant)

For each item, use concurrent or retrospective probing:

1. "In your own words, what is this asking you to do?" (comprehension)
2. "How did you choose your answer?" (response process)
3. "Were any words confusing, unfamiliar, or uncomfortable?" (lexical/cultural)
4. "Could you complete this without seeing the screen / without a camera / without speaking?" If not, what blocked you? (accessibility)
5. "If someone read this to you over the phone, would you understand it the same way?" (telephony equivalence, for the scripted items)

### 3.3 Per-participant record template (copy once per participant)

```
Participant: P_
Date / location:
Interviewer:
Education (level and years):
Age band:
Sensory/access profile:
Assistive technology / route used (screen reader, large text, read-aloud, keyboard-only, phone script, other):
Language/dialect notes:

Item-level findings:
- [item id]: understood as intended? (yes/no/partly) — evidence/quote — issue — proposed change
...

Global findings (fatigue, timing, dignity, cultural fit, accessibility blockers):
Decision for this participant: proceed as-is / revise wording / revise interaction / exclude item (with rationale):
```

**Completion criterion:** five completed records covering the required mix, with issues resolved or explicitly carried as limitations, and any wording changes propagated through §1–§2.

## 4. Local clinical sign-off (PENDING)

A local clinician (named, credentialed, with relevant scope) reviews the final Arabic wording, the administration modes, and the interview findings, and states whether the pathway is acceptable for the intended exploratory use.

| Field | Value |
| --- | --- |
| Clinician name | _pending_ |
| Credentials / role | _pending_ |
| Organisation | _pending_ |
| Date | _pending_ |
| Scope reviewed (wording, modes, interview findings, limitations) | _pending_ |
| Decision | ☐ acceptable for exploratory administration as documented · ☐ acceptable with conditions (list) · ☐ not acceptable (list) |
| Conditions / limitations required to be shown to users and clinicians | _pending_ |
| Signature / attestation reference | _pending_ |

**Completion criterion:** a signed/attested decision recorded here (or a linked, access-controlled document referenced by identifier — do not paste personal data into the repo). "Acceptable" does not equal "validated diagnostic instrument"; the permitted claim remains bounded by this record.

## 5. Readiness decision (derived — do not set manually)

The pathway may be marked task-ready for Arabic **only when**: §1 complete, §2 complete with discrepancies resolved, §3 complete for the required five-participant mix, and §4 records an acceptable/acceptable-with-conditions decision — and the corresponding stages in `server/src/services/assessmentLanguageReadiness.ts` are updated to reflect that evidence (with references), not asserted in advance.

Until then the system must treat this pathway as **draft / not validated** and record that status on every session produced through it.

## 6. What the software records (implemented)

- `administrationMode`: `ACCESSIBLE_ARABIC_NO_CAMERA_NO_MIC` (or the applicable mode), with `cameraUsed: false`, `microphoneUsed: false`.
- `sensoryRoute`: the interaction route actually used (on-screen/keyboard, screen-reader, browser-read-aloud), as reported by the client.
- `languageReadiness`: the pathway's validation status at the time of administration (`DRAFT_NOT_VALIDATED` until §1–§4 are complete), stamped into `taskResponses` so a clinician can see it.
- The pathway **never** contributes to the Neulens composite score and **never** produces a diagnosis or risk tier.

## 7. Telephone / IVR script (designed, NOT IMPLEMENTED)

A non-visual, non-camera, non-internet administration route for the same two tasks, deliverable by a person or an IVR system. This is a script specification; no telephony integration exists in this codebase.

### 7.1 Word-list recall (phone)
1. "I will read a short list of words. Please listen carefully. I will read the list twice. There is no camera and nothing to look at." *(read the approved Arabic word list at a steady pace, twice, with a short pause between readings.)*
2. Distractor: brief neutral conversation or a fixed delay (state duration), identical across administrations.
3. "Please tell me every word you remember from the list, in any order. Take your time." *(record the spoken/free-recall response verbatim; do not prompt with the list.)*
4. Scoring (if used): recognised/recalled items against the approved list, recorded by the administrator — **not auto-scored by this platform** unless/until a validated scoring rule is specified and signed off.

### 7.2 Daily-function check-in (phone)
Read each of the four approved activity items and the three response options verbatim, in a fixed order. Accept one response per item or "skip". Confirm the response before moving on ("You said: … Is that correct?"). Record item, response, and any clarification requested.

### 7.3 Telephony constraints (must be stated)
- Identity verification, consent, and privacy follow the service's telephony policy (out of scope of this script).
- Hearing impairment: the same script must be deliverable as a real-time text/relay conversation; equivalence requires its own cognitive interview (§3, P5 modality).
- The IVR/phone route is **not implemented** and **not validated** until administered and reviewed under the same protocol (§1–§4).

## 8. Evidence status summary

| Requirement | Status | Evidence |
| --- | --- | --- |
| Forward translation (Arabic, word-list + functional) | **PENDING** — draft only | §1 table (unreviewed) |
| Independent back-translation | **PENDING** | §2 |
| 5 cognitive interviews (2 low-ed, 2 high-ed, 1 sensory impairment) | **PENDING** | §3 records |
| Local clinician sign-off | **PENDING** | §4 |
| No camera / no microphone / no vision (technical pathway) | **IMPLEMENTED, UNVALIDATED WITH USERS** | `/patient/accessible-checkin`, `client/src/features/accessible/*` |
| Telephone/IVR administration | **DESIGNED, NOT IMPLEMENTED** | §7 |
| Proof it works for target users | **NOT AVAILABLE** — requires completed §3 and observed administrations | none yet |

Until every PENDING item is evidenced, the only accurate claim is: *a draft, sensor-free Arabic check-in pathway is implemented and instrumented to record validation status; it is not validated and must not be treated as a validated or clinically usable measure.*

## 9. Accessibility validation protocol (PENDING)

Test the Arabic pathway and the wider patient portal with Arabic screen-reader
users and the target groups named in §3.1, then record results here.

### 9.1 Screen readers and devices to cover
- iOS VoiceOver (Arabic voice) on a recent iPhone.
- Android TalkBack (Arabic) on a recent Android device.
- NVDA + Firefox/Chrome on Windows (Arabic).
- JAWS where available.
- Keyboard-only (no pointer) on desktop.
- Browser text-to-speech as the read-aloud fallback.

### 9.2 Tasks to complete (per participant)
1. Register / sign in.
2. Switch language to Arabic; confirm `<html lang="ar-AE" dir="rtl">`.
3. Navigate the patient portal sidebar and complete a check-in using only
   keyboard + screen reader.
4. Complete `/patient/accessible-checkin` end to end.
5. Confirm all numbers, dates and times render in Arabic-Indic or Western
   Arabic digits consistently (document which).
6. Confirm focus order, skip link, live region announcements, and error
   messages are announced in Arabic.

### 9.3 Record per session
Participant, device, screen reader, task, outcome (success / partial /
fail), observed barriers, severity (blocker / major / minor), fix proposed,
fix verified (date). Use the §3.3 record template where possible.

### 9.4 Completion criterion
At least one successful end-to-end run per screen reader above with no
blocker-level barriers, plus documented fixes for any blocker/major issues,
and re-test evidence after fixes.
