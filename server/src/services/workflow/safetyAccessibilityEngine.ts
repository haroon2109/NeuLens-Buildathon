import type { SafetyAccessibilityResult } from './types';

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

export function deriveSessionQuality(taskResponses: unknown) {
  const tr = asRecord(taskResponses);
  const quality = asRecord(tr.quality);
  const comparableFlag = typeof quality.comparable === 'boolean' ? quality.comparable : undefined;
  const completion = typeof quality.completion === 'string' ? quality.completion : undefined;
  const interruptions = Number.isFinite(Number(quality.interruptions)) ? Number(quality.interruptions) : 0;

  // Conservative safety gate: only explicitly comparable, sufficiently complete, low-interruption sessions
  // are eligible for within-person change interpretation. Missing quality metadata is treated as not comparable.
  const comparable = comparableFlag === true && completion !== 'PARTIAL' && interruptions <= 2;
  return {
    comparable,
    completion: completion || 'UNKNOWN',
    interruptions,
    reasons: [
      ...(comparableFlag === false ? ['QUALITY_NOT_COMPARABLE'] : []),
      ...(comparableFlag === undefined ? ['QUALITY_UNKNOWN'] : []),
      ...(completion === 'PARTIAL' ? ['INCOMPLETE_SESSION'] : []),
      ...(interruptions > 2 ? ['EXCESSIVE_INTERRUPTIONS'] : []),
    ] as string[],
  };
}

export function evaluateSafetyAccessibility(taskResponses: unknown, contextInputs: any[]): SafetyAccessibilityResult {
  const tr = asRecord(taskResponses);
  const sessionQuality = deriveSessionQuality(taskResponses);

  // Consent: recorded only if explicitly present; missing stays missing (never assumed).
  const consent = asRecord(tr.consent || tr.consentRecord);
  const consentRecorded = consent.granted === true || consent.accepted === true || consent.recorded === true;
  const consentMissing = !consentRecorded && Object.keys(consent).length === 0;

  // Urgent flags: deterministic extraction from explicitly reported fields only.
  const urgentFlags: string[] = [];
  const safety = asRecord(tr.safety || tr.urgent || tr.urgentConcerns);
  const scanUrgent = (obj: Record<string, any>, prefix = '') => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === true || (typeof v === 'string' && /urgent|immediate|emergency|severe|harm|suicid/i.test(v))) {
        urgentFlags.push(prefix ? `${prefix}.${k}` : k);
      }
    }
  };
  scanUrgent(safety);
  if (Array.isArray(tr.urgentFlags)) {
    for (const f of tr.urgentFlags) if (typeof f === 'string' && f.trim()) urgentFlags.push(f.trim());
  }

  const hasContext = (contextInputs || []).length > 0 || !!asRecord(tr.contextFactors || tr.context || tr.healthContext);
  const missingContext: string[] = [];
  if (!hasContext) missingContext.push('health_context_not_recorded');
  if (consentMissing) missingContext.push('consent_record_missing');

  const canInterpretChange = sessionQuality.comparable; // quality/comparability gate for change interpretation

  return {
    sessionQuality,
    consent: {
      recorded: consentRecorded,
      missing: consentMissing,
      details: consentRecorded ? ['CONSENT_RECORDED'] : consentMissing ? ['CONSENT_NOT_RECORDED'] : ['CONSENT_NOT_GRANTED_OR_INCOMPLETE'],
    },
    urgentFlags,
    accessibility: {
      contextAvailable: hasContext,
      missingContext,
      qualityGated: !sessionQuality.comparable,
    },
    canInterpretChange,
  };
}
