import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { PlatformController } from '../controllers/platform.controller';
import { CognitiveController } from '../controllers/cognitive.controller';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Doctor Authentication
router.post('/login', DoctorController.login);

// Protected Doctor Portal APIs (Strictly role: CLINICIAN | ADMIN)
const clinicianGuard = [authenticateToken, requireRole(['CLINICIAN', 'ADMIN'])];

router.get('/dashboard', clinicianGuard, DoctorController.getDashboard);
router.get('/patients', clinicianGuard, DoctorController.getPatients);
router.get('/patients/:id', clinicianGuard, DoctorController.getPatientProfile);
router.get('/reports/:id', clinicianGuard, DoctorController.getScreeningReport);
router.get('/reports/:id/export', clinicianGuard, DoctorController.exportAssessment);
router.patch('/reports/:id/review', clinicianGuard, DoctorController.updateReportReview);
router.patch('/reports/:id/care-plan', clinicianGuard, DoctorController.saveCarePlan);
router.get('/referrals', clinicianGuard, DoctorController.getAllReferrals);
router.get('/patients/:id/referrals', clinicianGuard, DoctorController.getPatientReferrals);
router.post('/patients/:id/referrals', clinicianGuard, DoctorController.createReferral);
router.patch('/referrals/:id/outcome', clinicianGuard, DoctorController.updateReferralOutcome);
router.get('/appointments', clinicianGuard, AppointmentController.listAll);
router.post('/patients/:id/appointments', clinicianGuard, AppointmentController.createForPatient);
router.patch('/appointments/:id', clinicianGuard, AppointmentController.update);
router.get('/platform-insights', clinicianGuard, PlatformController.getInsights);
router.get('/assessment-language-readiness', clinicianGuard, DoctorController.getAssessmentLanguageReadiness);
router.post('/assessment-language-readiness/sign-off', clinicianGuard, DoctorController.recordLanguageSignOff);

// Cognitive assessment management: task library, recorded sessions and
// clinician approval of a patient's assessment plan.
router.get('/cognitive/tasks', clinicianGuard, CognitiveController.clinicianLibrary);
router.get('/patients/:id/cognitive', clinicianGuard, CognitiveController.patientSessions);
router.get('/patients/:id/cognitive/plan', clinicianGuard, CognitiveController.patientPlan);
router.post('/patients/:id/cognitive/plan-approval', clinicianGuard, CognitiveController.approvePlan);

export default router;
