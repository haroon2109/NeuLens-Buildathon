import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';

export const getContextInputs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { source } = req.query;
    const inputs = await HospitalDataStore.getContextInputs(req.user.id, source as string | undefined);
    return res.status(200).json({ inputs });
  } catch (err) {
    next(err);
  }
};

export const createContextInput = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { assessmentId, source, values, consentGranted, consentAt } = req.body;

    const input = await HospitalDataStore.createContextInput({
      userId: req.user.id,
      assessmentId: assessmentId ?? null,
      source,
      values,
      consentGranted: consentGranted === true,
      consentAt: consentAt ? new Date(consentAt) : null,
    });

    return res.status(201).json({ input });
  } catch (err) {
    next(err);
  }
};