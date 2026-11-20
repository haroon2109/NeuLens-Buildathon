import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical, Stethoscope, UserRound } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { patientApi } from '../../services/portalApi';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { SupportedLanguage } from '../../services/language/types';
import { portalPathForUser } from './authRouting';
import { DEMO_ACCOUNTS, type DemoRole } from './demoAccounts';
import { getEntryCopy } from '../../services/language/entryCopy';

type DemoAccessPanelProps = {
  mode: 'shared' | 'patient-id' | 'doctor';
  roles?: DemoRole[];
  onError: (message: string) => void;
};

/**
 * One-click access to the fictional jury accounts. This still performs a real
 * server sign-in; it only removes the typing and OTP/approval wait.
 */
export const DemoAccessPanel: React.FC<DemoAccessPanelProps> = ({
  mode,
  roles = ['patient', 'doctor'],
  onError,
}) => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { setLanguage, currentLanguage } = useLanguageStore();
  const copy = getEntryCopy(currentLanguage);
  const [busy, setBusy] = useState<DemoRole | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .demoStatus()
      .then((status) => {
        if (active) setAvailable(Boolean(status.enabled));
      })
      .catch(() => {
        // Do not advertise demo credentials when the server cannot confirm them.
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openDemo = async (role: DemoRole) => {
    setBusy(role);
    onError('');

    try {
      if (mode === 'patient-id') {
        const response = await patientApi.login({
          patientId: DEMO_ACCOUNTS.patient.patientId,
          verification: DEMO_ACCOUNTS.patient.pin,
        });

        login({ ...response.user, role: 'PATIENT' }, false);
        if (response.user.language) {
          setLanguage(response.user.language as SupportedLanguage);
        }
        navigate('/patient/welcome', { replace: true });
        return;
      }

      const account = role === 'patient' ? DEMO_ACCOUNTS.patient : DEMO_ACCOUNTS.doctor;
      const response = await authApi.signin({
        identifier: account.email,
        password: account.password,
        rememberMe: true,
      });

      if (!response.user) {
        onError(copy.demo.sessionFailed);
        return;
      }

      login(response.user, true);
      navigate(portalPathForUser(response.user), { replace: true });
    } catch (error: any) {
      onError(
        currentLanguage === 'ar'
          ? copy.demo.unavailable
          : error?.message || copy.demo.unavailable
      );
    } finally {
      setBusy(null);
    }
  };

  const showPatient = roles.includes('patient');
  const showDoctor = roles.includes('doctor');

  if (!available) return null;

  return (
    <section className="portal-demo-section" aria-labelledby="demo-access-heading">
      <div className="portal-demo-heading">
        <FlaskConical className="h-4 w-4" aria-hidden="true" />
        <span id="demo-access-heading">{copy.demo.heading}</span>
      </div>
      <p className="portal-demo-description">
        {mode === 'doctor'
          ? copy.demo.doctorDesc
          : mode === 'patient-id'
            ? copy.demo.patientIdDesc
            : copy.demo.sharedDesc}
      </p>

      <div className="portal-demo-grid">
        {showPatient && (
          <button
            type="button"
            className="portal-demo-patient"
            onClick={() => openDemo('patient')}
            disabled={busy !== null}
            aria-busy={busy === 'patient'}
          >
            <span className="portal-demo-avatar" aria-hidden="true">
              H
            </span>
            <span>
              <strong>{busy === 'patient' ? copy.demo.openingPatient : copy.demo.patient}</strong>
              <span>{copy.demo.patientMeta}</span>
            </span>
            <ArrowRight className="portal-demo-arrow" aria-hidden="true" />
          </button>
        )}

        {showDoctor && (
          <button
            type="button"
            className="portal-demo-clinician"
            onClick={() => openDemo('doctor')}
            disabled={busy !== null}
            aria-busy={busy === 'doctor'}
          >
            <span className="portal-demo-avatar portal-demo-avatar-blue" aria-hidden="true">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span>
              <strong>{busy === 'doctor' ? copy.demo.openingDoctor : copy.demo.doctor}</strong>
              <span>{copy.demo.doctorMeta}</span>
            </span>
            <ArrowRight className="portal-demo-arrow" aria-hidden="true" />
          </button>
        )}
      </div>

      <details className="portal-demo-credentials">
        <summary>{copy.demo.credentialsSummary}</summary>
        {mode !== 'patient-id' && (
          <div className="portal-demo-credential-row">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {copy.demo.clinicianLabel} <code>{DEMO_ACCOUNTS.doctor.email}</code> /{' '}
              <code>{DEMO_ACCOUNTS.doctor.password}</code>
            </span>
          </div>
        )}
        {mode === 'shared' && (
          <div className="portal-demo-credential-row">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {copy.demo.patientLabel} <code>{DEMO_ACCOUNTS.patient.email}</code> /{' '}
              <code>{DEMO_ACCOUNTS.patient.password}</code>
            </span>
          </div>
        )}
        {mode !== 'doctor' && (
          <div className="portal-demo-credential-row">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {copy.demo.patientCheckinLabel} <code>{DEMO_ACCOUNTS.patient.patientId}</code> /{' '}
              {copy.demo.pinLabel}{' '}
              <code>{DEMO_ACCOUNTS.patient.pin}</code>
            </span>
          </div>
        )}
      </details>
    </section>
  );
};

export default DemoAccessPanel;
