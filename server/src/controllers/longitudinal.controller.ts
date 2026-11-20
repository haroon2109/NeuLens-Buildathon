import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';

export const getLongitudinalHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const records = await HospitalDataStore.getLongitudinalRecords(req.user.id);
    return res.status(200).json({ records });
  } catch (err) {
    next(err);
  }
};

export const createLongitudinalRecord = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { assessmentId, overallScore, changeFromBaseline, trendDirection, assessmentsCount } = req.body;

    const record = await HospitalDataStore.createLongitudinalRecord({
      userId: req.user.id,
      assessmentId,
      overallScore: Number(overallScore),
      changeFromBaseline: changeFromBaseline ? Number(changeFromBaseline) : null,
      trendDirection,
      assessmentsCount: assessmentsCount ? Number(assessmentsCount) : 1,
    });

    return res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
};