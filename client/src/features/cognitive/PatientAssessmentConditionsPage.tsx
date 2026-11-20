import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  Brain,
  ClipboardList,
  Info,
  Languages,
  Moon,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { Card, EmptyState, Pill, PortalPageHeader, formatDate } from '../patient/portal/ui';
import { usePatientPortalStore } from '../../store/patientPortalStore';
import { cognitiveApi, type CognitiveSessionRecord, type SessionContext } from './cognitiveApi';
import { DOMAIN_LABEL } from './types';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getCognitiveCopy } from '../../services/language/cognitiveCopy';

const label = (value: string | null | undefined, copy: ReturnType<typeof getCognitiveCopy>) =>
  value == null || value === ''
    ? copy.conditions.notReported
    : copy.conditions.values[value] || value.charAt(0).toUpperCase() + value.slice(1);

const yesNo = (value: number | null, suffix = '') =>
  value == null ? 'Not reported' : `${value}${suffix}`;

export const PatientAssessmentConditionsPage: React.FC = () => {
  const { accessibility, sleep, wellbeing } = usePatientPortalStore();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [sessions, setSessions] = useState<CognitiveSessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const copy = getCognitiveCopy(useLanguageStore((state) => state.currentLanguage));
  const c = copy.conditions;
  const domains = copy.domains;

  useEffect(() => {
    let cancelled = false;
    Promise.all([cognitiveApi.getContext(), cognitiveApi.getHistory()])
      .then(([contextResult, history]) => {
        if (cancelled) return;
        setContext(contextResult.context);
        setMissing(contextResult.missingFields);
        setSessions(history.sessions);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : c.loadError);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reportedBadge = <Pill tone="sage">{c.badgeReported}</Pill>;
  const recordedBadge = <Pill tone="forestSoft">{c.badgeRecorded}</Pill>;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        actions={<Link to="/patient/cognitive" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white">{c.startAssessment} <ArrowRight className="h-4 w-4" /></Link>}
      />

      {error && <p className="rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm text-amber-900">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <UserRound className="h-4 w-4 text-sage-deep" /> {c.profileTitle}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">{recordedBadge}</div>
          <dl className="mt-3 space-y-1.5 text-sm">
            {[
              [c.age, context?.age == null ? c.notRecorded : c.years(context.age)],
              [c.education, context?.educationYears == null ? c.notRecorded : c.years(context.educationYears)],
              [c.language, context?.language === 'en' ? c.english : context?.language?.toUpperCase() || c.notRecorded]
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-3">
                <dt className="text-muted">{term}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex gap-1.5 text-[13px] leading-5 text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {c.ageNote}
          </p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Moon className="h-4 w-4 text-sage-deep" /> {c.sleepTitle}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">{reportedBadge}</div>
          <dl className="mt-3 space-y-1.5 text-sm">
            {[
              [c.sleepLastNight, context?.sleepHours == null ? (sleep.durationHours || c.notReported) : c.hours(context.sleepHours)],
              [c.sleepQuality, context?.sleepQuality == null ? (sleep.quality || c.notReported) : c.outOfFive(context.sleepQuality)],
              [c.fatigue, context?.fatigue == null ? c.notReported : c.outOfFive(context.fatigue)],
              [c.mood, context?.mood == null ? (wellbeing.mood || c.notReported) : c.outOfFive(context.mood)],
              [c.stress, context?.stress == null ? (wellbeing.stress || c.notReported) : c.outOfFive(context.stress)]
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-3">
                <dt className="text-muted">{term}</dt>
                <dd className="text-right font-semibold text-ink">{String(value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 rounded-xl border border-mint bg-mint/50 p-2.5 text-[13px] leading-5 text-forest">
            {c.sleepNote}
          </p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Accessibility className="h-4 w-4 text-sage-deep" /> {c.sensoryTitle}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">{reportedBadge}</div>
          <dl className="mt-3 space-y-1.5 text-sm">
            {[
              [c.vision, label(context?.vision, copy)],
              [c.hearing, label(context?.hearing, copy)],
              [c.motor, label(context?.motor, copy)],
              [c.deviceFamiliarity, label(context?.digitalFamiliarity, copy)],
              [c.device, label(context?.device, copy)],
              [c.textSize, label(accessibility.textSize, copy)],
              [c.highContrast, accessibility.highContrast ? c.on : c.off]
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-3">
                <dt className="text-muted">{term}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {missing.length > 0 && (
        <div className="rounded-2xl border border-amber/60 bg-amber/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> {c.missingTitle}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-900/85">
            {c.missingBody(missing.map((field) => c.fieldNames[field] || field).join('، '))}
          </p>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <ClipboardList className="h-4 w-4 text-forest" /> {c.previousTitle}
          </h2>
          <Pill tone="sage">{c.recordedSessions}</Pill>
        </div>
        {sessions.length === 0 ? (
          <EmptyState
            icon={Brain}
            title={c.emptyTitle}
            detail={c.emptyDetail}
            action={<Link to="/patient/cognitive" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white">{c.startAssessment}</Link>}
          />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-line text-[12px] uppercase tracking-wide text-sage-deep">
                  <th className="py-2 pr-3">{c.colDate}</th>
                  <th className="px-3 py-2">{c.colMode}</th>
                  <th className="px-3 py-2">{c.colCompleted}</th>
                  <th className="px-3 py-2">{c.colDomains}</th>
                  <th className="px-3 py-2">{c.colComparison}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.sessionId} className="border-b border-line/70 last:border-0">
                    <td className="py-2.5 pr-3 font-semibold text-ink">{formatDate(session.completedAt)}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={session.mode === 'STANDARDIZED' ? 'forestSoft' : 'amber'}>
                        {session.mode === 'STANDARDIZED' ? c.standardized : c.exploratory}
                      </Pill>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {session.tasks.filter((task) => task.completed).length} of {session.tasks.length}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {session.domains.map((domain) => domains[domain.domain] || DOMAIN_LABEL[domain.domain]).join(', ')}
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill tone={session.quality.comparable ? 'forestSoft' : 'amber'}>
                        {session.quality.comparable ? c.comparable : c.notComparable}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-5 text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {c.storageNote}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Languages className="h-4 w-4 text-sage-deep" /> {c.languageTitle}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {c.languagePreference(context?.language ? label(context.language, copy) : c.notReported)}
          </p>
          <p className="mt-2 rounded-xl border border-line bg-warm/60 p-3 text-[13px] leading-5 text-muted">
            {c.languageNote}
          </p>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-ink">{c.measuredTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {c.measuredNote}
          </p>
          <Link to="/patient/history" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-warm">
            {c.openHistory} <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </div>
  );
};
