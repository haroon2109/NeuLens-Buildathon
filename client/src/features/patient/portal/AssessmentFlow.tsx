import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Fingerprint, Eye, AudioLines, ScanFace } from 'lucide-react';
import { PortalPageHeader } from './ui';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getAssessmentCopy } from '../../../services/language/assessmentCopy';

export type AssessmentStepKey = 'cognitive' | 'ocular' | 'vocal' | 'facial';

const STEP_PATHS: Record<AssessmentStepKey, string> = {
  cognitive: '/patient/assessment/cognitive',
  ocular: '/patient/assessment/ocular',
  vocal: '/patient/assessment/vocal',
  facial: '/patient/assessment/facial'
};

const STEP_ICONS: Record<AssessmentStepKey, LucideIcon> = {
  cognitive: Fingerprint,
  ocular: Eye,
  vocal: AudioLines,
  facial: ScanFace
};

type StepState = 'done' | 'current' | 'upcoming';

/**
 * AssessmentProgress — where you are in the four-stage session.
 *
 * Deliberately a rail rather than a numbered stepper with arrows: the stages are
 * not necessarily completed in order, and the patient can leave and come back.
 * Each segment is a link, the current one is marked `aria-current="step"`, and
 * state is also stated in text so it does not depend on colour alone.
 *
 * It takes the width of its container and never sets one, so it always lines up
 * with the block below it: full width on the intro and completion screens, and
 * the shell's narrow column on a stage screen.
 */
export const AssessmentProgress: React.FC<{
  current?: AssessmentStepKey;
  complete?: boolean;
  className?: string;
}> = ({ current, complete = false, className = '' }) => {
  const copy = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage));
  const assessmentSteps = copy.flow.steps.map((step) => ({
    ...step,
    path: STEP_PATHS[step.key],
    icon: STEP_ICONS[step.key]
  }));
  const currentIndex = current ? assessmentSteps.findIndex((step) => step.key === current) : -1;
  const total = assessmentSteps.length;
  const active = assessmentSteps[currentIndex];

  const stateFor = (index: number): StepState => {
    if (complete) return 'done';
    if (currentIndex === -1) return 'upcoming';
    if (index < currentIndex) return 'done';
    return index === currentIndex ? 'current' : 'upcoming';
  };

  const barFor: Record<StepState, string> = {
    done: 'bg-forest/45',
    current: 'bg-forest',
    upcoming: 'bg-line'
  };
  const labelFor: Record<StepState, string> = {
    done: 'text-forest',
    current: 'font-bold text-ink',
    upcoming: 'text-muted'
  };
  const spokenFor: Record<StepState, string> = {
    done: copy.flow.states.done,
    current: copy.flow.states.current,
    upcoming: copy.flow.states.upcoming
  };

  return (
    <nav aria-label={copy.flow.ariaLabel} className={className}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[12px]">
        <span className="font-bold uppercase tracking-[0.12em] text-sage-deep">
          {complete
            ? copy.flow.complete
            : active
              ? copy.flow.stepOf(currentIndex + 1, total)
              : copy.flow.notStarted(total)}
        </span>
        {active && !complete && <span className="text-muted">{active.minutes}</span>}
      </p>
      <ol className="mt-2 grid grid-cols-4 gap-1.5">
        {assessmentSteps.map((step, index) => {
          const state = stateFor(index);
          return (
            <li key={step.key} className="min-w-0">
              <Link
                to={step.path}
                aria-current={state === 'current' ? 'step' : undefined}
                className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
              >
                <span aria-hidden="true" className={`block h-1.5 rounded-full ${barFor[state]} transition-colors group-hover:bg-forest/70`} />
                <span className={`mt-1.5 flex items-center gap-1 truncate text-[12px] leading-4 ${labelFor[state]}`}>
                  {state === 'done' && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{step.label}</span>
                </span>
                <span className="sr-only"> ({spokenFor[state]})</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * AssessmentShell — the quiet container for a stage screen.
 *
 * One narrow column, one h1, the progress rail above it, and no competing
 * navigation. Reference material is folded away so the task itself is the only
 * thing asking for attention.
 */
export const AssessmentShell: React.FC<{
  step?: AssessmentStepKey;
  complete?: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ step, complete, eyebrow, title, description, icon, actions, children }) => (
  <div className="w-full space-y-5 xl:max-w-2xl">
    <PortalPageHeader eyebrow={eyebrow} title={title} description={description} icon={icon} actions={actions} />
    <AssessmentProgress current={step} complete={complete} />
    <div className="rounded-2xl border border-line/70 bg-white p-5 sm:p-6">{children}</div>
  </div>
);

/** Reference block that stays out of the way until asked for. */
export const QuietDetails: React.FC<{
  summary: string;
  children: React.ReactNode;
  className?: string;
}> = ({ summary, children, className = '' }) => {
  const copy = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage));

  return (
  <details className={`group rounded-xl border border-line/70 bg-warm/40 px-3.5 py-3 ${className}`}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
      {summary}
      <span className="text-[13px] font-bold text-sage-deep group-open:hidden" aria-hidden="true">
        {copy.flow.show}
      </span>
      <span className="hidden text-[13px] font-bold text-sage-deep group-open:inline" aria-hidden="true">
        {copy.flow.hide}
      </span>
    </summary>
    <div className="pp-swap-enter mt-3 text-[13px] leading-5 text-muted">{children}</div>
  </details>
  );
};
