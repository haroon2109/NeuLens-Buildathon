import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Coffee, Loader2, PauseCircle, Play, ShieldCheck, SkipForward } from 'lucide-react';
import type { AssessmentPlan, CognitiveSessionRecord, SessionContext, TaskResultPayload } from './cognitiveApi';
import { cognitiveApi } from './cognitiveApi';
import { TASK_BY_ID } from './taskLibrary';
import { TaskPlayer, type TaskCompletion } from './TaskPlayer';
import { DOMAIN_LABEL } from './types';

const PROGRESS_KEY = 'nl_cognitive_paused_session';

export const CognitiveSessionRunner: React.FC<{
  plan: AssessmentPlan;
  context: SessionContext;
  accommodations: { largeText: boolean; highContrast: boolean; extraPractice: boolean };
  onCancel: () => void;
  onSubmitted: (session: CognitiveSessionRecord) => void;
}> = ({ plan, context, accommodations, onCancel, onSubmitted }) => {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<TaskResultPayload[]>([]);
  const [interstitial, setInterstitial] = useState(false);
  const [paused, setPaused] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(new Date().toISOString());
  const breaks = useRef(0);
  const interruptions = useRef(0);

  // Restore a paused session for this exact plan.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PROGRESS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.plan?.planId !== plan.planId) return;
      setResults(saved.results || []);
      setIndex(saved.index || 0);
      setInterstitial(Boolean(saved.interstitial));
      startedAt.current = saved.startedAt || startedAt.current;
      breaks.current = saved.breaks || 0;
      interruptions.current = saved.interruptions || 0;
    } catch {
      /* ignore corrupt snapshot */
    }
  }, [plan.planId]);

  const current = plan.tasks[index];
  const task = current ? TASK_BY_ID.get(current.taskId) : null;
  const progress = Math.round((results.length / Math.max(1, plan.tasks.length)) * 100);
  const totalMinutes = useMemo(() => plan.tasks.reduce((sum, item) => sum + item.durationMinutes, 0), [plan.tasks]);

  const persist = (nextResults: TaskResultPayload[], nextIndex: number, nextInterstitial: boolean) => {
    sessionStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        plan,
        context,
        results: nextResults,
        index: nextIndex,
        interstitial: nextInterstitial,
        startedAt: startedAt.current,
        breaks: breaks.current,
        interruptions: interruptions.current
      })
    );
  };

  const submit = async (finalResults: TaskResultPayload[]) => {
    setSubmitting(true);
    setError(null);
    try {
      const completedIds = new Set(finalResults.map((result) => result.taskId));
      const payload = {
        mode: plan.mode,
        planId: plan.planId,
        protocolId: plan.protocolId,
        protocolVersion: plan.protocolVersion,
        plan: {
          tasks: plan.tasks.map((item) => ({
            taskId: item.taskId,
            form: item.form,
            difficultyLevel: item.difficultyLevel
          }))
        },
        context,
        language: context.language,
        startedAt: startedAt.current,
        completedAt: new Date().toISOString(),
        results: finalResults.map(({ taskId, form, difficultyLevel, startedAt: taskStarted, completedAt, skipped, trials, notes }) => ({
          taskId,
          form,
          difficultyLevel,
          startedAt: taskStarted,
          completedAt,
          skipped,
          trials,
          notes
        })),
        interruptions: interruptions.current,
        breaksTaken: breaks.current
      };
      // Any planned task with no captured result is explicitly recorded as
      // skipped; it is never silently treated as correct.
      const missing = plan.tasks
        .filter((item) => !completedIds.has(item.taskId))
        .map((item) => ({
          taskId: item.taskId,
          form: item.form,
          difficultyLevel: item.difficultyLevel,
          startedAt: startedAt.current,
          completedAt: new Date().toISOString(),
          skipped: true,
          trials: [],
          notes: ['Activity was not completed.']
        }));
      const result = await cognitiveApi.submitSession({ ...payload, results: [...payload.results, ...missing] });
      sessionStorage.removeItem(PROGRESS_KEY);
      onSubmitted(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The session could not be submitted. Your progress is saved on this device.');
      setPaused(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = (result: TaskCompletion) => {
    const payload: TaskResultPayload = {
      taskId: result.taskId,
      form: result.form,
      difficultyLevel: result.difficultyLevel,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      skipped: result.skipped,
      trials: result.trials.filter((trial) => !trial.practice),
      notes: result.notes
    };
    const nextResults = [...results, payload];
    setResults(nextResults);
    if (index + 1 >= plan.tasks.length) {
      persist(nextResults, index, false);
      void submit(nextResults);
      return;
    }
    persist(nextResults, index + 1, true);
    setIndex((value) => value + 1);
    setInterstitial(true);
  };

  const skip = () => {
    const payload: TaskResultPayload = {
      taskId: current.taskId,
      form: current.form,
      difficultyLevel: current.difficultyLevel,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      skipped: true,
      trials: [],
      notes: ['Skipped by the patient.']
    };
    const nextResults = [...results, payload];
    setResults(nextResults);
    if (index + 1 >= plan.tasks.length) {
      void submit(nextResults);
      return;
    }
    persist(nextResults, index + 1, true);
    setIndex((value) => value + 1);
    setInterstitial(true);
  };

  const continueToNext = () => {
    setInterstitial(false);
    persist(results, index, false);
  };

  useEffect(() => {
    if (breakSeconds == null) return;
    if (breakSeconds <= 0) {
      setBreakSeconds(null);
      return;
    }
    const timer = window.setTimeout(() => setBreakSeconds((value) => (value == null ? null : value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [breakSeconds]);

  const endEarly = () => {
    if (results.length === 0) {
      onCancel();
      return;
    }
    interruptions.current += 1;
    void submit(results);
  };

  if (submitting) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-3xl border border-line bg-white p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ink">Recording your session</h2>
        <p className="max-w-sm text-sm text-muted">Your responses are being stored for clinician review. Please keep this page open.</p>
      </div>
    );
  }

  if (paused) {
    return (
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <PauseCircle className="h-5 w-5 text-forest" /> Session paused
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your place is saved on this device. You can resume where you left off, or end the session and send the activities you completed.
        </p>
        <div className="mt-3 rounded-2xl border border-line bg-warm/60 p-3 text-sm text-body">
          {results.length} of {plan.tasks.length} activities recorded · about {totalMinutes} minutes planned
        </div>
        {error && <p className="mt-3 rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm text-amber-900">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-forest px-5 text-base font-semibold text-white"
          >
            <Play className="h-4 w-4" /> Resume
          </button>
          <button
            type="button"
            onClick={endEarly}
            disabled={results.length === 0}
            className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-semibold text-ink disabled:opacity-50"
          >
            End session and review
          </button>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-muted">
          Ending early records the remaining activities as not completed. A partial session may not be comparable with previous sessions.
        </p>
      </div>
    );
  }

  if (interstitial) {
    const next = plan.tasks[index];
    const breakRecommended = plan.warnings.some((warning) => warning.code === 'BREAK_RECOMMENDED');
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-forest/30 bg-mint/40 p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-sage-deep">
            {results.length} of {plan.tasks.length} complete
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Next: {next?.name}</h2>
          <p className="mt-1 text-sm text-muted">{next?.subdomain}</p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-body">
            Take your time. You can pause before starting, and the next activity will explain itself again.
          </p>
          {breakSeconds != null && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-forest">
              <Coffee className="h-4 w-4" /> Break: {breakSeconds}s
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={continueToNext}
              className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-forest px-6 text-lg font-semibold text-white"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                breaks.current += 1;
                setBreakSeconds(60);
              }}
              className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-semibold text-ink"
            >
              <Coffee className="h-4 w-4" /> Take a 1-minute break
            </button>
            <button
              type="button"
              onClick={() => setPaused(true)}
              className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-semibold text-body"
            >
              <PauseCircle className="h-4 w-4" /> Pause session
            </button>
          </div>
          {breakRecommended && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" /> A break was recommended because you reported fatigue.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!current || !task) {
    return (
      <div className="rounded-2xl border border-amber/60 bg-amber/10 p-5 text-sm text-amber-900">
        This plan contains an activity that is not available in this build. Please return to the plan and regenerate it.
        <button type="button" onClick={onCancel} className="ml-2 font-bold underline">Back to plan</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            Activity {index + 1} of {plan.tasks.length} · {DOMAIN_LABEL[task.domain]}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaused(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-warm px-3 py-1.5 text-xs font-semibold text-body"
            >
              <PauseCircle className="h-3.5 w-3.5" /> Pause
            </button>
            <button
              type="button"
              onClick={skip}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted"
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </button>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-forest transition-[width] duration-500" style={{ width: `${Math.max(2, progress)}%` }} />
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[13px] text-muted">
          <ShieldCheck className="h-3 w-3" /> {plan.mode === 'STANDARDIZED' ? 'Standardized mode · fixed difficulty' : `Exploratory mode · adaptive level ${current.difficultyLevel}`}
        </p>
      </div>

      <TaskPlayer
        key={`${current.taskId}-${index}`}
        task={task}
        form={current.form}
        level={current.difficultyLevel}
        accommodations={accommodations}
        onComplete={handleComplete}
        onSkip={skip}
        onPause={() => setPaused(true)}
      />
      {error && <p className="rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm text-amber-900">{error}</p>}
    </div>
  );
};
