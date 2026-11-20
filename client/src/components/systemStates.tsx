import React from 'react';
import { HealthcareScene } from './illustrations/HealthcareScene';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Brain,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileQuestion,
  Info,
  Loader2,
  Mic,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AnyTone, Tone } from '../features/patient/portal/ui';

/** Old blue/green/slate/violet tones fold into the NeuLens palette. */
const legacyTone: Record<string, Tone> = {
  blue: 'mint',
  green: 'forestSoft',
  slate: 'sage',
  violet: 'ink'
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';

/* ---------------------------------------------------------------------------
 * Shared building blocks for the non-happy paths.
 *
 * Design constraints:
 *  - Older adults first: body text never below 14px, generous padding, one
 *    primary action, plain language, no colour-only meaning.
 *  - These are states, not sidebar destinations: every component renders
 *    inline inside a page, or as a focused dialog.
 *  - Wording stays descriptive. Nothing here reports a diagnosis or a
 *    probability of disease.
 * ------------------------------------------------------------------------- */

const toneStyles: Record<Tone, { wrap: string; icon: string; button: string }> = {
  forest: { wrap: 'border-forest/30 bg-mint/50', icon: 'bg-forest text-white', button: 'bg-forest hover:bg-forest-deep text-white' },
  forestSoft: { wrap: 'border-sage/60 bg-mint/40', icon: 'bg-mint text-forest', button: 'bg-forest hover:bg-forest-deep text-white' },
  mint: { wrap: 'border-mint bg-mint/40', icon: 'bg-white text-forest', button: 'bg-forest hover:bg-forest-deep text-white' },
  amber: { wrap: 'border-amber/60 bg-amber/10', icon: 'bg-amber/15 text-amber-800', button: 'bg-amber-700 hover:bg-amber-800 text-white' },
  rose: { wrap: 'border-rose/40 bg-rose/10', icon: 'bg-rose/15 text-rose-700', button: 'bg-rose-700 hover:bg-rose-800 text-white' },
  sage: { wrap: 'border-line bg-warm/70', icon: 'bg-white text-sage-deep', button: 'bg-forest hover:bg-forest-deep text-white' },
  ink: { wrap: 'border-line bg-white', icon: 'bg-ink text-white', button: 'bg-ink hover:bg-forest-deep text-white' }
};

export const stateButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-[14px] font-semibold text-white shadow-pill transition hover:bg-forest-deep focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest disabled:cursor-not-allowed disabled:opacity-60';
export const stateButtonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 py-3 text-[14px] font-semibold text-ink transition hover:border-sage-dark hover:bg-warm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest disabled:cursor-not-allowed disabled:opacity-60';

/* ------------------------------------------------------------------ panels */

export const StatePanel: React.FC<{
  icon: LucideIcon;
  tone?: AnyTone;
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  notes?: string[];
  compact?: boolean;
  illustration?: React.ReactNode;
}> = ({ icon: Icon, tone = 'sage', eyebrow, title, description, children, actions, notes, compact = false, illustration }) => {
  const resolved = legacyTone[tone] ?? (tone as Tone);
  const styles = toneStyles[resolved] ?? toneStyles.sage;
  return (
    <section
      role="status"
      aria-live="polite"
      className={`rounded-2xl border ${styles.wrap} ${compact ? 'p-5' : 'p-6 sm:p-8'}`}
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-slate-500">{eyebrow}</p>
          )}
          <h2 className="mt-1 text-[19px] font-semibold leading-snug text-slate-900">{title}</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-700">{description}</p>
          {children}
          {notes && notes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {notes.map((note) => (
                <li key={note} className="flex gap-2 text-[14px] leading-6 text-slate-700">
                  <Info className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
          {actions && <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {illustration && <div className="w-full max-w-[220px] sm:ml-auto sm:w-[220px] shrink-0 opacity-95">{illustration}</div>}
      </div>
    </section>
  );
};

/* ------------------------------------------------------- loading / error */

export const LoadingState: React.FC<{ label?: string; detail?: string; rows?: number }> = ({
  label = 'Loading…',
  detail,
  rows = 3
}) => (
  <section role="status" aria-live="polite" aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="flex items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-blue-700" aria-hidden="true" />
      <p className="text-[15px] font-semibold text-slate-800">{label}</p>
    </div>
    {detail && <p className="mt-2 text-[14px] leading-6 text-slate-600">{detail}</p>}
    <div className="mt-5 space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-3 animate-pulse rounded-full bg-slate-100"
          style={{ width: `${88 - index * 14}%` }}
        />
      ))}
    </div>
  </section>
);

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: React.ReactNode;
  offline?: boolean;
}> = ({
  title = 'We could not load this right now',
  description = 'Something interrupted the request. Your information is safe — please try again.',
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  offline = false
}) => (
  <StatePanel
    icon={offline ? WifiOff : AlertTriangle}
    tone="rose"
    title={title}
    description={description}
    illustration={<HealthcareScene kind="errorCalm" className="w-full" />}
    notes={
      offline
        ? ['Check that you are connected to the internet.', 'If the problem continues, contact support.']
        : undefined
    }
    actions={
      <>
        {onRetry && (
          <button type="button" onClick={onRetry} className={`${stateButton} ${toneStyles.rose.button}`}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> {retryLabel}
          </button>
        )}
        {secondaryAction}
      </>
    }
  />
);

/* -------------------------------------------------- camera / microphone */

export type SensorKind = 'camera' | 'microphone' | 'both';

const sensorCopy: Record<SensorKind, { icon: LucideIcon; title: string; description: string; notes: string[] }> = {
  camera: {
    icon: Camera,
    title: 'Camera access is turned off',
    description:
      'The eye and facial activities need your camera. You can allow access in your browser, or continue with the activities that do not need it.',
    notes: [
      'Look for the camera icon in your browser address bar and choose “Allow”.',
      'On a tablet or phone, check Settings → Privacy → Camera for this browser.',
      'Nothing is recorded or shared until you start the activity.'
    ]
  },
  microphone: {
    icon: Mic,
    title: 'Microphone access is turned off',
    description:
      'The voice activity needs your microphone. You can allow access in your browser, or continue with the activities that do not need it.',
    notes: [
      'Look for the microphone icon in your browser address bar and choose “Allow”.',
      'On a tablet or phone, check Settings → Privacy → Microphone for this browser.',
      'Other people in the room will be able to hear the instructions, so choose a quiet space.'
    ]
  },
  both: {
    icon: Camera,
    title: 'Camera and microphone access are turned off',
    description:
      'This session uses your camera and microphone. You can allow access in your browser settings, or continue without the activities that need them.',
    notes: [
      'Open your browser settings for this site and allow camera and microphone.',
      'Check the privacy settings on your device if the browser does not ask.',
      'You can pause and finish the remaining activities at any time.'
    ]
  }
};

export const PermissionDeniedState: React.FC<{
  kind: SensorKind;
  onRetry?: () => void;
  onContinueWithout?: () => void;
  continueLabel?: string;
  compact?: boolean;
}> = ({ kind, onRetry, onContinueWithout, continueLabel = 'Continue without this activity', compact }) => {
  const copy = sensorCopy[kind];
  return (
    <div className="space-y-3">
      <StatePanel
        icon={copy.icon}
        tone="amber"
        eyebrow="Permission needed"
        title={copy.title}
        description={copy.description}
        notes={copy.notes}
        compact={compact}
        actions={
          <>
            {onRetry && (
              <button type="button" onClick={onRetry} className={`${stateButton} ${toneStyles.amber.button}`}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Check access again
              </button>
            )}
            {onContinueWithout && (
              <button type="button" onClick={onContinueWithout} className={stateButtonSecondary}>
                {continueLabel}
              </button>
            )}
          </>
        }
      />
      <p className="px-1 text-[14px] leading-6 text-slate-500">
        If access stays blocked, this activity can be skipped. A session with skipped activities is marked as
        partially completed and is not compared with your earlier sessions.
      </p>
    </div>
  );
};

/* -------------------------------------------------- assessment lifecycle */

export const InterruptedState: React.FC<{
  stageLabel: string;
  savedAt?: string | null;
  onResume: () => void;
  onRestart: () => void;
}> = ({ stageLabel, savedAt, onResume, onRestart }) => (
  <StatePanel
    icon={Clock3}
    tone="blue"
    eyebrow="Session paused"
    title="Your assessment was interrupted"
    description={`You stopped during “${stageLabel}”. Nothing has been submitted yet. You can pick up where you left off, or begin the whole session again.`}
    notes={[
      savedAt ? `Last saved ${savedAt}.` : 'Progress up to your last completed activity is saved on this device.',
      'Resuming may repeat the activity you were in the middle of.',
      'Recording only starts again after you confirm.'
    ]}
    actions={
      <>
        <button type="button" onClick={onResume} className={`${stateButton} ${toneStyles.forest.button}`}>
          Resume assessment
        </button>
        <button type="button" onClick={onRestart} className={stateButtonSecondary}>
          Start over
        </button>
      </>
    }
  />
);

export const AssessmentUnavailableState: React.FC<{
  onRetry?: () => void;
  supportEmail?: string;
  reason?: string;
}> = ({ onRetry, supportEmail = 'support@neulens.health', reason }) => (
  <StatePanel
    icon={FileQuestion}
    tone="slate"
    eyebrow="Assessment unavailable"
    title="This assessment cannot start right now"
    description={
      reason ||
      'A technical problem is preventing the assessment from opening. Your previous results are unaffected and you can come back to this later.'
    }
    notes={[
      'Close other apps or browser tabs that may be using the camera.',
      'Try a different browser or device if the problem continues.',
      `If it still does not open, contact ${supportEmail}.`
    ]}
    actions={
      <>
        {onRetry && (
          <button type="button" onClick={onRetry} className={`${stateButton} ${toneStyles.sage.button}`}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reload the assessment
          </button>
        )}
        <Link to="/patient/help" className={stateButtonSecondary}>
          Get help
        </Link>
      </>
    }
  />
);

/* ------------------------------------------------- monitoring findings */

export type MonitoringFinding =
  | 'NO_BASELINE'
  | 'INSUFFICIENT_DATA'
  | 'NO_SIGNIFICANT_CHANGE'
  | 'REVIEW_REQUIRED';

const findingCopy: Record<
  MonitoringFinding,
  { icon: LucideIcon; tone: Tone; eyebrow: string; title: string; description: string; notes: string[] }
> = {
  NO_BASELINE: {
    icon: Brain,
    tone: 'mint',
    eyebrow: 'Baseline needed',
    title: 'No baseline yet',
    description:
      'Comparison needs a first completed assessment. Once one is finished, this screen can describe what is typical for you.',
    notes: [
      'Your first session creates a provisional baseline, not a diagnosis.',
      'It becomes more reliable as comparable sessions are added.'
    ]
  },
  INSUFFICIENT_DATA: {
    icon: ClipboardList,
    tone: 'amber',
    eyebrow: 'Not enough data',
    title: 'Not enough valid observations',
    description:
      'There were not enough complete, good-quality observations to describe a change. We would rather show nothing than an unreliable signal.',
    notes: [
      'A noisy room, skipped activity, or poor camera position can limit a session.',
      'No interpretation of decline is made from a limited session.',
      'Two or three comparable sessions usually make a comparison possible.'
    ]
  },
  NO_SIGNIFICANT_CHANGE: {
    icon: CheckCircle2,
    tone: 'forestSoft',
    eyebrow: 'Monitoring result',
    title: 'No significant change detected',
    description:
      'Your recent observations stayed within the range recorded for you. This is a monitoring result, not a clean bill of health.',
    notes: [
      'Small session-to-session variation is expected.',
      'Keep noting sleep, stress, and medication changes in Health context.'
    ]
  },
  REVIEW_REQUIRED: {
    icon: ShieldAlert,
    tone: 'amber',
    eyebrow: 'Clinical review requested',
    title: 'A clinician review has been suggested',
    description:
      'Some observations moved outside your recorded range. This is a prompt for a clinician to look at the results with context — it does not mean something is wrong.',
    notes: [
      'A clinician reviews session quality and health context before drawing conclusions.',
      'Your clinician decides whether further evaluation, a referral, or a repeat session is needed.'
    ]
  }
};

export const MonitoringResultState: React.FC<{
  finding: MonitoringFinding;
  detailOverrides?: Partial<{ title: string; description: string }>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}> = ({ finding, detailOverrides, children, actions, compact }) => {
  const copy = findingCopy[finding];
  return (
    <StatePanel
      icon={copy.icon}
      tone={copy.tone}
      eyebrow={copy.eyebrow}
      title={detailOverrides?.title || copy.title}
      description={detailOverrides?.description || copy.description}
      notes={copy.notes}
      compact={compact}
      actions={actions}
    >
      {children}
    </StatePanel>
  );
};

/* ------------------------------------------------------ consent / account */

export const ConsentWithdrawnState: React.FC<{
  withdrawn: string[];
  effectiveNote?: string;
  onRestore?: () => void;
  restoreLabel?: string;
  eyebrow?: string;
  title?: string;
  noteSuffix?: string;
}> = ({
  withdrawn,
  effectiveNote = 'Data collection for the withdrawn items has stopped. Care already provided is not affected.',
  onRestore,
  restoreLabel = 'Restore these permissions',
  eyebrow = 'Consent withdrawn',
  title = 'Some data collection has stopped',
  noteSuffix = 'is switched off.'
}) => (
  <StatePanel
    icon={ShieldCheck}
    tone="violet"
    eyebrow={eyebrow}
    title={title}
    description={effectiveNote}
    notes={withdrawn.map((item) => `${item} ${noteSuffix}`)}
    actions={
      onRestore ? (
        <button type="button" onClick={onRestore} className={`${stateButton} ${toneStyles.ink.button}`}>
          {restoreLabel}
        </button>
      ) : undefined
    }
  />
);

export const AccountSuspendedState: React.FC<{ reason?: string; onSignOut: () => void }> = ({
  reason,
  onSignOut
}) => (
  <StatePanel
    icon={ShieldAlert}
    tone="rose"
    eyebrow="Access restricted"
    title="This account is suspended"
    description={
      reason ||
      'Access to records and assessments is paused while the account is reviewed. Your data has not been deleted.'
    }
    notes={[
      'Scheduled assessments and reports are not available while suspended.',
      'Contact support if you believe this is a mistake or to ask about restoration.'
    ]}
    actions={
      <>
        <a href="mailto:support@neulens.health" className={`${stateButton} ${toneStyles.rose.button}`}>
          Contact support
        </a>
        <button type="button" onClick={onSignOut} className={stateButtonSecondary}>
          Sign out
        </button>
      </>
    }
  />
);

/* --------------------------------------------------------------- dialogs */

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent role="alertdialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <button type="button" onClick={onCancel} className={`${stateButtonSecondary} sm:w-auto`}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${stateButton} ${destructive ? 'bg-rose-700 hover:bg-rose-800 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const SESSION_EXPIRED_EVENT = 'neulens:session-expired';

/** Marks the session as expired wherever an API call returns 401. */
export const notifySessionExpired = (message?: string) => {
  try {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
  } catch {
    // Non-browser environments (tests, SSR) do not need the notification.
  }
};

export const SessionExpiredDialog: React.FC<{
  onSignIn: (nextPath: string) => void;
  message?: string;
}> = ({ onSignIn, message }) => {
  const [expired, setExpired] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setExpired(detail?.message || message || 'For your security, you need to sign in again to continue.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [message]);

  const nextPath = `${window.location.pathname}${window.location.search}`;

  return (
    <Dialog open={Boolean(expired)} onOpenChange={() => undefined}>
      <DialogContent
        role="alertdialog"
        aria-describedby={undefined}
        className="[&>button.absolute]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Clock3 className="h-6 w-6" aria-hidden="true" />
        </span>
        <DialogTitle className="mt-4">Your session has ended</DialogTitle>
        <DialogDescription asChild>
          <div>
            <p className="mt-2 text-[14px] leading-6 text-slate-600">{expired || ''}</p>
            <p className="mt-2 text-[14px] leading-6 text-slate-500">
              Nothing you saved before this point has been lost.
            </p>
          </div>
        </DialogDescription>
        <button
          type="button"
          onClick={() => onSignIn(nextPath)}
          className={`${stateButton} mt-6 w-full bg-blue-700 text-white hover:bg-blue-800`}
        >
          Sign in again
        </button>
      </DialogContent>
    </Dialog>
  );
};

export const PartialDataNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
    <p className="text-[14px] leading-6 text-amber-900">{children}</p>
  </div>
);
