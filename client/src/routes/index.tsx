import React from 'react';
import { createBrowserRouter, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts and the landing page stay eager: they are the shell and the first
// paint for every visitor.
import { AppLayout } from '../layouts/AppLayout';
import { DoctorLayout } from '../layouts/DoctorLayout';
import { PatientPortalLayout } from '../features/patient/portal/PatientPortalLayout';
import { LandingPage } from '../features/landing/LandingPage';

/**
 * Route-level code splitting.
 *
 * A single entry bundle forced every visitor — including a patient on a slow
 * connection opening the landing page — to download the clinician charts,
 * report tooling and assessment engine before seeing anything. Each screen now
 * loads on navigation instead.
 */
const lazyPage = <T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  exportName: keyof T & string
) =>
  React.lazy(async () => {
    const module = await loader();
    return { default: module[exportName] as unknown as React.ComponentType };
  });

// Patient portal entry screens
const PatientHubPage = lazyPage(() => import('../features/patient/PatientHubPage'), 'PatientHubPage');
const PatientRegisterPage = lazyPage(() => import('../features/patient/PatientRegisterPage'), 'PatientRegisterPage');
const PatientLoginPage = lazyPage(() => import('../features/patient/PatientLoginPage'), 'PatientLoginPage');
const PatientLanguagePage = lazyPage(() => import('../features/patient/PatientLanguagePage'), 'PatientLanguagePage');
const PatientAssessmentPage = lazyPage(() => import('../features/patient/PatientAssessmentPage'), 'PatientAssessmentPage');
const PatientCompletionPage = lazyPage(() => import('../features/patient/PatientCompletionPage'), 'PatientCompletionPage');
const AccessibleArabicCheckinPage = lazyPage(() => import('../features/accessible/AccessibleArabicCheckinPage'), 'AccessibleArabicCheckinPage');

// Patient portal (screens 15–45)
const PatientWelcomePage = lazyPage(() => import('../features/patient/portal/PatientOnboardingPages'), 'PatientWelcomePage');
const PersonalInfoPage = lazyPage(() => import('../features/patient/portal/PatientOnboardingPages'), 'PersonalInfoPage');
const HealthBackgroundPage = lazyPage(() => import('../features/patient/portal/PatientOnboardingPages'), 'HealthBackgroundPage');
const ConsentPrivacyPage = lazyPage(() => import('../features/patient/portal/PatientOnboardingPages'), 'ConsentPrivacyPage');
const AccessibilitySetupPage = lazyPage(() => import('../features/patient/portal/PatientOnboardingPages'), 'AccessibilitySetupPage');

const PatientDashboardPage = lazyPage(() => import('../features/patient/portal/PatientDashboardPage'), 'PatientDashboardPage');

const AssessmentIntroductionPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'AssessmentIntroductionPage');
const CognitiveAssessmentPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'CognitiveAssessmentPage');
const OcularAssessmentPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'OcularAssessmentPage');
const VocalAssessmentPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'VocalAssessmentPage');
const FacialAssessmentPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'FacialAssessmentPage');
const AssessmentCompletionPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'AssessmentCompletionPage');
const AssessmentQualityReportPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'AssessmentQualityReportPage');
const PersonalBaselineReportPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'PersonalBaselineReportPage');
const AssessmentReportPage = lazyPage(() => import('../features/patient/portal/PatientAssessmentPages'), 'AssessmentReportPage');

const CognitiveHubPage = lazyPage(() => import('../features/cognitive/CognitiveHubPage'), 'CognitiveHubPage');
const CognitiveTaskLibraryPage = lazyPage(() => import('../features/cognitive/CognitiveTaskLibraryPage'), 'CognitiveTaskLibraryPage');
const CognitiveSessionDetailPage = lazyPage(() => import('../features/cognitive/CognitiveSessionDetailPage'), 'CognitiveSessionDetailPage');
const PatientAssessmentConditionsPage = lazyPage(() => import('../features/cognitive/PatientAssessmentConditionsPage'), 'PatientAssessmentConditionsPage');

const BrainHealthOverviewPage = lazyPage(() => import('../features/patient/portal/PatientMonitoringPages'), 'BrainHealthOverviewPage');
const AssessmentHistoryPage = lazyPage(() => import('../features/patient/portal/PatientMonitoringPages'), 'AssessmentHistoryPage');
const LongitudinalTrendsPage = lazyPage(() => import('../features/patient/portal/PatientMonitoringPages'), 'LongitudinalTrendsPage');
const ChangeDetectionPage = lazyPage(() => import('../features/patient/portal/PatientMonitoringPages'), 'ChangeDetectionPage');

const PatientHealthProfilePage = lazyPage(() => import('../features/patient/portal/PatientRequestedScreens'), 'PatientHealthProfilePage');
const DailyFunctionQuestionnairePage = lazyPage(() => import('../features/patient/portal/PatientRequestedScreens'), 'DailyFunctionQuestionnairePage');
const BrainHealthTimelinePage = lazyPage(() => import('../features/patient/portal/PatientRequestedScreens'), 'BrainHealthTimelinePage');
const PersonalizedPreventionPlanPage = lazyPage(() => import('../features/patient/portal/PatientRequestedScreens'), 'PersonalizedPreventionPlanPage');

const HealthContextOverviewPage = lazyPage(() => import('../features/patient/portal/PatientContextPages'), 'HealthContextOverviewPage');
const SleepLifestylePage = lazyPage(() => import('../features/patient/portal/PatientContextPages'), 'SleepLifestylePage');
const MentalWellbeingPage = lazyPage(() => import('../features/patient/portal/PatientContextPages'), 'MentalWellbeingPage');
const ClinicalFamilyHistoryPage = lazyPage(() => import('../features/patient/portal/PatientContextPages'), 'ClinicalFamilyHistoryPage');

const AppointmentsPage = lazyPage(() => import('../features/patient/portal/PatientCarePages'), 'AppointmentsPage');
const CarePlanPage = lazyPage(() => import('../features/patient/portal/PatientCarePages'), 'CarePlanPage');
const NotificationsPage = lazyPage(() => import('../features/patient/portal/PatientCarePages'), 'NotificationsPage');
const DocumentsPage = lazyPage(() => import('../features/patient/portal/PatientCarePages'), 'DocumentsPage');

const MyProfilePage = lazyPage(() => import('../features/patient/portal/PatientAccountPages'), 'MyProfilePage');
const AccountSettingsPage = lazyPage(() => import('../features/patient/portal/PatientAccountPages'), 'AccountSettingsPage');
const PrivacyDataPage = lazyPage(() => import('../features/patient/portal/PatientAccountPages'), 'PrivacyDataPage');
const HelpSupportPage = lazyPage(() => import('../features/patient/portal/PatientAccountPages'), 'HelpSupportPage');

// Shared authentication views (screens 08–14)
const RoleSelectPage = lazyPage(() => import('../features/auth/RoleSelectPage'), 'RoleSelectPage');
const SignUpPage = lazyPage(() => import('../features/auth/SignUpPage'), 'SignUpPage');

const VerifyOtpPage = lazyPage(() => import('../features/auth/VerifyOtpPage'), 'VerifyOtpPage');
const ForgotPasswordPage = lazyPage(() => import('../features/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyPage(() => import('../features/auth/ResetPasswordPage'), 'ResetPasswordPage');
const PendingApprovalPage = lazyPage(() => import('../features/auth/PendingApprovalPage'), 'PendingApprovalPage');
const AccountSuspendedPage = lazyPage(() => import('../features/auth/AccountSuspendedPage'), 'AccountSuspendedPage');

// Clinician workspace
const DoctorLoginPage = lazyPage(() => import('../features/doctor/DoctorLoginPage'), 'DoctorLoginPage');
const DoctorDashboardPage = lazyPage(() => import('../features/doctor/DoctorDashboardPage'), 'DoctorDashboardPage');
const DoctorPatientsPage = lazyPage(() => import('../features/doctor/DoctorPatientsPage'), 'DoctorPatientsPage');
const DoctorPatientProfilePage = lazyPage(() => import('../features/doctor/DoctorPatientProfilePage'), 'DoctorPatientProfilePage');
const DoctorReportViewPage = lazyPage(() => import('../features/doctor/DoctorReportViewPage'), 'DoctorReportViewPage');
const DoctorPatientScreenPage = lazyPage(() => import('../features/doctor/DoctorPatientScreenPage'), 'DoctorPatientScreenPage');
const DoctorReportsPage = lazyPage(() => import('../features/doctor/portal/DoctorReportsSettingsPages'), 'DoctorReportsPage');
const DoctorSettingsPage = lazyPage(() => import('../features/doctor/portal/DoctorReportsSettingsPages'), 'DoctorSettingsPage');

const DoctorRegistrationPage = lazyPage(() => import('../features/doctor/portal/DoctorOnboardingPages'), 'DoctorRegistrationPage');
const DoctorVerificationPage = lazyPage(() => import('../features/doctor/portal/DoctorOnboardingPages'), 'DoctorVerificationPage');
const ClinicSetupPage = lazyPage(() => import('../features/doctor/portal/DoctorOnboardingPages'), 'ClinicSetupPage');

const AddPatientPage = lazyPage(() => import('../features/doctor/portal/DoctorPatientScreens'), 'AddPatientPage');
const DoctorPatientOverviewPage = lazyPage(() => import('../features/doctor/portal/DoctorPatientScreens'), 'DoctorPatientOverviewPage');

const DoctorCognitivePage = lazyPage(() => import('../features/doctor/DoctorCognitivePage'), 'DoctorCognitivePage');
const DoctorAssessmentReviewPage = lazyPage(() => import('../features/doctor/portal/DoctorClinicalReviewPages'), 'DoctorAssessmentReviewPage');
const DoctorLongitudinalPage = lazyPage(() => import('../features/doctor/portal/DoctorClinicalReviewPages'), 'DoctorLongitudinalPage');

const DoctorChangeDetectionPage = lazyPage(() => import('../features/doctor/portal/DoctorChangeContextNotesPages'), 'DoctorChangeDetectionPage');
const ChangeDetectionQueuePage = lazyPage(() => import('../features/doctor/portal/DoctorChangeContextNotesPages'), 'ChangeDetectionQueuePage');
const DoctorHealthContextPage = lazyPage(() => import('../features/doctor/portal/DoctorChangeContextNotesPages'), 'DoctorHealthContextPage');
const DoctorClinicalNotesPage = lazyPage(() => import('../features/doctor/portal/DoctorChangeContextNotesPages'), 'DoctorClinicalNotesPage');

const DoctorCarePlanPage = lazyPage(() => import('../features/doctor/portal/DoctorCarePages'), 'DoctorCarePlanPage');
const DoctorPatientReferralsPage = lazyPage(() => import('../features/doctor/portal/DoctorCarePages'), 'DoctorPatientReferralsPage');
const DoctorReferralManagementPage = lazyPage(() => import('../features/doctor/portal/DoctorCarePages'), 'DoctorReferralManagementPage');
const DoctorAppointmentsPage = lazyPage(() => import('../features/doctor/portal/DoctorCarePages'), 'DoctorAppointmentsPage');
const DoctorPatientAppointmentsPage = lazyPage(() => import('../features/doctor/portal/DoctorCarePages'), 'DoctorPatientAppointmentsPage');

const DoctorClinicalReviewQueuePage = lazyPage(() => import('../features/doctor/portal/DoctorRequestedScreens'), 'DoctorClinicalReviewQueuePage');
const DoctorQualityEquityPage = lazyPage(() => import('../features/doctor/portal/DoctorRequestedScreens'), 'DoctorQualityEquityPage');
const DoctorEvidenceDataQualityPage = lazyPage(() => import('../features/doctor/portal/DoctorRequestedScreens'), 'DoctorEvidenceDataQualityPage');
const DoctorClinicalApprovalPage = lazyPage(() => import('../features/doctor/portal/DoctorRequestedScreens'), 'DoctorClinicalApprovalPage');
const DoctorAssessmentReadinessPage = lazyPage(() => import('../features/doctor/portal/DoctorAssessmentReadinessPage'), 'DoctorAssessmentReadinessPage');

const AboutPage = lazyPage(() => import('../features/about/AboutPage'), 'AboutPage');


// Doctor Route Guard: requires authentication, a clinical role, and verified credentials
const DoctorProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isClinician } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/doctor/login" replace />;
  }

  if (user?.role === 'PATIENT') {
    return <Navigate to="/patient/dashboard" replace />;
  }

  // Unverified or institutional accounts never reach patient records
  if (!isClinician() || user?.verificationStatus === 'PENDING' || user?.verificationStatus === 'REJECTED') {
    return <Navigate to="/auth/pending-approval" replace />;
  }

  return <>{children}</>;
};

// Clinician setup guard: authenticated professionals may complete onboarding
// before their credentials are verified. Patient records stay locked.
const ClinicianSetupRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/doctor/login" replace />;
  }

  if (user.role === 'PATIENT') {
    return <Navigate to="/patient/dashboard" replace />;
  }

  return <>{children}</>;
};

// Patient Guard: only an authenticated patient reaches portal screens
const PatientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/patient/login" replace />;
  }

  if (user.role !== 'PATIENT') {
    return <Navigate to={(user.role === 'CLINICIAN' || user.role === 'ADMIN') && user.verificationStatus !== 'PENDING' ? '/doctor/dashboard' : '/auth/pending-approval'} replace />;
  }

  return <>{children}</>;
};

// Old shared sign-in links now belong to one of the two dedicated portals.
const LegacyLoginRedirect = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  return (
    <Navigate
      to={role === 'doctor' || role === 'institution' ? '/doctor/login' : '/patient/login'}
      replace
    />
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'landing',
        element: <LandingPage />
      },

      // ----------------------------------------------------------------------
      // PATIENT PORTAL ROUTES (Portal & Assessment Experience)
      // ----------------------------------------------------------------------
      {
        path: 'patient',
        children: [
          {
            index: true,
            element: <PatientHubPage />
          },
          {
            path: 'register',
            element: <PatientRegisterPage />
          },
          {
            path: 'login',
            element: <PatientLoginPage />
          },
          {
            path: 'language',
            element: <PatientLanguagePage />
          },
          {
            path: 'assessment',
            element: <PatientAssessmentPage />
          },
          {
            path: 'assessment/complete',
            element: <PatientCompletionPage />
          },
          {
            path: 'accessible-checkin',
            element: <AccessibleArabicCheckinPage />
          }
        ]
      },

      // ----------------------------------------------------------------------
      // PATIENT PORTAL (screens 15–45) — onboarding is standalone; the rest
      // shares the portal sidebar and header.
      // ----------------------------------------------------------------------
      {
        path: 'patient/welcome',
        element: <PatientProtectedRoute><PatientWelcomePage /></PatientProtectedRoute>
      },
      {
        path: 'patient/onboarding/personal-info',
        element: <PatientProtectedRoute><PersonalInfoPage /></PatientProtectedRoute>
      },
      {
        path: 'patient/onboarding/health-background',
        element: <PatientProtectedRoute><HealthBackgroundPage /></PatientProtectedRoute>
      },
      {
        path: 'patient/onboarding/consent',
        element: <PatientProtectedRoute><ConsentPrivacyPage /></PatientProtectedRoute>
      },
      {
        path: 'patient/onboarding/accessibility',
        element: <PatientProtectedRoute><AccessibilitySetupPage /></PatientProtectedRoute>
      },
      {
        path: 'patient',
        element: <PatientProtectedRoute><PatientPortalLayout /></PatientProtectedRoute>,
        children: [
          { path: 'dashboard', element: <PatientDashboardPage /> },

          { path: 'cognitive', element: <CognitiveHubPage /> },
          { path: 'cognitive/library', element: <CognitiveTaskLibraryPage /> },
          { path: 'cognitive/history/:assessmentId', element: <CognitiveSessionDetailPage /> },
          { path: 'context/assessment-conditions', element: <PatientAssessmentConditionsPage /> },

          { path: 'assessment/intro', element: <AssessmentIntroductionPage /> },
          { path: 'assessment/cognitive', element: <CognitiveAssessmentPage /> },
          { path: 'assessment/ocular', element: <OcularAssessmentPage /> },
          { path: 'assessment/vocal', element: <VocalAssessmentPage /> },
          { path: 'assessment/facial', element: <FacialAssessmentPage /> },
          { path: 'assessment/submitted', element: <AssessmentCompletionPage /> },
          { path: 'assessment/quality', element: <AssessmentQualityReportPage /> },
          { path: 'assessment/baseline', element: <PersonalBaselineReportPage /> },
          { path: 'assessment/report', element: <AssessmentReportPage /> },

          { path: 'brain-health', element: <BrainHealthOverviewPage /> },
          { path: 'history', element: <AssessmentHistoryPage /> },
          { path: 'trends', element: <LongitudinalTrendsPage /> },
          { path: 'change-detection', element: <ChangeDetectionPage /> },
          { path: 'timeline', element: <BrainHealthTimelinePage /> },
          { path: 'daily-function', element: <DailyFunctionQuestionnairePage /> },
          { path: 'health-profile', element: <PatientHealthProfilePage /> },
          { path: 'prevention-plan', element: <PersonalizedPreventionPlanPage /> },

          { path: 'context', element: <HealthContextOverviewPage /> },
          { path: 'context/sleep', element: <SleepLifestylePage /> },
          { path: 'context/wellbeing', element: <MentalWellbeingPage /> },
          { path: 'context/clinical', element: <ClinicalFamilyHistoryPage /> },

          { path: 'appointments', element: <AppointmentsPage /> },
          { path: 'care-plan', element: <CarePlanPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'documents', element: <DocumentsPage /> },

          { path: 'profile', element: <MyProfilePage /> },
          { path: 'settings', element: <AccountSettingsPage /> },
          { path: 'privacy', element: <PrivacyDataPage /> },
          { path: 'help', element: <HelpSupportPage /> }
        ]
      },

      // ----------------------------------------------------------------------
      // SHARED AUTHENTICATION ROUTES (screens 08–14)
      // ----------------------------------------------------------------------
      {
        path: 'auth',
        element: <Navigate to="/auth/role-selection" replace />
      },
      {
        path: 'auth/role-selection',
        element: <RoleSelectPage />
      },
      {
        path: 'auth/signup',
        element: <SignUpPage />
      },
      {
        path: 'auth/login',
        element: <LegacyLoginRedirect />
      },
      {
        path: 'auth/verify',
        element: <VerifyOtpPage />
      },
      {
        path: 'auth/forgot-password',
        element: <ForgotPasswordPage />
      },
      {
        path: 'auth/reset-password',
        element: <ResetPasswordPage />
      },
      {
        path: 'auth/pending-approval',
        element: <PendingApprovalPage />
      },
      {
        path: 'account-suspended',
        element: <AccountSuspendedPage />
      },

      // ----------------------------------------------------------------------
      // CLINICIAN ONBOARDING (screens 46–48) — available while pending review
      // ----------------------------------------------------------------------
      {
        path: 'doctor/onboarding/registration',
        element: <ClinicianSetupRoute><DoctorRegistrationPage /></ClinicianSetupRoute>
      },
      {
        path: 'doctor/onboarding/verification',
        element: <ClinicianSetupRoute><DoctorVerificationPage /></ClinicianSetupRoute>
      },
      {
        path: 'doctor/onboarding/clinic',
        element: <ClinicianSetupRoute><ClinicSetupPage /></ClinicianSetupRoute>
      },

      // ----------------------------------------------------------------------
      // DOCTOR PORTAL ROUTES (Clinician Workspace)
      // ----------------------------------------------------------------------
      {
        path: 'doctor/login',
        element: <DoctorLoginPage />
      },
      {
        path: 'doctor',
        element: (
          <DoctorProtectedRoute>
            <DoctorLayout />
          </DoctorProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/doctor/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <DoctorDashboardPage />
          },
          {
            path: 'patients',
            element: <DoctorPatientsPage />
          },
          {
            path: 'patients/:id',
            element: <DoctorPatientOverviewPage />
          },
          {
            path: 'patients/:id/dossier',
            element: <DoctorPatientProfilePage />
          },
          {
            path: 'patients/:id/screen',
            element: <DoctorPatientScreenPage />
          },
          {
            path: 'patients/new',
            element: <AddPatientPage />
          },
          // Patient workflow (screens 51–59): review → trends → changes → context →
          // notes → care plan → referrals → appointments.
          {
            path: 'patients/:id/review',
            element: <DoctorAssessmentReviewPage />
          },
          {
            path: 'patients/:id/longitudinal',
            element: <DoctorLongitudinalPage />
          },
          {
            path: 'patients/:id/change-detection',
            element: <DoctorChangeDetectionPage />
          },
          {
            path: 'patients/:id/context',
            element: <DoctorHealthContextPage />
          },
          {
            path: 'patients/:id/notes',
            element: <DoctorClinicalNotesPage />
          },
          {
            path: 'patients/:id/care-plan',
            element: <DoctorCarePlanPage />
          },
          {
            path: 'patients/:id/referrals',
            element: <DoctorPatientReferralsPage />
          },
          {
            path: 'patients/:id/appointments',
            element: <DoctorPatientAppointmentsPage />
          },
          {
            path: 'screen',
            element: <Navigate to="/doctor/patients?select=true" replace />
          },
          {
            path: 'reports',
            element: <DoctorReportsPage />
          },
          {
            path: 'reports/:id',
            element: <DoctorReportViewPage />
          },
          {
            path: 'change-detection',
            element: <ChangeDetectionQueuePage />
          },
          {
            path: 'cognitive',
            element: <DoctorCognitivePage />
          },
          {
            path: 'review-queue',
            element: <DoctorClinicalReviewQueuePage />
          },
          {
            path: 'quality-equity',
            element: <DoctorQualityEquityPage />
          },
          {
            path: 'evidence-quality',
            element: <DoctorEvidenceDataQualityPage />
          },
          {
            path: 'assessment-readiness',
            element: <DoctorAssessmentReadinessPage />
          },
          {
            path: 'clinical-approval',
            element: <DoctorClinicalApprovalPage />
          },
          {
            path: 'referrals',
            element: <DoctorReferralManagementPage />
          },
          {
            path: 'appointments',
            element: <DoctorAppointmentsPage />
          },
          {
            path: 'longitudinal',
            element: <Navigate to="/doctor/patients" replace />
          },
          {
            path: 'assessments',
            element: <Navigate to="/doctor/patients" replace />
          },
          {
            path: 'analytics',
            element: <Navigate to="/doctor/dashboard" replace />
          },
          {
            path: 'settings',
            element: <DoctorSettingsPage />
          },
          {
            path: 'about',
            element: <AboutPage />
          }
        ]
      },

      // ----------------------------------------------------------------------
      // LEGACY / BACKWARD COMPATIBILITY REDIRECTS
      // ----------------------------------------------------------------------
      {
        path: 'auth/register',
        element: <Navigate to="/auth/role-selection" replace />
      },
      {
        path: 'dashboard',
        element: <Navigate to="/doctor/dashboard" replace />
      },
      {
        path: 'dashboard/screen',
        element: <Navigate to="/doctor/patients?select=true" replace />
      },
      {
        path: 'dashboard/*',
        element: <Navigate to="/doctor/dashboard" replace />
      },

      // ----------------------------------------------------------------------
      // CATCH-ALL ROUTE
      // ----------------------------------------------------------------------
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);