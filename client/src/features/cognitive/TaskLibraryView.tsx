import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  ChevronDown,
  Clock3,
  Eye,
  FunctionSquare,
  Languages,
  ListChecks,
  Search,
  Shapes,
  Sparkles,
  Waypoints
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { COGNITIVE_DOMAINS, DOMAIN_LABEL, type CognitiveDomain } from './types';
import { COGNITIVE_TASKS } from './taskLibrary';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getCognitiveCopy } from '../../services/language/cognitiveCopy';

const domainIcon: Record<CognitiveDomain, LucideIcon> = {
  MEMORY: Brain,
  ATTENTION: Eye,
  EXECUTIVE: ListChecks,
  REASONING: Sparkles,
  LANGUAGE: Languages,
  VISUOSPATIAL: Shapes,
  FUNCTIONAL: Activity,
  PROCESSING_SPEED: Waypoints
};

export const TaskLibraryView: React.FC<{
  onStart?: () => void;
  compact?: boolean;
  title?: string;
}> = ({ onStart, compact, title }) => {
  const copy = getCognitiveCopy(useLanguageStore((state) => state.currentLanguage)).library;
  const domainNames = getCognitiveCopy(useLanguageStore((state) => state.currentLanguage)).domains;
  const [domain, setDomain] = useState<CognitiveDomain | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      COGNITIVE_TASKS.filter((task) => {
        const matchesDomain = domain === 'ALL' || task.domain === domain;
        const text = `${task.name} ${task.subdomain} ${task.description}`.toLowerCase();
        return matchesDomain && text.includes(query.toLowerCase());
      }),
    [domain, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title || copy.heading}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {copy.summary(COGNITIVE_TASKS.length, COGNITIVE_DOMAINS.length)}
          </p>
        </div>
        {onStart && (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white"
          >
            {copy.startAssessment} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <span className="sr-only">{copy.searchLabel}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="min-h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-forest"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDomain('ALL')}
            className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
              domain === 'ALL' ? 'border-forest bg-mint text-forest' : 'border-line bg-white text-body'
            }`}
          >
            {copy.all(COGNITIVE_TASKS.length)}
          </button>
          {COGNITIVE_DOMAINS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDomain(item.id)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
                domain === item.id ? 'border-forest bg-mint text-forest' : 'border-line bg-white text-body'
              }`}
            >
              {domainNames[item.id] || item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-line bg-warm/60 p-4 text-sm text-muted">{copy.noMatches}</p>
      )}

      <div className={compact ? 'space-y-2' : 'grid gap-3 lg:grid-cols-2'}>
        {filtered.map((task) => {
          const Icon = domainIcon[task.domain];
          const open = expanded === task.id;
          return (
            <div key={task.id} className="rounded-2xl border border-line bg-white p-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-ink">{task.name}</h3>
                    <span className="rounded-full border border-amber/60 bg-amber/10 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-amber-900">
                      {copy.researchStage}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{domainNames[task.domain] || DOMAIN_LABEL[task.domain]} · {task.subdomain}</p>
                  <p className="mt-1.5 text-xs leading-5 text-body">{task.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-warm px-2 py-0.5 font-semibold text-body">
                      <Clock3 className="h-3 w-3" /> {copy.minutes(task.durationMinutes)}
                    </span>
                    <span className="rounded-full bg-warm px-2 py-0.5 font-semibold text-body">{task.responseType}</span>
                    <span className="rounded-full bg-warm px-2 py-0.5 font-semibold text-body">v{task.version}</span>
                    <span className="rounded-full bg-warm px-2 py-0.5 font-semibold text-body">{copy.forms(task.alternateForms.join('/'))}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : task.id)}
                    aria-expanded={open}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline"
                  >
                    {copy.details} <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {open && (
                <div className="mt-3 space-y-2 rounded-xl border border-line bg-warm/50 p-3 text-[13px] leading-5">
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.instructions}</p>
                    <p className="text-body">{task.instructions}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.example}</p>
                    <p className="text-body">{task.example}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.difficultyLevels}</p>
                    <ol className="mt-0.5 space-y-0.5 text-body">
                      {task.difficultyLevels.map((level, index) => (
                        <li key={level}><span className="font-semibold text-ink">{copy.level(index + 1)}</span> {level}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.scoring}</p>
                    <p className="text-body">{task.scoringMethod}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.accessibility}</p>
                    <p className="text-body">{task.accessibilityRequirements.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.languageSupport}</p>
                    <p className="text-body">
                      {copy.englishOnly}{' '}
                      {task.languageSupport.length > 1
                        ? copy.additionalLanguages(task.languageSupport.join(', '))
                        : copy.translatedPending}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sage-deep">{copy.validation}</p>
                    <p className="text-body">{task.validationNote}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber/60 bg-amber/10 p-3 text-[13px] leading-5 text-amber-900">
        <p className="flex items-center gap-1.5 font-bold">
          <AlertTriangle className="h-3.5 w-3.5" /> {copy.noticeTitle}
        </p>
        <p className="mt-1">
          {copy.noticeBody}
        </p>
      </div>
    </div>
  );
};
