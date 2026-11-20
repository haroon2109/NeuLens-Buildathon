import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import type { RawTrial, SearchContent, TapStreamContent } from '../contentTypes';
import { playTones, ActivityFrame, CountdownPill, Feedback, primaryButton, secondaryButton, type PlayerProps } from './shared';

/**
 * Timed symbol stream used by Target Detection, Go/No-Go, Prospective Memory
 * and Sound Recognition. Timing is controlled; no transition animation plays
 * during cognitive activities.
 */
export const TapStreamPlayer: React.FC<PlayerProps<TapStreamContent> & { practiceFirst?: boolean }> = ({
  content,
  accommodations,
  onFinish,
  practiceFirst
}) => {
  const [index, setIndex] = useState(0);
  const [tapped, setTapped] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const current = content.symbols[index];
  const isPractice = Boolean(practiceFirst && index < 3);

  useEffect(() => {
    startedAt.current = Date.now();
    setTapped(false);
    setFeedback(null);
    if (current?.tone) playTones(current.tone);
  }, [index, current]);

  const commit = (didTap: boolean) => {
    if (!current) return;
    const correct = current.isTarget ? didTap : !didTap;
    trials.current.push({
      index,
      correct,
      responseMs: Date.now() - startedAt.current,
      missed: current.isTarget && !didTap,
      practice: isPractice,
      response: { symbol: current.symbol, tapped: didTap }
    });
    setTapped(didTap);
    setFeedback(correct);
  };

  const next = () => {
    if (index + 1 >= content.symbols.length) {
      onFinish({ trials: trials.current, notes: [], completed: true });
      return;
    }
    setIndex((value) => value + 1);
  };

  // Advance when the response window closes.
  useEffect(() => {
    if (feedback !== null || !current) return;
    const timer = window.setTimeout(() => commit(false), content.displayMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, feedback]);

  if (!current) return null;

  return (
    <ActivityFrame
      prompt={content.instruction}
      largeText={accommodations.largeText}
      timer={<CountdownPill seconds={Math.ceil(content.displayMs / 1000)} label="Each symbol" />}
      helper={
        <span className="inline-flex items-center gap-2 rounded-full bg-warm px-3 py-1 text-sm font-semibold text-ink">
          Symbol {index + 1} of {content.symbols.length}
          {isPractice && <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-forest">Practice</span>}
        </span>
      }
      footer={
        feedback !== null ? (
          <>
            <Feedback
              correct={feedback}
              detail={
                current.isTarget
                  ? feedback ? 'Good — you responded to the target.' : 'Missed target. That is recorded as a missing response.'
                  : feedback ? 'Good — you correctly did not tap.' : 'That symbol was not the target.'
              }
            />
            <button type="button" onClick={next} className={primaryButton}>
              {index + 1 >= content.symbols.length ? 'Finish' : 'Next symbol'}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Respond only while the symbol is shown.</p>
        )
      }
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-warm/60 px-4 py-8">
        <div className={`flex h-40 w-40 items-center justify-center rounded-3xl border-2 border-line bg-white ${accommodations.highContrast ? 'border-ink' : ''}`}>
          <span className="text-8xl leading-none" aria-label={current.symbol}>{current.symbol}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => commit(true)}
            disabled={feedback !== null}
            className="flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-3xl bg-forest text-lg font-bold text-white shadow-elevated transition hover:bg-forest/90 disabled:opacity-50"
          >
            <Check className="h-6 w-6" aria-hidden="true" />
            Tap
          </button>
          {content.mode === 'prospective' && (
            <button
              type="button"
              onClick={() => {
                if (current.isCue) {
                  trials.current.push({
                    index: trials.current.length,
                    correct: true,
                    responseMs: Date.now() - startedAt.current,
                    practice: isPractice,
                    response: 'reminder'
                  });
                  setFeedback(true);
                } else {
                  trials.current.push({
                    index: trials.current.length,
                    correct: false,
                    responseMs: Date.now() - startedAt.current,
                    practice: isPractice,
                    response: 'reminder-early'
                  });
                  setFeedback(false);
                }
              }}
              disabled={feedback !== null}
              className="flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-sage bg-white text-lg font-bold text-forest transition hover:bg-mint disabled:opacity-50"
            >
              <Bell className="h-6 w-6" aria-hidden="true" />
              Reminder
            </button>
          )}
          {current.tone && (
            <button
              type="button"
              onClick={() => playTones(current.tone!)}
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-forest hover:bg-mint"
            >
              Play sound again
            </button>
          )}
        </div>
      </div>
    </ActivityFrame>
  );
};

/** Timed visual search over a symbol grid. */
export const SearchPlayer: React.FC<PlayerProps<SearchContent>> = ({ content, accommodations, onFinish }) => {
  const [secondsLeft, setSecondsLeft] = useState(content.seconds);
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const foundRef = useRef<string[]>([]);
  const targets = useMemo(() => content.cells.filter((cell) => cell.isTarget), [content.cells]);

  const finish = () => {
    if (done) return;
    setDone(true);
    const missed = targets.filter((cell) => !foundRef.current.includes(cell.id));
    for (const cell of missed) {
      trials.current.push({
        index: trials.current.length,
        correct: false,
        responseMs: Date.now() - startedAt.current,
        missed: true,
        response: { cell: cell.id, result: 'not-found' }
      });
    }
    onFinish({
      trials: trials.current,
      notes: [`${wrong} incorrect tap${wrong === 1 ? '' : 's'} recorded.`],
      completed: true
    });
  };

  useEffect(() => {
    if (done) return;
    if (secondsLeft <= 0) {
      finish();
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, done]);

  const tap = (cell: SearchContent['cells'][number]) => {
    if (done) return;
    trials.current.push({
      index: trials.current.length,
      correct: cell.isTarget,
      responseMs: Date.now() - startedAt.current,
      response: { cell: cell.id, target: cell.isTarget }
    });
    if (cell.isTarget) {
      const nextFound = [...foundRef.current, cell.id];
      foundRef.current = nextFound;
      setFound(nextFound);
      if (nextFound.length >= targets.length) {
        window.setTimeout(finish, 300);
      }
    } else {
      setWrong((value) => value + 1);
    }
  };

  return (
    <ActivityFrame
      prompt={`Find every ${content.targetSymbol}.`}
      helper={`${found.length} of ${targets.length} found. ${wrong} incorrect tap${wrong === 1 ? '' : 's'}.`}
      largeText={accommodations.largeText}
      timer={<CountdownPill seconds={secondsLeft} label="Search time" />}
      footer={
        <button type="button" onClick={finish} className={secondaryButton}>
          Finish search
        </button>
      }
    >
      <div
        className="mx-auto grid max-w-xl gap-2"
        style={{ gridTemplateColumns: `repeat(${content.cols}, minmax(0, 1fr))`, gridAutoRows: '3.5rem' }}
      >
        {content.cells.map((cell) => {
          const selected = found.includes(cell.id);
          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => tap(cell)}
              disabled={selected || done}
              aria-label={`${cell.symbol}${selected ? ', found' : ''}`}
              className={`flex items-center justify-center rounded-xl border-2 text-3xl transition ${
                selected ? 'border-forest bg-mint opacity-60' : 'border-line bg-white hover:bg-warm'
              }`}
              style={{ color: cell.color }}
            >
              {cell.glyph}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-4">
          <Feedback correct={found.length === targets.length} detail="Search finished. Missing targets are recorded separately." />
        </div>
      )}
    </ActivityFrame>
  );
};
