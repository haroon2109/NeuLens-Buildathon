import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';
import { auditFromRequest } from '../services/audit';
import { externalInstrumentSchema } from '../validation/schemas';
import {
  externalInstrumentCatalog,
  prepareExternalInstrumentRecord,
  summarizeExternalAnchor,
  describeExternalHistory
} from '../services/externalInstruments';

const clinicianOnly = (req: AuthenticatedRequest, res: Response): boolean => {
  if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Clinician access required' });
    return false;
  }
  return true;
};

export class ExternalInstrumentController {
  /** GET /api/v1/external-instruments/catalog — the instruments that may be recorded. */
  public static async catalog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!clinicianOnly(req, res)) return;
      return res.status(200).json(externalInstrumentCatalog());
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/external-instruments/patients/:patientId */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!clinicianOnly(req, res)) return;

      const patient = await HospitalDataStore.getPatientDetail(req.params.patientId);
      if (!patient) return res.status(404).json({ error: 'Patient file not found' });

      const records = await HospitalDataStore.listExternalInstruments(patient.patient.id);

      return res.status(200).json({
        success: true,
        patientId: patient.patient.patientId,
        records: describeExternalHistory(records),
        anchor: summarizeExternalAnchor(records)
      });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/external-instruments/patients/:patientId */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!clinicianOnly(req, res)) return;

      const parsed = externalInstrumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message ?? 'Invalid external instrument record',
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
        });
      }

      const prepared = prepareExternalInstrumentRecord(parsed.data);
      if (!prepared.ok) {
        // A refused record is not stored in any form: no partial row, no
        // clamped score, no invented licence confirmation.
        return res.status(400).json({ error: prepared.error });
      }

      const patient = await HospitalDataStore.getPatientDetail(req.params.patientId);
      if (!patient) return res.status(404).json({ error: 'Patient file not found' });

      const created = await HospitalDataStore.createExternalInstrument({
        patientId: patient.patient.id,
        instrumentKey: prepared.record.instrumentKey,
        instrumentVersion: prepared.record.instrumentVersion,
        language: prepared.record.language,
        administeredOn: prepared.record.administeredOn,
        administeredBy: prepared.record.administeredBy,
        score: prepared.record.score,
        maxScore: prepared.record.maxScore,
        licenceConfirmed: prepared.record.licenceConfirmed,
        licenceReference: prepared.record.licenceReference,
        notes: prepared.record.notes,
        recordedBy: req.user?.id ?? null
      });

      await auditFromRequest(req, {
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'EXTERNAL_INSTRUMENT_WRITE',
        resourceType: 'EXTERNAL_INSTRUMENT',
        resourceId: created.id,
        metadata: {
          patientId: patient.patient.patientId,
          instrument: prepared.record.instrumentKey,
          language: prepared.record.language,
          licenceConfirmed: prepared.record.licenceConfirmed
        }
      });

      const records = await HospitalDataStore.listExternalInstruments(patient.patient.id);

      return res.status(201).json({
        success: true,
        record: created,
        records: describeExternalHistory(records),
        anchor: summarizeExternalAnchor(records)
      });
    } catch (err) {
      next(err);
    }
  }
}
