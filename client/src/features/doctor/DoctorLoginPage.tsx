import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { doctorApi } from '../../services/portalApi';
import { authApi, AuthRequestError } from '../../services/authApi';
import { endSession } from '../../services/sessionApi';
import { portalPathForUser } from '../auth/authRouting';
import { DemoAccessPanel } from '../auth/DemoAccessPanel';
import { useAuthStore } from '../../store/authStore';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { PortalIllustration } from '../../components/PortalIllustration';

export const DoctorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Account-based clinicians (including the jury demo) sign in through the
      // shared account service so verification and pending-review handling match.
      const response = await authApi.signin({
        identifier: email.trim(),
        password,
        rememberMe: true,
      });

      if (!response.user) {
        setErrorMsg('The server did not return a session. Please try again.');
        return;
      }

      if (
        response.user.role !== 'CLINICIAN' &&
        response.user.role !== 'ADMIN' &&
        response.user.role !== 'INSTITUTION'
      ) {
        await endSession();
        setErrorMsg('This is the clinician portal. Please use the patient portal to sign in.');
        return;
      }

      login(response.user, true);
      navigate(portalPathForUser(response.user), { replace: true });
    } catch (err) {
      if (err instanceof AuthRequestError) {
        if (err.payload?.requiresVerification && err.payload.challengeId) {
          navigate('/auth/verify', {
            state: {
              challengeId: err.payload.challengeId,
              devOtp: err.payload.devOtp,
              identifier: err.payload.account?.email || email.trim(),
              name: err.payload.account?.name,
              role: err.payload.account?.role,
              portal: 'doctor',
              isPasswordReset: false,
            },
          });
          return;
        }

        if (err.status === 401) {
          // Clinicians provisioned directly into the clinical user table keep
          // using the dedicated clinician endpoint.
          try {
            const res = await doctorApi.login(email.trim(), password);
            login(res.doctor, true);
            navigate(portalPathForUser(res.doctor), { replace: true });
            return;
          } catch (clinicalError: any) {
            setErrorMsg(clinicalError?.message || 'Invalid clinician credentials.');
            return;
          }
        }

        setErrorMsg(err.message);
        return;
      }

      setErrorMsg('We could not sign you in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="portal-login-page">
      <header className="portal-login-header">
        <Link to="/" className="portal-brand" aria-label="NeuLens home">
          <NeuLensLogo height="h-9" />
        </Link>
        <Link to="/patient" className="portal-back-link">
          <ArrowLeft className="h-4 w-4" />
          <span>Patient portal</span>
        </Link>
      </header>

      <main className="portal-login-main">
        <PortalIllustration variant="clinician" />

        <section className="portal-login-card" aria-labelledby="clinician-login-title">
          <div className="portal-form-step">
            <span className="portal-form-step-icon">
              <Building2 className="h-4 w-4" />
            </span>
            <span>Healthcare professionals</span>
            <span className="portal-form-step-count">Secure access</span>
          </div>

          <div className="portal-form-heading">
            <h1 id="clinician-login-title">Welcome back</h1>
            <p>Sign in to review patient sessions and screening summaries.</p>
          </div>

          {errorMsg && (
            <div className="portal-error-alert" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <strong>Sign-in error</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <DemoAccessPanel mode="doctor" roles={['doctor']} onError={setErrorMsg} />

          <form onSubmit={handleSubmit} className="portal-login-form">
            <div className="portal-field">
              <label htmlFor="clinician-email">Hospital staff email</label>
              <div className="portal-input-wrap">
                <Mail className="portal-input-icon" />
                <input
                  id="clinician-email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="name@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="portal-input"
                />
              </div>
            </div>

            <div className="portal-field">
              <div className="portal-label-row">
                <label htmlFor="clinician-password">Password</label>
                <Link to="/auth/forgot-password?portal=doctor">Forgot password?</Link>
              </div>
              <div className="portal-input-wrap">
                <LockKeyhole className="portal-input-icon" />
                <input
                  id="clinician-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="portal-input"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="portal-submit-button">
              <span>{isLoading ? 'Authenticating clinician…' : 'Sign in to clinical portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="portal-secure-note">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Role-based access control · Activity is audit logged
          </div>
        </section>
      </main>

      <footer className="portal-login-footer">
        <span>NeuLens hospital neurological screening platform · Authorised staff only</span>
        <Link to="/patient/login">Go to patient sign-in</Link>
      </footer>
    </div>
  );
};

export default DoctorLoginPage;
