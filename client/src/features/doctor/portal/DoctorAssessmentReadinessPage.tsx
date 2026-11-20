import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Globe2, Languages, ShieldCheck } from 'lucide-react';
import { doctorApi } from '../../../services/portalApi';
import {
  Card,
  DoctorPageHeader,
  Notice,
  Pill,
  StatCard,
  formatDate,
  secondaryButton
} from './ui';

type ReadinessStatus = 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'NOT_STARTED';

interface ReadinessStage {
  key: string;
  label: string;
  status: ReadinessStatus;
  note: string;
}

interface LanguageReadiness {
  language: string;
  nativeName: string;
  bcp47: string;
  dir: 'ltr' | 'rtl';
  taskAdministrationReady: boolean;
  portalOnly: boolean;
  readinessPercent: number;
  stages: ReadinessStage[];
  summary: string;
}

interface ReadinessResponse {
  generatedAt: string;
  summary: {
    languagesOffered: number;
    taskAdministrationReady: number;
    portalOnly: number;
    rightToLeft: number;
  };
  note: string;
  languages: LanguageReadiness[];
  signOffs?: any[];
}

const STATUS_LABEL: Record<ReadinessStatus, string> = {
  DONE: 'Done',
  IN_PROGRESS: 'In progress',
  PENDING: 'Pending',
  NOT_STARTED: 'Not started'
};

const statusTone = (status: ReadinessStatus) => {
  switch (status) {
    case 'DONE':
      return 'forestSoft' as const;
    case 'IN_PROGRESS':
      return 'mint' as const;
    case 'PENDING':
      return 'amber' as const;
    default:
      return 'sage' as const;
  }
};

const StatusPill: React.FC<{ status: ReadinessStatus }> = ({ status }) => (
  <Pill tone={statusTone(status)} dot={status === 'DONE' || status === 'IN_PROGRESS'}>
    {STATUS_LABEL[status]}
  </Pill>
);

const TABLE_STAGES: Array<{ key: string; label: string }> = [
  { key: 'portal_interface', label: 'Portal' },
  { key: 'consent', label: 'Consent' },
  { key: 'results', label: 'Results' },
  { key: 'stimulus_translation', label: 'Task translation' },
  { key: 'back_translation', label: 'Back-translation' },
  { key: 'cognitive_pretesting', label: 'Pretesting' },
  { key: 'local_clinical_review', label: 'Clinical sign-off' },
  { key: 'spoken_voice', label: 'Spoken voice' }
];

const statusByKey = (language: LanguageReadiness, key: string): ReadinessStatus =>
  language.stages.find((stage) => stage.key === key)?.status ?? 'NOT_STARTED';

export const DoctorAssessmentReadinessPage: React.FC = () => {
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ language: 'Arabic', stage: 'back_translation', status: 'DONE', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    doctorApi
      .getAssessmentLanguageReadiness()
      .then((response) => setData(response as ReadinessResponse))
      .catch((err) => setError(err instanceof Error ? err.message : 'Readiness status is unavailable.'))
      .finally(() => setLoading(false));
  };

  const submitSignOff = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const response = await doctorApi.recordLanguageSignOff(form);
      setData(response.readiness as ReadinessResponse);
      setForm((current) => ({ ...current, notes: '' }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign-off could not be recorded.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    doctorApi
      .getAssessmentLanguageReadiness()
      .then((response) => {
        if (!cancelled) setData(response as ReadinessResponse);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Readiness status is unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const arabic = useMemo(
    () => data?.languages.find((language) => language.language === 'Arabic') ?? null,
    [data]
  );

  return (
    <div className="space-y-5">
      <DoctorPageHeader
        screen="Screen 60 · Assessment readiness"
        title="Validated assessment readiness"
        description="Which languages can present this assessment safely, and what is still required before task stimuli may be administered. Readiness is a documentation status, not a validation result."
        actions={
          <Link to="/doctor/quality-equity" className={secondaryButton}>
            Quality &amp; equity
          </Link>
        }
        meta={
          data ? (
            <span className="text-xs text-muted">
              Generated {formatDate(data.generatedAt)}
            </span>
          ) : undefined
        }
      />

      <Notice tone="warning" title="Portal translation is not task validation">
        A translated interface does not make the assessment valid in that language. Task
        administration requires translated stimuli, independent back-translation, cognitive
        pretesting and local clinical sign-off. Until all four are complete the wording is a working
        translation: it is administered only after the participant records an explicit acknowledgement
        that is stored with the session, and this screen must not be read as approval.
      </Notice>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
          Readiness status unavailable ({error}). Do not assume any language is ready.
        </div>
      )}

      {loading && !data && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          Loading language readiness…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Languages offered"
              value={String(data.summary.languagesOffered)}
              detail="Portal, consent and results"
              icon={Languages}
            />
            <StatCard
              label="Ready for task administration"
              value={String(data.summary.taskAdministrationReady)}
              detail="All required stages complete"
              icon={CheckCircle2}
              tone="forestSoft"
            />
            <StatCard
              label="Portal-only languages"
              value={String(data.summary.portalOnly)}
              detail="Interface only — task wording not approved"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Right-to-left"
              value={String(data.summary.rightToLeft)}
              detail="Arabic layout direction"
              icon={Globe2}
              tone="mint"
            />
          </div>

          {arabic && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="pp-eyebrow">Arabic spotlight</p>
                  <h2 className="mt-1 flex items-center gap-2 text-[18px] font-semibold text-ink">
                    <span dir="rtl" lang="ar-AE" className="text-[20px]">
                      العربية
                    </span>
                    <span className="text-[13px] font-medium text-muted">ar-AE · right-to-left</span>
                  </h2>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-body">{arabic.summary}</p>
                </div>
                <Pill tone={arabic.taskAdministrationReady ? 'forestSoft' : 'rose'} dot>
                  {arabic.taskAdministrationReady
                    ? 'Task administration approved'
                    : 'Not approved for Arabic tasks'}
                </Pill>
              </div>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-warm" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-forest transition-[width]"
                  style={{ width: `${arabic.readinessPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {arabic.readinessPercent}% of readiness stages complete
              </p>

              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {arabic.stages.map((stage) => (
                  <li key={stage.key} className="rounded-xl border border-line bg-white px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">{stage.label}</span>
                      <div className="flex items-center gap-2">
                        <StatusPill status={stage.status} />
                        {stage.status !== 'DONE' && (
                          <button
                            type="button"
                            className="text-[11px] font-semibold text-forest underline"
                            onClick={() => setForm({ language: 'Arabic', stage: stage.key, status: 'DONE', notes: '' })}
                          >
                            Record
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted">{stage.note}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">All languages</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Every stage is shown separately so a translated portal is never mistaken for a
              validated assessment.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.06em] text-sage-deep">
                    <th className="py-2 pr-3 font-bold">Language</th>
                    {TABLE_STAGES.map((stage) => (
                      <th key={stage.key} className="px-2 py-2 font-bold">
                        {stage.label}
                      </th>
                    ))}
                    <th className="px-2 py-2 font-bold">Task administration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.languages.map((language) => (
                    <tr key={language.language} className="border-b border-line/70 align-top">
                      <td className="py-3 pr-3">
                        <div className="text-[13px] font-semibold text-ink">{language.language}</div>
                        <div
                          className="text-xs text-muted"
                          dir={language.dir}
                          lang={language.bcp47}
                        >
                          {language.nativeName} · {language.bcp47}
                        </div>
                      </td>
                      {TABLE_STAGES.map((stage) => (
                        <td key={stage.key} className="px-2 py-3">
                          <StatusPill status={statusByKey(language, stage.key)} />
                        </td>
                      ))}
                      <td className="px-2 py-3">
                        <Pill tone={language.taskAdministrationReady ? 'forestSoft' : 'rose'} dot>
                          {language.taskAdministrationReady ? 'Approved' : 'Not approved'}
                        </Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Record a sign-off</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Clinicians record completed back-translation, pretesting or clinical review here. The readiness percentage and task-approval state update from these records, not from a static register.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-sage-deep">Language</span>
                <select
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  value={form.language}
                  onChange={(e) => setForm((c) => ({ ...c, language: e.target.value }))}
                >
                  {data.languages.map((language) => (
                    <option key={language.language} value={language.language}>{language.language}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-sage-deep">Stage</span>
                <select
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  value={form.stage}
                  onChange={(e) => setForm((c) => ({ ...c, stage: e.target.value }))}
                >
                  <option value="stimulus_translation">Task instructions &amp; stimuli translated</option>
                  <option value="back_translation">Independent back-translation</option>
                  <option value="cognitive_pretesting">Cognitive pretesting</option>
                  <option value="local_clinical_review">Local clinical review &amp; sign-off</option>
                  <option value="spoken_voice">Reviewed spoken voice</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-sage-deep">Status</span>
                <select
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                >
                  <option value="DONE">Done</option>
                  <option value="IN_PROGRESS">In progress</option>
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-sage-deep">Notes / evidence</span>
                <textarea
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                  placeholder="Reviewer, version, participant count, date of pretesting…"
                />
              </label>
            </div>
            {formError && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
                {formError}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={submitting}
                onClick={submitSignOff}
              >
                {submitting ? 'Recording…' : 'Record sign-off'}
              </button>
            </div>
          </Card>

          {(data.signOffs ?? []).length > 0 && (
            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Recorded sign-offs</h2>
              <ul className="mt-3 space-y-2">
                {(data.signOffs ?? []).map((signOff: any, index: number) => (
                  <li key={`${signOff.language}-${signOff.stage}-${index}`} className="rounded-xl border border-line bg-white px-3 py-2.5 text-xs">
                    <span className="font-semibold text-ink">{signOff.language}</span> · {signOff.stage.replace(/_/g, ' ')} ·{' '}
                    <StatusPill status={signOff.status} /> · recorded by {signOff.reviewer} on {formatDate(signOff.reviewedAt)}
                    {signOff.notes ? <p className="mt-1 text-muted">{signOff.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex items-start gap-2 rounded-2xl border border-line bg-white p-4 text-xs leading-5 text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            <p>{data.note}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorAssessmentReadinessPage;
