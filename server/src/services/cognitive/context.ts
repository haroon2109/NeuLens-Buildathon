import type { UserRecord } from '../../models/dataStore';
import type { AssessmentContext, QualityFlag } from './types';

/**
 * Builds the session context from recorded profile data and patient-reported
 * context inputs. Anything absent stays `null`; nothing is inferred or imputed.
 */
export function buildContext(
  user: UserRecord | null,
  contextInputs: Array<{ source: string; recordedAt: Date | string; values: any }>,
  overrides: Partial<AssessmentContext> = {}
): AssessmentContext {
  const ordered = [...contextInputs].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  const latestBy = (sources: string[]) =>
    ordered.find((input) => sources.includes(input.source))?.values || {};

  const sleep = latestBy(['sleep', 'sleep_lifestyle', 'assessment_context']);
  const wellbeing = latestBy(['wellbeing', 'mood', 'mental_wellbeing']);
  const sensory = latestBy(['sensory', 'accessibility', 'assessment_context']);

  const num = (value: unknown): number | null => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
  };
  const pick = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;

  const reported: AssessmentContext = {
    age: num(user?.age) ?? null,
    educationYears: num(user?.educationYears) ?? null,
    language: user?.language || 'en',
    sleepHours: num(sleep.sleepHours ?? sleep.durationHours),
    sleepQuality: num(sleep.sleepQuality ?? sleep.quality),
    fatigue: num(sleep.fatigue ?? overrides.fatigue),
    mood: num(wellbeing.mood),
    stress: num(wellbeing.stress),
    vision: pick(sensory.vision ?? overrides.vision, ['none', 'mild', 'significant'] as const),
    hearing: pick(sensory.hearing ?? overrides.hearing, ['none', 'mild', 'significant'] as const),
    motor: pick(sensory.motor ?? overrides.motor, ['none', 'mild', 'significant'] as const),
    digitalFamiliarity: pick(
      sensory.digitalFamiliarity ?? overrides.digitalFamiliarity,
      ['low', 'medium', 'high'] as const
    ),
    device: pick(overrides.device ?? sensory.device, ['tablet', 'desktop', 'phone'] as const),
    reportedBy: 'UNKNOWN'
  };

  // Explicit values supplied for this session win over older stored context.
  const merged: AssessmentContext = { ...reported };
  for (const key of Object.keys(overrides) as Array<keyof AssessmentContext>) {
    const value = overrides[key];
    if (value !== undefined && value !== null && value !== '') {
      (merged as unknown as Record<string, unknown>)[key] = value;
    }
  }
  merged.reportedBy = overrides.reportedBy || 'PATIENT';
  return merged;
}

/**
 * Contextual factors that may affect performance and must be shown to the
 * clinician. They are never used to change scores or clinical difficulty.
 */
export function contextConfounders(context: AssessmentContext): QualityFlag[] {
  const flags: QualityFlag[] = [];
  if (context.sleepHours != null && context.sleepHours < 6) {
    flags.push({
      code: 'SHORT_SLEEP',
      label: 'Short sleep',
      detail: `Reported ${context.sleepHours} hours of sleep. Recorded as interpretation context only.`,
      severity: 'WARNING'
    });
  }
  if (context.sleepQuality != null && context.sleepQuality <= 2) {
    flags.push({
      code: 'POOR_SLEEP_QUALITY',
      label: 'Reported sleep difficulty',
      detail: 'Patient reported poor sleep quality before the assessment.',
      severity: 'WARNING'
    });
  }
  if (context.fatigue != null && context.fatigue >= 4) {
    flags.push({
      code: 'HIGH_FATIGUE',
      label: 'High fatigue',
      detail: 'High fatigue was reported. A break or a later session may improve administration quality.',
      severity: 'WARNING'
    });
  }
  if (context.stress != null && context.stress >= 4) {
    flags.push({
      code: 'HIGH_STRESS',
      label: 'High stress',
      detail: 'High stress was reported on the day of assessment.',
      severity: 'WARNING'
    });
  }
  if (context.vision === 'significant') {
    flags.push({
      code: 'VISION_ACCESS',
      label: 'Vision accessibility need',
      detail: 'Significant visual difficulty reported: enlarged text and targets are required; detailed visual activities are excluded.',
      severity: 'WARNING'
    });
  }
  if (context.hearing === 'significant') {
    flags.push({
      code: 'HEARING_ACCESS',
      label: 'Hearing accessibility need',
      detail: 'Significant hearing difficulty reported: audio-only activities are excluded.',
      severity: 'WARNING'
    });
  }
  if (context.motor === 'significant') {
    flags.push({
      code: 'MOTOR_ACCESS',
      label: 'Motor accessibility need',
      detail: 'Significant motor difficulty reported: fine-motor activities are excluded and large controls are applied.',
      severity: 'WARNING'
    });
  }
  if (context.digitalFamiliarity === 'low') {
    flags.push({
      code: 'LOW_DIGITAL_FAMILIARITY',
      label: 'Low device familiarity',
      detail: 'Additional practice trials and simplified instructions will be offered.',
      severity: 'INFO'
    });
  }
  if (
    context.sleepHours == null &&
    context.fatigue == null &&
    context.mood == null &&
    (context.vision == null || context.hearing == null)
  ) {
    flags.push({
      code: 'CONTEXT_MISSING',
      label: 'Context not fully reported',
      detail: 'Some sleep, mood or sensory information was not supplied. Missing values are kept as missing, not inferred.',
      severity: 'INFO'
    });
  }
  return flags;
}
