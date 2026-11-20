import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Minus, Plus, RotateCcw, Send } from 'lucide-react';
import type { BudgetContent, ClockContent, FluencyContent, RawTrial, RouteContent, TowerContent } from '../contentTypes';
import {
  ActivityFrame,
  CountdownPill,
  Feedback,
  primaryButton,
  secondaryButton,
  type PlayerProps
} from './shared';

export const BudgetPlayer: React.FC<PlayerProps<BudgetContent>> = ({ content, accommodations, onFinish }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<'shop' | 'remainder' | 'done'>('shop');
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const total = content.items
    .filter((item) => selected.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const toggle = (id: string) => {
    if (phase !== 'shop') return;
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const checkBudget = () => {
    const within = total <= content.budget;
    trials.current.push({
      index: 0,
      correct: within,
      responseMs: Date.now() - startedAt.current,
      response: { selected, total }
    });
    setFeedback(within);
    setPhase('remainder');
  };

  const chooseRemainder = (id: string) => {
    const correct = id === content.correctRemainderId;
    trials.current.push({
      index: 1,
      correct,
      responseMs: Date.now() - startedAt.current,
      response: id
    });
    setFeedback(correct);
    setPhase('done');
  };

  return (
    <ActivityFrame
      prompt={content.prompt}
      largeText={accommodations.largeText}
      helper={
        <span className="inline-flex flex-wrap items-center gap-3 text-base">
          <span className="font-semibold text-ink">Budget: {content.currency}{content.budget}</span>
          <span className={total > content.budget ? 'font-semibold text-amber-700' : 'text-muted'}>
            Chosen: {content.currency}{total}
          </span>
        </span>
      }
      footer={
        phase === 'shop' ? (
          <button type="button" onClick={checkBudget} disabled={selected.length === 0} className={primaryButton}>
            Check my basket <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : phase === 'remainder' ? (
          <p className="text-sm text-muted">
            {feedback ? 'Your basket is within budget.' : 'Your basket is over budget — that is recorded, not penalised.'} Now answer the question below.
          </p>
        ) : (
          <>
            <Feedback correct={feedback} />
            <button type="button" onClick={() => onFinish({ trials: trials.current, notes: [], completed: true })} className={primaryButton}>
              Finish activity
            </button>
          </>
        )
      }
    >
      {phase === 'shop' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {content.items.map((item) => {
            const active = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={active}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                  active ? 'border-forest bg-mint/70' : 'border-line bg-white hover:border-sage hover:bg-warm'
                }`}
              >
                <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                <span className="font-semibold text-ink">{item.label}</span>
                <span className="ml-auto font-semibold text-body">{content.currency}{item.price}</span>
              </button>
            );
          })}
        </div>
      )}

      {phase !== 'shop' && (
        <div className="rounded-2xl border border-line bg-warm/70 p-4">
          <p className="font-semibold text-ink">Basket total: {content.currency}{total} of {content.currency}{content.budget}</p>
          <p className="mt-3 text-lg font-semibold text-ink">{content.remainderPrompt}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {content.remainderOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseRemainder(option.id)}
                disabled={phase !== 'remainder'}
                className="min-h-14 rounded-xl border-2 border-line bg-white text-lg font-semibold text-ink transition hover:border-sage hover:bg-mint disabled:opacity-60"
              >
                {content.currency}{option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </ActivityFrame>
  );
};

export const ClockPlayer: React.FC<PlayerProps<ClockContent>> = ({ content, accommodations, onFinish }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());

  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;

  const submit = () => {
    const hourCorrect = hour % 12 === content.targetHour % 12;
    const minuteCorrect = minute === content.targetMinute;
    trials.current = [
      {
        index: 0,
        correct: hourCorrect,
        responseMs: Date.now() - startedAt.current,
        response: { hand: 'hour', hour }
      },
      {
        index: 1,
        correct: minuteCorrect,
        responseMs: Date.now() - startedAt.current,
        response: { hand: 'minute', minute }
      }
    ];
    setFeedback(hourCorrect && minuteCorrect);
  };

  return (
    <ActivityFrame
      prompt={`Set the clock to ${content.targetHour}:${String(content.targetMinute).padStart(2, '0')}.`}
      helper="Use the controls below. The digital time updates as you set it."
      largeText={accommodations.largeText}
      footer={
        feedback !== null ? (
          <>
            <Feedback correct={feedback} detail={feedback ? 'Clock set correctly.' : 'The recorded hand positions differed from the target time.'} />
            <button type="button" onClick={() => onFinish({ trials: trials.current, notes: [], completed: true })} className={primaryButton}>
              Finish <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" onClick={submit} className={primaryButton}>
            <Check className="h-4 w-4" aria-hidden="true" /> Set clock
          </button>
        )
      }
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <div className="relative h-56 w-56 rounded-full border-4 border-forest bg-white shadow-card" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => {
            const angle = ((index + 1) * 30 - 90) * (Math.PI / 180);
            return (
              <span
                key={index}
                className="absolute text-sm font-bold text-ink"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * 84}px)`,
                  top: `calc(50% + ${Math.sin(angle) * 84}px)`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {index + 1}
              </span>
            );
          })}
          <span className="absolute left-1/2 top-1/2 h-20 w-1.5 origin-bottom rounded-full bg-forest" style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }} />
          <span className="absolute left-1/2 top-1/2 h-28 w-1 origin-bottom rounded-full bg-ink" style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }} />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest" />
        </div>
        <div className="w-full max-w-sm space-y-4">
          <p className="text-center text-3xl font-bold text-ink">
            {hour}:{String(minute).padStart(2, '0')}
          </p>
          <label className="block">
            <span className="flex items-center justify-between text-sm font-semibold text-ink">
              Hour hand
              <span className="inline-flex gap-1">
                <button type="button" onClick={() => setHour((value) => (value === 1 ? 12 : value - 1))} className="h-9 w-9 rounded-lg border border-line bg-white" aria-label="Decrease hour"><Minus className="mx-auto h-4 w-4" /></button>
                <button type="button" onClick={() => setHour((value) => (value === 12 ? 1 : value + 1))} className="h-9 w-9 rounded-lg border border-line bg-white" aria-label="Increase hour"><Plus className="mx-auto h-4 w-4" /></button>
              </span>
            </span>
            <input
              type="range"
              min={1}
              max={12}
              value={hour}
              onChange={(event) => setHour(Number(event.target.value))}
              className="mt-2 w-full accent-[#2f5e4e]"
            />
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-sm font-semibold text-ink">
              Minute hand
              <span className="inline-flex gap-1">
                <button type="button" onClick={() => setMinute((value) => (value === 0 ? 55 : value - 5))} className="h-9 w-9 rounded-lg border border-line bg-white" aria-label="Decrease minutes"><Minus className="mx-auto h-4 w-4" /></button>
                <button type="button" onClick={() => setMinute((value) => (value === 55 ? 0 : value + 5))} className="h-9 w-9 rounded-lg border border-line bg-white" aria-label="Increase minutes"><Plus className="mx-auto h-4 w-4" /></button>
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={55}
              step={5}
              value={minute}
              onChange={(event) => setMinute(Number(event.target.value))}
              className="mt-2 w-full accent-[#2f5e4e]"
            />
          </label>
        </div>
      </div>
    </ActivityFrame>
  );
};

export const FluencyPlayer: React.FC<PlayerProps<FluencyContent>> = ({ content, accommodations, onFinish }) => {
  const [secondsLeft, setSecondsLeft] = useState(content.seconds);
  const [value, setValue] = useState('');
  const [entries, setEntries] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  const finish = (recorded: string[]) => {
    if (done) return;
    setDone(true);
    const seen = new Set<string>();
    const trials: RawTrial[] = recorded.map((entry, index) => {
      const key = entry.trim().toLowerCase();
      const unique = key.length > 0 && !seen.has(key);
      if (unique) seen.add(key);
      return {
        index,
        correct: unique,
        responseMs: Date.now() - startedAt.current,
        response: entry,
        practice: false
      };
    });
    if (trials.length === 0) {
      trials.push({ index: 0, correct: false, responseMs: content.seconds * 1000, missed: true });
    }
    onFinish({
      trials,
      notes: [
        `Category: ${content.category}.`,
        `Responses: ${recorded.join(', ') || 'none'}.`,
        'Automatic scoring counts unique entries only; semantic accuracy requires clinician review.'
      ],
      completed: true
    });
  };

  useEffect(() => {
    if (done) return;
    if (secondsLeft <= 0) {
      finish(entries);
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, done]);

  const add = () => {
    const entry = value.trim();
    if (!entry) return;
    setEntries((current) => [...current, entry]);
    setValue('');
  };

  return (
    <ActivityFrame
      prompt={content.prompt}
      helper={`Type one item at a time and press Add. ${entries.length} item${entries.length === 1 ? '' : 's'} so far.`}
      largeText={accommodations.largeText}
      timer={<CountdownPill seconds={secondsLeft} label="Time left" />}
      footer={
        done ? (
          <button type="button" onClick={() => finish(entries)} className={primaryButton}>Continue</button>
        ) : (
          <button type="button" onClick={() => finish(entries)} className={secondaryButton}>
            I have finished
          </button>
        )
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          disabled={done}
          placeholder={`Name a ${content.category.replace(/s$/, '')}…`}
          aria-label={`Name ${content.category}`}
          className="min-h-14 flex-1 rounded-2xl border-2 border-line bg-white px-4 text-lg text-ink outline-none focus:border-forest"
        />
        <button type="button" onClick={add} disabled={done || !value.trim()} className={primaryButton}>
          <Send className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {entries.map((entry, index) => (
          <li key={`${entry}-${index}`} className="rounded-full border border-line bg-warm px-3 py-1.5 text-sm font-semibold text-ink">
            {entry}
          </li>
        ))}
      </ul>
      {entries.length === 0 && <p className="mt-3 text-sm text-muted">No items entered yet.</p>}
    </ActivityFrame>
  );
};

export const TowerPlayer: React.FC<PlayerProps<TowerContent>> = ({ content, accommodations, onFinish }) => {
  const initial = useMemo(() => {
    const pegs: number[][] = Array.from({ length: content.pegs }, () => []);
    pegs[0] = Array.from({ length: content.disks }, (_, index) => content.disks - index);
    return pegs;
  }, [content.disks, content.pegs]);
  const [pegs, setPegs] = useState<number[][]>(initial);
  const [source, setSource] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [violations, setViolations] = useState(0);
  const [history, setHistory] = useState<number[][][]>([]);
  const [solved, setSolved] = useState(false);
  const finished = useRef(false);
  const startedAt = useRef(Date.now());

  const finish = (won: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onFinish({
      trials: [
        {
          index: 0,
          correct: won,
          responseMs: Date.now() - startedAt.current,
          response: { moves, violations }
        }
      ],
      notes: [
        `Moves used: ${moves}. Rule violations: ${violations}.`,
        won ? 'Target arrangement reached.' : 'Target arrangement not reached within this attempt.'
      ],
      completed: true
    });
  };

  const clickPeg = (pegIndex: number) => {
    if (solved) return;
    if (source === null) {
      if (pegs[pegIndex].length === 0) {
        setMessage('That peg is empty. Choose a peg with a disc.');
        return;
      }
      setSource(pegIndex);
      setMessage(null);
      return;
    }
    if (source === pegIndex) {
      setSource(null);
      setMessage(null);
      return;
    }
    const from = [...pegs[source]];
    const to = [...pegs[pegIndex]];
    const disc = from[from.length - 1];
    const top = to[to.length - 1];
    if (top != null && top < disc) {
      setViolations((value) => value + 1);
      setMessage('A larger disc cannot sit on a smaller one.');
      setSource(null);
      return;
    }
    from.pop();
    to.push(disc);
    const next = pegs.map((peg, index) => (index === source ? from : index === pegIndex ? to : peg));
    setHistory((current) => [...current, pegs]);
    setPegs(next);
    setSource(null);
    setMoves((value) => value + 1);
    setMessage(null);
    const won = next[content.pegs - 1]?.length === content.disks;
    if (won) {
      setSolved(true);
      window.setTimeout(() => finish(true), 600);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    setPegs(history[history.length - 1]);
    setHistory((current) => current.slice(0, -1));
    setMoves((value) => Math.max(0, value - 1));
    setSolved(false);
    setMessage(null);
  };

  return (
    <ActivityFrame
      prompt={`Move all ${content.disks} discs to the right-hand peg.`}
      helper={`Moves: ${moves} · Rule violations: ${violations} · Suggested limit: ${content.maxMoves} moves`}
      largeText={accommodations.largeText}
      footer={
        <>
          <button type="button" onClick={undo} disabled={history.length === 0} className={secondaryButton}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Undo move
          </button>
          <button type="button" onClick={() => finish(solved)} className={secondaryButton}>
            Finish attempt
          </button>
        </>
      }
    >
      {message && (
        <p role="status" className="mb-3 rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm font-medium text-amber-900">
          {message}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-warm/60 p-3">
        {pegs.map((peg, index) => (
          <button
            key={index}
            type="button"
            onClick={() => clickPeg(index)}
            aria-label={`Peg ${index + 1}${source === index ? ', selected' : ''}`}
            className={`flex min-h-56 flex-col justify-end gap-1 rounded-xl border-2 p-2 transition ${
              source === index ? 'border-forest bg-mint/60' : 'border-line bg-white hover:border-sage'
            }`}
          >
            <span className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Peg {index + 1}</span>
            {[...peg].reverse().map((disc) => (
              <span
                key={disc}
                className="mx-auto h-6 rounded-full bg-forest text-center text-[13px] font-bold leading-6 text-white"
                style={{ width: `${35 + disc * 14}%` }}
              >
                {disc}
              </span>
            ))}
          </button>
        ))}
      </div>
      {solved && <p className="mt-3 rounded-xl border border-forest/40 bg-mint p-3 text-sm font-semibold text-forest">Target arrangement reached.</p>}
    </ActivityFrame>
  );
};

export const RoutePlayer: React.FC<PlayerProps<RouteContent>> = ({ content, accommodations, onFinish }) => {
  const [position, setPosition] = useState(content.start);
  const [path, setPath] = useState<number[]>([content.start]);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const trials = useRef<RawTrial[]>([]);
  const startedAt = useRef(Date.now());
  const blocked = useMemo(() => new Set(content.blocked), [content.blocked]);

  const finish = (reached: boolean) => {
    if (done) return;
    setDone(true);
    trials.current.push({
      index: trials.current.length,
      correct: reached,
      responseMs: Date.now() - startedAt.current,
      response: { path, moves: path.length - 1 }
    });
    onFinish({
      trials: trials.current,
      notes: [`Moves: ${path.length - 1}. Destination ${reached ? 'reached' : 'not reached'}.`],
      completed: true
    });
  };

  const move = (target: number) => {
    if (done) return;
    const row = Math.floor(position / content.cols);
    const col = position % content.cols;
    const targetRow = Math.floor(target / content.cols);
    const targetCol = target % content.cols;
    const adjacent = Math.abs(row - targetRow) + Math.abs(col - targetCol) === 1;
    const valid = adjacent && !blocked.has(target);
    trials.current.push({
      index: trials.current.length,
      correct: valid,
      responseMs: Date.now() - startedAt.current,
      response: { from: position, to: target, valid }
    });
    if (!valid) {
      setMessage('You cannot move there. Choose a neighbouring open square.');
      return;
    }
    setPosition(target);
    setPath((current) => [...current, target]);
    setMessage(null);
    if (target === content.end) {
      window.setTimeout(() => finish(true), 400);
    } else if (path.length >= content.maxMoves) {
      finish(false);
    }
  };

  return (
    <ActivityFrame
      prompt="Move from START to HOME."
      helper={`Moves: ${path.length - 1} · You may only move to a neighbouring open square.`}
      largeText={accommodations.largeText}
      footer={
        <>
          <button type="button" onClick={() => finish(false)} className={secondaryButton}>Stop here</button>
          <p className="text-sm text-muted">Obstacles are shown as dark squares.</p>
        </>
      }
    >
      {message && <p role="status" className="mb-3 rounded-xl border border-amber/60 bg-amber/10 p-2 text-sm text-amber-900">{message}</p>}
      <div
        className="mx-auto grid max-w-md gap-1.5"
        style={{ gridTemplateColumns: `repeat(${content.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: content.cols * content.rows }, (_, cell) => {
          const isStart = cell === content.start;
          const isEnd = cell === content.end;
          const isBlocked = blocked.has(cell);
          const isHere = cell === position;
          const row = Math.floor(cell / content.cols);
          const col = cell % content.cols;
          const hereRow = Math.floor(position / content.cols);
          const hereCol = position % content.cols;
          const adjacent = Math.abs(row - hereRow) + Math.abs(col - hereCol) === 1;
          return (
            <button
              key={cell}
              type="button"
              onClick={() => move(cell)}
              disabled={isBlocked || done}
              aria-label={
                isBlocked ? 'Blocked square' : isStart ? 'Start' : isEnd ? 'Home' : isHere ? 'Your position' : `Square ${cell + 1}`
              }
              className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-bold transition ${
                isBlocked
                  ? 'cursor-not-allowed border-ink/30 bg-ink/20'
                  : isHere
                    ? 'border-forest bg-forest text-white'
                    : isEnd
                      ? 'border-forest bg-mint text-forest'
                      : adjacent
                        ? 'border-sage bg-white hover:bg-mint'
                        : 'border-line bg-white/60 text-muted'
              }`}
            >
              {isStart && !isHere ? 'S' : isEnd ? '🏠' : isHere ? '●' : ''}
            </button>
          );
        })}
      </div>
    </ActivityFrame>
  );
};
