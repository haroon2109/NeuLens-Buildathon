import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { RouteAnnouncer } from '../components/a11y/RouteAnnouncer';
import { ConfirmDialog } from '../components/systemStates';
import { useAuthStore } from '../store/authStore';
import { useDoctorPortalStore } from '../store/doctorPortalStore';
import { deploymentConfig } from '../config/deployment';
import { doctorApi } from '../services/portalApi';
import { NeuLensLogo } from '../components/NeuLensLogo';
import { ClinicalIllustration } from '../components/ClinicalIllustration';
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  CalendarDays,
  FileText,
  Languages,
  Send,
  LogOut,
  Search,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Stethoscope,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon
} from 'lucide-react';

type NavItem = { path: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

// Care workflow: overview → review queue → patients → change review → approvals
// → referrals → appointments → quality/evidence. Grouping keeps a long clinical
// navigation predictable without hiding any existing destination.
const navGroups: NavGroup[] = [
  {
    label: 'Care',
    items: [
      { path: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard },
      { path: '/doctor/review-queue', label: 'Clinical Review Queue', icon: ClipboardList },
      { path: '/doctor/patients', label: 'Patients', icon: Users }
    ]
  },
  {
    label: 'Clinical review',
    items: [
      { path: '/doctor/reports', label: 'Reports', icon: FileText },
      { path: '/doctor/cognitive', label: 'Cognitive assessment', icon: Brain },
      { path: '/doctor/change-detection', label: 'Longitudinal / Change Review', icon: Activity },
      { path: '/doctor/clinical-approval', label: 'Clinical Approval', icon: CheckCircle2 }
    ]
  },
  {
    label: 'Coordination',
    items: [
      { path: '/doctor/referrals', label: 'Referral & Care Coordination', icon: Send },
      { path: '/doctor/appointments', label: 'Appointments', icon: CalendarDays }
    ]
  },
  {
    label: 'Insights',
    items: [
      { path: '/doctor/evidence-quality', label: 'Evidence & Data Quality', icon: Search },
      { path: '/doctor/assessment-readiness', label: 'Assessment Readiness', icon: Languages },
      { path: '/doctor/quality-equity', label: 'Quality & Equity', icon: BarChart3 }
    ]
  },
  {
    label: 'Account',
    items: [{ path: '/doctor/settings', label: 'Settings', icon: Settings }]
  }
];

const navItems = navGroups.flatMap((group) => group.items);

const SidebarContent: React.FC<{
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  pathname: string;
  clinicianName: string;
  clinicianRole: string;
  clinicianInitials: string;
  onLogout: () => void;
}> = ({
  collapsed,
  onToggleCollapse,
  onNavigate,
  pathname,
  clinicianName,
  clinicianRole,
  clinicianInitials,
  onLogout
}) => (
  <div className="flex h-full min-h-0 flex-col">
    {/* Brand */}
    <div className={`flex items-center px-4 py-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
      <Link to="/doctor/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
        <NeuLensLogo height="h-8" hideText={collapsed} />
      </Link>
      {!collapsed && !onNavigate && (
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className="rounded-lg p-1.5 text-sage-deep transition hover:bg-mint"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      )}
    </div>

    {collapsed && (
      <div className="pb-2 text-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="mx-auto rounded-lg p-2 text-sage-deep transition hover:bg-mint"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </div>
    )}

    {/* Navigation */}
    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4" aria-label="Clinical workspace navigation">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-sage-deep">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== '/doctor/dashboard' && pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    /* Without this a screen reader cannot tell which section is
                       open; the colour change is invisible to it. */
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center rounded-lg text-[14px] font-medium transition-colors ${
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-mint font-semibold text-forest'
                        : 'text-body hover:bg-warm hover:text-ink'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 stroke-[1.8] ${isActive ? 'text-forest' : 'text-sage-deep'}`}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>

    {/* Footer: portal switch + clinician identity + sign out */}
    <div className="space-y-2 border-t border-line p-3">
      <Link
        to="/patient"
        title="Open Patient Portal"
        onClick={onNavigate}
        className={`flex items-center rounded-lg border border-line bg-warm/70 text-body transition hover:border-sage-dark hover:text-ink ${
          collapsed ? 'justify-center px-2 py-2.5' : 'justify-between gap-2 px-3 py-2'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <ExternalLink className="h-4 w-4 shrink-0 text-sage-deep" aria-hidden="true" />
          {!collapsed && <span className="text-[14px] font-semibold">Patient Portal</span>}
        </span>
        {!collapsed && <ChevronRight className="h-3.5 w-3.5 text-sage-deep" aria-hidden="true" />}
      </Link>

      <div className={`flex items-center gap-2.5 rounded-xl border border-line bg-warm/70 p-2.5 ${collapsed ? 'justify-center' : ''}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-[13px] font-bold text-white">
          {clinicianInitials}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-ink" title={clinicianName}>
              {clinicianName}
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-muted">{clinicianRole}</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        title="Sign out of the clinical workspace"
        className={`flex w-full items-center rounded-lg text-[14px] font-semibold text-body transition hover:bg-rose-50 hover:text-rose-700 ${
          collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
        }`}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  </div>
);

export const DoctorLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const setAppointments = useDoctorPortalStore((state) => state.setAppointments);
  const setReferrals = useDoctorPortalStore((state) => state.setReferrals);
  const hydratePatients = useDoctorPortalStore((state) => state.hydratePatients);

  // Appointments are persisted server-side; the store copy is a display cache.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    doctorApi
      .getAppointments()
      .then((rows: any[]) => {
        if (cancelled) return;
        setAppointments(
          rows.map((row) => ({
            id: row.id,
            patientId: row.patientPublicId || row.patientId,
            title: row.title,
            type: row.type,
            date: row.date,
            time: row.time,
            location: row.location || 'To be confirmed',
            status: row.status,
            communication: row.communication || '',
            createdAt: row.createdAt
          }))
        );
      })
      .catch(() => {
        // Keep cached records when the API is unavailable; pages surface errors on write.
      });

    // The server is the patient directory. Mirror it into the local cache so
    // report, referral and appointment selectors are populated after a refresh.
    doctorApi
      .getPatients()
      .then((rows: any[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        hydratePatients(rows);
      })
      .catch(() => {
        // Pages still show their own error/empty states if the directory fails.
      });

    doctorApi
      .getReferrals()
      .then((rows: any[]) => {
        if (cancelled) return;
        setReferrals(
          rows.map((row) => ({
            id: row.id,
            patientId: row.patientPublicId || row.patientId,
            type: row.type,
            reason: row.reason,
            destination: row.destination,
            urgency: row.urgency,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          }))
        );
      })
      .catch(() => {
        // Keep cached records when the API is unavailable; pages surface errors on write.
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, setAppointments, setReferrals, hydratePatients]);

  const confirmLogout = () => {
    logout();
    navigate('/doctor/login', { replace: true });
  };

  // Sign-out is confirmed first so an accidental click does not end the session.
  const handleLogout = () => setIsLogoutOpen(true);

  // Suspended or withdrawn professionals never reach patient records.
  if (user?.status === 'SUSPENDED' || user?.status === 'WITHDRAWN') {
    return <Navigate to="/account-suspended" replace />;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/doctor/patients?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Clinician profile details from authenticated user session
  const clinicianName = user?.name
    ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`)
    : user?.firstName || user?.lastName
    ? `Dr. ${`${user.firstName || ''} ${user.lastName || ''}`.trim()}`
    : user?.email
    ? `Dr. ${user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
    : 'Clinician';

  const clinicianRole = user?.role === 'ADMIN'
    ? 'Chief Neurologist'
    : 'Attending Clinician';

  const clinicianInitials = clinicianName
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map(n => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR';

  // Check if viewing a patient record to bind screening directly
  const patientPathMatch = location.pathname.match(/\/doctor\/patients\/([^/]+)/);
  const currentPatientId = patientPathMatch && patientPathMatch[1] !== 'screen' ? patientPathMatch[1] : null;
  const activeLabel =
    navItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/doctor/dashboard' && location.pathname.startsWith(item.path))
    )?.label || 'Overview';

  const sidebarProps = {
    pathname: location.pathname,
    clinicianName,
    clinicianRole,
    clinicianInitials,
    onLogout: handleLogout
  };

  return (
    <div className="doctor-portal min-h-screen bg-warm text-ink" dir="ltr" lang="en">
      {/* Skip link */}
      <a
        href="#doctor-main"
        className="sr-only z-50 rounded-lg bg-forest px-4 py-2 text-white text-sm font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <RouteAnnouncer />

      {/* Sidebar — desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-white transition-[width] duration-200 lg:block ${
          isCollapsed ? 'w-[76px]' : 'w-[272px]'
        }`}
      >
        <SidebarContent
          {...sidebarProps}
          collapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((value) => !value)}
        />
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(292px,88vw)] flex-col overflow-hidden border-r border-line bg-white shadow-2xl">
            <SidebarContent
              {...sidebarProps}
              collapsed={false}
              onToggleCollapse={() => undefined}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[272px]'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-line/80 bg-white/95 backdrop-blur">
          <div className="flex min-h-[68px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-body lg:hidden"
              aria-label="Open navigation"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
                <Stethoscope className="h-3 w-3" aria-hidden="true" />
                Neurology &amp; Cognitive Health
              </p>
              <p className="truncate text-[14px] font-semibold text-ink">{activeLabel}</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="hidden items-center md:flex" role="search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sage-deep" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search patient ID or name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search patients"
                  className="h-9 w-56 rounded-lg border border-line bg-warm/60 pl-8 pr-3 text-[14px] text-ink placeholder:text-muted transition focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/15"
                />
              </div>
            </form>

            <div className="hidden items-center gap-2 rounded-full border border-line bg-warm/70 px-3 py-1.5 text-[13px] font-semibold text-body sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-forest shadow-[0_0_6px_rgba(47,94,78,0.5)]" />
              Clinical pipeline active
            </div>

            <Link
              to={currentPatientId ? `/doctor/patients/${currentPatientId}/screen` : '/doctor/patients?select=true'}
              title={currentPatientId ? 'Start screening for the open patient' : 'Select a patient to screen'}
              className="pp-btn pp-btn-primary pp-btn-sm"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Launch screening</span>
              <span className="sm:hidden">Screen</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main
          id="doctor-main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1360px] px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8"
        >
          <Outlet />
        </main>

        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-1.5 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>{deploymentConfig.isConfigured ? `${deploymentConfig.clinicName} · ${deploymentConfig.clinicCity || 'Neurology & Cognitive Health'}` : 'Your clinic · Neurology & Cognitive Health'}</span>
            <span>Screening support, not a diagnosis. Clinician review guides next steps.</span>
          </div>
        </footer>
      </div>

      <ConfirmDialog
        open={isLogoutOpen}
        title="Sign out of the clinical workspace?"
        description="Unsaved notes in an open form are not kept. Any care plan or referral already saved stays in the record."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutOpen(false)}
      />
    </div>
  );
};
export default DoctorLayout;
