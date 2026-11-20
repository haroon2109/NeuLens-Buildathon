import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { AccountSuspendedState } from '../../components/systemStates';
import { useAuthStore } from '../../store/authStore';

export const AccountSuspendedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const loginPath = user?.role === 'PATIENT' ? '/patient/login' : '/doctor/login';

  if (!user) {
    return <Navigate to="/patient/login" replace />;
  }

  const handleSignOut = () => {
    logout();
    navigate(loginPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-2.5">
          <NeuLensLogo height="h-10" />
        </div>

        <AccountSuspendedState
          reason={
            user.status === 'WITHDRAWN'
              ? 'This account has been withdrawn. Records are retained according to the retention policy and are not visible in the portal.'
              : undefined
          }
          onSignOut={handleSignOut}
        />

        <p className="mt-6 text-center text-[14px] leading-6 text-slate-500">
          Signed in as {user.name || user.email}. If you have an appointment already scheduled, contact the clinic
          directly so it is not missed.
        </p>
      </div>
    </div>
  );
};

export default AccountSuspendedPage;
