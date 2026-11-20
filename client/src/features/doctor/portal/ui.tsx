import type { FC, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  Info,
  Route,
  Send,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';
import { Pill } from '../../patient/portal/ui';

export {
  Card,
  EmptyState,
  InfoRow,
  Pill,
  ScoreDial,
  SectionTitle,
  StatCard,
  Toggle,
  TrendLine,
  formatDate,
  formatDateTime
} from '../../patient/portal/ui';
export type { Tone } from '../../patient/portal/ui';

/*
 * Clinician controls share the portal button/field classes defined in
 * portalDesignSystem.css (`doctor-portal` scope), so a clinician and a patient
 * see the same shapes, radii and focus rings across the product.
 */
/**
 * Renders a recorded score, or states plainly that no interpretable score exists.
 * There is no fallback number: a missing score is not a low score and not a normal one.
 */
export const formatScore = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value)} / 100`
    : 'Not interpretable';

export const primaryButton = 'pp-btn pp-btn-primary pp-btn-sm';
export const secondaryButton = 'pp-btn pp-btn-secondary pp-btn-sm';
export const dangerButton = 'pp-btn pp-btn-danger pp-btn-sm';
export const fieldClass = 'pp-input';
export const labelClass = 'pp-label';

export const DoctorPageHeader: FC<{
  screen: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}> = ({ screen, title, description, actions, meta }) => (
  <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <p className="pp-eyebrow">{screen}</p>
      <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[30px]">
        {title}
      </h1>
      {description && <p className="mt-2 max-w-3xl text-[14px] leading-6 text-body">{description}</p>}
      {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

/**
 * Administrative review state — never a clinical risk tier.
 *
 * There is deliberately no green "low concern" pill: an unreviewed record is
 * not reassurance, and a missing score is not a normal result.
 */
export const ReviewStatePill: FC<{ state?: string | null }> = ({ state }) => {
  switch ((state || '').toUpperCase()) {
    case 'REVIEW_PROMPT':
      return <Pill tone="amber" dot>Review prompt</Pill>;
    case 'NOT_INTERPRETABLE':
      return <Pill tone="sage">Not interpretable</Pill>;
    case 'CLINICIAN_REVIEWED':
      return <Pill tone="forestSoft" dot>Clinician reviewed</Pill>;
    case 'NOT_REVIEWED':
      return <Pill tone="mint" dot>Not reviewed</Pill>;
    default:
      return <Pill tone="sage">Not screened</Pill>;
  }
};

export const ReviewPill: FC<{ status?: string | null }> = ({ status }) => {
  switch ((status || '').toUpperCase()) {
    case 'REVIEWED':
      return <Pill tone="forestSoft" dot>Reviewed</Pill>;
    case 'FOLLOWUP_REQUIRED':
      return <Pill tone="amber" dot>Follow-up suggested</Pill>;
    case 'PENDING_REVIEW':
      return <Pill tone="mint" dot>Awaiting review</Pill>;
    default:
      return <Pill tone="sage">Not reviewed</Pill>;
  }
};

export const ChangePill: FC<{ status?: string | null }> = ({ status }) => {
  switch (status) {
    case 'REVIEW':
      return <Pill tone="amber" dot>Review prompt</Pill>;
    case 'NO_CHANGE':
      return <Pill tone="forestSoft" dot>Stable</Pill>;
    default:
      return <Pill tone="sage">More comparisons needed</Pill>;
  }
};

const workflowItems = [
  { suffix: '', label: 'Summary', icon: ClipboardList, end: true },
  { suffix: '/review', label: 'Assessment review', icon: FileText },
  { suffix: '/longitudinal', label: 'Longitudinal', icon: TrendingUp },
  { suffix: '/change-detection', label: 'Change review', icon: Activity },
  { suffix: '/context', label: 'Health context', icon: HeartPulse },
  { suffix: '/notes', label: 'Notes & findings', icon: Brain },
  { suffix: '/care-plan', label: 'Care plan', icon: CalendarCheck },
  { suffix: '/referrals', label: 'Referrals', icon: Send },
  { suffix: '/appointments', label: 'Appointments', icon: CalendarDays }
];

export const PatientWorkflowNav: FC<{ patientId: string }> = ({ patientId }) => (
  <nav
    className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1 shadow-card"
    aria-label="Patient record sections"
  >
    {workflowItems.map(({ suffix, label, icon: Icon, end }) => (
      <NavLink
        key={suffix || 'summary'}
        to={`/doctor/patients/${patientId}${suffix}`}
        end={end}
        className={({ isActive }) =>
          `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${
            isActive ? 'bg-mint text-forest' : 'text-body hover:bg-warm hover:text-ink'
          }`
        }
      >
        <Icon className="h-3.5 w-3.5 stroke-[1.8]" aria-hidden="true" />
        {label}
      </NavLink>
    ))}
  </nav>
);

export const Notice: FC<{
  tone?: 'info' | 'warning' | 'success' | 'danger';
  title: string;
  children: ReactNode;
}> = ({ tone = 'info', title, children }) => {
  const styles = {
    info: 'pp-notice',
    warning: 'pp-notice pp-warning',
    success: 'pp-notice pp-success',
    danger: 'pp-notice pp-error'
  }[tone];
  const Icon =
    tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : tone === 'danger' ? ShieldAlert : Info;
  return (
    <div className={styles} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <div>
        <p className="text-[14px] font-bold">{title}</p>
        <div className="mt-1 text-[14px] leading-5">{children}</div>
      </div>
    </div>
  );
};

export const MetricTile: FC<{ label: string; value: string; detail?: string }> = ({
  label,
  value,
  detail
}) => (
  <div className="rounded-xl border border-line bg-warm/60 p-3">
    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep">{label}</p>
    <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em] text-ink">{value}</p>
    {detail && <p className="mt-0.5 text-[13px] leading-4 text-muted">{detail}</p>}
  </div>
);

/** Empty-row helper for clinical tables, so every list has a designed state. */
export const TableEmpty: FC<{ title: string; detail: string; action?: ReactNode }> = ({
  title,
  detail,
  action
}) => (
  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest">
      <ClipboardList className="h-5 w-5" aria-hidden="true" />
    </span>
    <p className="text-[14px] font-semibold text-ink">{title}</p>
    <p className="max-w-sm text-[14px] leading-5 text-muted">{detail}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const iconForDomain: Record<string, typeof Brain> = {
  cognitive: Brain,
  ocular: Route,
  vocal: Activity,
  facial: HeartPulse,
  functional: ClipboardList
};

