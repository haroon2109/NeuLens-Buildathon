# Arabic (UAE) linguistic and cultural review — reviewer worksheet

Status of item 2 ("Linguistic/cultural review: have UAE-based Arabic
(MSA/Gulf/Emirati as appropriate) reviewers and clinicians adapt wording,
stimuli, and examples for local comprehension and cultural fit").

This worksheet lists the user-facing strings that currently ship in the Arabic
(`ar-AE`) build — both the Arabic copy that needs review and the English copy
still awaiting translation — grouped by surface, so a UAE-based reviewer can
forward-review, back-translate, and sign off. **No review has been
performed yet**; all rows are PENDING. Do not flip `ARABIC_ENABLED` or
claim Arabic readiness until a reviewer signs the columns below.

## How to use
Columns: `ID | Source (EN) | Current (AR) | Reviewer rewrite (AR) |
Back-translation (EN) | Comprehension (1-5) | Cultural fit (1-5) |
Reviewer | Date | Sign-off`.
A row is "done" only when Reviewer rewrite + Back-translation + Sign-off
are all filled and Comprehension/Cultural fit ≥ 4.

## A. Patient portal navigation (`portalTranslations.ts`)
IDs P-NAV-01.. already covered by the `ar` block. Reviewer focus:
- "صحة الدماغ" (Brain health) — confirm Gulf/Emirati term; alternatives
  "صحة العقل", "الصحة الدماغية".
- "كشف التغيير" (Change detection) — confirm comprehension for low-education.
- "خطة الوقاية شخصية" (Personalized Prevention Plan) — grammar/word order.
- "الرفاهية النفسية" (Mental wellbeing) — stigma-sensitive wording.

## B. Consent and privacy (`ConsentPrivacyPage`, portal consent block)
- "بياناتك، خياراتك" — confirm.
- Required/optional item wording — confirm no coercion.
- "دعم الفحص وليس تشخيصًا" — keep as the standard disclaimer.

## C. Context pages
- Sleep/lifestyle, wellbeing, clinical & family history descriptions.
- "تقرير ذاتي قصير يضع جلسة الفحص في سياقها. ليس تشخيصًا للمزاج ولا أداة
  فحص مُتحقق منها." — confirm.

## D. Accessible Arabic pathway (`AccessibleArabicCheckinPage.tsx`,
   `draftArabicCheckin.ts`) — word-list recall + 4-item daily function
- Word-list stimuli: are the 5 words culturally familiar and unambiguous
  for low-education Gulf/Emirati adults? Replace any that are not.
- "هل يمكنك إدارة أموالك/أدويةك/مواعيدك/تنقلك" daily-function items —
  confirm local comprehension.
- TTS voice (`ar-SA`/`ar-AE` depending on browser) — confirm intelligibility.

## E. Cognitive task wording in the main battery (partly Arabic today)

The registry (`server/src/services/assessmentLanguageReadiness.ts`) is the source
of truth for this section. Two items are already administered in Arabic and are
therefore **live, unreviewed copy** — they are the highest-priority rows here,
because a participant hears or reads them verbatim.

**Administered in Arabic — review targets, not approved wording**
- Spoken-repeat (verbal recall) sentence — `getTargetSentence()` in
  `client/src/features/screening/ScreeningPage.tsx`. Record an independent
  back-translation for this sentence specifically; it is the stimulus the
  participant repeats and it drives the acoustic comparison.
- Piano-sequencing instructions — all copy in
  `client/src/features/screening/PianoSequenceTask.tsx` (badge, title, intro,
  watch/turn/correct/incorrect messages, round counter, buttons, refusal note).

**Still English**
- Activity titles and step headers ("Activity 1 of 5: …"), the other task intros
  and prompts, button labels, and the screen-reader status announcements.
  These are `NOT_TRANSLATED`; mark them so in the table below rather than treating
  the section as translated.

This split is why `stimulus_translation` is `DONE` while
`taskAdministrationReady` remains false: translation of the two items above does
not make the battery reviewable, and administration stays gated on
back-translation, cognitive pretesting and local clinical sign-off.

## F. Clinician-facing (doctor portal)
- Doctor portal is English-only by design (`dir="ltr"`). No Arabic
  translation required for MVP, but any patient-facing strings that leak
  into doctor screens must be checked.

## Sign-off
Reviewer name / role / institution / date: ____________________
Clinician co-sign (local): ____________________
Status: PENDING (no review performed).
