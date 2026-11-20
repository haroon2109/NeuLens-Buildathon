import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Music, Play, Volume2 } from 'lucide-react';

type Props = {
  patientMode?: boolean;
  onComplete: (result: any) => void;
  speak?: (text: string) => void;
  /** Session language, so the instructions are read in the language being assessed. */
  language?: string;
  t?: any;
};

type PianoStrings = {
  badge: string;
  title: string;
  introMessage: string;
  watchMessage: string;
  turnMessage: string;
  correctMessage: string;
  incorrectMessage: string;
  roundInfo: (current: number, total: number, length: number) => string;
  startButton: string;
  listenWatch: string;
  yourTurn: string;
  preparing: string;
  completeTitle: string;
  completeBody: string;
  footerNote: string;
  keyAria: (label: string) => string;
};

const ENGLISH: PianoStrings = {
  badge: 'Fixed observation · Sequence memory',
  title: 'Piano Sequence',
  introMessage: 'Watch the piano keys light up, then repeat the sequence in the same order.',
  watchMessage: 'Watch the sequence carefully.',
  turnMessage: 'Now tap the keys in the same order.',
  correctMessage: 'Correct sequence.',
  incorrectMessage: 'That sequence was different. Continue to the next round.',
  roundInfo: (current, total, length) => `Round ${current} of ${total} · Length ${length}`,
  startButton: 'Start sequence',
  listenWatch: 'Listen and watch',
  yourTurn: 'Your turn',
  preparing: 'Preparing next round',
  completeTitle: 'Piano Sequence Complete',
  completeBody: 'Fixed-observation sequencing recorded.',
  footerNote:
    'Standardized fixed-observation activity (same form). Results may be used for within-person comparison only when quality/comparability gates pass. This is not adaptive practice.',
  keyAria: (label) => `Piano key ${label}`
};

const TAMIL: PianoStrings = {
  badge: 'நிலையான கவனிப்பு · வரிசை நினைவாற்றல்',
  title: 'இசை வரிசைப் பயிற்சி (Piano Sequence)',
  introMessage: 'இசை விசைகள் ஒளிரும் வரிசையைக் கவனித்து, அதே வரிசையில் விசைகளைத் தொடவும்.',
  watchMessage: 'ஒளிரும் வரிசையைக் கவனமாகப் பாருங்கள்.',
  turnMessage: 'இப்போது அதே வரிசையில் விசைகளைத் தொடவும்.',
  correctMessage: 'சரியான வரிசை!',
  incorrectMessage: 'இந்த வரிசை மாறியுள்ளது. அடுத்த சுற்றுக்குச் செல்வோம்.',
  roundInfo: (current, total, length) => `சுற்று ${current} / ${total} · நீளம் ${length}`,
  startButton: 'வரிசையைத் தொடங்கு',
  listenWatch: 'கவனித்துப் பார்க்கவும்',
  yourTurn: 'உங்கள் முறை',
  preparing: 'அடுத்த சுற்று தயாராகிறது',
  completeTitle: 'இசை வரிசைப் பயிற்சி முடிந்தது',
  completeBody: 'வரிசை நினைவாற்றல் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.',
  footerNote:
    'நிலையான மருத்துவ கவனிப்புப் பயிற்சி. தரம் மற்றும் ஒப்பீட்டு விதிகள் பூர்த்தியாகும்போது மட்டுமே முந்தைய அமர்வுகளுடன் ஒப்பிடப்படும்.',
  keyAria: (label) => `இசை விசை ${label}`
};

const HINDI: PianoStrings = {
  badge: 'मानकीकृत अवलोकन · अनुक्रम स्मृति',
  title: 'पियानो अनुक्रम (Piano Sequence)',
  introMessage: 'पियानो की कुंजियों को चमकते हुए देखें, फिर उसी क्रम में उन्हें दबाएं।',
  watchMessage: 'अनुक्रम को ध्यान से देखें।',
  turnMessage: 'अब उसी क्रम में कुंजियों को दबाएं।',
  correctMessage: 'बिल्कुल सही अनुक्रम!',
  incorrectMessage: 'यह क्रम थोड़ा अलग था। आइए अगले दौर पर चलें।',
  roundInfo: (current, total, length) => `दौर ${current} / ${total} · लंबाई ${length}`,
  startButton: 'अनुक्रम शुरू करें',
  listenWatch: 'सुनें और ध्यान से देखें',
  yourTurn: 'अब आपकी बारी',
  preparing: 'अगला दौर तैयार हो रहा है',
  completeTitle: 'पियानो अनुक्रम पूरा हुआ',
  completeBody: 'अनुक्रम स्मृति सफलतापूर्वक दर्ज की गई।',
  footerNote:
    'मानकीकृत अवलोकन गतिविधि। गुणवत्ता सत्यापन के बाद ही व्यक्तिगत बेसलाइन के साथ तुलना की जाती है।',
  keyAria: (label) => `पियानो कुंजी ${label}`
};

type MessageKey = 'introMessage' | 'watchMessage' | 'turnMessage' | 'correctMessage' | 'incorrectMessage';

const KEYS = [
  { id: 0, label: 'C', color: 'bg-rose-500', light: 'bg-rose-300', freq: 261.63 },
  { id: 1, label: 'D', color: 'bg-amber-500', light: 'bg-amber-300', freq: 293.66 },
  { id: 2, label: 'E', color: 'bg-emerald-500', light: 'bg-emerald-300', freq: 329.63 },
  { id: 3, label: 'G', color: 'bg-sky-500', light: 'bg-sky-300', freq: 392.0 },
];

// Fixed-observation rounds (standardized): same structure for every administration of this form version.
const ROUNDS = [3, 4, 5];

export const PianoSequenceTask: React.FC<Props> = ({ patientMode = false, onComplete, speak, language }) => {
  const s = language === 'ta' ? TAMIL : language === 'hi' ? HINDI : ENGLISH;
  const [phase, setPhase] = useState<'intro' | 'showing' | 'input' | 'feedback' | 'done'>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [messageKey, setMessageKey] = useState<MessageKey>('introMessage');
  const timers = useRef<number[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const beep = useCallback((freq: number, duration = 280) => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx.current) audioCtx.current = new Ctx();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
      osc.start(now);
      osc.stop(now + duration / 1000 + 0.02);
    } catch {
      // Audio unavailable: visual cue remains.
    }
  }, []);

  const makeSequence = useCallback((len: number) => {
    // Deterministic-feeling but varied per round using fixed round lengths only (not adaptive difficulty).
    const base = [0, 2, 1, 3, 0, 1, 3, 2, 0, 3, 1, 2];
    const offset = roundIndex * 2;
    return Array.from({ length: len }, (_, i) => base[(i + offset) % base.length]);
  }, [roundIndex]);

  const playSequence = useCallback((seq: number[]) => {
    clearTimers();
    setPhase('showing');
    setInputIndex(0);
    setMessageKey('watchMessage');
    seq.forEach((keyId, i) => {
      const t1 = window.setTimeout(() => {
        setActiveKey(keyId);
        beep(KEYS[keyId].freq);
      }, 600 + i * 700);
      const t2 = window.setTimeout(() => setActiveKey(null), 600 + i * 700 + 380);
      timers.current.push(t1, t2);
    });
    const done = window.setTimeout(() => {
      setActiveKey(null);
      setPhase('input');
      setMessageKey('turnMessage');
      speak?.('Now repeat the sequence.');
    }, 600 + seq.length * 700 + 200);
    timers.current.push(done);
  }, [beep, speak]);

  const startRound = useCallback((idx: number) => {
    const len = ROUNDS[idx];
    const seq = makeSequence(len);
    setSequence(seq);
    setRoundIndex(idx);
    setRoundResults((prev) => prev);
    playSequence(seq);
  }, [makeSequence, playSequence]);

  const finish = useCallback((finalCorrect: number, results: any[]) => {
    const total = ROUNDS.length;
    const score = Math.round((finalCorrect / total) * 100);
    const payload = {
      taskId: 'piano_sequence',
      taskName: 'Piano Sequence (Fixed Observation)',
      mode: 'fixed_observation',
      formVersion: 'piano-seq-v1',
      score,
      correctRounds: finalCorrect,
      totalRounds: total,
      roundLengths: ROUNDS,
      roundResults: results,
      clinicalUse: true,
      note: 'Standardized fixed-observation sequencing task; not adaptive. Comparable only with the same form/version under similar conditions.',
      completedAt: new Date().toISOString(),
    };
    setPhase('done');
    onComplete(payload);
  }, [onComplete]);

  const handleKey = (keyId: number) => {
    if (phase !== 'input') return;
    beep(KEYS[keyId].freq, 180);
    setActiveKey(keyId);
    window.setTimeout(() => setActiveKey(null), 150);

    const expected = sequence[inputIndex];
    const correctSoFar = keyId === expected;
    const nextIndex = inputIndex + 1;

    if (!correctSoFar || nextIndex === sequence.length) {
      const roundCorrect = correctSoFar && nextIndex === sequence.length;
      const newCorrect = correctRounds + (roundCorrect ? 1 : 0);
      const result = {
        round: roundIndex + 1,
        length: sequence.length,
        correct: roundCorrect,
        entered: [...sequence.slice(0, inputIndex), keyId],
        expected: sequence,
      };
      const newResults = [...roundResults, result];
      setRoundResults(newResults);
      setCorrectRounds(newCorrect);
      setPhase('feedback');
      setMessageKey(roundCorrect ? 'correctMessage' : 'incorrectMessage');
      speak?.(roundCorrect ? 'Correct.' : 'Let us try the next one.');

      const t = window.setTimeout(() => {
        const next = roundIndex + 1;
        if (next < ROUNDS.length) {
          startRound(next);
        } else {
          finish(newCorrect, newResults);
        }
      }, 1200);
      timers.current.push(t);
      return;
    }

    setInputIndex(nextIndex);
  };

  const start = () => {
    setCorrectRounds(0);
    setRoundResults([]);
    startRound(0);
  };

  if (phase === 'done') {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900">{s.completeTitle}</h3>
        <p className="text-sm text-slate-600">{s.completeBody}</p>
      </div>
    );
  }

  return (
    <div className={patientMode ? 'bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm' : 'glass-card p-6 space-y-5'}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-200">
          <Music className="w-4 h-4" /> {s.badge}
        </div>
        <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">{s.title}</h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">{s[messageKey]}</p>
        {phase !== 'intro' && (
          <p className="text-xs font-semibold text-slate-500">
            {s.roundInfo(Math.min(roundIndex + 1, ROUNDS.length), ROUNDS.length, ROUNDS[roundIndex] || ROUNDS[0])}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3 sm:gap-4 py-4">
        {KEYS.map((k) => {
          const active = activeKey === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => handleKey(k.id)}
              disabled={phase !== 'input'}
              className={`relative w-16 sm:w-20 h-40 sm:h-52 rounded-b-2xl rounded-t-lg border-2 transition-all shadow-sm flex items-end justify-center pb-4 select-none ${
                active ? `${k.light} border-slate-400 scale-[1.02]` : 'bg-white border-slate-300 hover:border-slate-400'
              } ${phase === 'input' ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default opacity-95'}`}
              aria-label={s.keyAria(k.label)}
            >
              <span className={`absolute top-3 w-8 h-8 rounded-full ${active ? k.color : 'bg-slate-200'} transition-colors`} />
              <span className="text-sm font-bold text-slate-700">{k.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        {phase === 'intro' ? (
          <button type="button" onClick={start} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white font-bold shadow-md">
            <Play className="w-4 h-4 fill-white" /> {s.startButton}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Volume2 className="w-4 h-4" />
            <span>{phase === 'showing' ? s.listenWatch : phase === 'input' ? s.yourTurn : s.preparing}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-slate-400 max-w-xl mx-auto">
        {s.footerNote}
      </p>
    </div>
  );
};

export default PianoSequenceTask;
