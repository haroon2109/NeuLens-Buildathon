import type { FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { HealthcareScene, type SceneKind } from '../../../components/illustrations/HealthcareScene';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getPortalTranslation } from '../../../services/language/portalTranslations';

/**
 * Portal button classes.
 *
 * Every button in the patient portal is built from one of these strings, so the
 * `pp-btn` base class cannot go missing again: `.pp-btn` supplies the layout,
 * size, radius and focus ring, and the modifier supplies the colour. Layout
 * utilities (`inline-flex`, `items-center`, `gap-2`, `min-h-11`, `rounded-xl`)
 * are deliberately absent — they are inert here, because `.patient-portal
 * .pp-btn` outranks a single utility class.
 *
 * `shrink-0` keeps a button from collapsing inside a flex row: beside a
 * sentence, the sentence wraps and the button keeps its label on one line.
 */
export const primaryButton = 'pp-btn pp-btn-primary pp-btn-sm shrink-0';
export const secondaryButton = 'pp-btn pp-btn-secondary pp-btn-sm shrink-0';

const displayLocale = (): string => {
  if (typeof document === 'undefined') return 'en-US';
  const lang = document.documentElement.lang || 'en-US';
  if (lang === 'ar') return 'ar-AE';
  return lang;
};

export const formatDate = (value?: string | Date | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return 'Not available';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString(displayLocale(), options || { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'Not available';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Not available';
  return `${date.toLocaleDateString(displayLocale(), { day: 'numeric', month: 'short' })} · ${date.toLocaleTimeString(displayLocale(), { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatTime = (value?: string | Date | null) => {
  if (!value) return 'Not available';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleTimeString(displayLocale(), { hour: '2-digit', minute: '2-digit' });
};

/**
 * NeuLens pill tones map onto the landing page palette:
 *   forest  — primary action / "awating review" state (sage-deep-ish forest)
 *   mint    — subtle highlight / "in progress"
 *   amber   — warning / follow-up suggested
 *   rose    — attention / error
 *   sage    — neutral secondary (replaces old "slate")
 *   ink     — dark text pill (replaces old "violet")
 */
export type Tone = 'forest' | 'forestSoft' | 'mint' | 'amber' | 'rose' | 'sage' | 'ink';

/**
 * Older screens still pass the pre-design-system tone names. They are folded
 * into the sage/forest palette here so no page drifts back to blue or slate.
 */
type LegacyTone = 'green' | 'blue' | 'slate' | 'violet';
export type AnyTone = Tone | LegacyTone;

const legacyToneMap: Record<LegacyTone, Tone> = {
  green: 'forestSoft',
  blue: 'mint',
  slate: 'sage',
  violet: 'ink'
};

const toneClasses: Record<Tone, string> = {
  forest: 'border-forest/40 bg-forest text-white', // solid forest for primary emphasis
  forestSoft: 'border-forest bg-mint text-forest',
  mint: 'border-mint/70 bg-mint/60 text-forest',
  amber: 'border-amber/60 bg-amber/10 text-amber-900',
  rose: 'border-rose/60 bg-rose/10 text-rose-900',
  sage: 'border-line bg-white text-sage-deep',
  ink: 'border-line bg-white text-ink'
};

const dotForTone: Record<Tone, string> = {
  forest: 'bg-current shadow-[0_0_6px_rgba(47,94,78,0.6)]',
  forestSoft: 'bg-forest shadow-[0_0_6px_rgba(47,94,78,0.5)]',
  mint: 'bg-forest shadow-[0_0_6px_rgba(47,94,78,0.5)]',
  amber: 'bg-amber-600 shadow-[0_0_6px_rgba(217,119,6,0.5)]',
  rose: 'bg-rose-600 shadow-[0_0_6px_rgba(180,35,50,0.5)]',
  sage: 'bg-sage-deep shadow-[0_0_6px_rgba(70,113,94,0.5)]',
  ink: 'bg-ink shadow-[0_0_6px_rgba(27,51,43,0.5)]'
};

const resolveTone = (tone: AnyTone): Tone =>
  tone in legacyToneMap ? legacyToneMap[tone as LegacyTone] : (tone as Tone);

export const Pill: FC<{ children: ReactNode; tone?: AnyTone; dot?: boolean }> = ({
  children,
  tone = 'sage',
  dot = false
}) => {
  const resolved = resolveTone(tone);
  return (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
      toneClasses[resolved]
    }`}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotForTone[resolved]}`} />}
    {children}
  </span>
  );
};

export const PortalPageHeader: FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}> = ({ eyebrow, title, description, actions, icon: Icon }) => (
  <header className="flex flex-col gap-4 border-b border-line/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && (
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-sage-deep">
          {Icon && <Icon className="h-3.5 w-3.5 text-sage-deep" aria-hidden="true" />}
          {eyebrow}
        </div>
      )}
      <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[30px]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-body">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

/**
 * Card — white surface with soft NeuLens shadow and 1.5rem radius (matches lp-card).
 * Padding is opt-in to keep nested layouts flexible.
 */
export const Card: FC<{ children: ReactNode; className?: string; padded?: boolean }> = ({
  children,
  className = '',
  padded = true
}) => (
  <section className={`min-w-0 rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(27,51,43,0.03),0_24px_60px_-58px_rgba(27,51,43,0.45)] ${padded ? 'p-5' : ''} ${className}`}>
    {children}
  </section>
);

export const SectionTitle: FC<{ title: string; detail?: string; action?: ReactNode }> = ({
  title,
  detail,
  action
}) => (
  <div className="mb-4 flex items-start justify-between gap-4">
    <div>
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {detail && <p className="mt-1 text-[14px] leading-5 text-muted">{detail}</p>}
    </div>
    {action}
  </div>
);

/**
 * StatCard — sage-tinted label strip, large ink value, subtle icon chip.
 */
export const StatCard: FC<{
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: AnyTone;
}> = ({ label, value, detail, icon: Icon, tone = 'forest' }) => {
  const resolvedTone = resolveTone(tone);
  const chipTone: Tone =
    resolvedTone === 'ink' || resolvedTone === 'sage' || resolvedTone === 'mint' || resolvedTone === 'amber'
      ? resolvedTone
      : 'forestSoft';
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClasses[chipTone]}`}>
          <Icon className="h-4 w-4 stroke-[1.8]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-[21px] font-semibold tracking-[-0.03em] text-ink">{value}</p>
      {detail && <p className="mt-1 text-[13px] leading-5 text-muted">{detail}</p>}
    </div>
  );
};

export const InfoRow: FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
    <dt className="text-[14px] text-muted">{label}</dt>
    <dd className="max-w-[60%] text-right text-[14px] font-semibold text-ink">{value}</dd>
  </div>
);

export const EmptyState: FC<{
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: ReactNode;
  scene?: SceneKind;
}> = ({ icon: Icon, title, detail, action, scene }) => (
  <div className="rounded-2xl border border-dashed border-line bg-warm/70 px-6 py-10 text-center">
    {scene ? (
      <HealthcareScene kind={scene} className="mx-auto mb-1 w-full max-w-[240px]" />
    ) : (
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest shadow-xs">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    )}
    <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-[14px] leading-5 text-muted">{detail}</p>
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export const Toggle: FC<{
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ label, detail, checked, onChange, disabled }) => (
  <label
    className={`flex items-start justify-between gap-4 rounded-xl border border-line p-3.5 ${
      disabled ? 'opacity-70' : 'cursor-pointer hover:border-sage-dark/60'
    }`}
  >
    <span>
      <span className="block text-[14px] font-semibold text-ink">{label}</span>
      {detail && <span className="mt-1 block text-[13px] leading-5 text-muted">{detail}</span>}
    </span>
    <span
      className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-forest' : 'bg-slate-300'
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </span>
  </label>
);

export const TrendLine: FC<{
  points: Array<{ label: string; value: number }>;
  min?: number;
  max?: number;
  tone?: string;
  height?: number;
  valueSuffix?: string;
}> = ({ points, min, max, tone = '#2f5e4e', height = 150, valueSuffix = '' }) => {
  if (points.length < 2) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed border-line bg-warm text-[13px] text-muted">
        More valid sessions are needed to show a trend.
      </div>
    );
  }

  const values = points.map((point) => point.value);
  const low = min ?? Math.min(...values) - 2;
  const high = max ?? Math.max(...values) + 2;
  const range = Math.max(high - low, 1);
  const width = 340;
  const padding = { left: 12, right: 12, top: 16, bottom: 26 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const coords = points.map((point, index) => {
    const x = padding.left + (index / (points.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((point.value - low) / range) * chartHeight;
    return { ...point, x, y };
  });

  const path = coords.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[150px] w-full" role="img" aria-label="Trend chart">
      {[0, 1, 2].map((line) => {
        const y = padding.top + (line / 2) * chartHeight;
        return (
          <line
            key={line}
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            stroke="#e2e7df"
            strokeDasharray="3 5"
          />
        );
      })}
      <polyline
        points={path}
        fill="none"
        stroke={tone}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="4" fill="white" stroke={tone} strokeWidth="2.5" />
          <title>{`${point.label}: ${point.value}${valueSuffix}`}</title>
        </g>
      ))}
      {points.map((point, index) => (
        <text
          key={`${point.label}-label-${index}`}
          x={coords[index].x}
          y={height - 6}
          textAnchor="middle"
          fontSize="8.5"
          fill="#63716b"
        >
          {point.label}
        </text>
      ))}
    </svg>
  );
};

export const ScoreDial: FC<{ value: number | null; label: string; tone?: string }> = ({
  value,
  label,
  tone = '#2f5e4e'
}) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  const offset = hasValue ? circumference - (clamped / 100) * circumference : circumference;

  return (
    <div className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e7df" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <span className="block text-[22px] font-semibold leading-none text-ink">{hasValue ? Math.round(clamped) : '—'}</span>
        <span className="mt-1 block text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{label}</span>
      </div>
    </div>
  );
};

export const AssessmentStatusPill: FC<{ reviewStatus: string; status?: string }> = ({
  reviewStatus,
  status = 'COMPLETED'
}) => {
  const status_copy = getPortalTranslation(useLanguageStore((state) => state.currentLanguage)).shell.status;
  if (status !== 'COMPLETED') return <Pill tone="mint" dot>{status_copy.inProgress}</Pill>;
  if (reviewStatus === 'REVIEWED') return <Pill tone="forest" dot>{status_copy.reviewed}</Pill>;
  if (reviewStatus === 'FOLLOWUP_REQUIRED') return <Pill tone="amber" dot>{status_copy.followUpSuggested}</Pill>;
  return <Pill tone="forestSoft" dot>{status_copy.awaitingReview}</Pill>;
};
