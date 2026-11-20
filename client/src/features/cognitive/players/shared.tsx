import React, { useEffect, useRef, useState } from 'react';
import { Check, Clock3, Play, RotateCcw, Volume2, X } from 'lucide-react';
import type { RawTrial } from '../contentTypes';

export interface PlayerOutcome {
  trials: RawTrial[];
  notes: string[];
  completed: boolean;
}

export interface PlayerProps<C> {
  content: C;
  accommodations: {
    largeText: boolean;
    highContrast: boolean;
    extraPractice: boolean;
  };
  onFinish: (outcome: PlayerOutcome) => void;
}

export const bigButton =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-forest/30 disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButton = `${bigButton} bg-forest text-white shadow-elevated hover:bg-forest/90`;
export const secondaryButton = `${bigButton} border border-line bg-white text-ink hover:bg-warm`;

export const ActivityFrame: React.FC<{
  prompt: string;
  helper?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  largeText: boolean;
  timer?: React.ReactNode;
}> = ({ prompt, helper, children, footer, largeText, timer }) => (
  <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className={`max-w-2xl font-semibold leading-snug text-ink ${largeText ? 'text-2xl' : 'text-xl'}`}>
        {prompt}
      </p>
      {timer && <div className="shrink-0">{timer}</div>}
    </div>
    {helper && <div className="mt-2 text-sm leading-6 text-muted">{helper}</div>}
    <div className="mt-5">{children}</div>
    {footer && <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">{footer}</div>}
  </div>
);

export const CountdownPill: React.FC<{ seconds: number; label?: string }> = ({ seconds, label = 'Time' }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-warm px-3 py-1.5 text-sm font-semibold text-ink">
    <Clock3 className="h-4 w-4 text-sage-deep" aria-hidden="true" />
    {label}: {Math.max(0, Math.ceil(seconds))}s
  </span>
);

export function useCountdown(seconds: number, active: boolean, onEnd?: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const ended = useRef(false);
  useEffect(() => {
    setRemaining(seconds);
    ended.current = false;
  }, [seconds]);
  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          if (!ended.current) {
            ended.current = true;
            onEnd?.();
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active, onEnd]);
  return remaining;
}

/** Auditory stimulus for the sound-recognition activity. */
export function playTones(pattern: number[]) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    pattern.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gain.gain.value = 0.12;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + index * 0.32;
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    });
    window.setTimeout(() => ctx.close(), pattern.length * 320 + 500);
  } catch {
    /* Audio is optional; the visual pattern remains available. */
  }
}

export const AudioButton: React.FC<{ pattern: number[]; label?: string }> = ({ pattern, label = 'Play sound' }) => (
  <button
    type="button"
    onClick={() => playTones(pattern)}
    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-forest hover:bg-mint"
  >
    <Volume2 className="h-4 w-4" aria-hidden="true" />
    {label}
  </button>
);

export const Feedback: React.FC<{ correct: boolean | null; detail?: string }> = ({ correct, detail }) => {
  if (correct === null) return null;
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-2xl border p-3 text-sm font-medium ${
        correct ? 'border-forest/40 bg-mint text-forest' : 'border-amber/60 bg-amber/10 text-amber-900'
      }`}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${correct ? 'bg-forest text-white' : 'bg-amber-600 text-white'}`}>
        {correct ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
      </span>
      <span>{detail || (correct ? 'Correct.' : 'Not quite — that is okay. Let us continue.')}</span>
    </div>
  );
};

export const StudyCard: React.FC<{
  title: string;
  body?: string;
  items?: Array<{ emoji?: string; label: string }>;
  seconds: number;
  onContinue: () => void;
  largeText: boolean;
}> = ({ title, body, items, seconds, onContinue, largeText }) => {
  const [remaining, setRemaining] = useState(seconds);
  const finished = useRef(false);
  useEffect(() => {
    finished.current = false;
    setRemaining(seconds);
    const interval = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          if (!finished.current) {
            finished.current = true;
            onContinue();
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return (
    <div className="rounded-3xl border border-forest/25 bg-mint/40 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={`font-semibold text-ink ${largeText ? 'text-2xl' : 'text-xl'}`}>{title}</h3>
        <CountdownPill seconds={remaining} label="Study time" />
      </div>
      {body && <p className={`mt-3 leading-7 text-ink/85 ${largeText ? 'text-xl' : 'text-base'}`}>{body}</p>}
      {items && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              {item.emoji && <span className="text-4xl" aria-hidden="true">{item.emoji}</span>}
              <span className={`font-semibold text-ink ${largeText ? 'text-xl' : 'text-base'}`}>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onContinue} className={`${primaryButton} mt-5`}>
        I have looked — continue
        <Play className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export const RestartButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className={secondaryButton}>
    <RotateCcw className="h-4 w-4" aria-hidden="true" />
    Start this activity again
  </button>
);

export function percent(correct: number, total: number): number | null {
  return total > 0 ? Math.round((correct / total) * 100) : null;
}
