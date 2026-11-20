import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Info,
  Printer,
  RotateCcw,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { Card, Pill } from '../patient/portal/ui';
import { DOMAIN_LABEL } from './types';
import { LIBRARY_NOTICE } from './taskLibrary';
import type { CognitiveSessionRecord } from './cognitiveApi';

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const CognitiveSummary: React.FC<{
  session: CognitiveSessionRecord;
  onRestart?: () => void;
}> = ({ session, onRestart }) => {
  const [showAll, setShowAll] = useState(false);
  const completed = session.tasks.filter((task) => task.completed).length;
  const skipped = session.tasks.filter((task) => task.skipped);
  const warnings = session.quality.flags.filter((flag) => flag.severity !== 'INFO');

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-forest/40 bg-mint/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-ink">Assessment session recorded</h1>
              <p className="mt-1 text-sm text-muted">
                {formatDate(session.completedAt)} · {completed} of {session.tasks.length} activities completed
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={session.mode === 'STANDARDIZED' ? 'forest' : 'amber'} dot>
              {session.mode === 'STANDARDIZED' ? 'Standardized' : 'Exploratory'}
            </Pill>
            <Pill tone={session.quality.comparable ? 'forestSoft' : 'amber'} dot>
              {session.quality.comparable ? 'Comparable within protocol' : 'Comparison withheld'}
            </Pill>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-sage-deep">Session</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            {[
              ['Mode', session.mode === 'STANDARDIZED' ? 'Standardized clinical' : 'Adaptive exploration'],
              ['Activities completed', `${completed} of ${session.tasks.length}`],
              ['Skipped', String(skipped.length)],
              ['Duration', session.administrationMinutes != null ? `${session.administrationMinutes} min` : 'Not recorded'],
              ['Protocol', session.protocolVersion],
              ['Algorithm', session.algorithmVersion]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-sage-deep">Descriptive results</h2>
          <p className="mt-1 text-[13px] leading-5 text-muted">
            These numbers describe what was captured. They are not a clinical score, a diagnosis or a risk category.
          </p>
          <div className="mt-2 space-y-2">
            {session.domains.map((domain) => (
              <div key={domain.domain} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-warm/60 p-2.5">
                <span className="text-xs font-semibold text-ink">{DOMAIN_LABEL[domain.domain]}</span>
                <span className="text-xs text-muted">
                  {domain.accuracy == null ? 'No scored responses' : `${Math.round(domain.accuracy * 100)}% descriptive accuracy`}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-sage-deep">Data quality</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{session.quality.comparableReason}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="sage">{Math.round(session.quality.completeness * 100)}% complete</Pill>
            {warnings.map((flag) => (
              <Pill key={flag.code} tone="amber">{flag.label}</Pill>
            ))}
            {warnings.length === 0 && <Pill tone="forestSoft">No quality warnings</Pill>}
          </div>
          {session.confounders.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[13px] font-bold uppercase tracking-wide text-sage-deep">Interpretation context</p>
              {session.confounders.map((item) => (
                <p key={item.code} className="text-[13px] leading-5 text-muted">{item.label}: {item.detail}</p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Activity results</h2>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="text-xs font-bold text-forest hover:underline"
            aria-expanded={showAll}
          >
            {showAll ? 'Show summary only' : 'Show task-level detail'}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-wide text-sage-deep">
                <th className="py-2 pr-3">Activity</th>
                <th className="px-3 py-2">Domain</th>
                <th className="px-3 py-2">Form / level</th>
                <th className="px-3 py-2">Captured</th>
                <th className="px-3 py-2">Accuracy</th>
                <th className="px-3 py-2">Median time</th>
              </tr>
            </thead>
            <tbody>
              {(showAll ? session.tasks : session.tasks.slice(0, 4)).map((task) => (
                <tr key={task.taskId} className="border-b border-line/70 last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{task.taskName}</td>
                  <td className="px-3 py-2.5 text-muted">{DOMAIN_LABEL[task.domain]}</td>
                  <td className="px-3 py-2.5 text-muted">{task.form} / {task.difficultyLevel}</td>
                  <td className="px-3 py-2.5 text-muted">
                    {task.skipped ? 'Skipped' : `${task.correct} of ${task.trials}`}
                  </td>
                  <td className="px-3 py-2.5">
                    {task.accuracy == null ? <span className="text-muted">—</span> : `${Math.round(task.accuracy * 100)}%`}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {task.medianResponseMs == null ? '—' : `${task.medianResponseMs} ms`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAll && session.tasks.length > 4 && (
          <p className="mt-2 text-[13px] text-muted">Showing the first four activities. Open task-level detail for the full session.</p>
        )}
      </Card>

      {skipped.length > 0 && (
        <div className="rounded-2xl border border-amber/60 bg-amber/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Some activities were skipped
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-900/85">
            {skipped.map((task) => task.taskName).join(', ')}. Skipped activities are recorded as missing, not as incorrect.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Stethoscope className="h-4 w-4 text-forest" /> What happens next
          </h2>
          <ol className="mt-2 space-y-2 text-xs leading-5 text-muted">
            <li className="flex gap-2"><span className="font-bold text-forest">1.</span> Your session is stored for clinician review.</li>
            <li className="flex gap-2"><span className="font-bold text-forest">2.</span> A clinician interprets the observations together with your context and history.</li>
            <li className="flex gap-2"><span className="font-bold text-forest">3.</span> No diagnosis or risk category is produced automatically.</li>
          </ol>
          <div className="mt-3 rounded-xl border border-line bg-warm/70 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Not a diagnosis
            </p>
            <p className="mt-1 text-[13px] leading-5 text-muted">
              {LIBRARY_NOTICE}
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">Keep a record</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            This summary is available in your assessment history. You can print it or share it with your care team.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-warm"
            >
              <Printer className="h-4 w-4" /> Print summary
            </button>
            <Link to="/patient/history" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-warm">
              <ClipboardList className="h-4 w-4" /> Assessment history
            </Link>
          </div>
          <div className="mt-3 rounded-xl border border-mint bg-mint/50 p-3 text-[13px] leading-5 text-forest">
            Standardized and exploratory sessions are stored separately and are never merged into one score.
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/patient/dashboard"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-forest px-5 text-sm font-semibold text-white"
        >
          Return to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink"
          >
            <RotateCcw className="h-4 w-4" /> Start another session
          </button>
        )}
        <Link
          to="/patient/trends"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink"
        >
          <Clock3 className="h-4 w-4" /> Compare sessions
        </Link>
      </div>

      <p className="flex items-start gap-1.5 text-[13px] leading-5 text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Records carry a timestamp, task identifiers, task versions, assessment mode and administration conditions. Clinician review is required before any clinical interpretation.
      </p>
    </div>
  );
};
