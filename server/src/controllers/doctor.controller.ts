import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HospitalDataStore } from '../models/dataStore';
import { loginSchema, doctorCarePlanSchema, doctorReviewSchema } from '../validation/schemas';
import { AuthenticatedRequest } from '../middleware/auth';
import { summarizePatientChanges } from '../services/changeMonitor';
import { describeExternalHistory, summarizeExternalAnchor } from '../services/externalInstruments';
import { auditFromRequest, requestIp } from '../services/audit';
import { clearAttempts, consumeAttempt } from '../services/loginThrottle';
import { getJwtSecret } from '../config/jwt';
import { getAssessmentLanguageReadiness, recordLanguageSignOff } from '../services/assessmentLanguageReadiness';
import type { ReadinessStageKey } from '../services/assessmentLanguageReadiness';
import { setSessionCookie, SESSION_MAX_AGE_MS } from '../services/sessionCookie';
import { isDemoUserId } from '../services/demoRecords';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS_PER_EMAIL = 10;
const LOGIN_MAX_ATTEMPTS_PER_IP = 30;

export class DoctorController {
  /**
   * GET /api/v1/doctor/assessment-language-readiness
   * Per-language readiness for administering the assessment tasks.
   */
  public static async getAssessmentLanguageReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }
      return res.status(200).json(getAssessmentLanguageReadiness());
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/doctor/assessment-language-readiness/sign-off
   * Clinician records a back-translation / pretesting / clinical-review sign-off.
   */
  public static async recordLanguageSignOff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }
      const { language, stage, status, notes } = req.body || {};
      if (typeof language !== 'string' || typeof stage !== 'string') {
        return res.status(400).json({ error: 'language and stage are required' });
      }
      const record = recordLanguageSignOff({
        language,
        stage: stage as ReadinessStageKey,
        status,
        reviewer: req.user.email,
        notes: typeof notes === 'string' ? notes : undefined
      });
      if (!record) {
        return res.status(400).json({ error: 'Unknown language or stage' });
      }
      return res.status(201).json({ signOff: record, readiness: getAssessmentLanguageReadiness() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/doctor/login
   * Doctor / Clinician Authentication.
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const normalizedEmail = email.trim().toLowerCase();
      const ip = requestIp(req) || 'unknown';

      const emailLimit = consumeAttempt(`clinician:email:${normalizedEmail}`, LOGIN_MAX_ATTEMPTS_PER_EMAIL, LOGIN_WINDOW_MS);
      if (!emailLimit.allowed) {
        res.setHeader('Retry-After', String(emailLimit.retryAfterSeconds));
        return res.status(429).json({ error: 'Too many sign-in attempts. Please wait and try again.' });
      }

      const ipLimit = consumeAttempt(`clinician:ip:${ip}`, LOGIN_MAX_ATTEMPTS_PER_IP, LOGIN_WINDOW_MS);
      if (!ipLimit.allowed) {
        res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
        return res.status(429).json({ error: 'Too many sign-in attempts. Please wait and try again.' });
      }

      const user = await HospitalDataStore.findUserByEmail(normalizedEmail);
      if (!user || (user.role !== 'CLINICIAN' && user.role !== 'ADMIN')) {
        await auditFromRequest(req, {
          action: 'CLINICIAN_LOGIN_FAILED',
          resourceType: 'CLINICIAN',
          resourceId: normalizedEmail,
          success: false,
          metadata: { reason: 'UNKNOWN_ACCOUNT' },
        });
        return res.status(401).json({ error: 'Invalid clinician credentials or unauthorized role' });
      }

      // Password only. No shared secret, demo password or email alias is accepted.
      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        await auditFromRequest(req, {
          actorId: user.id,
          actorRole: user.role,
          action: 'CLINICIAN_LOGIN_FAILED',
          resourceType: 'CLINICIAN',
          resourceId: user.id,
          success: false,
          metadata: { reason: 'INVALID_PASSWORD' },
        });
        return res.status(401).json({ error: 'Invalid clinician credentials' });
      }

      clearAttempts(`clinician:email:${normalizedEmail}`);

      await auditFromRequest(req, {
        actorId: user.id,
        actorRole: user.role,
        action: 'CLINICIAN_LOGIN',
        resourceType: 'CLINICIAN',
        resourceId: user.id,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        getJwtSecret(),
        { expiresIn: '12h' }
      );
      setSessionCookie(res, token, SESSION_MAX_AGE_MS.clinician);

      const { passwordHash: _, ...doctorProfile } = user;

      return res.status(200).json({
        success: true,
        message: 'Clinician authenticated successfully',
        doctor: doctorProfile
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/doctor/dashboard
   * Real database stats for the doctor overview.
   */
  public static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      // Demo records are invented, so they are only counted inside the demo
      // workspace — never in a real clinician's patient and quality figures.
      const stats = await HospitalDataStore.getDoctorDashboardStats({
        includeDemo: isDemoUserId(req.user.id)
      });
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/doctor/patients
   * Searchable patient directory for clinicians.
   */
  public static async getPatients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const query = (req.query.q as string) || '';
      // Administrative review filter — never a risk tier.
      const reviewFilter = (req.query.reviewState as string)
        || (req.query.review as string)
        || 'ALL';

      const patients = await HospitalDataStore.listPatients(query, reviewFilter, {
        includeDemo: isDemoUserId(req.user.id)
      });
      return res.status(200).json({
        success: true,
        count: patients.length,
        patients
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/doctor/patients/:id
   * Detailed clinical patient record.
   */
  public static async getPatientProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const { id } = req.params;
      const data = await HospitalDataStore.getPatientDetail(id);

      if (!data) {
        return res.status(404).json({ error: 'Patient file not found' });
      }

      const { passwordHash: _, ...patientProfile } = data.patient;
      const referrals = await HospitalDataStore.listReferrals(data.patient.id);
      const externalInstrumentRecords = await HospitalDataStore.listExternalInstruments(data.patient.id);

      // Patient-shared context (including family history and optional genomic
      // context) is returned only with the consent recorded alongside it. A
      // genomic input without explicit consent is dropped rather than shown.
      const contextInputs = (await HospitalDataStore.getContextInputs(data.patient.id)).filter(
        (input) => input.source !== 'genomic' || input.consentGranted
      );

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'PATIENT_READ',
        resourceType: 'PATIENT',
        resourceId: data.patient.id,
        metadata: { assessments: data.assessments.length },
      });

      return res.status(200).json({
        success: true,
        patient: patientProfile,
        assessments: data.assessments,
        changeSummary: summarizePatientChanges(data.assessments),
        contextInputs,
        referrals,
        externalInstruments: describeExternalHistory(externalInstrumentRecords),
        externalAnchor: summarizeExternalAnchor(externalInstrumentRecords)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/doctor/reports/:id
   * Doctor-only Clinical Screening Report.
   */
  public static async getScreeningReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required to view clinical screening reports' });
      }

      const { id } = req.params;
      const reportData = await HospitalDataStore.getScreeningReport(id);

      if (!reportData) {
        return res.status(404).json({ error: 'Clinical screening report not found' });
      }

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ASSESSMENT_READ',
        resourceType: 'ASSESSMENT',
        resourceId: id,
        metadata: { patientId: reportData.patient.patientId },
      });

      return res.status(200).json({
        success: true,
        report: reportData
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/doctor/reports/:id/review
   * Update clinical review status and add doctor's notes.
   */
  public static async updateReportReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const { id } = req.params;
      const { reviewStatus, doctorNotes } = doctorReviewSchema.parse(req.body);

      // Attribute the review to the signed-in clinician rather than guessing
      // from their email address.
      const clinician = await HospitalDataStore.findUserById(req.user.id);
      const doctorName = clinician?.name?.trim() || req.user.email;

      const updated = await HospitalDataStore.updateAssessmentReview(
        id,
        reviewStatus,
        doctorNotes || '',
        doctorName
      );

      if (!updated) {
        return res.status(404).json({ error: 'Assessment record not found' });
      }

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ASSESSMENT_REVIEW_WRITE',
        resourceType: 'ASSESSMENT',
        resourceId: id,
        metadata: { reviewStatus },
      });

      return res.status(200).json({
        success: true,
        message: 'Clinical review status and physician notes updated successfully.',
        assessment: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/doctor/reports/:id/care-plan
   * Save clinician-confirmed next steps for a screening assessment.
   */
  public static async saveCarePlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const { id } = req.params;
      const validated = doctorCarePlanSchema.parse(req.body);
      const saved = await HospitalDataStore.saveClinicianCarePlan(id, {
        ...validated,
        savedAt: new Date().toISOString(),
        savedBy: req.user.email
      });
      if (!saved) return res.status(404).json({ error: 'Assessment record not found' });

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'CARE_PLAN_WRITE',
        resourceType: 'ASSESSMENT',
        resourceId: id,
        metadata: { action: validated.action, followUpDate: validated.followUpDate },
      });

      return res.status(200).json({ success: true, carePlan: saved.taskResponses?.clinicianCarePlan });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctor/referrals
   * All referrals for the signed-in clinician's workflow.
   */
  public static async getAllReferrals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }
      const referrals = await HospitalDataStore.listAllReferrals();
      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'REFERRAL_READ',
        resourceType: 'REFERRAL',
        resourceId: 'all',
        metadata: { count: referrals.length },
      });
      return res.status(200).json({ success: true, referrals });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/doctor/patients/:id/referrals
   * List referrals and closed-loop outcomes for a patient.
   */
  public static async getPatientReferrals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }
      const { id } = req.params;
      const data = await HospitalDataStore.getPatientDetail(id);
      if (!data) return res.status(404).json({ error: 'Patient file not found' });
      const referrals = await HospitalDataStore.listReferrals(data.patient.id);
      return res.status(200).json({ success: true, referrals });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/doctor/patients/:id/referrals
   * Create a referral (clinician-owned) as part of closed-loop care.
   */
  public static async createReferral(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }
      const { id } = req.params;
      const data = await HospitalDataStore.getPatientDetail(id);
      if (!data) return res.status(404).json({ error: 'Patient file not found' });
      const { assessmentId, type, reason, destination, urgency, status, outcomeStatus, followUpDate } = req.body || {};
      if (!type || !reason) return res.status(400).json({ error: 'Referral type and reason are required' });
      const referral = await HospitalDataStore.createReferral({
        patientId: data.patient.id,
        assessmentId: assessmentId || null,
        type,
        reason: String(reason),
        destination: destination ? String(destination) : '',
        urgency,
        status,
        outcomeStatus,
        followUpDate: followUpDate ?? null,
        createdBy: req.user.id,
      });
      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'REFERRAL_WRITE',
        resourceType: 'REFERRAL',
        resourceId: referral.id,
        metadata: { patientId: data.patient.id, type },
      });
      return res.status(201).json({ success: true, referral });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/doctor/referrals/:id/outcome
   * Update referral workflow and capture closed-loop outcome.
   */
  public static async updateReferralOutcome(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }
      const { id } = req.params;
      const { status, outcomeStatus, outcomeNotes, followUpDate, destination, urgency, reason } = req.body || {};
      const referral = await HospitalDataStore.updateReferralOutcome(id, {
        status,
        outcomeStatus,
        outcomeNotes: outcomeNotes != null ? String(outcomeNotes) : undefined,
        followUpDate: followUpDate === null ? null : (followUpDate != null ? String(followUpDate) : undefined),
        destination: destination != null ? String(destination) : undefined,
        urgency,
        reason: reason != null ? String(reason) : undefined,
      });
      if (!referral) return res.status(404).json({ error: 'Referral not found' });
      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'REFERRAL_WRITE',
        resourceType: 'REFERRAL',
        resourceId: id,
        metadata: { status, outcomeStatus },
      });
      return res.status(200).json({ success: true, referral });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/doctor/reports/:id/export
   * Clinician-only structured export of a screening record for audit,
   * pilot analysis, or handoff. Returns the same clinician-visible record
   * as the report view in a downloadable JSON envelope.
   */
  public static async exportAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const { id } = req.params;
      const reportData = await HospitalDataStore.getScreeningReport(id);

      if (!reportData) {
        return res.status(404).json({ error: 'Clinical screening report not found' });
      }

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ASSESSMENT_EXPORT',
        resourceType: 'ASSESSMENT',
        resourceId: id,
        metadata: { patientId: reportData.patient.patientId, format: 'json' },
      });

      const payload = {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: { id: req.user.id, role: req.user.role },
        disclaimer:
          'Research-stage screening record for clinician-supervised use. Not a diagnosis, not a validated clinical instrument, and not a substitute for clinical evaluation.',
        report: reportData,
      };

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="neulens-assessment-${id}.json"`);
      return res.status(200).send(JSON.stringify(payload, null, 2));
    } catch (err) {
      next(err);
    }
  }

}
