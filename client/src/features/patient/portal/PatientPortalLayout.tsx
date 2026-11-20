import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RouteAnnouncer } from '../../../components/a11y/RouteAnnouncer';
import { ConfirmDialog } from '../../../components/systemStates';
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Globe,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  MicOff,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
  X,
  type LucideIcon
} from 'lucide-react';
import { NeuLensLogo } from '../../../components/NeuLensLogo';
import { useAuthStore } from '../../../store/authStore';
import { usePatientPortalStore } from '../../../store/patientPortalStore';
import { patientPortalApi } from '../../../services/patientPortalApi';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getPortalTranslation } from '../../../services/language/portalTranslations';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../../../services/language/translations';
import type { SupportedLanguage } from '../../../services/language/types';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';
import { VoiceCopilot } from '../../../components/voice/VoiceCopilot';
import { useVoiceCopilotStore } from '../../../services/voice/VoiceCopilotEngine';
import { getVoiceAssistantCopy } from '../../../services/voice/voiceAssistantCopy';
import { deploymentConfig } from '../../../config/deployment';

type NavItem = { path: string; label: string; icon: LucideIcon; end?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/patient/brain-health', label: 'Brain health', icon: Brain },
      { path: '/patient/timeline', label: 'Brain Health Timeline', icon: TrendingUp }
    ]
  },
  {
    label: 'Assessment',
    items: [
      { path: '/patient/assessment/intro', label: 'Start assessment', icon: Sparkles },
      { path: '/patient/cognitive', label: 'Cognitive assessment', icon: Brain, end: true },
      { path: '/patient/cognitive/library', label: 'Task library', icon: ClipboardList },
      { path: '/patient/history', label: 'History', icon: ClipboardList },
      { path: '/patient/daily-function', label: 'Daily Function Questionnaire', icon: ClipboardList },
      { path: '/patient/documents', label: 'Reports & documents', icon: FileText }
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { path: '/patient/trends', label: 'Longitudinal trends', icon: TrendingUp },
      { path: '/patient/change-detection', label: 'Change detection', icon: Activity }
    ]
  },
  {
    label: 'Health context',
    items: [
      { path: '/patient/health-profile', label: 'Health Profile & Context', icon: HeartPulse },
      { path: '/patient/context', label: 'Context overview', icon: HeartPulse, end: true },
      { path: '/patient/context/assessment-conditions', label: 'Assessment conditions', icon: Activity },
      { path: '/patient/context/sleep', label: 'Sleep & lifestyle', icon: Moon },
      { path: '/patient/context/wellbeing', label: 'Mental wellbeing', icon: Users },
      { path: '/patient/context/clinical', label: 'Clinical & family', icon: Stethoscope }
    ]
  },
  {
    label: 'Care',
    items: [
      { path: '/patient/prevention-plan', label: 'Personalized Prevention Plan', icon: ShieldCheck },
      { path: '/patient/appointments', label: 'Follow-up & Appointments', icon: CalendarDays },
      { path: '/patient/care-plan', label: 'My care plan', icon: ShieldCheck },
      { path: '/patient/notifications', label: 'Notifications', icon: Bell }
    ]
  },
  {
    label: 'Account',
    items: [
      { path: '/patient/profile', label: 'My profile', icon: UserRound },
      { path: '/patient/settings', label: 'Account settings', icon: SlidersHorizontal },
      { path: '/patient/privacy', label: 'Privacy & data', icon: ShieldCheck },
      { path: '/patient/help', label: 'Help & support', icon: HelpCircle }
    ]
  }
];

const textSizeClass: Record<string, string> = {
  normal: '',
  large: 'pp-text-lg',
  xlarge: 'pp-text-xl'
};

/**
 * Switches the language used for spoken guidance (and the language-aware
 * portal copy) from anywhere in the portal. Choosing a language immediately
 * plays a short sample, so the patient hears the new voice before starting.
 */
const VoiceLanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, getTranslation } = useLanguageStore();
  const { speak } = useVoiceAssistantStore();
  const [open, setOpen] = useState(false);
  const t = getTranslation();
  const current = getLanguageInfo(currentLanguage);

  const choose = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setOpen(false);
    speak(getLanguageInfo(lang).sampleGreeting);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.assistant.languageBtn}: ${current.nativeName}`}
        title={t.assistant.languageBtn}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2 text-body transition-colors hover:bg-mint"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="hidden text-[13px] font-semibold sm:inline">{current.nativeName}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label={t.assistant.languageBtn}
            className="absolute end-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-sage-deep">
              {t.assistant.languageBtn}
            </p>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const selected = lang.id === currentLanguage;
              return (
                <button
                  key={lang.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(lang.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start transition-colors ${
                    selected ? 'bg-mint text-forest' : 'text-body hover:bg-warm'
                  }`}
                >
                  <span className="min-w-0">
                    <span className={`block text-[14px] ${selected ? 'font-semibold' : ''}`}>{lang.nativeName}</span>
                    <span className="block text-[12px] text-muted">{lang.name}</span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const VoiceHandsFreeToggle: React.FC = () => {
  const { currentLanguage } = useLanguageStore();
  const copy = getVoiceAssistantCopy(currentLanguage);
  const { backgroundEnabled, setBackgroundEnabled } = useVoiceCopilotStore();

  return (
    <button
      type="button"
      onClick={() => setBackgroundEnabled(!backgroundEnabled)}
      aria-pressed={backgroundEnabled}
      aria-label={backgroundEnabled ? copy.backgroundOn : copy.backgroundOff}
      title={copy.backgroundOff}
      className={`relative flex h-9 items-center gap-1.5 rounded-lg border px-2 text-body transition-colors ${
        backgroundEnabled ? 'border-forest bg-mint text-forest' : 'border-line hover:bg-mint'
      }`}
    >
      {backgroundEnabled ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
      <span className="hidden text-[12px] font-semibold sm:inline">
        {backgroundEnabled ? copy.backgroundActive : copy.buttonLabel}
      </span>
      {backgroundEnabled && (
        <span className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-forest shadow-[0_0_6px_rgba(47,94,78,0.6)]" aria-hidden="true" />
      )}
    </button>
  );
};

const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { notifications } = usePatientPortalStore();
  const { currentLanguage } = useLanguageStore();
  const pt = getPortalTranslation(currentLanguage);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = () => setIsLogoutOpen(true);

  const confirmLogout = () => {
    logout();
    navigate('/patient/login', { replace: true });
  };

  const nameParts = (user?.name || pt.shell.patientFallback).split(' ').filter(Boolean);
  const initials = nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <Link
        to="/patient/dashboard"
        className="flex items-center px-5 py-5 text-decoration-none"
        onClick={onNavigate}
      >
        <NeuLensLogo height="h-8" />
      </Link>

      {/* User card — mint surface, matching NeuLens identity */}
      <div className="mx-4 mb-4 rounded-xl border border-line p-3 bg-mint">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[14px] font-bold text-forest shadow-xs">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-ink">
              {user?.name || pt.shell.patientFallback}
            </span>
            <span className="mt-0.5 block font-mono text-[13px] text-muted">
              {user?.patientId || '—'}
            </span>
          </span>
        </div>
      </div>

      {/* Navigation — sage-tinted section labels, forest active state */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4" aria-label={pt.shell.navLabel}>
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-sage-deep">
              {pt.nav.groups[group.label] || group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon, end }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${isActive
                        ? 'bg-mint text-forest font-semibold'
                        : 'text-body hover:bg-white/60 hover:text-ink'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 stroke-[1.8]" aria-hidden="true" />
                    <span className="flex-1">{pt.nav.items[path] || label}</span>
                    {path === '/patient/notifications' && notifications.some((item) => !item.read) && (
                      <span className="h-2 w-2 rounded-full bg-forest shadow-[0_0_6px_rgba(47,94,78,0.5)]" aria-label={pt.shell.unreadNotification} />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold text-body transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {pt.signOut}
        </button>
      </div>

      <ConfirmDialog
        open={isLogoutOpen}
        title={pt.signOut}
        description={pt.shell.logoutDescription}
        confirmLabel={pt.shell.logoutConfirm}
        cancelLabel={pt.shell.logoutCancel}
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutOpen(false)}
      />
    </div>
  );
};

export const PatientPortalLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const pt = getPortalTranslation(currentLanguage);
  const { accessibility, notifications, setAppointments } = usePatientPortalStore();
  const unread = notifications.filter((item) => !item.read).length;

  // Appointments live on the server; the store copy is a display cache.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    patientPortalApi
      .getAppointments()
      .then((rows) => {
        if (cancelled) return;
        setAppointments(
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            clinician: row.clinician || pt.shell.careTeam,
            location: row.location || pt.shell.toBeConfirmed,
            date: row.date,
            time: row.time,
            status: row.status,
            notes: row.communication || undefined
          }))
        );
      })
      .catch(() => {
        // Keep any cached records; the appointments page reports server errors.
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, setAppointments]);

  const activeItem = navGroups
    .flatMap((group) => group.items)
    .filter((item) =>
      item.end
        ? location.pathname === item.path
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
  const translatedNavItems = pt.nav.items as Record<string, string>;
  const activeLabel =
    (activeItem && translatedNavItems[activeItem.path]) ||
    activeItem?.label ||
    pt.patientPortal;

  // A suspended account keeps its record but loses portal access.
  if (user?.status === 'SUSPENDED' || user?.status === 'WITHDRAWN') {
    return <Navigate to="/account-suspended" replace />;
  }

  const contentClass = [
    'patient-portal',
    accessibility.highContrast ? 'patient-contrast' : '',
    textSizeClass[accessibility.textSize]
  ].filter(Boolean).join(' ');

  const initials = (user?.name || pt.shell.patientFallback)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`${contentClass} min-h-screen bg-warm text-ink`}>
      {/* Skip link */}
      <a
        href="#patient-main"
        className="sr-only z-50 rounded-lg bg-forest px-4 py-2 text-white text-sm font-semibold focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
      >
        {pt.skipToContent}
      </a>
      <RouteAnnouncer />

      {/* Sidebar — desktop */}
      <aside className={`fixed inset-y-0 start-0 z-40 hidden border-e border-line bg-white lg:block transition-all duration-300 ${sidebarCollapsed ? 'w-[64px]' : 'w-[258px]'}`}>
        {/* Collapse / expand toggle */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? pt.shell.expandSidebar : pt.shell.collapseSidebar}
          className="absolute -end-3.5 top-[72px] z-50 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white shadow-md text-sage-deep hover:bg-mint transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
        <div className={`h-full overflow-hidden ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
          <SidebarContent />
        </div>
        {/* Collapsed icon-strip */}
        {sidebarCollapsed && (
          <div className="flex flex-col items-center gap-2 pt-5 px-2">
            <Link to="/patient/dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-mint transition-colors" title={pt.shell.shortcuts.dashboard}>
              <LayoutDashboard className="h-4 w-4" />
            </Link>
            <Link to="/patient/brain-health" className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-mint transition-colors" title={pt.shell.shortcuts.brainHealth}>
              <Brain className="h-4 w-4" />
            </Link>
            <Link to="/patient/assessment/intro" className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-mint transition-colors" title={pt.shell.shortcuts.assessment}>
              <Sparkles className="h-4 w-4" />
            </Link>
            <Link to="/patient/trends" className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-mint transition-colors" title={pt.shell.shortcuts.trends}>
              <TrendingUp className="h-4 w-4" />
            </Link>
            <Link to="/patient/health-profile" className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-mint transition-colors" title={pt.shell.shortcuts.healthProfile}>
              <HeartPulse className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={pt.shell.closeNav}
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 flex w-[min(280px,85vw)] flex-col overflow-hidden border-e border-line bg-white shadow-2xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Top layer: header + main + footer */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ps-[64px]' : 'lg:ps-[258px]'}`}>
        <header className="sticky top-0 z-30 border-b border-line/80 bg-white/95 backdrop-blur">
          <div className="flex h-[64px] items-center gap-3 px-4 sm:px-6">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-body lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={pt.shell.openNav}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* Breadcrumb-ish label */}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
                {pt.patientPortal}
              </p>
              <p className="truncate text-[14px] font-semibold text-ink">{activeLabel}</p>
            </div>

            {/* Hands-free voice listening */}
            <VoiceHandsFreeToggle />

            {/* Voice-guidance language */}
            <VoiceLanguageSwitcher />

            {/* Notifications */}
            <Link
              to="/patient/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-body transition-colors hover:bg-mint"
              aria-label={`${pt.notifications}${unread ? `, ${unread} ${pt.notificationsUnread}` : ''}`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -end-1 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-forest px-1 text-[12px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* Profile menu */}
            <Link
              to="/patient/profile"
              className="flex items-center gap-2 rounded-lg border border-line py-1.5 ps-1.5 pe-2.5 transition-colors hover:bg-mint"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-forest shadow-xs">
                {initials}
              </span>
              <span className="hidden max-w-[120px] truncate text-[14px] font-semibold text-ink sm:block">
                {user?.name || pt.shell.patientFallback}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-sage-deep sm:block" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main
          id="patient-main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1180px] px-4 py-6 focus:outline-none sm:px-6 sm:py-8"
        >
          <Outlet />
        </main>

        {/* Voice copilot — continuous bilingual commands from any page */}
        <VoiceCopilot />

        {/* Footer */}
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-1.5 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>{deploymentConfig.isConfigured ? `${deploymentConfig.clinicName} · ` : ''}{pt.footerLine1}</span>
            <span>{pt.footerLine2}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PatientPortalLayout;
