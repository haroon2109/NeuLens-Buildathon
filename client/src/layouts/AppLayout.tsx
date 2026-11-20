import React, { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { SessionExpiredDialog } from '../components/systemStates';
import { RouteAnnouncer } from '../components/a11y/RouteAnnouncer';

const RouteLoading: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center"
  >
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden="true" />
    <p className="text-sm text-slate-600">Loading this screen…</p>
  </div>
);

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // The portal layouts own their own <main>, skip link and route announcer, so
  // this outer shell must not add a second copy of any of them.
  const nestedLayout =
    location.pathname === '/' ||
    location.pathname === '/landing' ||
    /^\/(patient\/(dashboard|cognitive|context|assessment|brain-health|history|trends|change-detection|timeline|daily-function|health-profile|prevention-plan|appointments|care-plan|notifications|documents|profile|settings|privacy|help)|doctor\/)/.test(
      location.pathname
    );
  const logout = useAuthStore((state) => state.logout);

  const handleSignInAgain = (nextPath: string) => {
    const role = useAuthStore.getState().role;
    logout();
    const loginPath = role === 'PATIENT' ? '/patient/login' : '/doctor/login';
    const query = new URLSearchParams();
    if (nextPath && nextPath !== '/' && !nextPath.startsWith('/auth/')) query.set('next', nextPath);
    navigate(`${loginPath}${query.toString() ? `?${query.toString()}` : ''}`, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-800">
      {/* First focusable element: jump past the page shell to the content. */}
      {!nestedLayout && (
        <a
          href="#main-content"
          className="sr-only z-50 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
      )}

      {/* Decorative subtle medical ambient glows — clipped to avoid document scroll overflow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-sky-400/5 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 h-[30rem] w-[30rem] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>
      
      {/* A plain wrapper, not a <main>: portal pages render their own <main>
          landmark, and nesting landmarks breaks screen-reader navigation.
          tabIndex lets route changes move focus here. */}
      <div id="main-content" tabIndex={-1} className="relative z-10 flex-grow focus:outline-none">
        {/* Route-level code splitting: one boundary for every nested outlet. */}
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </div>

      {!nestedLayout && <RouteAnnouncer />}

      {/* Global session-expiry prompt: any API that returns 401 opens this once. */}
      <SessionExpiredDialog onSignIn={handleSignInAgain} />
    </div>
  );
};
