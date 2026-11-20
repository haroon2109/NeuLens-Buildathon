import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  Languages,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { AuthShell } from './AuthShell';
import { AuthRequestError, authApi } from '../../services/authApi';

type SignupRole = 'patient' | 'doctor' | 'institution';

const roleCopy: Record<
  SignupRole,
  { serverRole: 'PATIENT' | 'CLINICIAN' | 'INSTITUTION'; title: string; description: string; eyebrow: string }
> = {
  patient: {
    serverRole: 'PATIENT',
    title: 'Create your patient profile',
    description:
      'Your details help personalise assessments and establish a personal brain-health baseline. You can review and update them later.',
    eyebrow: 'Patient registration',
  },
  doctor: {
    serverRole: 'CLINICIAN',
    title: 'Register as a clinician',
    description:
      'Tell us about your professional practice. Your registration and institutional affiliation are reviewed before patient records become available.',
    eyebrow: 'Clinical registration',
  },
  institution: {
    serverRole: 'INSTITUTION',
    title: 'Register your institution',
    description:
      'Request an organisational account for your hospital, clinic, or research site. Our team verifies the institution before activation.',
    eyebrow: 'Institution registration',
  },
};

const languageOptions = [
  { value: 'en', label: 'English (India / Global)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'ml', label: 'മലയാളം (Malayalam)' },
];

const specialtyOptions = [
  'Neurology',
  'Geriatric Medicine',
  'Psychiatry',
  'Neuropsychology',
  'General Medicine',
  'Rehabilitation Medicine',
  'Other',
];

const institutionTypes = ['Hospital', 'Clinic', 'Diagnostic centre', 'Research institution', 'Community health programme'];

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const role: SignupRole | null =
    roleParam === 'patient' || roleParam === 'doctor' || roleParam === 'institution' ? roleParam : null;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    dateOfBirth: '',
    gender: 'PREFER_NOT_TO_SAY',
    language: 'en',
    specialty: 'Neurology',
    professionalRegistrationNumber: '',
    yearsExperience: '',
    institutionName: '',
    institutionType: 'Hospital',
    institutionRegistrationNumber: '',
    contactPerson: '',
    city: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const copy = role ? roleCopy[role] : null;
  const passwordHasLetter = /[A-Za-z]/.test(form.password);
  const passwordHasNumber = /\d/.test(form.password);

  const roleTabs = useMemo(
    () => [
      { role: 'patient' as const, label: 'Patient', icon: UserRound },
      { role: 'doctor' as const, label: 'Doctor', icon: Stethoscope },
      { role: 'institution' as const, label: 'Institution', icon: Building2 },
    ],
    []
  );

  if (!role || !copy) {
    return <Navigate to="/auth/role-selection" replace />;
  }

  const update = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));

  const validate = (): string | null => {
    if (form.name.trim().length < 2) return 'Enter your full name.';
    if (!isValidEmail(form.email)) return 'Enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number.';
    if (form.password.length < 8) return 'Your password must be at least 8 characters long.';
    if (!passwordHasLetter || !passwordHasNumber) {
      return 'Your password must include at least one letter and one number.';
    }
    if (form.password !== form.confirmPassword) return 'The passwords you entered do not match.';

    if (role === 'patient') {
      if (!form.dateOfBirth) return 'Enter your date of birth.';
    }

    if (role === 'doctor') {
      if (!form.professionalRegistrationNumber.trim()) {
        return 'Enter your medical registration or licence number.';
      }
      if (!form.specialty.trim()) return 'Select your specialty.';
      if (!form.institutionName.trim()) return 'Enter the hospital or clinic you are affiliated with.';
    }

    if (role === 'institution') {
      if (!form.institutionName.trim()) return 'Enter the institution name.';
      if (!form.institutionRegistrationNumber.trim()) return 'Enter the institution registration number.';
      if (!form.contactPerson.trim()) return 'Enter the name of the primary contact person.';
    }

    if (!form.acceptedTerms) {
      return 'Please accept the privacy and consent notice to continue.';
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.signup({
        role: copy.serverRole,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        acceptedTerms: form.acceptedTerms,
        ...(role === 'patient'
          ? {
              dateOfBirth: form.dateOfBirth,
              gender: form.gender,
              language: form.language,
            }
          : {}),
        ...(role === 'doctor'
          ? {
              specialty: form.specialty,
              professionalRegistrationNumber: form.professionalRegistrationNumber.trim(),
              institutionName: form.institutionName.trim(),
              yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
              city: form.city.trim() || undefined,
            }
          : {}),
        ...(role === 'institution'
          ? {
              institutionName: form.institutionName.trim(),
              institutionType: form.institutionType,
              institutionRegistrationNumber: form.institutionRegistrationNumber.trim(),
              contactPerson: form.contactPerson.trim(),
              city: form.city.trim() || undefined,
            }
          : {}),
      });

      navigate('/auth/verify', {
        state: {
          challengeId: response.challengeId,
          devOtp: response.devOtp,
          identifier: form.email.trim(),
          name: form.name.trim(),
          role: copy.serverRole,
          isPasswordReset: false,
        },
      });
    } catch (error) {
      setErrorMsg(
        error instanceof AuthRequestError
          ? error.message
          : 'We could not create your account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      variant={role === 'patient' ? 'patient' : 'clinician'}
      icon={role === 'patient' ? UserPlus : role === 'doctor' ? Stethoscope : Building2}
      eyebrow={copy.eyebrow}
      badge="Screen 09 · Step 2 of 2"
      title={copy.title}
      description={copy.description}
      backTo="/auth/role-selection"
      backLabel="Change account type"
      width="wide"
      footer={
        <p className="portal-login-switch">
          Already registered?{' '}
          <Link to={role === 'patient' ? '/patient/login' : '/doctor/login'}>Sign in</Link>
        </p>
      }
    >
      <div className="auth-role-tabs" role="tablist" aria-label="Account type">
        {roleTabs.map(({ role: tabRole, label, icon: Icon }) => (
          <Link
            key={tabRole}
            to={`/auth/signup?role=${tabRole}`}
            className={`auth-role-tab ${tabRole === role ? 'is-active' : ''}`}
            role="tab"
            aria-selected={tabRole === role}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {errorMsg && (
        <div className="portal-error-alert" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong>Please check your information</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="portal-login-form portal-registration-form" noValidate>
        <div className="portal-field">
          <label htmlFor="signup-name">{role === 'institution' ? 'Institution contact name' : 'Full name'}</label>
          <div className="portal-input-wrap">
            <UserRound className="portal-input-icon" />
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder={role === 'institution' ? 'e.g. Dr. Meera Krishnan' : 'e.g. Eleanor Vance'}
              className="portal-input"
            />
          </div>
        </div>

        <div className="portal-registration-grid">
          <div className="portal-field">
            <label htmlFor="signup-email">Email address</label>
            <div className="portal-input-wrap">
              <Mail className="portal-input-icon" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder={role === 'institution' ? 'admin@hospital.org' : 'name@domain.com'}
                className="portal-input"
              />
            </div>
          </div>

          <div className="portal-field">
            <label htmlFor="signup-phone">Phone number</label>
            <div className="portal-input-wrap">
              <Phone className="portal-input-icon" />
              <input
                id="signup-phone"
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="+91 98765 43210"
                className="portal-input"
              />
            </div>
          </div>
        </div>

        {role === 'patient' && (
          <>
            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="signup-dob">Date of birth</label>
                <div className="portal-input-wrap">
                  <CalendarDays className="portal-input-icon" />
                  <input
                    id="signup-dob"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    autoComplete="bday"
                    value={form.dateOfBirth}
                    onChange={(event) => update('dateOfBirth', event.target.value)}
                    className="portal-input"
                  />
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="signup-gender">Gender</label>
                <div className="portal-input-wrap">
                  <UsersRound className="portal-input-icon" />
                  <select
                    id="signup-gender"
                    value={form.gender}
                    onChange={(event) => update('gender', event.target.value)}
                    className="portal-input portal-input-select"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="portal-field">
              <label htmlFor="signup-language">Preferred language</label>
              <div className="portal-input-wrap">
                <Languages className="portal-input-icon" />
                <select
                  id="signup-language"
                  value={form.language}
                  onChange={(event) => update('language', event.target.value)}
                  className="portal-input portal-input-select"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="portal-field-hint">You can change this before each screening.</p>
            </div>
          </>
        )}

        {role === 'doctor' && (
          <>
            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="signup-specialty">Specialty</label>
                <div className="portal-input-wrap">
                  <Stethoscope className="portal-input-icon" />
                  <select
                    id="signup-specialty"
                    value={form.specialty}
                    onChange={(event) => update('specialty', event.target.value)}
                    className="portal-input portal-input-select"
                  >
                    {specialtyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="signup-registration">Medical registration no.</label>
                <div className="portal-input-wrap">
                  <Hash className="portal-input-icon" />
                  <input
                    id="signup-registration"
                    type="text"
                    required
                    value={form.professionalRegistrationNumber}
                    onChange={(event) => update('professionalRegistrationNumber', event.target.value)}
                    placeholder="e.g. REG-2026-001"
                    className="portal-input"
                  />
                </div>
              </div>
            </div>

            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="signup-institution">Hospital or clinic</label>
                <div className="portal-input-wrap">
                  <Building2 className="portal-input-icon" />
                  <input
                    id="signup-institution"
                    type="text"
                    required
                    autoComplete="organization"
                    value={form.institutionName}
                    onChange={(event) => update('institutionName', event.target.value)}
                    placeholder="e.g. Hospital or clinic name"
                    className="portal-input"
                  />
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="signup-experience">Years in practice</label>
                <div className="portal-input-wrap">
                  <GraduationCap className="portal-input-icon" />
                  <input
                    id="signup-experience"
                    type="number"
                    min="0"
                    max="70"
                    value={form.yearsExperience}
                    onChange={(event) => update('yearsExperience', event.target.value)}
                    placeholder="e.g. 12"
                    className="portal-input"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {role === 'institution' && (
          <>
            <div className="portal-field">
              <label htmlFor="signup-institution-name">Institution name</label>
              <div className="portal-input-wrap">
                <Building2 className="portal-input-icon" />
                <input
                  id="signup-institution-name"
                  type="text"
                  required
                  autoComplete="organization"
                  value={form.institutionName}
                  onChange={(event) => update('institutionName', event.target.value)}
                  placeholder="e.g. Sunrise Memory Clinic"
                  className="portal-input"
                />
              </div>
            </div>

            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="signup-institution-type">Institution type</label>
                <div className="portal-input-wrap">
                  <UsersRound className="portal-input-icon" />
                  <select
                    id="signup-institution-type"
                    value={form.institutionType}
                    onChange={(event) => update('institutionType', event.target.value)}
                    className="portal-input portal-input-select"
                  >
                    {institutionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="signup-institution-registration">Registration number</label>
                <div className="portal-input-wrap">
                  <Hash className="portal-input-icon" />
                  <input
                    id="signup-institution-registration"
                    type="text"
                    required
                    value={form.institutionRegistrationNumber}
                    onChange={(event) => update('institutionRegistrationNumber', event.target.value)}
                    placeholder="e.g. TN-HOSP-2026-1184"
                    className="portal-input"
                  />
                </div>
              </div>
            </div>

            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="signup-contact-person">Primary contact person</label>
                <div className="portal-input-wrap">
                  <UserRound className="portal-input-icon" />
                  <input
                    id="signup-contact-person"
                    type="text"
                    required
                    value={form.contactPerson}
                    onChange={(event) => update('contactPerson', event.target.value)}
                    placeholder="e.g. Dr. Meera Krishnan"
                    className="portal-input"
                  />
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="signup-city">City</label>
                <div className="portal-input-wrap">
                  <MapPin className="portal-input-icon" />
                  <input
                    id="signup-city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                    placeholder="e.g. Chennai"
                    className="portal-input"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="portal-registration-grid">
          <div className="portal-field">
            <label htmlFor="signup-password">Password</label>
            <div className="portal-input-wrap">
              <LockKeyhole className="portal-input-icon" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="At least 8 characters"
                className="portal-input"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="portal-field-hint">
              Use 8+ characters with at least one letter and one number.
            </p>
          </div>

          <div className="portal-field">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <div className="portal-input-wrap">
              <LockKeyhole className="portal-input-icon" />
              <input
                id="signup-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                placeholder="Re-enter your password"
                className="portal-input"
              />
            </div>
          </div>
        </div>

        <label className="auth-check-row" htmlFor="signup-terms">
          <input
            id="signup-terms"
            type="checkbox"
            checked={form.acceptedTerms}
            onChange={(event) => update('acceptedTerms', event.target.checked)}
          />
          <span>
            I agree to the privacy notice and consent to my information being used to support
            screening and clinical review. I understand NeuLens supports, but does not replace,
            professional assessment.
          </span>
        </label>

        <button type="submit" disabled={isLoading} className="portal-submit-button">
          <span>{isLoading ? 'Creating your account…' : 'Create account'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {role !== 'patient' && (
        <div className="auth-notice">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            Clinical accounts remain pending until registration and institutional affiliation are
            verified. Patient records stay inaccessible during review.
          </span>
        </div>
      )}
    </AuthShell>
  );
};

export default SignUpPage;
