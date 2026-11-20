import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { AuthShell } from './AuthShell';
import { AuthRequestError, authApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import { roleLabel } from './authRouting';

const timeline = [
  {
    icon: CheckCircle2,
    title: 'Application received',
    detail: 'Your account details and contact verification are complete.',
    state: 'done' as const,
  },
  {
    icon: Clock3,
    title: 'Credentials under review',
    detail: 'We check professional registration and institutional affiliation.',
    state: 'current' as const,
  },
  {
    icon: LockKeyhole,
    title: 'Patient records unlock after approval',
    detail: 'You will be notified once your clinical workspace is activated.',
    state: 'upcoming' as const,
  },
];

export const PendingApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();

  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) {
    return <Navigate to="/doctor/login" replace />;
  }

  const isInstitution = user.role === 'INSTITUTION';

  const handleCheckStatus = async () => {
    if (!isAuthenticated) {
      navigate('/doctor/login', { replace: true });
      return;
    }

    setMessage('');
    setErrorMsg('');
    setIsChecking(true);
    try {
      const response = await authApi.verificationStatus();
      if (response.user) {
        updateUser(response.user);
        if (response.user.verificationStatus === 'VERIFIED') {
          navigate(user.role === 'INSTITUTION' ? '/auth/pending-approval' : '/doctor/dashboard', {
            replace: true,
          });
          return;
        }
      }
      setMessage('Your application is still under review. No action is needed right now.');
    } catch (error) {
      setErrorMsg(
        error instanceof AuthRequestError
          ? error.message
          : 'We could not check your status. Please try again later.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/doctor/login', { replace: true });
  };

  return (
    <AuthShell
      variant="clinician"
      icon={isInstitution ? Building2 : Stethoscope}
      eyebrow="Account pending approval"
      badge="Screen 14"
      title={isInstitution ? 'Institution review in progress' : 'Your credentials are being reviewed'}
      description={`Signed in as ${user.name || user.email} · ${roleLabel(user.role)}. For patient privacy, clinical accounts are activated only after verification.`}
      backTo="/"
      backLabel="Back to NeuLens"
      footer={
        <p className="portal-login-switch">
          Need help? <a href="mailto:support@neulens.health">Contact support</a>
        </p>
      }
    >
      <div className="auth-status-banner" role="status">
        <span className="auth-status-banner-icon">
          <Clock3 className="h-5 w-5" />
        </span>
        <div>
          <strong>Verification status: Under review</strong>
          <p>This usually takes 1–2 business days after your registration details are confirmed.</p>
        </div>
      </div>

      <ol className="auth-timeline" aria-label="Approval progress">
        {timeline.map(({ icon: Icon, title, detail, state }) => (
          <li key={title} className={`auth-timeline-item is-${state}`}>
            <span className="auth-timeline-icon">
              <Icon className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span>
              <strong>{title}</strong>
              <span>{detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="auth-detail-card">
        <h2>Submitted details</h2>
        <dl>
          <div>
            <dt>{roleLabel(user.role)}</dt>
            <dd>{user.name || '—'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          {user.phone && (
            <div>
              <dt>Phone</dt>
              <dd>{user.phone}</dd>
            </div>
          )}
          {isInstitution ? (
            <>
              <div>
                <dt>Institution</dt>
                <dd>{user.institutionName || '—'}</dd>
              </div>
              <div>
                <dt>Institution type</dt>
                <dd>{user.institutionType || '—'}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt>Registration number</dt>
                <dd>{user.professionalRegistrationNumber || '—'}</dd>
              </div>
              <div>
                <dt>Specialty</dt>
                <dd>{user.specialty || '—'}</dd>
              </div>
              <div>
                <dt>Affiliated institution</dt>
                <dd>{user.institutionName || '—'}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {message && (
        <div className="auth-success-inline" role="status">
          <BadgeCheck className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <p className="auth-inline-error" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="auth-action-row">
        <button type="button" onClick={handleCheckStatus} disabled={isChecking} className="portal-submit-button">
          {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          <span>{isChecking ? 'Checking status…' : 'Check approval status'}</span>
        </button>
        <button type="button" onClick={handleSignOut} className="auth-secondary-button">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      {!isInstitution && (
        <p className="portal-login-switch">
          Need to add or update your credentials?{' '}
          <Link to="/doctor/onboarding/registration">Complete your professional profile</Link>
        </p>
      )}

      <div className="auth-notice">
        <LifeBuoy className="h-4 w-4 shrink-0" />
        <span>
          While your account is pending, you can still explore the patient experience. Patient
          records and clinical reports remain locked to protect privacy.
        </span>
      </div>
    </AuthShell>
  );
};

export default PendingApprovalPage;
