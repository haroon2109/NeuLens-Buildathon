import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { computePlatformInsights } from '../services/platformInsights';

export const PlatformController = {
  getInsights: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician authorization required' });
      }
      const insights = await computePlatformInsights();
      return res.status(200).json({ success: true, insights });
    } catch (err) {
      next(err);
    }
  },
};
