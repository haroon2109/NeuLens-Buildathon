import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Stethoscope, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import { AuthShell } from './AuthShell';

type RoleOption = {
  role: 'patient' | 'doctor' | 'institution';
  icon: LucideIcon;
  title: string;
  detail: string;
  tag: string;
  ring: string;
};

const roles: RoleOption[] = [
  {
    role: 'patient',
    icon: UserRound,
    title: 'Patient or family member',
    detail: 'Create a personal brain-health profile, take guided screenings, and follow your progress over time.',
    tag: 'Immediate access after verification',
    ring: '0 text-forest',
  },
  {
    role: 'doctor',
    icon: Stethoscope,
    title: 'Doctor or clinician',
    detail: 'Review patient screening histories, meaningful change, and care-context information in one workspace.',
    tag: 'Requires credential review',
    ring: 'bg-mint-veil text-health-teal',
  },
  {
    role: 'institution',
    icon: Building2,
    title: 'Healthcare institution',
    detail: 'Represent a hospital, clinic, or research site and manage professional access for your care team.',
    tag: 'Requires institutional approval',
    ring: 'bg-clay text-clay-deep',
  },
];

export const RoleSelectPage: React.FC = () => {
  return (
    <AuthShell
      icon={UsersRound}
      eyebrow="Create your account"
      badge="Screen 08 · Step 1 of 2"
      title="How will you use NeuLens?"
      description="Choose the account type that fits you. Registration differs by role, and clinical accounts are reviewed before patient information is available."
      backTo="/"
      backLabel="Back to NeuLens"
      footer={
        <p className="portal-login-switch">
          Already have an account? <Link to="/patient/login">Patient sign in</Link> ·{' '}
          <Link to="/doctor/login">Clinician sign in</Link>
        </p>
      }
    >
      <ul className="auth-role-list" aria-label="Account types">
        {roles.map(({ role, icon: Icon, title, detail, tag, ring }) => (
          <li key={role}>
            <Link to={`/auth/signup?role=${role}`} className="auth-role-option">
              <span className={`auth-role-icon ${ring}`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="auth-role-copy">
                <strong>{title}</strong>
                <span>{detail}</span>
                <em>{tag}</em>
              </span>
              <span className="auth-role-arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="portal-secure-note">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Patients control their data. Clinicians only see records after professional verification.
      </div>
    </AuthShell>
  );
};

export default RoleSelectPage;
