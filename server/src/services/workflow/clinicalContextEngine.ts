function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

export function collectPreventionSignals(taskResponses: unknown, contextInputs: any[]) {
  const tr = asRecord(taskResponses);
  const functional = asRecord(tr.functionalCheckIn || tr.functional || tr.functional_checkin);
  const context = asRecord(tr.contextFactors || tr.context || tr.healthContext);
  const signals = new Set<string>();

  const scan = (obj: Record<string, any>) => {
    for (const [k, v] of Object.entries(obj || {})) {
      const key = k.toLowerCase();
      const val = typeof v === 'string' ? v.toLowerCase() : (typeof v === 'boolean' ? (v ? 'yes' : 'no') : '');
      const text = `${key} ${val}`;
      if (/sleep|insomnia|fatigue|tired/.test(text)) signals.add('sleep');
      if (/stress|anxiety|worry|overwhelm/.test(text)) signals.add('stress');
      if (/mood|depress|sad|lonel/.test(text)) signals.add('mood');
      if (/activity|exercise|walk|physical|sedentary/.test(text)) signals.add('activity');
      if (/social|isolation|alone|connect/.test(text)) signals.add('social');
      if (/hear|vision|sight|glasses/.test(text)) signals.add('sensory');
      if (/medication|medicine|drug/.test(text)) signals.add('medication_review');
      if (/nutrition|diet|eat|hydration/.test(text)) signals.add('nutrition');
    }
  };
  scan(functional);
  scan(context);
  for (const input of contextInputs || []) {
    scan(asRecord(input?.values));
  }
  return Array.from(signals);
}

export function summarizeHealthContext(taskResponses: unknown, contextInputs: any[]) {
  const tr = asRecord(taskResponses);
  const hasInlineContext = !!asRecord(tr.contextFactors || tr.context || tr.healthContext);
  return {
    hasContext: (contextInputs || []).length > 0 || hasInlineContext,
    recordedSources: Array.from(new Set((contextInputs || []).map(c => c?.source).filter(Boolean))),
    signals: collectPreventionSignals(taskResponses, contextInputs),
    note: 'Organized from recorded inputs only; missing data remains missing.',
  };
}
