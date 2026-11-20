import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';
import { CognitiveAssessmentService } from '../services/cognitive/service';
import { auditFromRequest } from '../services/audit';
import { extractCognitiveSessions } from '../services/cognitive/scoring';
import type { AssessmentContext } from '../services/cognitive/types';

const badRequest = (res: Response, message: string) =>
  res.status(400).json({ error: message });

export class CognitiveController {
  /** GET /api/v1/patient/cognitive/library */
  public static async library(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const library = CognitiveAssessmentService.getLibrary();
      await auditFromRequest(req, {
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'COGNITIVE_TASKS_READ',
        resourceType: 'COGNITIVE_TASK_LIBRARY'
      });
      return res.json(library);
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/patient/cognitive/context */
  public static async context(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await HospitalDataStore.findUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: 'Patient record not found.' });
      const context = await CognitiveAssessmentService.getContext(user);
      return res.json({ context, missingFields: missingContextFields(context) });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/patient/cognitive/plan */
  public static async createPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await HospitalDataStore.findUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: 'Patient record not found.' });
      const plan = await CognitiveAssessmentService.createPlan(user, req.body || {}, req);
      return res.status(201).json({ plan });
    } catch (err) {
      if (err instanceof Error && !/database/i.test(err.message)) {
        return badRequest(res, err.message);
      }
      next(err);
    }
  }

  /** POST /api/v1/patient/cognitive/sessions */
  public static async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await HospitalDataStore.findUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: 'Patient record not found.' });
      const result = await CognitiveAssessmentService.submitSession(user, req.body || {}, req);
      return res.status(201).json(result);
    } catch (err) {
      if (err instanceof Error && !/database/i.test(err.message)) {
        return badRequest(res, err.message);
      }
      next(err);
    }
  }

  /** GET /api/v1/patient/cognitive/history */
  public static async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await CognitiveAssessmentService.getPatientSessions(req.user!.id);
      if (!sessions) return res.status(404).json({ error: 'Patient record not found.' });
      await auditFromRequest(req, {
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'COGNITIVE_SESSION_READ',
        resourceType: 'ASSESSMENT'
      });
      return res.json({
        sessions,
        note: 'Exploratory and standardized sessions are reported separately. Scores are descriptive, not diagnostic.'
      });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/doctor/cognitive/tasks */
  public static async clinicianLibrary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await auditFromRequest(req, {
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'COGNITIVE_TASKS_READ',
        resourceType: 'COGNITIVE_TASK_LIBRARY'
      });
      return res.json(CognitiveAssessmentService.getLibrary());
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/doctor/patients/:id/cognitive */
  public static async patientSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const detail = await HospitalDataStore.getPatientDetail(req.params.id);
      if (!detail) return res.status(404).json({ error: 'Patient record not found.' });
      const sessions = extractCognitiveSessions(detail.assessments);
      await auditFromRequest(req, {
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'COGNITIVE_SESSION_READ',
        resourceType: 'PATIENT',
        resourceId: detail.patient.id
      });
      return res.json({
        patient: {
          id: detail.patient.id,
          patientId: detail.patient.patientId,
          name: detail.patient.name,
          age: detail.patient.age,
          language: detail.patient.language,
          educationYears: detail.patient.educationYears
        },
        sessions
      });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/doctor/patients/:id/cognitive/plan */
  public static async patientPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const detail = await HospitalDataStore.getPatientDetail(req.params.id);
      if (!detail) return res.status(404).json({ error: 'Patient record not found.' });
      const plan = CognitiveAssessmentService.getLatestPlan(detail.patient.id);
      return res.json({
        patient: {
          id: detail.patient.id,
          patientId: detail.patient.patientId,
          name: detail.patient.name
        },
        plan
      });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/doctor/patients/:id/cognitive/plan-approval */
  public static async approvePlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clinician = await HospitalDataStore.findUserById(req.user!.id);
      if (!clinician) return res.status(404).json({ error: 'Clinician record not found.' });
      const detail = await HospitalDataStore.getPatientDetail(req.params.id);
      if (!detail) return res.status(404).json({ error: 'Patient record not found.' });

      const { planId, decision, note } = req.body || {};
      if (!planId) return badRequest(res, 'A plan identifier is required.');
      const approval = CognitiveAssessmentService.recordApproval(
        detail.patient.id,
        String(planId),
        decision === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'APPROVED',
        typeof note === 'string' ? note : '',
        clinician
      );
      await auditFromRequest(req, {
        actorId: clinician.id,
        actorRole: clinician.role,
        action: 'COGNITIVE_PLAN_REVIEWED',
        resourceType: 'ASSESSMENT',
        resourceId: approval.planId,
        metadata: { decision: approval.decision }
      });
      return res.status(201).json({ approval });
    } catch (err) {
      if (err instanceof Error && !/database/i.test(err.message)) {
        return badRequest(res, err.message);
      }
      next(err);
    }
  }
}

function missingContextFields(context: AssessmentContext): string[] {
  const fields = [
    'sleepHours',
    'sleepQuality',
    'fatigue',
    'mood',
    'stress',
    'vision',
    'hearing',
    'motor',
    'digitalFamiliarity'
  ];
  return fields.filter((field) => (context as unknown as Record<string, unknown>)[field] == null);
}
