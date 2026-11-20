import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { ChoiceContent, ChoiceTrial, RawTrial } from '../contentTypes';
import {
  ActivityFrame,
  AudioButton,
  CountdownPill,
  Feedback,
  StudyCard,
  primaryButton,
  secondaryButton,
  type PlayerProps
} from './shared';

const MiniGrid: React.FC<{ cells: string[] }> = ({ cells }) => {
  const size = Math.sqrt(cells.length);
  return (
    <div
      className="grid gap-1 rounded-xl border border-line bg-warm p-2"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: 'min(180px, 40vw)' }}
      aria-hidden="true"
    >
      {cells.map((cell, index) => (
        <span key={index} className="flex aspect-square items-center justify-center rounded-md bg-white text-lg text-forest">
          {cell}
        </span>
      ))}
    </div>
  );
};

const FigurePair: React.FC<{ pair: NonNullable<ChoiceTrial['figurePair']> }> = ({ pair }) => (
  <div className="flex flex-wrap items-center gap-6" aria-hidden="true">
    <span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-line bg-warm text-5xl font-bold text-forest">
      <span style={{ transform: `rotate(${pair.rotationA}deg) scaleX(${pair.mirrorA ? -1 : 1})`, display: 'inline-block' }}>
        {pair.glyph}
      </span>
    </span>
    <span className="text-2xl text-muted">vs</span>
    <span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-line bg-warm text-5xl font-bold text-forest">
      <span style={{ transform: `rotate(${pair.rotationB}deg) scaleX(${pair.mirrorB ? -1 : 1})`, display: 'inline-block' }}>
        {pair.glyph}
      </span>
    </span>
  </div>
);

export const ChoicePlayer: React.FC<PlayerProps<ChoiceContent> & { practiceFirst?: boolean }> = ({
  content,
  accommodations,
  onFinish,
  practiceFirst
}) => {
  const [inStudy, setInStudy] = useState(Boolean(content.study));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef<number>(Date.now());
  const trial = content.trials[index];
  const largeText = accommodations.largeText;
  // A practice trial must never consume the only scored trial of an activity.
  const isPractice = Boolean(practiceFirst && index === 0 && content.trials.length > 1);

  const options = useMemo(() => trial?.options || [], [trial]);

  useEffect(() => {
    startedAt.current = Date.now();
    setRemaining(trial?.timeLimitMs ? Math.ceil(trial.timeLimitMs / 1000) : null);
  }, [index, trial]);

  const commit = (choices: string[], timedOut = false) => {
    if (!trial || feedback !== null) return;
    const expected = trial.multi ? trial.correctIds || [trial.correctId] : [trial.correctId];
    const correct = trial.multi
      ? expected.every((id) => choices.includes(id)) && choices.every((id) => expected.includes(id))
      : choices[0] === trial.correctId;
    const responseMs = Date.now() - startedAt.current;
    trials.current.push({
      index,
      correct,
      responseMs: timedOut ? trial.timeLimitMs || responseMs : responseMs,
      missed: timedOut,
      practice: isPractice,
      response: choices
    });
    setSelected(choices);
    setFeedback(correct);
  };

  // Optional per-trial time limit. Expiry records a missing response, not a
  // punitive "wrong" judgement.
  useEffect(() => {
    if (feedback !== null || remaining == null) return;
    if (remaining <= 0) {
      commit([], true);
      return;
    }
    const timer = window.setTimeout(() => setRemaining((value) => (value == null ? null : value - 1)), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, feedback]);

  if (inStudy && content.study) {
    return (
      <StudyCard
        title={content.study.title}
        body={content.study.body}
        items={content.study.items}
        seconds={content.study.displaySeconds || 8}
        largeText={largeText}
        onContinue={() => setInStudy(false)}
      />
    );
  }

  if (!trial) {
    return <p className="text-muted">No activity content was generated.</p>;
  }

  const toggle = (id: string) => {
    if (!trial.multi) {
      commit([id]);
      return;
    }
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const next = () => {
    if (index + 1 >= content.trials.length) {
      onFinish({ trials: trials.current, notes: [], completed: true });
      return;
    }
    setIndex((value) => value + 1);
    setSelected([]);
    setFeedback(null);
  };

  return (
    <ActivityFrame
      prompt={trial.prompt}
      largeText={largeText}
      timer={remaining != null && feedback === null ? <CountdownPill seconds={remaining} /> : undefined}
      helper={
        <div className="space-y-3">
          {trial.helper && !trial.inkWord && (
            <p className={`${largeText ? 'text-7xl' : 'text-6xl'} leading-none`} aria-hidden="true">
              {trial.helper}
            </p>
          )}
          {trial.inkWord && (
            <p
              className={`${largeText ? 'text-6xl' : 'text-5xl'} font-bold leading-none tracking-wide`}
              style={{ color: trial.inkWord.color }}
            >
              {trial.inkWord.text}
            </p>
          )}
          {trial.patternPair && (
            <div className="flex flex-wrap items-center gap-4">
              <MiniGrid cells={trial.patternPair.left} />
              <span className="text-xl text-muted">vs</span>
              <MiniGrid cells={trial.patternPair.right} />
            </div>
          )}
          {trial.figurePair && <FigurePair pair={trial.figurePair} />}
          {trial.audioPattern && <AudioButton pattern={trial.audioPattern} />}
          {isPractice && (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase tracking-wide text-forest">
              Practice — this one is not scored
            </span>
          )}
        </div>
      }
      footer={
        <>
          {trial.multi && feedback === null && (
            <button type="button" onClick={() => commit(selected)} disabled={selected.length === 0} className={primaryButton}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Confirm choices
            </button>
          )}
          {feedback !== null && (
            <>
              <Feedback
                correct={feedback}
                detail={
                  feedback
                    ? 'Correct.'
                    : `Not quite. The correct answer was “${
                        trial.multi
                          ? (trial.correctIds || []).join(', ')
                          : options.find((option) => option.id === trial.correctId)?.label || trial.correctId
                      }”.`
                }
              />
              <button type="button" onClick={next} className={primaryButton}>
                {index + 1 >= content.trials.length ? 'Finish activity' : 'Next'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
          {feedback === null && !trial.multi && (
            <p className="text-sm text-muted">Choose one answer.</p>
          )}
        </>
      }
    >
      {content.referenceKey && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-line bg-warm p-3" aria-label="Reference key">
          {content.referenceKey.map((entry) => (
            <span key={entry.symbol} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-lg font-semibold text-ink shadow-xs">
              <span aria-hidden="true">{entry.symbol}</span>
              <span className="text-muted">=</span>
              {entry.value}
            </span>
          ))}
        </div>
      )}
      <div className={`grid gap-3 ${options.length > 4 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {options.map((option) => {
          const active = selected.includes(option.id);
          const showCorrect = feedback !== null && option.id === trial.correctId;
          const showWrong = feedback !== null && active && option.id !== trial.correctId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              disabled={feedback !== null}
              aria-pressed={active}
              className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                showCorrect
                  ? 'border-forest bg-mint'
                  : showWrong
                    ? 'border-amber-500 bg-amber/10'
                    : active
                      ? 'border-forest bg-mint/60'
                      : 'border-line bg-white hover:border-sage hover:bg-warm'
              }`}
            >
              {option.emoji && <span className="text-4xl" aria-hidden="true">{option.emoji}</span>}
              {option.glyph && !option.emoji && (
                <span className="text-4xl text-forest" aria-hidden="true">{option.glyph}</span>
              )}
              {option.color && (
                <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ backgroundColor: option.color }} aria-hidden="true" />
              )}
              <span className={`font-semibold text-ink ${largeText ? 'text-xl' : 'text-base'}`}>{option.label}</span>
            </button>
          );
        })}
      </div>
      {feedback !== null && index + 1 >= content.trials.length && (
        <p className="mt-4 text-sm text-muted">That was the last item in this activity.</p>
      )}
    </ActivityFrame>
  );
};

export { secondaryButton };
