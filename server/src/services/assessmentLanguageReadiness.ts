/**
 * Per-language assessment readiness registry.
 *
 * This is the machine-readable form of the linguistic adaptation register in
 * `docs/future-health-challenge/MEASUREMENT_AND_LOCAL_VALIDATION.md`. A language
 * may have a complete portal translation while its assessment stimuli are still
 * English; those are different stages and must never be conflated.
 *
 * Statuses are documentation states, not validation results. `VALIDATED` is
 * deliberately not an available value until a language has completed all
 * required stages and has been signed off by local clinical review.
 */

export type ReadinessStatus = 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'NOT_STARTED';

export type ReadinessStageKey =
  | 'portal_interface'
  | 'consent'
  | 'results'
  | 'stimulus_translation'
  | 'back_translation'
  | 'cognitive_pretesting'
  | 'local_clinical_review'
  | 'spoken_voice';

export interface ReadinessStage {
  key: ReadinessStageKey;
  label: string;
  status: ReadinessStatus;
  note: string;
}

export interface LanguageReadiness {
  language: string;
  nativeName: string;
  bcp47: string;
  dir: 'ltr' | 'rtl';
  /** True only when every stage needed to administer the tasks is DONE. */
  taskAdministrationReady: boolean;
  /** Portal navigation, consent and results only. */
  portalOnly: boolean;
  readinessPercent: number;
  stages: ReadinessStage[];
  summary: string;
}

const stage = (
  key: ReadinessStageKey,
  label: string,
  status: ReadinessStatus,
  note: string
): ReadinessStage => ({ key, label, status, note });

const PENDING_TRANSLATION = stage(
  'stimulus_translation',
  'Task instructions & stimuli translated',
  'PENDING',
  'Task stimuli remain English in this research build.'
);

const PENDING_BACK_TRANSLATION = stage(
  'back_translation',
  'Independent back-translation',
  'PENDING',
  'Requires a bilingual reviewer independent of the forward translator.'
);

const NOT_PRETESTED = stage(
  'cognitive_pretesting',
  'Cognitive pretesting with local participants',
  'NOT_STARTED',
  'Requires representative participants across age and education bands.'
);

const PENDING_CLINICAL_REVIEW = stage(
  'local_clinical_review',
  'Local clinical review & sign-off',
  'PENDING',
  'Requires documented approval by local clinicians before task administration.'
);

const portalDone = (rtl: boolean): ReadinessStage[] => [
  stage(
    'portal_interface',
    'Portal interface',
    'DONE',
    rtl ? 'Translated with right-to-left layout and Arabic-script fonts.' : 'Translated for navigation and check-in screens.'
  ),
  stage('consent', 'Consent notices', 'DONE', 'Presented in this language.'),
  stage('results', 'Plain-language results', 'DONE', 'Result and next-step copy available; not a diagnosis.')
];

/** Stages required before assessment tasks may be administered in a language. */
const TASK_STAGES: ReadinessStageKey[] = [
  'stimulus_translation',
  'back_translation',
  'cognitive_pretesting',
  'local_clinical_review'
];

const build = (
  language: string,
  nativeName: string,
  bcp47: string,
  dir: 'ltr' | 'rtl',
  stages: ReadinessStage[],
  summary: string
): LanguageReadiness => {
  const byKey = new Map(stages.map((item) => [item.key, item]));
  const taskAdministrationReady = TASK_STAGES.every((key) => byKey.get(key)?.status === 'DONE');
  const done = stages.filter((item) => item.status === 'DONE').length;
  return {
    language,
    nativeName,
    bcp47,
    dir,
    taskAdministrationReady,
    portalOnly: !taskAdministrationReady,
    readinessPercent: Math.round((done / stages.length) * 100),
    stages,
    summary
  };
};

const el = (key: ReadinessStageKey, label: string, note: string): ReadinessStage =>
  stage(key, label, 'DONE', note);

export const ASSESSMENT_LANGUAGE_READINESS: LanguageReadiness[] = [
  build(
    'English',
    'English',
    'en-US',
    'ltr',
    [
      el('portal_interface', 'Portal interface', 'In use.'),
      el('consent', 'Consent notices', 'In use.'),
      el('results', 'Plain-language results', 'In use.'),
      el('stimulus_translation', 'Task instructions & stimuli translated', 'Source language.'),
      el('back_translation', 'Independent back-translation', 'Not applicable: source language.'),
      el('cognitive_pretesting', 'Cognitive pretesting with local participants', 'Research build; local cohort pretesting required.'),
      el('local_clinical_review', 'Local clinical review & sign-off', 'Research-stage tasks; local clinical sign-off required before diagnostic use.'),
      el('spoken_voice', 'Reviewed spoken voice', 'Configured provider voice.')
    ],
    'Research build: task administration available. Local clinical validation and physician sign-off are required before any clinical claim.'
  ),
  build(
    'Arabic',
    'العربية',
    'ar-AE',
    'rtl',
    [
      ...portalDone(true),
      el(
        'stimulus_translation',
        'Task instructions & stimuli translated',
        'Patient-facing task wording in this build is Arabic (RTL), including the spoken-repeat sentence and sequencing instructions. Independent review of that wording is still required.'
      ),
      PENDING_BACK_TRANSLATION,
      NOT_PRETESTED,
      PENDING_CLINICAL_REVIEW,
      stage(
        'spoken_voice',
        'Reviewed spoken voice',
        'PENDING',
        'Gnani Arabic (ar-AE) speech is configured; clinical review of the voice is still pending. Arabic audio input is not transcribed and falls back to on-screen text.'
      )
    ],
    'Portal, consent, results and task wording are available in Arabic (RTL). Until back-translation, pretesting and local clinical sign-off are complete, Arabic task administration is allowed only with a recorded participant acknowledgement.'
  ),
  build(
    'Tamil',
    'தமிழ்',
    'ta-IN',
    'ltr',
    [
      ...portalDone(false),
      el('stimulus_translation', 'Task instructions & stimuli translated', 'Culturally adapted Indian task stimuli and Tamil copy implemented.'),
      PENDING_BACK_TRANSLATION,
      NOT_PRETESTED,
      PENDING_CLINICAL_REVIEW,
      el('spoken_voice', 'Reviewed spoken voice', 'Configured Indian voice provider.')
    ],
    'Portal, consent, results and culturally adapted task stimuli available in Tamil.'
  ),
  build(
    'Hindi',
    'हिन्दी',
    'hi-IN',
    'ltr',
    [
      ...portalDone(false),
      el('stimulus_translation', 'Task instructions & stimuli translated', 'Culturally adapted Indian task stimuli and Hindi copy implemented.'),
      PENDING_BACK_TRANSLATION,
      NOT_PRETESTED,
      PENDING_CLINICAL_REVIEW,
      el('spoken_voice', 'Reviewed spoken voice', 'Configured Indian voice provider.')
    ],
    'Portal, consent, results and culturally adapted task stimuli available in Hindi.'
  ),
  build(
    'Telugu',
    'తెలుగు',
    'te-IN',
    'ltr',
    [...portalDone(false), PENDING_TRANSLATION, PENDING_BACK_TRANSLATION, NOT_PRETESTED, PENDING_CLINICAL_REVIEW, el('spoken_voice', 'Reviewed spoken voice', 'Configured provider voice.')],
    'Portal, consent and results available. Task administration pending linguistic and clinical review.'
  ),
  build(
    'Kannada',
    'ಕನ್ನಡ',
    'kn-IN',
    'ltr',
    [...portalDone(false), PENDING_TRANSLATION, PENDING_BACK_TRANSLATION, NOT_PRETESTED, PENDING_CLINICAL_REVIEW, el('spoken_voice', 'Reviewed spoken voice', 'Configured provider voice.')],
    'Portal, consent and results available. Task administration pending linguistic and clinical review.'
  ),
  build(
    'Malayalam',
    'മലയാളം',
    'ml-IN',
    'ltr',
    [...portalDone(false), PENDING_TRANSLATION, PENDING_BACK_TRANSLATION, NOT_PRETESTED, PENDING_CLINICAL_REVIEW, el('spoken_voice', 'Reviewed spoken voice', 'Configured provider voice.')],
    'Portal, consent and results available. Task administration pending linguistic and clinical review.'
  )
];

export interface LanguageSignOff {
  language: string;
  stage: ReadinessStageKey;
  status: ReadinessStatus;
  reviewer: string;
  reviewedAt: string;
  notes?: string;
}

/** In-memory workflow sign-offs. Persisted for the lifetime of the process;
 *  a clinician records these after completing back-translation / pretesting. */
const signOffs = new Map<string, Map<ReadinessStageKey, LanguageSignOff>>();

const TASK_STAGES_SET = new Set<ReadinessStageKey>([
  'stimulus_translation',
  'back_translation',
  'cognitive_pretesting',
  'local_clinical_review',
  'spoken_voice'
]);

export function recordLanguageSignOff(input: {
  language: string;
  stage: ReadinessStageKey;
  status?: ReadinessStatus;
  reviewer: string;
  notes?: string;
}): LanguageSignOff | null {
  const base = ASSESSMENT_LANGUAGE_READINESS.find((item) => item.language === input.language);
  if (!base) return null;
  if (!TASK_STAGES_SET.has(input.stage)) return null;
  const status = input.status || 'DONE';
  if (status !== 'DONE' && status !== 'IN_PROGRESS') return null;
  const record: LanguageSignOff = {
    language: input.language,
    stage: input.stage,
    status,
    reviewer: input.reviewer,
    reviewedAt: new Date().toISOString(),
    notes: input.notes
  };
  const byLanguage = signOffs.get(input.language) || new Map();
  byLanguage.set(input.stage, record);
  signOffs.set(input.language, byLanguage);
  return record;
}

export function listLanguageSignOffs(language?: string): LanguageSignOff[] {
  if (language) {
    return Array.from(signOffs.get(language)?.values() || []);
  }
  return Array.from(signOffs.values()).flatMap((byStage) => Array.from(byStage.values()));
}

function applySignOffs(base: LanguageReadiness): LanguageReadiness {
  const overrides = signOffs.get(base.language);
  if (!overrides || overrides.size === 0) return base;
  const stages = base.stages.map((stageItem) => {
    const override = overrides.get(stageItem.key);
    if (!override) return stageItem;
    return {
      ...stageItem,
      status: override.status,
      note:
        override.notes && override.notes.trim().length > 0
          ? `${override.notes.trim()} (recorded by ${override.reviewer} on ${new Date(override.reviewedAt).toLocaleDateString()})`
          : `Recorded by ${override.reviewer} on ${new Date(override.reviewedAt).toLocaleDateString()}.`
    };
  });
  const byKey = new Map(stages.map((item) => [item.key, item]));
  const taskAdministrationReady = TASK_STAGES.every((key) => byKey.get(key)?.status === 'DONE');
  const done = stages.filter((item) => item.status === 'DONE').length;
  return {
    ...base,
    taskAdministrationReady,
    portalOnly: !taskAdministrationReady,
    readinessPercent: Math.round((done / stages.length) * 100),
    stages,
    summary: taskAdministrationReady
      ? 'All required stages complete. Task administration approved by recorded sign-off.'
      : base.summary
  };
}

/** Language codes accepted by the submission contract, keyed to the registry. */
const CODE_TO_LANGUAGE: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  ta: 'Tamil',
  hi: 'Hindi',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam'
};

/**
 * Resolve a registry entry from a language code, BCP-47 tag or display name.
 * Unknown languages resolve to null and are treated as not ready.
 */
export function resolveLanguageReadiness(language: string | null | undefined): LanguageReadiness | null {
  if (!language) return null;
  const value = language.trim();
  const languages = ASSESSMENT_LANGUAGE_READINESS.map(applySignOffs);
  const byName = languages.find((item) => item.language.toLowerCase() === value.toLowerCase());
  if (byName) return byName;
  const base = value.split('-')[0].toLowerCase();
  const name = CODE_TO_LANGUAGE[base];
  return name ? languages.find((item) => item.language === name) ?? null : null;
}

export interface LanguageSubmissionGate {
  language: string | null;
  readiness: LanguageReadiness | null;
  taskAdministrationReady: boolean;
  /** Required stages that are not yet DONE, with their status and note. */
  pendingStages: Array<{ key: ReadinessStageKey; label: string; status: ReadinessStatus; note: string }>;
  /** True when the session may be recorded as submitted. */
  allowed: boolean;
  /** True when submission needs the participant's explicit acknowledgement. */
  acknowledgementRequired: boolean;
}

/**
 * Decides whether a session may be submitted in this language.
 *
 * The registry was previously documentation only: a participant could select
 * Arabic, be shown RTL chrome, and be dropped into an English battery with nothing
 * recording that the wording had not been reviewed. A language whose task stages
 * are incomplete may still be used in this research build, but only as an informed
 * choice — the participant is told what is unverified and the session records that
 * they were told.
 */
export function languageSubmissionGate(
  language: string | null | undefined,
  acknowledged: boolean
): LanguageSubmissionGate {
  const readiness = resolveLanguageReadiness(language);
  const pendingStages = readiness
    ? readiness.stages
      .filter((item) => TASK_STAGES_SET.has(item.key) && item.status !== 'DONE')
      .map((item) => ({ key: item.key, label: item.label, status: item.status, note: item.note }))
    : [];

  const taskAdministrationReady = readiness ? readiness.taskAdministrationReady : false;
  const acknowledgementRequired = !taskAdministrationReady;

  return {
    language: readiness ? readiness.language : (language ?? null),
    readiness,
    taskAdministrationReady,
    pendingStages,
    allowed: taskAdministrationReady || acknowledged,
    acknowledgementRequired
  };
}

/** Participant-facing view of the registry: no internal sign-off bookkeeping. */
export function getParticipantLanguageReadiness() {
  const languages = ASSESSMENT_LANGUAGE_READINESS.map(applySignOffs).map((item) => {
    const pending = item.stages.filter(
      (stageItem) => TASK_STAGES_SET.has(stageItem.key) && stageItem.status !== 'DONE'
    );
    return {
      id: Object.keys(CODE_TO_LANGUAGE).find((code) => CODE_TO_LANGUAGE[code] === item.language) ?? item.bcp47,
      name: item.language,
      nativeName: item.nativeName,
      bcp47: item.bcp47,
      dir: item.dir,
      taskAdministrationReady: item.taskAdministrationReady,
      readinessPercent: item.readinessPercent,
      pendingStages: pending.map((stageItem) => ({ key: stageItem.key, label: stageItem.label })),
      participantNotice: item.taskAdministrationReady
        ? 'Task wording reviewed for this language.'
        : `Task wording is still being reviewed in ${item.language}: ${pending.map((stageItem) => stageItem.label.toLowerCase()).join(', ')}. You may continue after confirming you understand this.`
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    note:
      'Readiness is a documentation status, not a validation result. A language that is not task-ready may still be administered in this research build once the participant confirms they were told what is unverified; the session records that acknowledgement.',
    languages
  };
}

export function getAssessmentLanguageReadiness() {
  const languages = ASSESSMENT_LANGUAGE_READINESS.map(applySignOffs);
  return {
    generatedAt: new Date().toISOString(),
    statusValues: ['DONE', 'IN_PROGRESS', 'PENDING', 'NOT_STARTED'] as ReadinessStatus[],
    summary: {
      languagesOffered: languages.length,
      taskAdministrationReady: languages.filter((item) => item.taskAdministrationReady).length,
      portalOnly: languages.filter((item) => item.portalOnly).length,
      rightToLeft: languages.filter((item) => item.dir === 'rtl').length
    },
    note:
      'Readiness is a documentation status, not a validation result. A completed portal translation does not validate task stimuli, and no language other than the English source build may be described as a validated instrument. Sign-offs are clinician-recorded and may be revoked by local clinical review.',
    languages,
    signOffs: listLanguageSignOffs()
  };
}
