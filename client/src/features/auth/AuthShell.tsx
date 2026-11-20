import type { FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { PortalIllustration } from '../../components/PortalIllustration';

type AuthShellProps = {
  variant?: 'patient' | 'clinician';
  icon: LucideIcon;
  eyebrow: string;
  badge?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  backTo?: string;
  backLabel?: string;
  width?: 'default' | 'wide';
};

/**
 * Shared frame for the role-based authentication screens. It reuses the portal
 * illustration, tokens, and typography so the auth flow matches the landing page.
 */
export const AuthShell: FC<AuthShellProps> = ({
  variant = 'patient',
  icon: Icon,
  eyebrow,
  badge,
  title,
  description,
  children,
  footer,
  backTo = '/',
  backLabel = 'Back to NeuLens',
  width = 'default',
}) => (
  <div className="portal-login-page portal-registration-page">
    <header className="portal-login-header">
      <Link to="/" className="portal-brand" aria-label="NeuLens home">
        <NeuLensLogo height="h-9" />
      </Link>
      <Link to={backTo} className="portal-back-link">
        <ArrowLeft className="h-4 w-4" />
        <span>{backLabel}</span>
      </Link>
    </header>

    <main className="portal-login-main portal-registration-main">
      <PortalIllustration variant={variant} />

      <section
        className={`portal-login-card portal-registration-card ${width === 'wide' ? 'auth-card-wide' : ''}`}
        aria-labelledby="auth-page-title"
      >
        <div className="portal-form-step">
          <span className="portal-form-step-icon">
            <Icon className="h-4 w-4" />
          </span>
          <span>{eyebrow}</span>
          {badge && <span className="portal-form-step-count">{badge}</span>}
        </div>

        <div className="portal-form-heading">
          <h1 id="auth-page-title">{title}</h1>
          <p>{description}</p>
        </div>

        {children}

        {footer}
      </section>
    </main>

    <footer className="portal-login-footer">
      <span>NeuLens · Screening support, not a diagnosis</span>
      <Link to="/auth/role-selection">Patient, doctor, or institution</Link>
    </footer>
  </div>
);

export default AuthShell;
