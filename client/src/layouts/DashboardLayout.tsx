import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFaceTrackingStore } from '../store/faceTrackingStore';
import { NeuLensLogo } from '../components/NeuLensLogo';
import { ClinicalIllustration } from '../components/ClinicalIllustration';
import {
  LayoutDashboard,
  BrainCircuit,
  Users,
  ClipboardCheck,
  Activity,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Search,
  Bell,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { cameraStatus, cameraPermission, metrics } = useFaceTrackingStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/doctor/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/screen', label: 'Screening', icon: BrainCircuit },
    { path: '/dashboard/patients', label: 'Patients', icon: Users },
    { path: '/dashboard/assessments', label: 'Assessments', icon: ClipboardCheck },
    { path: '/dashboard/results', label: 'Results', icon: Activity },
    { path: '/dashboard/report', label: 'Reports', icon: FileText },
    { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const bottomNavItems = [
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
    { path: '/dashboard/about', label: 'About & Help', icon: HelpCircle },
  ];

  // Helper for dynamic header title & description
  const getHeaderContext = () => {
    const p = location.pathname;
    const name = user?.firstName
      ? `Dr. ${user.lastName || user.firstName}`
      : user?.name
        ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`)
        : 'Doctor';

    if (p === '/dashboard' || p === '/dashboard/') {
      return {
        title: `Good morning, ${name}`,
        subtitle: "Here's today's neurological screening overview."
      };
    }
    if (p.startsWith('/dashboard/screen')) {
      return {
        title: 'Neulens Assessment Protocol',
        subtitle: 'Distraction-free multimodal patient screening session.'
      };
    }
    if (p.startsWith('/dashboard/patients')) {
      return {
        title: 'Patient Directory & Registry',
        subtitle: 'Active screening queues and patient baseline history.'
      };
    }
    if (p.startsWith('/dashboard/assessments')) {
      return {
        title: 'Screening Protocols & Batteries',
        subtitle: 'Standardized digital biomarker clinical assays.'
      };
    }
    if (p.startsWith('/dashboard/results')) {
      return {
        title: 'Screening Results & Biometrics',
        subtitle: 'Quantitative multi-signal cognitive and physiological scores.'
      };
    }
    if (p.startsWith('/dashboard/report')) {
      return {
        title: 'Clinical Summary Report',
        subtitle: 'Neurological findings and recommendations for this signed-in clinician.'
      };
    }
    if (p.startsWith('/dashboard/analytics')) {
      return {
        title: 'Population Health Analytics',
        subtitle: 'Longitudinal clinical cohort metrics and completion trends.'
      };
    }
    if (p.startsWith('/dashboard/settings')) {
      return {
        title: 'Station & System Settings',
        subtitle: 'Calibration thresholds, audio assistant, and clinic info.'
      };
    }
    if (p.startsWith('/dashboard/about')) {
      return {
        title: 'About Neulens',
        subtitle: 'Early multimodal neurological screening platform.'
      };
    }
    return {
      title: 'Neurological Screening',
      subtitle: 'AI-assisted cognitive health monitoring platform.'
    };
  };

  const headerContext = getHeaderContext();
  const isScreeningRoute = location.pathname.startsWith('/dashboard/screen');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside className={`
          fixed lg:static top-0 bottom-0 left-0 z-50
          w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80
          flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <NeuLensLogo height="h-8" className="group-hover:scale-105 transition-transform" />
            </Link>

            {/* Close button on mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider px-3 pb-1 block">
              Clinical Workflow
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-sm border border-sky-100'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Live Sensor Widget in Sidebar (Only shown during active screening session) */}
          {isScreeningRoute && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-xs uppercase text-sky-700 font-display tracking-wider">
                  Sensor Telemetry
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cameraStatus === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${cameraStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Camera Feed:</span>
                  <span className={`font-semibold capitalize ${cameraStatus === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {cameraStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ocular Fixation:</span>
                  <span className="font-semibold text-slate-800">{metrics.stability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blinks Captured:</span>
                  <span className="font-semibold text-slate-800">{metrics.blinkCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Links & User Profile */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 text-xs font-medium ${isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile Card */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold font-display text-xs flex items-center justify-center shrink-0 border border-sky-200">
                {user?.firstName
                  ? `${user.firstName[0]}${user.lastName?.[0] || ''}`
                  : user?.name
                    ? user.name.slice(0, 2).toUpperCase()
                    : 'DR'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user
                    ? `${user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || 'Doctor'}`
                    : 'Doctor'}
                </p>
                <p className="text-xs text-slate-400 truncate">Clinician</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Dynamic Title/Subtitle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display leading-tight">
                {headerContext.title}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {headerContext.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Search, AI status, user */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isScreeningRoute && (
              <ClinicalIllustration variant="clinical" size="micro" className="hidden xl:block" />
            )}
            {/* AI Engine Status Pill */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 rounded-full px-3 py-1.5 shadow-subtle">
              <span className="status-dot-green" />
              <span>AI Engine: Online</span>
            </div>

            {/* Start Screening Action Button */}
            {!isScreeningRoute && (
              <Link
                to="/dashboard/screen"
                className="btn-primary text-xs py-2 px-3.5 shadow-pill hidden sm:flex items-center gap-1.5"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>New Screening</span>
              </Link>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
