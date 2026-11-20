import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  Globe2,
  Info,
  Laptop,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Monitor,
  Phone,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  Type,
  UserRound
} from 'lucide-react';
import { treatmentTeam } from '../../../store/patientPortalStore';
import { useAuthStore } from '../../../store/authStore';
import { usePatientPortalStore } from '../../../store/patientPortalStore';
import { Card, InfoRow, Pill, PortalPageHeader, SectionTitle, Toggle, formatDate, formatDateTime } from './ui';
import { ConsentWithdrawnState } from '../../../components/systemStates';
import { getPortalPagesCopy } from '../../../services/language/portalPagesCopy';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import type { SupportedLanguage } from '../../../services/language/types';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-[14px] font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[14px] font-semibold text-body transition hover:bg-warm';
const dangerButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-[14px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40';
const fieldClass =
  'w-full rounded-xl border border-line bg-warm px-3.5 py-2.5 text-[14px] text-slate-800 outline-none transition placeholder:text-muted focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-1.5 block text-[14px] font-semibold text-body';

// ---------------------------------------------------------------------------
// Screen 42 — My Profile
// ---------------------------------------------------------------------------
export const MyProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { personal, setPersonal, health } = usePatientPortalStore();
  const [saved, setSaved] = useState(false);
  const language = useLanguageStore((state) => state.currentLanguage);
  const copy = getPortalPagesCopy(language).accountPages.profile;

  const displayName = personal.fullName || user?.name || copy.patientPill;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const save = () => {
    if (personal.fullName.trim()) updateUser({ name: personal.fullName.trim() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <button type="button" className={secondaryButton} onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
            <SlidersHorizontal className="h-4 w-4" /> {copy.accessibilityButton}
          </button>
        }
      />

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[14px] font-semibold text-emerald-900" role="status">
          <CheckCircle2 className="h-4 w-4" /> {copy.saved}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-[17px] font-bold text-blue-800">{initials}</span>
            <div>
              <p className="text-[16px] font-semibold text-ink">{displayName}</p>
              <p className="mt-0.5 text-xs text-muted">{user?.email || personal.email || copy.noEmail}</p>
              <p className="mt-1 font-mono text-xs text-muted">{user?.patientId || '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Pill tone="green" dot>{copy.patientPill}</Pill>
            <Pill tone="slate">{copy.verifiedPill}</Pill>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionTitle title={copy.personalTitle} detail={copy.personalDetail} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="profile-name">{copy.fullName}</label>
              <input id="profile-name" className={fieldClass} value={personal.fullName} onChange={(event) => setPersonal({ fullName: event.target.value })} autoComplete="name" />
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-dob">{copy.dob}</label>
              <input id="profile-dob" type="date" className={fieldClass} value={personal.dateOfBirth} onChange={(event) => setPersonal({ dateOfBirth: event.target.value })} autoComplete="bday" />
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-language">{copy.preferredLanguage}</label>
              <select id="profile-language" className={fieldClass} value={personal.language} onChange={(event) => setPersonal({ language: event.target.value })}>
                <option value="en">English (India)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-education">{copy.education}</label>
              <select id="profile-education" className={fieldClass} value={personal.education} onChange={(event) => setPersonal({ education: event.target.value })}>
                {copy.educationOptions.map((option, index) => (
                  <option key={option || `placeholder-${index}`} value={option}>
                    {index === 0 ? copy.educationPlaceholder : option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-phone">{copy.phone}</label>
              <input id="profile-phone" type="tel" className={fieldClass} value={personal.phone} onChange={(event) => setPersonal({ phone: event.target.value })} autoComplete="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="profile-email">{copy.email}</label>
              <input id="profile-email" type="email" className={fieldClass} value={personal.email} onChange={(event) => setPersonal({ email: event.target.value })} autoComplete="email" />
              <p className="mt-1.5 text-xs leading-5 text-muted">{copy.emailNote}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line bg-warm/70 p-3.5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{copy.emergencyTitle}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="profile-emergency-name">{copy.contactName}</label>
                <input id="profile-emergency-name" className={fieldClass} value={personal.emergencyName} onChange={(event) => setPersonal({ emergencyName: event.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-emergency-phone">{copy.contactPhone}</label>
                <input id="profile-emergency-phone" type="tel" className={fieldClass} value={personal.emergencyPhone} onChange={(event) => setPersonal({ emergencyPhone: event.target.value })} />
              </div>
            </div>
          </div>

          <button type="button" className={`${primaryButton} mt-4`} onClick={save}>
            <Save className="h-4 w-4" /> {copy.saveProfile}
          </button>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.careTeamTitle} />
            <p className="text-[14px] font-semibold text-ink">{treatmentTeam.doctor || (user as any)?.assignedDoctor || copy.careTeamFallback}</p>
            <p className="text-xs text-muted">{treatmentTeam.role || copy.careTeamRoleFallback}</p>
            <dl className="mt-3">
              <InfoRow label={copy.hospital} value={treatmentTeam.institution || copy.careTeamFallback} />
              <InfoRow label={copy.department} value={treatmentTeam.department || copy.careTeamRoleFallback} />
              <InfoRow label={copy.patientId} value={user?.patientId || '—'} />
              <InfoRow label={copy.onboarded} value={health.conditions.length ? copy.onboardedShared : copy.onboardedPending} />
            </dl>
            <Link to="/patient/appointments" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
              {copy.contactClinic} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <div id="profile-accessibility" className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[14px] font-semibold text-ink">{copy.accessibilityTitle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="slate">{personal.language === 'en' ? copy.languageEnglish : copy.languageSet}</Pill>
              <Pill tone="blue">{health.sensory.length ? health.sensory.join(', ') : copy.noSensory}</Pill>
            </div>
            <Link to="/patient/settings" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
              {copy.adjustSettings} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 43 — Account Settings
// ---------------------------------------------------------------------------
export const AccountSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { account, setAccount, accessibility, setAccessibility, privacy, removeDevice } = usePatientPortalStore();
  const [saved, setSaved] = useState(false);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const copy = getPortalPagesCopy(currentLanguage).accountPages.settings;

  const otherDevices = privacy.connectedDevices.filter((device) => device.id !== 'dev-1');

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[14px] font-semibold text-emerald-900" role="status">
          <CheckCircle2 className="h-4 w-4" /> {copy.saved}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title={copy.signInTitle} />
          <div className="space-y-3">
            <div className="rounded-xl border border-line p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{copy.emailAddress}</p>
                  <p className="mt-0.5 text-xs text-muted">{user?.email || getPortalPagesCopy(currentLanguage).accountPages.profile.noEmail}</p>
                </div>
                <Pill tone="green" dot>{copy.verified}</Pill>
              </div>
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{copy.password}</p>
                  <p className="mt-0.5 text-xs text-muted">{copy.passwordDetail}</p>
                </div>
                <Link to="/auth/forgot-password" className={secondaryButton}><Lock className="h-3.5 w-3.5" /> {copy.changePassword}</Link>
              </div>
            </div>
            <Toggle
              label={copy.twoStepLabel}
              detail={copy.twoStepDetail}
              checked={account.twoFactor}
              onChange={(value) => {
                setAccount({ twoFactor: value });
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2000);
              }}
            />
            <div className="rounded-xl border border-line p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{copy.thisBrowser}</p>
                    <p className="text-xs text-muted">{copy.browserDetail}</p>
                  </div>
                </div>
                <Pill tone="green" dot>{copy.current}</Pill>
              </div>
              {otherDevices.length > 0 && (
                <button
                  type="button"
                  className={`${dangerButton} mt-3 w-full`}
                  onClick={() => otherDevices.forEach((device) => removeDevice(device.id))}
                >
                  <LogOut className="h-3.5 w-3.5" /> {copy.signOutOther(otherDevices.length)}
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle title={copy.notificationsTitle} detail={copy.notificationsDetail} />
          <div className="space-y-2.5">
            <Toggle
              label={copy.emailUpdates}
              detail={copy.emailUpdatesDetail}
              checked={account.emailUpdates}
              onChange={(value) => setAccount({ emailUpdates: value })}
            />
            <Toggle
              label={copy.smsReminders}
              detail={copy.smsRemindersDetail}
              checked={account.smsReminders}
              onChange={(value) => setAccount({ smsReminders: value })}
            />
            <div className="rounded-lg bg-warm px-3 py-2 text-xs leading-5 text-muted">
              <Info className="me-1 inline h-3 w-3" />
              {copy.urgentNotice}
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle title={copy.languageTitle} />
          <label className={labelClass} htmlFor="settings-language"><Globe2 className="me-1 inline h-3.5 w-3.5" /> {copy.languageLabel}</label>
          <select
            id="settings-language"
            className={fieldClass}
            value={currentLanguage}
            onChange={(event) => {
              const next = event.target.value as SupportedLanguage;
              setLanguage(next);
              setAccessibility({ language: next });
              setSaved(true);
              window.setTimeout(() => setSaved(false), 2000);
            }}
          >
            <option value="en">English (India)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-muted">
            {copy.languageNote}
          </p>
        </Card>

        <Card>          <SectionTitle title={copy.displayTitle} action={<Accessibility className="h-4 w-4 text-muted" />} />
          <p className="mb-2 text-xs font-semibold text-body"><Type className="me-1 inline h-3.5 w-3.5" /> {copy.textSize}</p>
          <div className="grid grid-cols-3 gap-2">
            {
              [
              { value: 'normal' as const, label: copy.textSizes.normal },
              { value: 'large' as const, label: copy.textSizes.large },
              { value: 'xlarge' as const, label: copy.textSizes.xlarge }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={accessibility.textSize === option.value}
                onClick={() => setAccessibility({ textSize: option.value })}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  accessibility.textSize === option.value
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-line bg-white text-body hover:border-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2.5">
            <Toggle label={copy.highContrast} detail={copy.highContrastDetail} checked={accessibility.highContrast} onChange={(value) => setAccessibility({ highContrast: value })} />
            <Toggle label={copy.audioInstructions} detail={copy.audioInstructionsDetail} checked={accessibility.audioInstructions} onChange={(value) => setAccessibility({ audioInstructions: value })} />
            <Toggle label={copy.largerTargets} detail={copy.largerTargetsDetail} checked={accessibility.touchPreference === 'Large tap targets'} onChange={(value) => setAccessibility({ touchPreference: value ? 'Large tap targets' : 'Standard tap targets' })} />
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title={copy.supportTitle} detail={copy.supportDetail} />
        <div className="flex flex-wrap gap-2">
          <Link to="/patient/help" className={secondaryButton}><LifeBuoy className="h-3.5 w-3.5" /> {copy.helpSupport}</Link>
          <Link to="/patient/privacy" className={secondaryButton}><ShieldCheck className="h-3.5 w-3.5" /> {copy.privacyLink}</Link>
          <Link to="/patient/profile" className={secondaryButton}><UserRound className="h-3.5 w-3.5" /> {copy.myProfile}</Link>
        </div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 44 — Privacy & Data Settings
// ---------------------------------------------------------------------------
export const PrivacyDataPage: React.FC = () => {
  const { consent, privacy, setSharing, requestDeletion, removeDevice } = usePatientPortalStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const language = useLanguageStore((state) => state.currentLanguage);
  const copy = getPortalPagesCopy(language).accountPages.privacy;

  const deviceIcon = (id: string) => {
    if (id.includes('shared')) return Monitor;
    if (id.includes('phone')) return Smartphone;
    return Laptop;
  };

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Pill tone={consent.signedAt ? 'green' : 'amber'} dot>{consent.signedAt ? copy.consentRecorded(formatDate(consent.signedAt)) : copy.consentMissing}</Pill>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.consentTitle} detail={copy.consentDetail} />
            <div className="space-y-2">
              {[
                { label: copy.consentItems.assessment, granted: consent.dataCollection, required: true },
                { label: copy.consentItems.cameraMic, granted: consent.cameraMic, required: true },
                { label: copy.consentItems.processing, granted: consent.processing, required: true },
                { label: copy.consentItems.clinicianAccess, granted: consent.clinicianAccess, required: true },
                { label: copy.consentItems.optionalSharing, granted: consent.optionalSharing, required: false }
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <span className="text-xs text-body">{row.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {!row.required && <span className="text-xs text-muted">{copy.optional}</span>}
                    <Pill tone={row.granted ? 'green' : 'slate'}>{row.granted ? copy.granted : copy.notGranted}</Pill>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-muted">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {copy.consentLock}
            </p>
          </Card>

          <Card>
            <SectionTitle title={copy.sharingTitle} />
            <Toggle
              label={copy.researchLabel}
              detail={copy.researchDetail}
              checked={privacy.optionalSharing}
              onChange={setSharing}
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              {copy.researchOff}
            </p>
            {!privacy.optionalSharing && (
              <div className="mt-3">
                <ConsentWithdrawnState
                  withdrawn={[copy.withdrawnLabel]}
                  effectiveNote={copy.withdrawnNote}
                  eyebrow={copy.withdrawnEyebrow}
                  title={copy.withdrawnTitle}
                  noteSuffix={copy.withdrawnSuffix}
                  restoreLabel={copy.restore}
                  onRestore={() => setSharing(true)}
                />
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title={copy.activityTitle} detail={copy.activityDetail} />
            {consent.history.length ? (
              <ul className="space-y-2">
                {[...consent.history].reverse().map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="rounded-lg border border-line px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">{entry.action}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{entry.detail}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDateTime(entry.at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-5 text-muted">{copy.noActivity}</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.devicesTitle} />
            <ul className="space-y-2">
              {privacy.connectedDevices.map((device) => {
                const Icon = deviceIcon(device.id);
                return (
                  <li key={device.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{device.label}</p>
                        <p className="text-xs text-muted">{device.lastActive}</p>
                      </div>
                    </div>
                    {device.id === 'dev-1' ? (
                      <Pill tone="green">{copy.current}</Pill>
                    ) : (
                      <button type="button" onClick={() => removeDevice(device.id)} className="text-xs font-bold text-rose-700 hover:underline">
                        {copy.remove}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <SectionTitle title={copy.requestsTitle} />
            {privacy.requests.length ? (
              <ul className="space-y-2">
                {privacy.requests.map((request) => (
                  <li key={request.id} className="rounded-lg border border-line px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{request.type}</p>
                      <Pill tone={request.status.startsWith('Submitted') ? 'amber' : 'green'}>{request.status.startsWith('Submitted') ? copy.submitted : copy.completed}</Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(request.date)} · {request.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">{copy.noRequests}</p>
            )}
            <div className="mt-3 rounded-lg bg-warm px-3 py-2 text-xs leading-5 text-muted">
              <Download className="me-1 inline h-3 w-3" />
              {copy.downloadNote}
            </div>
          </Card>

          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
              <AlertTriangle className="h-3.5 w-3.5" /> {copy.deletionTitle}
            </p>
            <p className="mt-1 text-xs leading-5 text-rose-900/80">
              {copy.deletionBody}
            </p>
            {privacy.deletionRequested ? (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-rose-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> {copy.deletionSubmitted}
              </div>
            ) : confirmDelete ? (
              <div className="mt-3 space-y-2">
                <label className="flex items-start gap-2 text-xs leading-5 text-rose-900">
                  <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} className="mt-0.5" />
                  {copy.deletionUnderstand}
                </label>
                <div className="flex gap-2">
                  <button type="button" className={dangerButton} disabled={!understood} onClick={() => { requestDeletion(); setConfirmDelete(false); }}>
                    <Trash2 className="h-3.5 w-3.5" /> {copy.submitRequest}
                  </button>
                  <button type="button" className={secondaryButton} onClick={() => setConfirmDelete(false)}>{copy.keepAccount}</button>
                </div>
              </div>
            ) : (
              <button type="button" className={`${dangerButton} mt-2`} onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> {copy.requestDeletion}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 45 — Help & Support / Logout
// ---------------------------------------------------------------------------
export const HelpSupportPage: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [issue, setIssue] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const language = useLanguageStore((state) => state.currentLanguage);
  const copy = getPortalPagesCopy(language).accountPages.help;
  const faqs = copy.faqs;

  const handleLogout = () => {
    logout();
    navigate('/patient/login', { replace: true });
  };

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Pill tone="blue" dot>{copy.supportAvailable}</Pill>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.faqTitle} />
            <ul className="divide-y divide-slate-100">
              {faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <li key={faq.question}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-start"
                    >
                      <span className="text-[14px] font-semibold text-slate-800">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <p className="pb-3 text-xs leading-5 text-body">{faq.answer}</p>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <SectionTitle title={copy.reportTitle} detail={copy.reportDetail} />
            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-900">
                <p className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="h-4 w-4" /> {copy.reportReceived}</p>
                <p className="mt-1">{copy.reportFollowUp}</p>
                <button type="button" className="mt-2 text-xs font-bold text-emerald-800 underline" onClick={() => { setSubmitted(false); setIssue(''); }}>
                  {copy.reportAgain}
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-[0.6fr_1.4fr]">
                  <div>
                    <label className={labelClass} htmlFor="help-category">{copy.topic}</label>
                    <select id="help-category" className={fieldClass} value={String(categoryIndex)} onChange={(event) => setCategoryIndex(Number(event.target.value))}>
                      {copy.topicOptions.map((option, index) => (
                        <option key={option} value={String(index)}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="help-issue">{copy.whatHappened}</label>
                    <textarea id="help-issue" rows={3} className={fieldClass} value={issue} onChange={(event) => setIssue(event.target.value)} placeholder={copy.placeholder} />
                  </div>
                </div>
                <button type="button" className={`${primaryButton} mt-3`} disabled={!issue.trim()} onClick={() => setSubmitted(true)}>
                  <MessageSquare className="h-4 w-4" /> {copy.sendReport}
                </button>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.contactTitle} />
            <p className="text-[14px] font-semibold text-ink">{treatmentTeam.doctor}</p>
            <p className="text-xs text-muted">{treatmentTeam.department}</p>
            <div className="mt-3 space-y-2.5 text-xs">
              <a href={`tel:${treatmentTeam.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-body hover:text-blue-700">
                <Phone className="h-3.5 w-3.5 text-muted" /> {treatmentTeam.phone}
              </a>
              <a href={`mailto:${treatmentTeam.email}`} className="flex items-center gap-2 text-body hover:text-blue-700">
                <Mail className="h-3.5 w-3.5 text-muted" /> {treatmentTeam.email}
              </a>
              <p className="flex items-start gap-2 text-body">
                <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> {copy.hours}
              </p>
            </div>
            <a href={`mailto:${treatmentTeam.email}`} className={`${secondaryButton} mt-3 w-full`}>{copy.emailSupport}</a>
          </Card>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" /> {copy.emergencyTitle}
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-900/80">
              {copy.emergencyBody}
            </p>
            <a href={`tel:${treatmentTeam.phone.replace(/\s/g, '')}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline">
              <Phone className="h-3 w-3" /> {copy.call(treatmentTeam.phone)}
            </a>
          </div>

          <Card>
            <SectionTitle title={copy.accessibilityTitle} action={<Accessibility className="h-4 w-4 text-muted" />} />
            <p className="text-xs leading-5 text-body">
              {copy.accessibilityBody}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {copy.accessibilityPills.map((label) => (
                <Pill key={label} tone="slate">{label}</Pill>
              ))}
            </div>
          </Card>

          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[14px] font-semibold text-ink">{copy.signOutTitle}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {copy.signOutBody}
            </p>
            {confirmLogout ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-body">{copy.signOutConfirm}</p>
                <div className="flex gap-2">
                  <button type="button" className={primaryButton} onClick={handleLogout}><LogOut className="h-4 w-4" /> {copy.signOut}</button>
                  <button type="button" className={secondaryButton} onClick={() => setConfirmLogout(false)}>{copy.staySignedIn}</button>
                </div>
              </div>
            ) : (
              <button type="button" className={`${secondaryButton} mt-3 w-full`} onClick={() => setConfirmLogout(true)}>
                <LogOut className="h-4 w-4" /> {copy.signOutButton}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-line bg-warm p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-body">
              <Database className="h-3.5 w-3.5" /> {copy.aboutTitle}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {copy.aboutBody}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted"><Bell className="h-3 w-3" /> {copy.safetyNotice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
