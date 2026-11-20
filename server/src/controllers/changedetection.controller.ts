import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';

export const getChangeDetections = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const detections = await HospitalDataStore.getChangeDetections(req.user.id);
    return res.status(200).json({ detections });
  } catch (err) {
    next(err);
  }
};

export const createChangeDetection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { baselineId, status, cognitiveChange, outsideBaseline, reviewReasons } = req.body;

    const detection = await HospitalDataStore.createChangeDetection({
      userId: req.user.id,
      baselineId,
      status,
      cognitiveChange: cognitiveChange ? Number(cognitiveChange) : null,
      outsideBaseline: outsideBaseline === true,
      reviewReasons: Array.isArray(reviewReasons) ? reviewReasons : [],
    });

    return res.status(201).json({ detection });
  } catch (err) {
    next(err);
  }
};