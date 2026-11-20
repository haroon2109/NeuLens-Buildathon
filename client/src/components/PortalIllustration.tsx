import type { FC } from 'react';
import { ClipboardCheck, ShieldCheck, Stethoscope, User } from 'lucide-react';
import { ElderCareMascot } from './ElderCareMascot';

type PortalIllustrationProps = {
  variant: 'patient' | 'clinician';
};

const copy = {
  patient: {
    eyebrow: 'Patient portal',
    title: 'A guided screening, at your pace',
    detail:
      'Follow clear instructions through each activity. Your responses and observations are shared with your care team for professional review.',
    points: [
      'Step-by-step memory, attention, and coordination activities',
      'Calm guidance designed to be easy to follow',
      'Results reviewed by a healthcare professional',
    ],
    icon: User,
    pose: 'welcome' as const,
  },
  clinician: {
    eyebrow: 'Clinician portal',
    title: 'Clear summaries for clinical review',
    detail:
      'Review structured session observations and longitudinal context to support informed, professional assessment.',
    points: [
      'Structured session summaries and response details',
      'Change and context viewed over time',
      'Secure, role-based access to records',
    ],
    icon: Stethoscope,
    pose: 'guide' as const,
  },
} as const;

export const PortalIllustration: FC<PortalIllustrationProps> = ({ variant }) => {
  const content = copy[variant];
  const Icon = content.icon;

  return (
    <section
      className="flex min-h-[420px] flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/60 p-7 shadow-sm lg:min-h-[560px] lg:p-10"
      aria-label={content.eyebrow}
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 shadow-sm">
          <Icon className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
          {content.eyebrow}
        </span>
        <div className="mt-5 flex items-end justify-between gap-4">
          <h2 className="max-w-md font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-900 sm:text-4xl">
            {content.title}
          </h2>
          <div className="hidden w-[132px] shrink-0 sm:block lg:w-[156px]">
            <ElderCareMascot
              pose={content.pose}
              character={variant === 'clinician' ? 'clinician' : 'patient'}
              className="h-auto w-full drop-shadow-sm"
            />
          </div>
        </div>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">{content.detail}</p>
      </div>

      <div className="mt-8 space-y-3">
        <div className="mb-2 flex justify-center sm:hidden">
          <ElderCareMascot
            pose={content.pose}
            character={variant === 'clinician' ? 'clinician' : 'patient'}
            className="h-auto w-[140px]"
          />
        </div>
        {content.points.map((point) => (
          <div
            key={point}
            className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="text-sm leading-6 text-slate-700">{point}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 border-t border-slate-200 pt-5 text-xs font-medium text-slate-500">
        <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span>Secure access · Information supports, not replaces, clinical judgment</span>
      </div>
    </section>
  );
};

export default PortalIllustration;
