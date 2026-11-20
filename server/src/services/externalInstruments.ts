/**
 * External validated instruments.
 *
 * Neulens does not administer, score or interpret any of these tests. A
 * clinician who already holds the licence does that outside the product and
 * records the total here, so the platform's own exploratory measurements sit
 * next to an externally validated anchor.
 *
 * Two rules the rest of the codebase relies on:
 *  1. Nothing in this module produces a cognitive score. There is no cut-off,
 *     no band and no derived number: the registry holds only administrative
 *     facts (scale range, who must hold the licence, which language was used).
 *  2. An external score is never folded into the Neulens composite, never
 *     converted into a review state, and never compared to a Neulens score.
 *     Its scale belongs to the publisher, not to us.
 *
 * Publisher terms change. Every entry records what the publisher states as of
 * the retrieval date below and tells the recording clinician that confirmation
 * is theirs to make; the platform does not grant or verify a licence.
 */

export const INSTRUMENT_TERMS_RETRIEVED_ON = '2026-11-17';

export interface ExternalInstrumentDefinition {
  key: string;
  name: string;
  fullName: string;
  /** Published total score range for the version in general use. */
  scoreRange: { min: number; max: number };
  administration: string;
  licence: {
    required: boolean;
    holder: 'ADMINISTERING_CLINICIAN' | 'NONE';
    note: string;
  };
  /** Languages with a published validation of this instrument. */
  validatedLanguages: string[];
  languageNote: string;
  validationNote: string;
  publisher: string;
}

export const EXTERNAL_INSTRUMENTS: ExternalInstrumentDefinition[] = [
  {
    key: 'MOCA',
    name: 'MoCA',
    fullName: 'Montreal Cognitive Assessment',
    scoreRange: { min: 0, max: 30 },
    administration: 'Paper or app, clinician-administered, roughly 10–15 minutes.',
    licence: {
      required: true,
      holder: 'ADMINISTERING_CLINICIAN',
      note:
        'Proprietary to MoCA Cognition. Training and certification are required to interpret individual tasks, ' +
        'sub-scores or domains (optional for total-score screening since the December 2025 policy change), and a ' +
        'separate written licence is required to incorporate the test into a product. Confirm the current terms ' +
        'and record the certification or licence reference.'
    },
    validatedLanguages: ['en', 'fr', 'ar'],
    languageNote:
      "Use the publisher's own Arabic version. The platform stores the language used but does not supply or validate translations.",
    validationNote:
      'Arabic MoCA validated in an Egyptian sample: Geriatrics & Gerontology International, 2009 (translation, back-translation, test–retest subsample).',
    publisher: 'MoCA Cognition'
  },
  {
    key: 'RUDAS',
    name: 'RUDAS',
    fullName: 'Rowland Universal Dementia Assessment Scale',
    scoreRange: { min: 0, max: 30 },
    administration:
      'Paper, clinician-administered, roughly 10 minutes; six items, designed for culturally and linguistically diverse populations.',
    licence: {
      required: false,
      holder: 'NONE',
      note:
        'Freely available for clinical use, minimal training required. Confirm the current distribution terms with the publisher before reproducing it.'
    },
    validatedLanguages: ['en', 'ar'],
    languageNote:
      'Designed to be administered through an interpreter; an Arabic version with a published validation exists.',
    validationNote:
      'Arabic RUDAS (A-RUDAS) validated in a Lebanese sample of 232 older adults: Aging & Mental Health 20(8), 2016.',
    publisher: 'Rowland Universal Dementia Assessment Scale (Storey et al., 2004)'
  },
  {
    key: 'AD8',
    name: 'AD8',
    fullName: 'Eight-item Informant Interview to Differentiate Aging and Dementia',
    scoreRange: { min: 0, max: 8 },
    administration:
      'Informant interview (patient self-report acceptable), roughly 3 minutes. Higher scores indicate more reported change.',
    licence: {
      required: true,
      holder: 'ADMINISTERING_CLINICIAN',
      note:
        'Copyright Washington University in St. Louis. A licence is required for clinical or research use, for-profit ' +
        'or not, and derivatives including translations are not permitted. Record the licence reference.'
    },
    validatedLanguages: ['en'],
    languageNote:
      'Use the licensed English instrument. The publisher does not permit derivative translations, so an ad-hoc Arabic rendering must not be recorded as AD8.',
    validationNote:
      'Validated against the Clinical Dementia Rating with reported sensitivity above 84% and specificity above 80% (Washington University Knight ADRC).',
    publisher: 'Washington University in St. Louis'
  },
  {
    key: 'MMSE',
    name: 'MMSE',
    fullName: 'Mini-Mental State Examination',
    scoreRange: { min: 0, max: 30 },
    administration: 'Paper, clinician-administered, roughly 10 minutes.',
    licence: {
      required: true,
      holder: 'ADMINISTERING_CLINICIAN',
      note:
        'Copyright held by PAR, Inc.; forms must be purchased. A published Arabic validation exists but the form itself ' +
        'still requires the publisher licence — record the purchase reference.'
    },
    validatedLanguages: ['en', 'ar'],
    languageNote:
      'Arabic MMSE versions exist in the literature; the platform does not supply them and does not check that the form used is the validated one.',
    validationNote:
      'Widely validated, including Arabic versions; education effects are well documented and must be considered by the clinician.',
    publisher: 'PAR, Inc.'
  }
];

export function findExternalInstrument(key: string): ExternalInstrumentDefinition | null {
  const normalized = key.trim().toUpperCase().replace(/[\s-]/g, '_');
  return EXTERNAL_INSTRUMENTS.find((instrument) => instrument.key === normalized) ?? null;
}

export function externalInstrumentCatalog() {
  return {
    termsRetrievedOn: INSTRUMENT_TERMS_RETRIEVED_ON,
    // Stated once, in the payload, so a client cannot present these as platform scores.
    platformRole:
      'Records a clinician-administered score. The platform does not administer, rescore or interpret these instruments, and never merges them into its own composite.',
    instruments: EXTERNAL_INSTRUMENTS
  };
}

export interface ExternalInstrumentInput {
  instrumentKey: string;
  instrumentVersion?: string;
  language: string;
  administeredOn: string;
  administeredBy: string;
  score: number;
  licenceConfirmed: boolean;
  licenceReference?: string;
  notes?: string;
}

export interface PreparedExternalInstrumentRecord {
  instrumentKey: string;
  instrumentName: string;
  instrumentVersion: string | null;
  language: string;
  administeredOn: Date;
  administeredBy: string;
  score: number;
  maxScore: number;
  licenceConfirmed: boolean;
  licenceReference: string | null;
  notes: string | null;
}

export type ExternalInstrumentPreparation =
  | { ok: true; record: PreparedExternalInstrumentRecord }
  | { ok: false; error: string };

const LANGUAGE_PATTERN = /^[a-z]{2,3}(-[A-Za-z]{2,8})?$/;

/**
 * Validates an entry against the registry. The maximum score is taken from the
 * registry, never from the caller: a record cannot widen its own scale, and a
 * score outside the instrument's published range is refused rather than clipped.
 */
export function prepareExternalInstrumentRecord(
  input: ExternalInstrumentInput,
  now: Date = new Date()
): ExternalInstrumentPreparation {
  const instrument = findExternalInstrument(input.instrumentKey);
  if (!instrument) {
    return {
      ok: false,
      error: `Unknown instrument "${input.instrumentKey}". Recorded instruments are limited to: ${EXTERNAL_INSTRUMENTS.map((entry) => entry.key).join(', ')}.`
    };
  }

  if (!Number.isFinite(input.score)) {
    return { ok: false, error: 'A numeric total score is required.' };
  }
  const { min, max } = instrument.scoreRange;
  if (input.score < min || input.score > max) {
    return {
      ok: false,
      error: `${instrument.name} total score must be between ${min} and ${max}; received ${input.score}. The platform does not rescale or clip an out-of-range score.`
    };
  }

  if (instrument.licence.required && input.licenceConfirmed !== true) {
    return {
      ok: false,
      error: `Recording a ${instrument.name} score requires confirming that the administering clinician holds the required licence or certification.`
    };
  }

  const administeredOn = new Date(`${input.administeredOn}T00:00:00.000Z`);
  if (Number.isNaN(administeredOn.getTime())) {
    return { ok: false, error: 'Administration date must be a calendar date (YYYY-MM-DD).' };
  }
  const nowUtc = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  if (administeredOn.getTime() > nowUtc.getTime()) {
    return { ok: false, error: 'Administration date cannot be in the future.' };
  }

  const language = input.language.trim();
  if (!LANGUAGE_PATTERN.test(language)) {
    return { ok: false, error: 'Language must be a short code such as "ar" or "en-GB".' };
  }

  const administeredBy = input.administeredBy.trim();
  if (administeredBy.length < 2) {
    return { ok: false, error: 'The administering clinician must be named.' };
  }

  return {
    ok: true,
    record: {
      instrumentKey: instrument.key,
      instrumentName: instrument.name,
      instrumentVersion: input.instrumentVersion?.trim() || null,
      language,
      administeredOn,
      administeredBy,
      score: input.score,
      maxScore: max,
      // Stored as given; only instruments whose publisher requires a licence are
      // gated on it (see the check above), so a free instrument records false
      // rather than implying a licence that does not exist.
      licenceConfirmed: input.licenceConfirmed === true,
      licenceReference: input.licenceReference?.trim() || null,
      notes: input.notes?.trim() || null
    }
  };
}

export interface StoredExternalInstrumentRecord {
  id: string;
  patientId: string;
  instrumentKey: string;
  instrumentVersion?: string | null;
  language: string;
  administeredOn: Date | string;
  administeredBy: string;
  score: number;
  maxScore: number;
  licenceConfirmed: boolean;
  licenceReference?: string | null;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt?: Date | string;
}

export type ExternalInstrumentComparability =
  | 'COMPARABLE'
  | 'FIRST_RECORD'
  | 'DIFFERENT_INSTRUMENT'
  | 'DIFFERENT_VERSION'
  | 'DIFFERENT_LANGUAGE';

export interface ExternalInstrumentEntry extends StoredExternalInstrumentRecord {
  instrumentName: string;
  /** Arithmetic difference from the nearest earlier record, kept descriptive only. */
  deltaFromPrevious: number | null;
  deltaComparability: ExternalInstrumentComparability;
}

const nameOf = (key: string) => findExternalInstrument(key)?.name ?? key;

/**
 * Orders records chronologically and annotates each with the raw arithmetic
 * difference from the nearest earlier administration. The difference is only
 * reported when instrument, version and language are identical, because a
 * difference across those is not a difference on the same scale. It is never
 * labelled as improvement, decline or change beyond "descriptive".
 */
export function describeExternalHistory(records: StoredExternalInstrumentRecord[]): ExternalInstrumentEntry[] {
  const ordered = [...records].sort(
    (a, b) => new Date(a.administeredOn).getTime() - new Date(b.administeredOn).getTime()
  );

  return ordered.map((record, index) => {
    const previous = ordered[index - 1];
    const base = { ...record, instrumentName: nameOf(record.instrumentKey) };

    if (!previous) {
      return { ...base, deltaFromPrevious: null, deltaComparability: 'FIRST_RECORD' as const };
    }
    if (previous.instrumentKey !== record.instrumentKey) {
      return { ...base, deltaFromPrevious: null, deltaComparability: 'DIFFERENT_INSTRUMENT' as const };
    }
    if ((previous.instrumentVersion ?? null) !== (record.instrumentVersion ?? null)) {
      return { ...base, deltaFromPrevious: null, deltaComparability: 'DIFFERENT_VERSION' as const };
    }
    if (previous.language !== record.language) {
      return { ...base, deltaFromPrevious: null, deltaComparability: 'DIFFERENT_LANGUAGE' as const };
    }
    return {
      ...base,
      deltaFromPrevious: Number((record.score - previous.score).toFixed(3)),
      deltaComparability: 'COMPARABLE' as const
    };
  });
}

export interface ExternalInstrumentAnchor {
  latest: ExternalInstrumentEntry | null;
  totalRecords: number;
  /** Always false: this is the point of the record, not an omission. */
  comparableToPlatformComposite: false;
  deltaBasis: 'DESCRIPTIVE_ARITHMETIC_ONLY';
  note: string;
}

export function summarizeExternalAnchor(records: StoredExternalInstrumentRecord[]): ExternalInstrumentAnchor {
  const history = describeExternalHistory(records);
  const latest = history.length > 0 ? history[history.length - 1] : null;

  return {
    latest,
    totalRecords: history.length,
    comparableToPlatformComposite: false,
    deltaBasis: 'DESCRIPTIVE_ARITHMETIC_ONLY',
    note: latest
      ? `${latest.instrumentName} is a clinician-administered instrument with its own scale. It is not comparable to a Neulens composite, does not affect it, and any difference shown between two external records is arithmetic only — no reliability, meaningful-change or diagnostic claim is made from it.`
      : 'No external validated-instrument score has been recorded for this patient. The Neulens composite is not a validated instrument and no external anchor exists for it.'
  };
}
