import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';

export const getBrainHealthProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const profile = await HospitalDataStore.getBrainHealthProfile(req.user.id);
    // A missing profile is an empty state; the portal renders its own guidance.
    return res.status(200).json({ profile: profile || null });
  } catch (err) {
    next(err);
  }
};

export const createBrainHealthProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { changeDetectionId, profileScore, interpretation, nextSteps } = req.body;
    const score = profileScore === null || profileScore === undefined ? null : Number(profileScore);

    // No risk tier is accepted from the caller. The store derives an
    // administrative review signal from the recorded score (or its absence).
    const profile = await HospitalDataStore.createBrainHealthProfile({
      userId: req.user.id,
      changeDetectionId,
      profileScore: Number.isFinite(score) ? score : null,
      interpretation,
      nextSteps: Array.isArray(nextSteps) ? nextSteps : [],
    });

    return res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
};