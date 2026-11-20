import React, { useMemo, useState } from 'react';
import { Brain, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';

type Props = {
  onClose?: () => void;
  onSavePractice?: (session: any) => void;
};

// Adaptive practice: difficulty adjusts to performance. NEVER used for clinical scores, baseline, or change comparison.
export const AdaptivePracticeGames: React.FC<Props> = ({ onClose, onSavePractice }) => {
  const [level, setLevel] = useState(1); // adaptive
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [message, setMessage] = useState('Tap Start to begin a short practice round.');
  const [history, setHistory] = useState<Array<{ round: number; level: number; correct: boolean }>>([]);

  const totalRounds = 8;

  const newRound = (nextLevel: number, nextRound: number) => {
    const span = Math.min(9, 3 + nextLevel);
    const t = Math.floor(Math.random() * span) + nextLevel;
    const opts = new Set<number>([t]);
    while (opts.size < 4) opts.add(Math.floor(Math.random() * (span + nextLevel)) + 1);
    setTarget(t);
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setRound(nextRound);
    setLevel(nextLevel);
    setMessage(`Find the number: ${t}`);
  };

  const start = () => {
    setScore(0); setStreak(0); setHistory([]);
    newRound(1, 1);
  };

  const finish = (finalScore: number, finalHistory: any[], finalLevel: number) => {
    const session = {
      kind: 'adaptive_practice',
      mode: 'adaptive_practice',
      clinicalUse: false,
      excludeFromClinicalComparison: true,
      taskId: 'adaptive_cognitive_practice',
      formVersion: 'practice-adaptive-v1',
      score: finalScore,
      rounds: finalHistory.length,
      finalLevel,
      history: finalHistory,
      completedAt: new Date().toISOString(),
      note: 'Practice only. Adaptive difficulty. Not a standardized observation and never compared with fixed-observation clinical scores, baselines, or change detection.',
    };
    onSavePractice?.(session);
    setMessage(`Practice complete. Score ${finalScore}/${totalRounds}. (Not used in clinical scores.)`);
    setTarget(null);
    setOptions([]);
  };

  const pick = (val: number) => {
    if (target == null || round === 0) return;
    const correct = val === target;
    const newStreak = correct ? streak + 1 : 0;
    const newScore = score + (correct ? 1 : 0);
    const newHistory = [...history, { round, level, correct }];
    setScore(newScore); setStreak(newStreak); setHistory(newHistory);

    // Adaptive rule (practice only): up after 2 correct in a row, down after a miss (bounded).
    let nextLevel = level;
    if (correct && newStreak >= 2) nextLevel = Math.min(6, level + 1);
    if (!correct) nextLevel = Math.max(1, level - 1);

    if (round >= totalRounds) {
      finish(newScore, newHistory, nextLevel);
      return;
    }
    setMessage(correct ? 'Nice work! Difficulty adapts for practice.' : 'Good try. Difficulty adapts for practice.');
    window.setTimeout(() => newRound(nextLevel, round + 1), 450);
  };

  const active = target != null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Sparkles className="w-4 h-4" /> Practice only · Adaptive
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2"><Brain className="w-6 h-6 text-medical-600" /> Adaptive Cognitive Games</h3>
          <p className="text-sm text-slate-600 max-w-2xl">{message}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl border border-slate-200">Close</button>
        )}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
        <strong>Not a clinical score:</strong> this adaptive practice adjusts difficulty to support engagement. Results are <strong>never</strong> used in standardized assessment scores, personal baselines, change detection, or clinical comparisons (fixed observation ≠ adaptive practice).
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-700">Round {Math.min(round || 0, totalRounds)}/{totalRounds}</span>
        <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-700">Practice level {level} (adaptive)</span>
        <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-700 inline-flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {score} correct</span>
      </div>

      {active ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => pick(opt)} className="py-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-medical-500 hover:bg-blue-50 text-xl font-black text-slate-800 transition-all">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" onClick={start} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white font-bold shadow-md">
          <RotateCcw className="w-4 h-4" /> Start practice
        </button>
      )}

      {history.length > 0 && !active && (
        <p className="text-xs text-slate-500">Saved as a local practice session marker (excluded from clinical comparison). You can play again anytime.</p>
      )}
    </div>
  );
};

export default AdaptivePracticeGames;
