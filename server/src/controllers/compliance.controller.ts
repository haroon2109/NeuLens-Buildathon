import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';
import { consentRecordSchema, consentWithdrawSchema } from '../validation/schemas';
import { auditFromRequest, requestIp, requestUserAgent } from '../services/audit';

/**
 * Consent is a legal record: version, timestamp, actor, scopes and request
 * context are stored server-side. The browser copy is only a display cache.
 */
export class ComplianceController {
  /** POST /api/v1/patient/consent */
  public static async recordConsent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const { version, scopes } = consentRecordSchema.parse(req.body);
      const consent = await HospitalDataStore.createConsent({
        userId: req.user.id,
        version,
        scopes,
        actorRole: 'PATIENT',
        ipAddress: requestIp(req),
        userAgent: requestUserAgent(req),
      });

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: 'PATIENT',
        action: 'CONSENT_RECORDED',
        resourceType: 'CONSENT',
        resourceId: consent.id,
        metadata: { version, scopes },
      });

      return res.status(201).json({ success: true, consent });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/patient/consent */
  public static async listConsents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const consents = await HospitalDataStore.listConsents(req.user.id);
      return res.status(200).json({ success: true, consents });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/patient/consent/withdraw */
  public static async withdrawConsent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const { reason } = consentWithdrawSchema.parse(req.body ?? {});
      const consent = await HospitalDataStore.withdrawConsent(req.user.id, reason);
      if (!consent) {
        return res.status(404).json({ error: 'No active consent record found' });
      }

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: 'PATIENT',
        action: 'CONSENT_WITHDRAWN',
        resourceType: 'CONSENT',
        resourceId: consent.id,
        metadata: { reason },
      });

      return res.status(200).json({ success: true, consent });
    } catch (err) {
      next(err);
    }
  }
}
