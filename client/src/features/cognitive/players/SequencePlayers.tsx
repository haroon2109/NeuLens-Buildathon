import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { GridContent, RawTrial, SequenceContent, TrailContent } from '../contentTypes';
import { seededRandom, shuffle } from '../generatorsChoice';
import {
  ActivityFrame,
  CountdownPill,
  Feedback,
  primaryButton,
  secondaryButton,
  type PlayerProps
} from './shared';

export const SequenceRecallPlayer: React.FC<PlayerProps<SequenceContent>> = ({
  content,
  accommodations,
  onFinish
}) => {
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [showIndex, setShowIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const recallStart = useRef<number>(Date.now());
  const tray = useMemo(
    () => shuffle(content.items, seededRandom(`tray:${content.items.map((item) => item.id).join('-')}`)),
    [content.items]
  );

  useEffect(() => {
    if (phase !== 'show') return;
    if (showIndex >= content.items.length) {
      setPhase('recall');
      recallStart.current = Date.now();
      return;
    }
    const timer = window.setTimeout(() => setShowIndex((value) => value + 1), content.displayMs);
    return () => window.clearTimeout(timer);
  }, [phase, showIndex, content.items.length, content.displayMs]);

  if (phase === 'show') {
    const item = content.items[showIndex];
    return (
      <div className="rounded-3xl border border-forest/25 bg-mint/40 p-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-sage-deep">
          Watch the order · {showIndex + 1} of {content.items.length}
        </p>
        {item ? (
          <div className="mt-5">
            <span className="text-8xl" aria-hidden="true">{item.emoji}</span>
            <p className="mt-3 text-2xl font-semibold text-ink">{item.label}</p>
          </div>
        ) : (
          <p className="mt-6 text-lg text-ink">Get ready to put them in order…</p>
        )}
        <div className="mx-auto mt-6 flex justify-center gap-1.5" aria-hidden="true">
          {content.items.map((entry, index) => (
            <span
              key={entry.id}
              className={`h-2 w-8 rounded-full ${index < showIndex ? 'bg-forest' : 'bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const tap = (id: string) => {
    if (feedback !== null || selected.includes(id)) return;
    const position = selected.length;
    const correct = content.items[position]?.id === id;
    trials.current.push({
      index: position,
      correct,
      responseMs: Date.now() - recallStart.current,
      response: id
    });
    setSelected((current) => [...current, id]);
    setFeedback(correct);
  };

  const next = () => {
    setFeedback(null);
    if (selected.length >= content.items.length) {
      onFinish({ trials: trials.current, notes: [], completed: true });
    }
  };

  return (
    <ActivityFrame
      prompt={content.prompt}
      helper={`Tap them in the same order. ${selected.length} of ${content.items.length} placed.`}
      largeText={accommodations.largeText}
      footer={
        feedback !== null ? (
          <>
            <Feedback correct={feedback} />
            <button type="button" onClick={next} className={primaryButton}>
              Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Tap a picture, then the next one.</p>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tray.map((item) => {
          const used = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => tap(item.id)}
              disabled={used || feedback !== null}
              className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 transition ${
                used ? 'border-forest/30 bg-mint/60 opacity-60' : 'border-line bg-white hover:border-sage hover:bg-warm'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">{item.emoji}</span>
              <span className="text-sm font-semibold text-ink">{item.label}</span>
            </button>
          );
        })}
      </div>
    </ActivityFrame>
  );
};

export const GridRecallPlayer: React.FC<PlayerProps<GridContent>> = ({ content, accommodations, onFinish }) => {
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [objectIndex, setObjectIndex] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (phase !== 'show') return;
    const timer = window.setTimeout(() => {
      setPhase('recall');
      startedAt.current = Date.now();
    }, content.displayMs);
    return () => window.clearTimeout(timer);
  }, [phase, content.displayMs]);

  const current = content.items[objectIndex];

  if (phase === 'show') {
    return (
      <div className="rounded-3xl border border-forest/25 bg-mint/40 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold text-ink">Remember where each object is.</p>
          <CountdownPill seconds={Math.ceil(content.displayMs / 1000)} label="Look" />
        </div>
        <div
          className="mx-auto mt-4 grid max-w-md gap-2"
          style={{ gridTemplateColumns: `repeat(${content.cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: content.cols * content.rows }, (_, cell) => {
            const item = content.items.find((entry) => entry.cell === cell);
            return (
              <div key={cell} className="flex aspect-square items-center justify-center rounded-xl border border-line bg-white text-4xl">
                {item ? <span aria-label={item.label}>{item.emoji}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!current) return null;

  const place = (cell: number) => {
    if (feedback !== null) return;
    const correct = cell === current.cell;
    trials.current.push({
      index: objectIndex,
      correct,
      responseMs: Date.now() - startedAt.current,
      response: { object: current.id, cell }
    });
    setFeedback(correct);
  };

  const next = () => {
    setFeedback(null);
    if (objectIndex + 1 >= content.items.length) {
      onFinish({ trials: trials.current, notes: [], completed: true });
      return;
    }
    setObjectIndex((value) => value + 1);
    startedAt.current = Date.now();
  };

  return (
    <ActivityFrame
      prompt={`Where was the ${current.label}?`}
      largeText={accommodations.largeText}
      helper={<span className="text-5xl" aria-hidden="true">{current.emoji}</span>}
      footer={
        feedback !== null ? (
          <>
            <Feedback correct={feedback} detail={feedback ? 'Correct place.' : 'That was a different cell. Placement is recorded, not penalised.'} />
            <button type="button" onClick={next} className={primaryButton}>
              {objectIndex + 1 >= content.items.length ? 'Finish' : 'Next object'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Tap the cell where it was shown.</p>
        )
      }
    >
      <div
        className="mx-auto grid max-w-md gap-2"
        style={{ gridTemplateColumns: `repeat(${content.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: content.cols * content.rows }, (_, cell) => (
          <button
            key={cell}
            type="button"
            onClick={() => place(cell)}
            disabled={feedback !== null}
            className="flex aspect-square items-center justify-center rounded-xl border-2 border-line bg-white text-sm font-semibold text-muted transition hover:border-sage hover:bg-warm disabled:opacity-70"
            aria-label={`Cell ${cell + 1}`}
          >
            {cell + 1}
          </button>
        ))}
      </div>
    </ActivityFrame>
  );
};

export const TrailPlayer: React.FC<PlayerProps<TrailContent>> = ({ content, accommodations, onFinish }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [wrongTaps, setWrongTaps] = useState(0);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const expectedId = content.correctOrder[selected.length];
  const expectedLabel = content.nodes.find((node) => node.id === expectedId)?.label;

  const tap = (id: string) => {
    const correct = id === expectedId;
    trials.current.push({
      index: trials.current.length,
      correct,
      responseMs: Date.now() - startedAt.current,
      response: id
    });
    if (!correct) {
      setWrongTaps((value) => value + 1);
      return;
    }
    const nextSelection = [...selected, id];
    setSelected(nextSelection);
    if (nextSelection.length >= content.correctOrder.length) {
      onFinish({
        trials: trials.current,
        notes: [`${wrongTaps} incorrect selection${wrongTaps === 1 ? '' : 's'}.`],
        completed: true
      });
    }
  };

  return (
    <ActivityFrame
      prompt={content.prompt}
      helper={`Next: ${expectedLabel || '—'} · ${selected.length} of ${content.correctOrder.length} connected`}
      largeText={accommodations.largeText}
      footer={<p className="text-sm text-muted">Incorrect taps are recorded and you can keep going.</p>}
    >
      <div className="relative min-h-80 w-full overflow-hidden rounded-2xl border border-line bg-warm/60">
        {content.nodes.map((node) => {
          const done = selected.includes(node.id);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => tap(node.id)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-lg font-bold transition ${
                done
                  ? 'border-forest bg-forest text-white'
                  : 'border-sage bg-white text-ink hover:bg-mint'
              }`}
              aria-label={`Node ${node.label}${done ? ', completed' : ''}`}
            >
              {node.label}
            </button>
          );
        })}
      </div>
    </ActivityFrame>
  );
};

export { secondaryButton, Check };
