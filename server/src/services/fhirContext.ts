export type FhirContextCategory = 'physical' | 'metabolic' | 'sleep' | 'wellbeing';

/**
 * What gets attached to the session record. `null` importedAt means we never
 * reached a server that could return data (not configured, no match, failure),
 * so the clinician sees the status without a misleading timestamp.
 */
export interface FhirContextRecord {
  status: FhirContextResult['status'];
  importedAt: string | null;
  observations: FhirContextObservation[];
}

export interface FhirContextObservation {
  category: FhirContextCategory;
  code: string;
  label: string;
  value: number;
  unit: string;
  recordedAt: string | null;
  source: 'FHIR R4';
}

export interface FhirContextResult {
  status: 'NOT_CONFIGURED' | 'IMPORTED' | 'NO_MATCHING_DATA' | 'FAILED';
  observations: FhirContextObservation[];
}

const OBSERVATION_CATALOG: Record<string, { category: FhirContextCategory; label: string }> = {
  '8480-6': { category: 'metabolic', label: 'Systolic blood pressure' },
  '8462-4': { category: 'metabolic', label: 'Diastolic blood pressure' },
  '2345-7': { category: 'metabolic', label: 'Glucose' },
  '2093-3': { category: 'metabolic', label: 'Total cholesterol' },
  '29463-7': { category: 'physical', label: 'Body weight' },
  '41950-7': { category: 'physical', label: 'Daily step count' },
  '93832-4': { category: 'sleep', label: 'Sleep duration' },
  '55758-7': { category: 'wellbeing', label: 'PHQ-2 score' }
};

interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

interface FhirObservationResource {
  resourceType?: string;
  code?: { coding?: FhirCoding[] };
  valueQuantity?: { value?: number; unit?: string; code?: string };
  effectiveDateTime?: string;
  effectivePeriod?: { start?: string };
  issued?: string;
  component?: Array<{
    code?: { coding?: FhirCoding[] };
    valueQuantity?: { value?: number; unit?: string; code?: string };
  }>;
}

interface FhirBundle {
  resourceType?: string;
  entry?: Array<{ resource?: FhirObservationResource & { id?: string } }>;
}

function getLoincCode(codings: FhirCoding[] = []): string | undefined {
  return codings.find(coding =>
    coding.system === 'http://loinc.org' && coding.code && OBSERVATION_CATALOG[coding.code]
  )?.code;
}

export function extractFhirContext(bundle: FhirBundle): FhirContextObservation[] {
  const observations: FhirContextObservation[] = [];
  for (const entry of bundle.entry || []) {
    const resource = entry.resource;
    if (resource?.resourceType !== 'Observation') continue;
    const effectiveDate = resource.effectiveDateTime || resource.effectivePeriod?.start || resource.issued || null;
    const components = resource.component || [];
    const candidates = components.length > 0
      ? components.map(component => ({ coding: component.code?.coding, quantity: component.valueQuantity }))
      : [{ coding: resource.code?.coding, quantity: resource.valueQuantity }];

    for (const candidate of candidates) {
      const code = getLoincCode(candidate.coding);
      const catalogEntry = code ? OBSERVATION_CATALOG[code] : undefined;
      const value = candidate.quantity?.value;
      if (!code || !catalogEntry || typeof value !== 'number' || !Number.isFinite(value)) continue;
      observations.push({
        category: catalogEntry.category,
        code,
        label: catalogEntry.label,
        value,
        unit: candidate.quantity?.unit || candidate.quantity?.code || '',
        recordedAt: effectiveDate,
        source: 'FHIR R4'
      });
    }
  }
  return observations;
}

function getFhirConfig(): { baseUrl: URL; token: string; identifierSystem: string } | null {
  const base = process.env.FHIR_BASE_URL?.trim();
  const token = process.env.FHIR_BEARER_TOKEN?.trim();
  if (!base || !token) return null;

  const baseUrl = new URL(base);
  const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname);
  if (baseUrl.protocol !== 'https:' && !(baseUrl.protocol === 'http:' && isLoopback)) {
    throw new Error('FHIR_BASE_URL must use HTTPS except for a local development server.');
  }

  return {
    baseUrl,
    token,
    identifierSystem: process.env.FHIR_IDENTIFIER_SYSTEM?.trim() || 'urn:neulens:patient-id'
  };
}

function endpoint(config: { baseUrl: URL }, resource: string): URL {
  const url = new URL(config.baseUrl.toString());
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/${resource}`;
  return url;
}

export async function fetchFhirContext(patientId: string): Promise<FhirContextResult> {
  try {
    const config = getFhirConfig();
    if (!config) return { status: 'NOT_CONFIGURED', observations: [] };

    const patientUrl = endpoint(config, 'Patient');
    patientUrl.searchParams.set('identifier', `${config.identifierSystem}|${patientId}`);
    const patientResponse = await fetch(patientUrl, {
      headers: { Accept: 'application/fhir+json', Authorization: `Bearer ${config.token}` },
      signal: AbortSignal.timeout(8000)
    });
    if (!patientResponse.ok) throw new Error(`FHIR Patient search returned HTTP ${patientResponse.status}`);

    const patientBundle = await patientResponse.json() as FhirBundle;
    const patient = patientBundle.entry?.find(entry => entry.resource?.resourceType === 'Patient')?.resource;
    if (!patient?.id) return { status: 'NO_MATCHING_DATA', observations: [] };

    const observationUrl = endpoint(config, 'Observation');
    observationUrl.searchParams.set('subject', `Patient/${patient.id}`);
    observationUrl.searchParams.set('code', Object.keys(OBSERVATION_CATALOG).map(code => `http://loinc.org|${code}`).join(','));
    observationUrl.searchParams.set('_sort', '-date');
    observationUrl.searchParams.set('_count', '100');
    observationUrl.searchParams.set('date', `ge${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}`);
    const observationResponse = await fetch(observationUrl, {
      headers: { Accept: 'application/fhir+json', Authorization: `Bearer ${config.token}` },
      signal: AbortSignal.timeout(8000)
    });
    if (!observationResponse.ok) throw new Error(`FHIR Observation search returned HTTP ${observationResponse.status}`);

    const observations = extractFhirContext(await observationResponse.json() as FhirBundle);
    return {
      status: observations.length > 0 ? 'IMPORTED' : 'NO_MATCHING_DATA',
      observations
    };
  } catch (error) {
    console.error('[FHIR R4]: Context import failed:', error instanceof Error ? error.message : error);
    return { status: 'FAILED', observations: [] };
  }
}

/**
 * The only entry point the session path uses. Consent is checked before any
 * network call, so a patient who did not opt in never has their identifier sent
 * to an external system, and the attempt is recorded with the session so the
 * clinician can tell "nothing linked" apart from "not asked".
 */
export async function importExternalContext(
  consentGranted: boolean,
  patientIdentifier: string
): Promise<FhirContextRecord | null> {
  if (!consentGranted) return null;
  const result = await fetchFhirContext(patientIdentifier);
  return {
    status: result.status,
    importedAt: result.status === 'IMPORTED' ? new Date().toISOString() : null,
    observations: result.observations
  };
}
