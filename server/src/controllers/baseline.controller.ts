import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';

export const getBaseline = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const baseline = await HospitalDataStore.getActiveBaseline(req.user.id);
    // No baseline is a normal empty state, not a failed request. Returning 404
    // made every portal screen log a browser console error on first use.
    return res.status(200).json({ baseline: baseline || null });
  } catch (err) {
    next(err);
  }
};

export const establishBaseline = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { overallScore, cognitiveScore, functionalScore, eyeScore, voiceScore, faceScore, contextScore } = req.body;

    const baseline = await HospitalDataStore.createBaseline({
      userId: req.user.id,
      overallScore: Number(overallScore),
      cognitiveScore: Number(cognitiveScore),
      functionalScore: Number(functionalScore),
      eyeScore: eyeScore ? Number(eyeScore) : null,
      voiceScore: voiceScore ? Number(voiceScore) : null,
      faceScore: faceScore ? Number(faceScore) : null,
      contextScore: contextScore ? Number(contextScore) : null,
    });

    return res.status(201).json({ baseline });
  } catch (err) {
    next(err);
  }
};