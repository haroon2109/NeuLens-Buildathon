import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import type { OrderContent, PairContent, RawTrial, ScheduleContent, SortContent } from '../contentTypes';
import { seededRandom, shuffle } from '../generatorsChoice';
import {
  ActivityFrame,
  CountdownPill,
  Feedback,
  primaryButton,
  secondaryButton,
  type PlayerProps
} from './shared';

const shapeGlyph: Record<string, string> = { circle: '●', square: '■', triangle: '▲' };
const colourHex: Record<string, string> = { red: '#c0392b', blue: '#2f5e9e', green: '#2f6b4f' };

export const SortPlayer: React.FC<PlayerProps<SortContent>> = ({ content, accommodations, onFinish }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const round = content.rounds[roundIndex];
  const card = round?.cards[cardIndex];

  useEffect(() => {
    startedAt.current = Date.now();
  }, [cardIndex, roundIndex]);

  if (!round || !card) return null;

  const sort = (binId: string) => {
    if (feedback !== null) return;
    const correct = round.correctBin[card.id] === binId;
    trials.current.push({
      index: trials.current.length,
      correct,
      responseMs: Date.now() - startedAt.current,
      response: { card: card.id, bin: binId, rule: round.rule }
    });
    setFeedback(correct);
  };

  const next = () => {
    setFeedback(null);
    if (cardIndex + 1 < round.cards.length) {
      setCardIndex((value) => value + 1);
      return;
    }
    if (roundIndex + 1 < content.rounds.length) {
      setRoundIndex((value) => value + 1);
      setCardIndex(0);
      return;
    }
    onFinish({ trials: trials.current, notes: [], completed: true });
  };

  return (
    <ActivityFrame
      prompt={round.ruleLabel}
      helper={`Card ${cardIndex + 1} of ${round.cards.length} · Round ${roundIndex + 1} of ${content.rounds.length}`}
      largeText={accommodations.largeText}
      footer={
        feedback !== null ? (
          <>
            <Feedback correct={feedback} />
            <button type="button" onClick={next} className={primaryButton}>
              Next card <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Choose the bin that matches the rule at the top.</p>
        )
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-3xl border-2 border-line bg-warm">
          <span className="text-6xl leading-none" style={{ color: colourHex[card.color] }} aria-hidden="true">
            {shapeGlyph[card.shape]}
          </span>
          <span className="mt-1 text-sm font-semibold text-ink">
            {card.count} {card.color} {card.shape}
          </span>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {round.bins.map((bin) => (
            <button
              key={bin.id}
              type="button"
              onClick={() => sort(bin.id)}
              disabled={feedback !== null}
              className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-line bg-white px-4 text-lg font-semibold capitalize text-ink transition hover:border-sage hover:bg-warm disabled:opacity-60"
            >
              {round.rule === 'colour' && (
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: colourHex[bin.id] }} aria-hidden="true" />
              )}
              {round.rule === 'shape' && <span aria-hidden="true">{shapeGlyph[bin.id]}</span>}
              {bin.label}
            </button>
          ))}
        </div>
      </div>
    </ActivityFrame>
  );
};

export const PairMatchPlayer: React.FC<PlayerProps<PairContent>> = ({ content, accommodations, onFinish }) => {
  const [phase, setPhase] = useState<'study' | 'test'>('study');
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const current = content.pairs[index];
  const options = useMemo(() => {
    if (!current) return [];
    const others = content.pairs.filter((pair) => pair.id !== current.id);
    const distractors = shuffle(others, seededRandom(`pair-options:${current.id}`)).slice(0, 2);
    return shuffle(
      [
        { id: current.id, emoji: current.partnerEmoji, label: current.partnerLabel },
        ...distractors.map((pair) => ({ id: pair.id, emoji: pair.partnerEmoji, label: pair.partnerLabel }))
      ],
      seededRandom(`pair-order:${current.id}`)
    );
  }, [content.pairs, current]);

  useEffect(() => {
    if (phase !== 'study') return;
    const timer = window.setTimeout(() => {
      setPhase('test');
      startedAt.current = Date.now();
    }, content.studyMs);
    return () => window.clearTimeout(timer);
  }, [phase, content.studyMs]);

  if (phase === 'study') {
    return (
      <div className="rounded-3xl border border-forest/25 bg-mint/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold text-ink">Remember which objects go together.</p>
          <CountdownPill seconds={Math.ceil(content.studyMs / 1000)} label="Look" />
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {content.pairs.map((pair) => (
            <li key={pair.id} className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <span className="text-4xl" aria-hidden="true">{pair.emoji}</span>
              <span className="text-muted" aria-hidden="true">↔</span>
              <span className="text-4xl" aria-hidden="true">{pair.partnerEmoji}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!current) return null;

  const choose = (id: string) => {
    if (feedback !== null) return;
    const correct = id === current.id;
    trials.current.push({
      index,
      correct,
      responseMs: Date.now() - startedAt.current,
      response: id
    });
    setFeedback(correct);
  };

  const next = () => {
    setFeedback(null);
    if (index + 1 >= content.pairs.length) {
      onFinish({ trials: trials.current, notes: [], completed: true });
      return;
    }
    setIndex((value) => value + 1);
    startedAt.current = Date.now();
  };

  return (
    <ActivityFrame
      prompt={`Which picture was paired with the ${current.label}?`}
      helper={<span className="text-6xl" aria-hidden="true">{current.emoji}</span>}
      largeText={accommodations.largeText}
      footer={
        feedback !== null ? (
          <>
            <Feedback correct={feedback} />
            <button type="button" onClick={next} className={primaryButton}>
              {index + 1 >= content.pairs.length ? 'Finish' : 'Next pair'}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">{index + 1} of {content.pairs.length} pairs</p>
        )
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            disabled={feedback !== null}
            className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-white px-3 py-3 transition hover:border-sage hover:bg-warm disabled:opacity-70"
          >
            <span className="text-5xl" aria-hidden="true">{option.emoji}</span>
            <span className="text-sm font-semibold text-ink">{option.label}</span>
          </button>
        ))}
      </div>
    </ActivityFrame>
  );
};

export const OrderPlayer: React.FC<PlayerProps<OrderContent>> = ({ content, accommodations, onFinish }) => {
  const [ordered, setOrdered] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const byId = useMemo(() => new Map(content.items.map((item) => [item.id, item])), [content.items]);
  const remaining = content.items.filter((item) => !ordered.includes(item.id));

  const select = (id: string) => {
    if (feedback !== null) return;
    setOrdered((current) => [...current, id]);
  };

  const check = () => {
    if (ordered.length !== content.correctOrder.length) return;
    ordered.forEach((id, index) => {
      trials.current.push({
        index,
        correct: id === content.correctOrder[index],
        responseMs: Date.now() - startedAt.current,
        response: id
      });
    });
    const allCorrect = ordered.every((id, index) => id === content.correctOrder[index]);
    setFeedback(allCorrect);
  };

  const finish = () => onFinish({ trials: trials.current, notes: [], completed: true });

  return (
    <ActivityFrame
      prompt={content.prompt}
      helper={content.helper}
      largeText={accommodations.largeText}
      footer={
        feedback !== null ? (
          <>
            <Feedback
              correct={feedback}
              detail={feedback ? 'Correct order.' : 'The recorded order differed. Your sequence is saved as entered.'}
            />
            <button type="button" onClick={finish} className={primaryButton}>
              Finish <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => { setOrdered([]); setFeedback(null); trials.current = []; }} className={secondaryButton}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={check} disabled={ordered.length !== content.correctOrder.length} className={primaryButton}>
              <Check className="h-4 w-4" aria-hidden="true" /> Check order
            </button>
            <button type="button" onClick={() => setOrdered([])} disabled={ordered.length === 0} className={secondaryButton}>
              Clear
            </button>
          </>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-sage-deep">Steps to arrange</p>
          <div className="mt-2 space-y-2">
            {remaining.length === 0 && <p className="rounded-xl border border-line bg-warm p-3 text-sm text-muted">All steps placed.</p>}
            {remaining.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                disabled={feedback !== null}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-3 text-left transition hover:border-sage hover:bg-warm disabled:opacity-60"
              >
                {item.emoji && <span className="text-2xl" aria-hidden="true">{item.emoji}</span>}
                <span className="text-base font-semibold text-ink">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-sage-deep">Your order</p>
          <ol className="mt-2 space-y-2">
            {ordered.length === 0 && (
              <li className="rounded-xl border border-dashed border-line bg-warm/60 p-4 text-sm text-muted">
                Tap the steps on the left in the order you want.
              </li>
            )}
            {ordered.map((id, index) => (
              <li key={id} className="flex items-center gap-3 rounded-2xl border border-forest/25 bg-mint/50 px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-base font-semibold text-ink">{byId.get(id)?.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ActivityFrame>
  );
};

export const SchedulePlayer: React.FC<PlayerProps<ScheduleContent>> = ({ content, accommodations, onFinish }) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const complete = Object.keys(assignments).length === content.events.length;

  const check = () => {
    content.events.forEach((event, index) => {
      trials.current.push({
        index,
        correct: assignments[event.id] === event.slotId,
        responseMs: Date.now() - startedAt.current,
        response: { event: event.id, slot: assignments[event.id] }
      });
    });
    setFeedback(content.events.every((event) => assignments[event.id] === event.slotId));
  };

  return (
    <ActivityFrame
      prompt={content.prompt}
      helper={`${Object.keys(assignments).length} of ${content.events.length} activities placed.`}
      largeText={accommodations.largeText}
      footer={
        feedback !== null ? (
          <>
            <Feedback correct={feedback} />
            <button type="button" onClick={() => onFinish({ trials: trials.current, notes: [], completed: true })} className={primaryButton}>
              Finish <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" onClick={check} disabled={!complete} className={primaryButton}>
            <Check className="h-4 w-4" aria-hidden="true" /> Check schedule
          </button>
        )
      }
    >
      <div className="space-y-3">
        {content.events.map((event) => (
          <div key={event.id} className="rounded-2xl border border-line bg-white p-3">
            <p className="flex items-center gap-2 text-base font-semibold text-ink">
              <span className="text-2xl" aria-hidden="true">{event.emoji}</span>
              {event.label}
              <span className="ml-auto text-sm font-normal text-muted">{event.time}</span>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {content.slots.map((slot) => {
                const active = assignments[event.id] === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={feedback !== null}
                    onClick={() => setAssignments((current) => ({ ...current, [event.id]: slot.id }))}
                    className={`min-h-11 rounded-xl border-2 px-2 text-sm font-semibold transition ${
                      active ? 'border-forest bg-mint text-forest' : 'border-line bg-warm/60 text-body hover:border-sage'
                    }`}
                  >
                    {slot.label}
                    <span className="block text-xs font-normal text-muted">{slot.time}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ActivityFrame>
  );
};
