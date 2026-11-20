import React, { useMemo, useState } from 'react';
import { Accessibility, ArrowRight, Clock3, Info, PauseCircle, SkipForward } from 'lucide-react';
import type { CognitiveTaskDefinition } from './types';
import { DOMAIN_LABEL } from './types';
import type { TaskContent } from './contentTypes';
import type { PlayerOutcome } from './players/shared';
import { generateTaskContent } from './generateContent';
import { ChoicePlayer } from './players/ChoicePlayer';
import { GridRecallPlayer, SequenceRecallPlayer, TrailPlayer } from './players/SequencePlayers';
import { SearchPlayer, TapStreamPlayer } from './players/StreamPlayers';
import { OrderPlayer, PairMatchPlayer, SchedulePlayer, SortPlayer } from './players/MatchingPlayers';
import { BudgetPlayer, ClockPlayer, FluencyPlayer, RoutePlayer, TowerPlayer } from './players/FunctionalPlayers';

export interface TaskCompletion extends PlayerOutcome {
  taskId: string;
  form: string;
  difficultyLevel: number;
  skipped: boolean;
  startedAt: string;
  completedAt: string;
}

const activityAccommodations = [
  'No distracting animation during the activity',
  'Large tap targets and plain instructions',
  'Pause and skip are available at any time'
];

export const TaskPlayer: React.FC<{
  task: CognitiveTaskDefinition;
  form: string;
  level: number;
  accommodations: { largeText: boolean; highContrast: boolean; extraPractice: boolean };
  onComplete: (result: TaskCompletion) => void;
  onSkip: () => void;
  onPause: () => void;
}> = ({ task, form, level, accommodations, onComplete, onSkip, onPause }) => {
  const [phase, setPhase] = useState<'intro' | 'activity'>('intro');
  const [startedAt, setStartedAt] = useState(new Date().toISOString());
  const content = useMemo(() => generateTaskContent(task, form, level), [task, form, level]);

  const finish = (outcome: PlayerOutcome) => {
    onComplete({
      ...outcome,
      taskId: task.id,
      form,
      difficultyLevel: level,
      skipped: false,
      startedAt,
      completedAt: new Date().toISOString()
    });
  };

  const common = {
    accommodations: {
      largeText: accommodations.largeText,
      highContrast: accommodations.highContrast,
      extraPractice: accommodations.extraPractice
    },
    onFinish: finish
  };

  if (phase === 'intro') {
    return (
      <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-forest">
            {DOMAIN_LABEL[task.domain]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-warm px-3 py-1 text-xs font-semibold text-body">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> about {task.durationMinutes} min
          </span>
          <span className="rounded-full border border-amber/60 bg-amber/10 px-3 py-1 text-xs font-semibold text-amber-900">
            Research-stage activity
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-ink">{task.name}</h2>
        <p className="mt-1 text-sm text-muted">{task.subdomain}</p>
        <p className="mt-4 text-base leading-7 text-body">{task.description}</p>

        <div className="mt-4 rounded-2xl border border-line bg-warm/70 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Info className="h-4 w-4 text-sage-deep" aria-hidden="true" /> What you will do
          </p>
          <p className="mt-1 text-base leading-7 text-body">{task.instructions}</p>
          <p className="mt-2 text-sm leading-6 text-muted"><span className="font-semibold text-ink">Example:</span> {task.example}</p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-sage-deep">
              <Accessibility className="h-3.5 w-3.5" aria-hidden="true" /> Accessibility
            </p>
            <ul className="mt-1.5 space-y-1 text-xs leading-5 text-muted">
              {[...task.accessibilityRequirements.slice(0, 2), ...activityAccommodations.slice(0, 2)].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-sage-deep">How this is scored</p>
            <p className="mt-1.5 text-xs leading-5 text-muted">{task.scoringMethod}</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-sage/40 bg-mint/40 p-3 text-xs leading-5 text-forest">
          <span className="font-bold">No camera, microphone or movement sensor is used in this activity.</span>{' '}
          It is completed only with on-screen buttons and the keyboard, so it can be administered when a camera
          or microphone is unavailable, declined, or unsuited to the person. Instructions can be read aloud by
          the device where that is available.
        </p>

        <p className="mt-2 rounded-xl border border-amber/50 bg-amber/5 p-3 text-xs leading-5 text-amber-900">
          {task.validationNote} This activity is labelled research-stage and is interpreted only by your clinician, alongside other information.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setStartedAt(new Date().toISOString());
              setPhase('activity');
            }}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-forest px-6 text-lg font-semibold text-white shadow-elevated transition hover:bg-forest/90"
          >
            Begin activity <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onPause}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-semibold text-ink transition hover:bg-warm"
          >
            <PauseCircle className="h-4 w-4" aria-hidden="true" /> Save and pause
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold text-muted transition hover:bg-warm hover:text-ink"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" /> Skip this activity
          </button>
        </div>
      </div>
    );
  }

  const rendered = (() => {
    switch (content.kind) {
      case 'choice':
        return <ChoicePlayer content={content} {...common} practiceFirst={task.practiceRecommended || accommodations.extraPractice} />;
      case 'sequence-recall':
        return <SequenceRecallPlayer content={content} {...common} />;
      case 'grid-recall':
        return <GridRecallPlayer content={content} {...common} />;
      case 'trail':
        return <TrailPlayer content={content} {...common} />;
      case 'tap-stream':
        return <TapStreamPlayer content={content} {...common} practiceFirst />;
      case 'visual-search':
        return <SearchPlayer content={content} {...common} />;
      case 'sort':
        return <SortPlayer content={content} {...common} />;
      case 'pair-match':
        return <PairMatchPlayer content={content} {...common} />;
      case 'order':
        return <OrderPlayer content={content} {...common} />;
      case 'schedule':
        return <SchedulePlayer content={content} {...common} />;
      case 'budget':
        return <BudgetPlayer content={content} {...common} />;
      case 'clock':
        return <ClockPlayer content={content} {...common} />;
      case 'fluency':
        return <FluencyPlayer content={content} {...common} />;
      case 'tower':
        return <TowerPlayer content={content} {...common} />;
      case 'route':
        return <RoutePlayer content={content} {...common} />;
      default:
        return <UnsupportedContent content={content} />;
    }
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{task.name}</p>
        <button
          type="button"
          onClick={onPause}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-body hover:bg-warm"
        >
          <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" /> Pause
        </button>
      </div>
      {rendered}
    </div>
  );
};

const UnsupportedContent: React.FC<{ content: TaskContent }> = ({ content }) => (
  <div className="rounded-2xl border border-amber/60 bg-amber/10 p-4 text-sm text-amber-900">
    This activity type ({content.kind}) is not available in this build. It has been marked incomplete rather than scored.
  </div>
);
