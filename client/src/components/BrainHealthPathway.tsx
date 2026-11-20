import React from 'react';
import { Activity, Brain, GitBranch, HeartPulse, ShieldCheck, Stethoscope, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useLanguageStore } from '../services/language/LanguageManager';
import { getPathwayCopy, type PathwayCopy } from '../services/language/pathwayCopy';

type PathwayStage = {
  stage: number;
  key: string;
  title: string;
  state: string;
  summary: string;
  details?: Record<string, any>;
};

type Prevention = {
  signals?: string[];
  note?: string;
};

const icons = [Activity, Brain, GitBranch, HeartPulse, Stethoscope];

function toneForState(state: string) {
  const s = (state || '').toUpperCase();
  if (s.includes('REVIEW') || s.includes('SAFETY_GATED') || s.includes('RECOMMENDED')) return 'border-amber-200 bg-amber-50 text-amber-800';
  if (s.includes('PROVISIONAL') || s.includes('INSUFFICIENT')) return 'border-blue-200 bg-blue-50 text-blue-800';
  if (s.includes('WITHIN') || s.includes('COLLECTED') || s.includes('ACTIVE') || s.includes('COMPLETED') || s.includes('REVIEWED') || s.includes('MONITORING')) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function prettyState(state: string, copy: PathwayCopy) {
  const key = (state || '').toUpperCase();
  if (copy.states[key]) return copy.states[key];
  return (state || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export const BrainHealthPathway: React.FC<{
  pathway?: PathwayStage[] | null;
  personalizedPrevention?: Prevention | null;
  compact?: boolean;
  title?: string;
}> = ({ pathway, personalizedPrevention, compact = false, title }) => {
  const copy = getPathwayCopy(useLanguageStore((state) => state.currentLanguage));
  if (!pathway || pathway.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'} space-y-4`} aria-label={copy.ariaLabel}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy.eyebrow}</p>
          <h3 className={`${compact ? 'text-[15px]' : 'text-[17px]'} font-semibold text-slate-900 mt-0.5`}>{title || copy.title}</h3>
          <p className="text-[14px] text-slate-600 mt-1">{copy.disclaimer}</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
      </div>

      <ol className="space-y-2.5">
        {pathway.map((stage, idx) => {
          const Icon = icons[idx] || Activity;
          const tone = toneForState(stage.state);
          return (
            <li key={stage.key || stage.stage} className={`rounded-xl border p-3 ${compact ? '' : 'sm:p-3.5'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-slate-900">{stage.stage}. {stage.title}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
                      {prettyState(stage.state, copy)}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-5 text-slate-600">{stage.summary}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {personalizedPrevention && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <p className="text-[14px] font-semibold text-emerald-900">{copy.preventionTitle}</p>
          </div>
          <p className="mt-1 text-[14px] leading-5 text-emerald-900/90">
            {personalizedPrevention.note || copy.preventionFallback}
          </p>
          {personalizedPrevention.signals && personalizedPrevention.signals.length > 0 && (
            <p className="mt-1.5 text-xs text-emerald-800">
              {copy.signalsLabel} <span className="font-semibold">{personalizedPrevention.signals.join(', ').replace(/_/g, ' ')}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default BrainHealthPathway;



export function derivePathwayFromOverview(args: {
  baseline: any;
  changes: any[];
  brainHealth: any;
  assessments: any[];
  context: any[];
}, copy: PathwayCopy = getPathwayCopy('en')) {
  const { baseline, changes, brainHealth, assessments, context } = args;
  const latestChange = changes?.[0];
  const comparableCount = assessments?.filter((a: any) => a?.status === 'COMPLETED').length || 0;
  const hasContext = (context || []).length > 0;
  const stage3State = !latestChange
    ? (comparableCount >= 2 ? 'INSUFFICIENT_DATA' : 'INSUFFICIENT_DATA')
    : latestChange.status === 'REVIEW' ? 'REVIEW_SIGNAL'
    : latestChange.status === 'NO_CHANGE' ? 'WITHIN_PERSONAL_RANGE'
    : 'INSUFFICIENT_DATA';
  const stage3Summary = stage3State === 'REVIEW_SIGNAL'
    ? copy.stage3.review
    : stage3State === 'WITHIN_PERSONAL_RANGE'
      ? copy.stage3.within
      : copy.stage3.insufficient;

  const review = latestChange?.status === 'REVIEW' || brainHealth?.reviewSignal === 'REVIEW_PROMPT';
  const preventionSteps = (brainHealth?.nextSteps || []).filter((s: any) => s?.stage === 4 || s?.type === 'PERSONALIZED_PREVENTION' || s?.type === 'REVIEW_CONTEXT');

  return [
    {
      stage: 1, key: 'population_signals_and_screening', title: copy.stage1.title, state: 'COLLECTED',
      summary: copy.stage1.summary,
      details: { hasHealthContext: hasContext }
    },
    {
      stage: 2, key: 'personal_baseline', title: copy.stage2.title, state: baseline ? 'ACTIVE' : 'PENDING',
      summary: baseline ? copy.stage2.activeSummary : copy.stage2.pendingSummary,
      details: { assessmentsCount: comparableCount }
    },
    {
      stage: 3, key: 'meaningful_change_detection', title: copy.stage3.title, state: stage3State,
      summary: stage3Summary,
    },
    {
      stage: 4, key: 'personalized_prevention', title: copy.stage4.title, state: preventionSteps.length ? 'SUGGESTED' : 'AVAILABLE',
      summary: copy.stage4.summary,
    },
    {
      stage: 5, key: 'clinical_referral_and_closed_loop_outcomes', title: copy.stage5.title, state: review ? 'CLINICAL_REVIEW_RECOMMENDED' : 'MONITORING',
      summary: review ? copy.stage5.review : copy.stage5.monitoring,
    },
  ];
}
