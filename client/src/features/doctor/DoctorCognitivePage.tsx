import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  type LucideIcon
} from 'lucide-react';
import { Card, DoctorPageHeader, EmptyState, Notice, Pill, StatCard, formatDate, primaryButton, secondaryButton } from './portal/ui';
import { doctorApi } from '../../services/portalApi';
import { TaskLibraryView } from '../cognitive/TaskLibraryView';
import { Swap } from '../../components/motion/Reveal';
import { cognitiveApi, type AssessmentPlan, type CognitiveSessionRecord } from '../cognitive/cognitiveApi';
import { DOMAIN_LABEL } from '../cognitive/types';
import { COGNITIVE_TASKS } from '../cognitive/taskLibrary';

type Tab = 'sessions' | 'library' | 'plan';

interface PatientOption {
  id: string;
  patientId: string;
  name: string;
  age: number;
}

const pct = (value: number | null) => (value == null ? '—' : `${Math.round(value * 100)}%`);
const flagTone = (severity: string) => (severity === 'BLOCKER' ? 'rose' : severity === 'WARNING' ? 'amber' : 'sage');

export const DoctorCognitivePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('sessions');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PatientOption | null>(null);
  const [sessions, setSessions] = useState<CognitiveSessionRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState<AssessmentPlan | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      const result = await doctorApi.getPatients();
      const list = (Array.isArray(result) ? result : []) as PatientOption[];
      setPatients(list);
      if (!selected && list[0]) setSelected(list[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patient directory unavailable.');
    }
  };

  useEffect(() => {
    void loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPatient = async (patient: PatientOption) => {
    setBusy(true);
    setError(null);
    try {
      const [sessionResult, planResult] = await Promise.all([
        cognitiveApi.getClinicianPatientSessions(patient.patientId),
        cognitiveApi.getClinicianPatientPlan(patient.patientId)
      ]);
      setSessions(sessionResult.sessions);
      setSessionId(sessionResult.sessions[0]?.sessionId || null);
      setPlan(planResult.plan);
    } catch (err) {
      setSessions([]);
      setPlan(null);
      setError(err instanceof Error ? err.message : 'Cognitive records could not be loaded.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (selected) void loadPatient(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const current = useMemo(
    () => sessions.find((session) => session.sessionId === sessionId) || sessions[0] || null,
    [sessions, sessionId]
  );

  const previous = useMemo(() => {
    if (!current) return null;
    return (
      sessions.find(
        (session) =>
          session.sessionId !== current.sessionId &&
          session.mode === current.mode &&
          new Date(session.completedAt) < new Date(current.completedAt)
      ) || null
    );
  }, [sessions, current]);

  const filteredPatients = patients.filter((patient) =>
    `${patient.name} ${patient.patientId}`.toLowerCase().includes(query.toLowerCase())
  );

  const standardised = sessions.filter((session) => session.mode === 'STANDARDIZED').length;
  const exploratory = sessions.filter((session) => session.mode === 'EXPLORATORY').length;

  const approve = async (decision: 'APPROVED' | 'CHANGES_REQUESTED') => {
    if (!selected || !plan) return;
    setBusy(true);
    setError(null);
    try {
      await cognitiveApi.approvePlan(selected.patientId, plan.planId, decision, approvalNote);
      const refreshed = await cognitiveApi.getClinicianPatientPlan(selected.patientId);
      setPlan(refreshed.plan);
      setApprovalNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The plan decision could not be recorded.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <DoctorPageHeader
        screen="Cognitive assessment management"
        title="Cognitive Assessment Management"
        description="Review the 32-activity library, session-level administration conditions, task-level performance and data-quality flags. Approve an assessment plan where appropriate."
        actions={
          <button type="button" onClick={() => selected && loadPatient(selected)} className={secondaryButton} disabled={busy}>
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Refresh records
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Activities in library" value={String(COGNITIVE_TASKS.length)} detail="Eight cognitive domains" icon={Brain} />
        <StatCard label="Recorded sessions" value={String(sessions.length)} detail="Selected patient" icon={ClipboardList} tone="blue" />
        <StatCard label="Standardized" value={String(standardised)} detail="Comparable protocol sessions" icon={FileCheck2} tone="green" />
        <StatCard label="Exploratory" value={String(exploratory)} detail="Adaptive, non-comparable" icon={Activity} tone="amber" />
      </div>

      <Notice tone="warning" title="Research-stage measurements">
        All activities are research-stage and none is a validated clinical instrument. Task accuracy and response times are descriptive. They are not diagnostic, do not establish risk, and must be interpreted with the recorded context and this patient&rsquo;s history.
      </Notice>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-white p-1.5">
        {([
          ['sessions', 'Sessions & performance', ClipboardList],
          ['library', 'Task library', Brain],
          ['plan', 'Assessment plan review', FileCheck2]
        ] as Array<[Tab, string, LucideIcon]>).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              tab === id ? 'bg-mint text-forest' : 'text-body hover:bg-warm'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm text-amber-900">{error}</p>}

      <Swap key={tab} className="space-y-5">
      {tab === 'library' && <TaskLibraryView compact title="Available cognitive tasks" />}

      {tab === 'plan' && (
        <Card>
          {!selected ? (
            <EmptyState icon={Users} title="Choose a patient" detail="Select a patient to review their latest generated assessment plan." />
          ) : !plan ? (
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-ink">No plan generated yet</h2>
              <p className="text-sm leading-6 text-muted">
                A plan appears here after the patient reviews their assessment settings and generates a plan. The clinician decision applies only to that exact plan; a regenerated plan requires a new review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone={plan.mode === 'STANDARDIZED' ? 'forest' : 'amber'} dot>
                      {plan.mode === 'STANDARDIZED' ? 'Standardized' : 'Exploratory'}
                    </Pill>
                    <Pill tone="sage">{plan.tasks.length} activities</Pill>
                    <Pill tone="sage">{plan.sessionMinutes} min</Pill>
                    <Pill tone="sage">Plan {plan.planId.slice(-8)}</Pill>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-ink">Proposed assessment plan</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Patient {selected.name} · {selected.patientId} · generated {formatDate(plan.generatedAt)}
                  </p>
                </div>
                {plan.clinicianApproval ? (
                  <Pill tone={plan.clinicianApproval.decision === 'APPROVED' ? 'forestSoft' : 'amber'} dot>
                    {plan.clinicianApproval.decision.replace('_', ' ')} · {plan.clinicianApproval.reviewedBy}
                  </Pill>
                ) : (
                  <Pill tone="amber" dot>Awaiting clinician review</Pill>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-[12px] uppercase tracking-wide text-sage-deep">
                      <th className="py-2 pr-3">#</th>
                      <th className="px-3 py-2">Activity</th>
                      <th className="px-3 py-2">Domain</th>
                      <th className="px-3 py-2">Form</th>
                      <th className="px-3 py-2">Difficulty</th>
                      <th className="px-3 py-2">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.tasks.map((task) => (
                      <tr key={task.taskId} className="border-b border-line/70 align-top last:border-0">
                        <td className="py-2.5 pr-3 text-muted">{task.order}</td>
                        <td className="px-3 py-2.5 font-semibold text-ink">{task.name}</td>
                        <td className="px-3 py-2.5 text-muted">{DOMAIN_LABEL[task.domain]}</td>
                        <td className="px-3 py-2.5 text-muted">{task.form}</td>
                        <td className="px-3 py-2.5 text-muted">
                          {plan.mode === 'STANDARDIZED' ? 'Fixed' : `Level ${task.difficultyLevel}`}
                        </td>
                        <td className="px-3 py-2.5 text-muted">{task.rationale.join(' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(plan.warnings.length > 0 || plan.confounders.length > 0) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {[...plan.warnings, ...plan.confounders].map((flag) => (
                    <div key={`${flag.code}-${flag.label}`} className="rounded-xl border border-line bg-warm/60 p-3">
                      <Pill tone={flagTone(flag.severity)}>{flag.severity}</Pill>
                      <p className="mt-1.5 text-xs font-semibold text-ink">{flag.label}</p>
                      <p className="mt-0.5 text-[13px] leading-5 text-muted">{flag.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-line bg-warm/50 p-4">
                <h3 className="text-sm font-semibold text-ink">Record a plan decision</h3>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Approval covers this plan only. It does not replace review of the session results.
                </p>
                <textarea
                  value={approvalNote}
                  onChange={(event) => setApprovalNote(event.target.value)}
                  rows={2}
                  placeholder="Optional note for the record"
                  className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm text-ink outline-none focus:border-forest"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => approve('APPROVED')} disabled={busy} className={primaryButton}>
                    <CheckCircle2 className="h-4 w-4" /> Approve plan
                  </button>
                  <button type="button" onClick={() => approve('CHANGES_REQUESTED')} disabled={busy} className={secondaryButton}>
                    Request changes
                  </button>
                </div>
                {plan.clinicianApproval && (
                  <p className="mt-2 rounded-xl border border-line bg-white p-3 text-[13px] leading-5 text-muted">
                    <span className="font-semibold text-ink">{plan.clinicianApproval.reviewedBy}</span> recorded{' '}
                    {plan.clinicianApproval.decision.replace('_', ' ')} on {formatDate(plan.clinicianApproval.reviewedAt)}.
                    {plan.clinicianApproval.note ? ` Note: ${plan.clinicianApproval.note}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'sessions' && (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="min-w-0 space-y-4">
            <Card>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-ink">Patient</h2>
                <span className="text-[13px] text-muted">{filteredPatients.length} records</span>
              </div>
              <label className="relative mt-2 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <span className="sr-only">Search patients</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name or patient ID"
                  className="min-h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-forest"
                />
              </label>
              <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(patient)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                        selected?.id === patient.id ? 'bg-mint font-semibold text-forest' : 'text-body hover:bg-warm'
                      }`}
                    >
                      <span>{patient.name}</span>
                      <span className="text-[12px] font-mono text-muted">{patient.patientId}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-ink">Recorded sessions</h2>
              {busy && <p className="mt-2 flex items-center gap-2 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</p>}
              {!busy && sessions.length === 0 && (
                <p className="mt-2 text-xs leading-5 text-muted">No cognitive sessions recorded for this patient.</p>
              )}
              <ul className="mt-2 space-y-1.5">
                {sessions.map((session) => (
                  <li key={session.sessionId}>
                    <button
                      type="button"
                      onClick={() => setSessionId(session.sessionId)}
                      className={`w-full rounded-xl border p-2.5 text-left text-xs transition ${
                        current?.sessionId === session.sessionId
                          ? 'border-forest bg-mint/50'
                          : 'border-line bg-white hover:bg-warm'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink">{formatDate(session.completedAt)}</span>
                        <Pill tone={session.mode === 'STANDARDIZED' ? 'forestSoft' : 'amber'}>
                          {session.mode === 'STANDARDIZED' ? 'Std' : 'Expl'}
                        </Pill>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                        <span>{session.tasks.filter((task) => task.completed).length}/{session.tasks.length} completed</span>
                        <span>·</span>
                        <span>{session.quality.comparable ? 'Comparable' : 'Not comparable'}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="min-w-0 space-y-4">
            {!current ? (
              <Card>
                <EmptyState
                  icon={Brain}
                  title="No session selected"
                  detail="Choose a patient and a recorded cognitive session to review task-level performance, administration conditions and data-quality flags."
                />
              </Card>
            ) : (
              <>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        <Pill tone={current.mode === 'STANDARDIZED' ? 'forest' : 'amber'} dot>
                          {current.mode === 'STANDARDIZED' ? 'Standardized' : 'Exploratory'}
                        </Pill>
                        <Pill tone={current.quality.comparable ? 'forestSoft' : 'amber'}>
                          {current.quality.comparable ? 'Comparable within protocol' : 'Comparison withheld'}
                        </Pill>
                        <Pill tone="sage">Protocol v{current.protocolVersion}</Pill>
                        <Pill tone="sage">{current.algorithmVersion}</Pill>
                      </div>
                      <h2 className="mt-2 text-base font-semibold text-ink">{formatDate(current.completedAt)}</h2>
                      <p className="mt-0.5 text-xs text-muted">
                        {current.tasks.filter((task) => task.completed).length} of {current.tasks.length} activities ·{' '}
                        {current.administrationMinutes != null ? `${current.administrationMinutes} min` : 'duration not recorded'} ·{' '}
                        session {current.sessionId.slice(-8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-sage-deep">Descriptive accuracy</p>
                      <p className="text-2xl font-semibold text-ink">{current.compositeAccuracy == null ? '—' : `${current.compositeAccuracy}%`}</p>
                    </div>
                  </div>

                  <p className="mt-3 rounded-xl border border-line bg-warm/60 p-3 text-[13px] leading-5 text-muted">
                    {current.quality.comparableReason}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {current.quality.flags.map((flag) => (
                      <Pill key={`${flag.code}-${flag.label}`} tone={flagTone(flag.severity)} dot>
                        {flag.label}
                      </Pill>
                    ))}
                  </div>

                  {current.confounders.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber/60 bg-amber/5 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertTriangle className="h-3.5 w-3.5" /> Context for interpretation (not score adjustments)
                      </p>
                      <ul className="mt-1 space-y-1">
                        {current.confounders.map((flag) => (
                          <li key={flag.code} className="text-[13px] leading-5 text-amber-900/90">
                            <span className="font-semibold">{flag.label}:</span> {flag.detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>

                <Card>
                  <h2 className="text-base font-semibold text-ink">Task-level performance</h2>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-line text-[12px] uppercase tracking-wide text-sage-deep">
                          <th className="py-2 pr-3">Activity</th>
                          <th className="px-2 py-2">Domain</th>
                          <th className="px-2 py-2">Ver / form</th>
                          <th className="px-2 py-2">Level</th>
                          <th className="px-2 py-2">Trials</th>
                          <th className="px-2 py-2">Acc.</th>
                          <th className="px-2 py-2">Errors</th>
                          <th className="px-2 py-2">Missing</th>
                          <th className="px-2 py-2">Median RT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {current.tasks.map((task) => (
                          <tr key={task.taskId} className="border-b border-line/70 last:border-0">
                            <td className="py-2.5 pr-3 font-semibold text-ink">
                              {task.taskName}
                              {task.skipped && <span className="ml-1 rounded bg-amber/20 px-1 text-[12px] font-bold text-amber-900">SKIPPED</span>}
                            </td>
                            <td className="px-2 py-2.5 text-muted">{DOMAIN_LABEL[task.domain]}</td>
                            <td className="px-2 py-2.5 text-muted">v{task.version} · {task.form}</td>
                            <td className="px-2 py-2.5 text-muted">{task.difficultyLevel}</td>
                            <td className="px-2 py-2.5 text-muted">{task.trials}</td>
                            <td className="px-2 py-2.5 font-semibold text-ink">{pct(task.accuracy)}</td>
                            <td className="px-2 py-2.5 text-muted">{task.errors}</td>
                            <td className="px-2 py-2.5 text-muted">{task.misses}</td>
                            <td className="px-2 py-2.5 text-muted">{task.medianResponseMs == null ? '—' : `${task.medianResponseMs} ms`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {current.tasks.some((task) => task.notes.length > 0) && (
                    <details className="mt-3 rounded-xl border border-line bg-warm/50 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-ink">Task notes</summary>
                      <ul className="mt-2 space-y-1.5 text-[13px] leading-5 text-muted">
                        {current.tasks.flatMap((task) =>
                          task.notes.map((note) => (
                            <li key={`${task.taskId}-${note}`}><span className="font-semibold text-ink">{task.taskName}:</span> {note}</li>
                          ))
                        )}
                      </ul>
                    </details>
                  )}
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <h2 className="text-base font-semibold text-ink">Domain summary</h2>
                    <ul className="mt-2 space-y-1.5">
                      {current.domains.map((domain) => (
                        <li key={domain.domain} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-warm/60 p-2.5 text-xs">
                          <span className="font-semibold text-ink">{DOMAIN_LABEL[domain.domain]}</span>
                          <span className="text-muted">
                            {pct(domain.accuracy)} · {domain.trials} trials · {domain.medianResponseMs == null ? '—' : `${domain.medianResponseMs} ms`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                      <Stethoscope className="h-4 w-4 text-forest" /> Administration conditions
                    </h2>
                    <dl className="mt-2 space-y-1.5 text-xs">
                      {[
                        ['Language', current.language === 'en' ? 'English' : current.language.toUpperCase()],
                        ['Age', current.context.age == null ? 'Not reported' : `${current.context.age} years`],
                        ['Education', current.context.educationYears == null ? 'Not reported' : `${current.context.educationYears} years`],
                        ['Sleep', current.context.sleepHours == null ? 'Not reported' : `${current.context.sleepHours} h`],
                        ['Fatigue', current.context.fatigue == null ? 'Not reported' : `${current.context.fatigue} / 5`],
                        ['Vision', current.context.vision || 'Not reported'],
                        ['Hearing', current.context.hearing || 'Not reported'],
                        ['Motor', current.context.motor || 'Not reported'],
                        ['Device familiarity', current.context.digitalFamiliarity || 'Not reported'],
                        ['Device', current.context.device || 'Not reported']
                      ].map(([term, value]) => (
                        <div key={term} className="flex justify-between gap-3">
                          <dt className="text-muted">{term}</dt>
                          <dd className="text-right font-semibold text-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-2 text-[12px] leading-4 text-muted">
                      Missing values were not reported. Nothing on this page is inferred or imputed.
                    </p>
                  </Card>
                </div>

                <Card>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                    <ArrowRight className="h-4 w-4 text-forest" /> Longitudinal comparison
                  </h2>
                  {current.mode !== 'STANDARDIZED' ? (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Exploratory sessions use adaptive difficulty and are deliberately not compared with other sessions. Select a standardized session to compare task accuracy.
                    </p>
                  ) : !previous ? (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      No earlier standardized session is recorded. Comparison will be available after another standardized session.
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-[13px] leading-5 text-muted">
                        Compared with the previous standardized session ({formatDate(previous.completedAt)}). Changes are descriptive; no reliable-change threshold has been validated.
                      </p>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-line text-[12px] uppercase tracking-wide text-sage-deep">
                              <th className="py-2 pr-3">Activity</th>
                              <th className="px-2 py-2">Previous</th>
                              <th className="px-2 py-2">Current</th>
                              <th className="px-2 py-2">Change</th>
                              <th className="px-2 py-2">Form</th>
                            </tr>
                          </thead>
                          <tbody>
                            {current.tasks.map((task) => {
                              const prior = previous.tasks.find((item) => item.taskId === task.taskId);
                              if (!prior) return null;
                              const delta = task.accuracy == null || prior.accuracy == null ? null : Math.round((task.accuracy - prior.accuracy) * 100);
                              return (
                                <tr key={task.taskId} className="border-b border-line/70 last:border-0">
                                  <td className="py-2 pr-3 font-semibold text-ink">{task.taskName}</td>
                                  <td className="px-2 py-2 text-muted">{pct(prior.accuracy)}</td>
                                  <td className="px-2 py-2 text-muted">{pct(task.accuracy)}</td>
                                  <td className={`px-2 py-2 font-semibold ${delta == null ? 'text-muted' : delta < 0 ? 'text-amber-800' : 'text-forest'}`}>
                                    {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta} pts`}
                                  </td>
                                  <td className="px-2 py-2 text-muted">{prior.form} → {task.form}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </Card>

                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="flex items-start gap-2 text-[13px] leading-5 text-muted">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                    Clinician interpretation is required. These are descriptive research-stage measurements, not a diagnosis, and no automatic risk category has been assigned. Review alongside prior history, sensory access and the recorded administration conditions.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </Swap>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-warm/60 p-3 text-[13px] leading-5 text-muted">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Task selection rationale, difficulty decisions, alternate forms and algorithm versions are stored with every plan and session for auditability.
      </div>
    </div>
  );
};
