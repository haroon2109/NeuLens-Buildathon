import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HospitalDataStore } from '../models/dataStore';
import { patientRegisterSchema, patientLoginSchema } from '../validation/schemas';
import { AuthenticatedRequest } from '../middleware/auth';
import { auditFromRequest, requestIp } from '../services/audit';
import { clearAttempts, consumeAttempt } from '../services/loginThrottle';
import { getJwtSecret } from '../config/jwt';
import { setSessionCookie, SESSION_MAX_AGE_MS } from '../services/sessionCookie';
import { toPatientAssessmentView } from '../services/patientAssessmentView';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS_PER_ID = 10;
const LOGIN_MAX_ATTEMPTS_PER_IP = 30;

export class PatientController {
  /**
   * POST /api/v1/patient/register
   * Patient portal registration.
   * Generates a collision-resistant unique patient ID (e.g. CV-2026-8F3K92).
   */
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = patientRegisterSchema.parse(req.body);

      const { user, patientId } = await HospitalDataStore.createPatient({
        name: validated.name,
        age: validated.age,
        dob: validated.dob,
        pin: validated.pin,
        gender: validated.gender,
        language: validated.language,
        educationYears: validated.educationYears,
        handedness: validated.handedness,
      });

      const token = jwt.sign(
        { id: user.id, patientId: user.patientId, role: 'PATIENT' },
        getJwtSecret(),
        { expiresIn: '24h' }
      );
      setSessionCookie(res, token, SESSION_MAX_AGE_MS.patient);

      const patientRecord = {
        id: user.id,
        patientId: user.patientId,
        name: user.name,
        age: user.age,
        gender: user.gender,
        language: user.language,
        educationYears: user.educationYears,
        handedness: user.handedness,
        createdAt: user.createdAt,
      };

      await auditFromRequest(req, {
        actorId: user.id,
        actorRole: 'PATIENT',
        action: 'PATIENT_REGISTER',
        resourceType: 'PATIENT',
        resourceId: user.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        patientId,
        user: patientRecord,
        patient: patientRecord
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/patient/login
   * Patient portal authentication using Patient ID + PIN.
   *
   * The PIN is the only accepted factor. Date of birth, age and birth year are
   * public identifiers and must never authenticate a patient record.
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { patientId, verification } = patientLoginSchema.parse(req.body);
      const pin = verification.trim();
      const normalizedId = patientId.trim().toUpperCase();
      const ip = requestIp(req) || 'unknown';

      const idLimit = consumeAttempt(`patient:id:${normalizedId}`, LOGIN_MAX_ATTEMPTS_PER_ID, LOGIN_WINDOW_MS);
      if (!idLimit.allowed) {
        res.setHeader('Retry-After', String(idLimit.retryAfterSeconds));
        return res.status(429).json({
          error: 'Too many sign-in attempts for this Patient ID. Please wait and try again, or ask clinic staff for help.'
        });
      }

      const ipLimit = consumeAttempt(`patient:ip:${ip}`, LOGIN_MAX_ATTEMPTS_PER_IP, LOGIN_WINDOW_MS);
      if (!ipLimit.allowed) {
        res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
        return res.status(429).json({ error: 'Too many sign-in attempts. Please wait a few minutes and try again.' });
      }

      const genericError = {
        error: 'Patient ID or PIN is incorrect. Please check your card or ask clinic staff for help.'
      };

      const user = await HospitalDataStore.findUserByPatientId(normalizedId);
      if (!user || user.role !== 'PATIENT') {
        await auditFromRequest(req, {
          action: 'PATIENT_LOGIN_FAILED',
          resourceType: 'PATIENT',
          resourceId: normalizedId,
          success: false,
          metadata: { reason: 'UNKNOWN_PATIENT_ID' },
        });
        return res.status(401).json(genericError);
      }

      const lock = HospitalDataStore.lockState(user);
      if (lock.locked) {
        await auditFromRequest(req, {
          actorId: user.id,
          actorRole: 'PATIENT',
          action: 'PATIENT_LOGIN_FAILED',
          resourceType: 'PATIENT',
          resourceId: user.id,
          success: false,
          metadata: { reason: 'ACCOUNT_LOCKED' },
        });
        res.setHeader('Retry-After', String(lock.retryAfterSeconds));
        return res.status(429).json({
          error: 'This Patient ID is temporarily locked after several incorrect PIN attempts. Please wait 15 minutes or ask clinic staff for help.'
        });
      }

      if (!HospitalDataStore.verifyPatientPin(user, pin)) {
        await HospitalDataStore.recordFailedLogin(user);
        await auditFromRequest(req, {
          actorId: user.id,
          actorRole: 'PATIENT',
          action: 'PATIENT_LOGIN_FAILED',
          resourceType: 'PATIENT',
          resourceId: user.id,
          success: false,
          metadata: { reason: 'INVALID_PIN' },
        });
        return res.status(401).json(genericError);
      }

      await HospitalDataStore.clearFailedLogins(user);
      clearAttempts(`patient:id:${normalizedId}`);

      await auditFromRequest(req, {
        actorId: user.id,
        actorRole: 'PATIENT',
        action: 'PATIENT_LOGIN',
        resourceType: 'PATIENT',
        resourceId: user.id,
      });

      const token = jwt.sign(
        { id: user.id, patientId: user.patientId, role: 'PATIENT' },
        getJwtSecret(),
        { expiresIn: '24h' }
      );
      setSessionCookie(res, token, SESSION_MAX_AGE_MS.patient);

      const assignedAssessment = {
        instrument: 'Neulens Multimodal Screening Battery v2.4',
        durationMinutes: 4,
        tasks: ['Focus Orbit', 'Cortex Match', 'Vocal Echo', 'Mimic Sync', 'Path Mapper'],
        status: 'READY'
      };

      return res.status(200).json({
        success: true,
        message: 'Patient authenticated successfully',
        patientId: user.patientId,
        user: {
          id: user.id,
          patientId: user.patientId,
          name: user.name,
          age: user.age,
          gender: user.gender,
          language: user.language
        },
        patient: {
          id: user.id,
          patientId: user.patientId,
          name: user.name,
          age: user.age,
          gender: user.gender,
          language: user.language
        },
        assignedAssessment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/patient/session
   * Protected patient profile and assigned assessment lookup.
   */
  public static async getSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const user = await HospitalDataStore.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Patient record not found' });
      }

      return res.status(200).json({
        success: true,
        patientId: user.patientId,
        name: user.name,
        age: user.age,
        gender: user.gender,
        language: user.language
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/patient/assessments
   * Patient-safe assessment history for the signed-in patient portal.
   * Returns the patient's own session measurements and release-after-review
   * notes; never a risk classification. See services/patientAssessmentView.ts.
   */
  public static async listAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const data = await HospitalDataStore.getPatientDetail(req.user.id);
      if (!data) {
        return res.status(404).json({ error: 'Patient record not found' });
      }

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: 'PATIENT',
        action: 'ASSESSMENT_READ',
        resourceType: 'PATIENT',
        resourceId: req.user.id,
        metadata: { count: data.assessments.length },
      });

      // Single policy, defined in services/patientAssessmentView.ts: the
      // patient receives their own session measurements but no clinical risk
      // label and no clinician notes before review.
      const assessments = data.assessments.map(toPatientAssessmentView);

      return res.status(200).json({ success: true, assessments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/patient/confirmation-card
   * Provides safe, printable receipt card data for the patient ID.
   */
  public static async getConfirmationCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const user = await HospitalDataStore.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Patient record not found' });
      }

      return res.status(200).json({
        success: true,
        patientId: user.patientId,
        patientName: user.name,
        registeredDate: user.createdAt,
        language: user.language,
        hospitalName: 'Neulens Hospital Medical Center',
        hospitalAddress: 'Neurology & Cognitive Health Department, Block B, Suite 400',
        instructions: 'Present this Patient ID card to hospital staff or during your follow-up clinical appointments.'
      });
    } catch (err) {
      next(err);
    }
  }
}
