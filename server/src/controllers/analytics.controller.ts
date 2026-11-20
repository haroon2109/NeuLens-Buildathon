import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { inMemoryAssessments } from './screening.controller';

export const getTrends = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let assessments: any[];

    try {
      assessments = await prisma.assessment.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'asc' },
        include: {
          eyeMetrics: true,
          voiceMetrics: true,
          faceMetrics: true,
        }
      });
    } catch (dbError) {
      console.warn('Prisma DB error fetching trends. Falling back to memory:', dbError);
      assessments = inMemoryAssessments
        .filter(s => s.userId === req.user?.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    // Map data for easy UI chart ingestion
    const labels = assessments.map(s => {
      const date = new Date(s.date);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    // A missing measurement stays missing (null), never 0: a zero reaction time
    // or zero jitter is a reading, and plotting one that was never taken invents
    // data. Jitter and shimmer are deliberately absent from this payload — they
    // are acoustic quality features, not cognitive evidence.
    const datasetOverall = assessments.map(s => s.overallScore ?? null);
    const datasetReaction = assessments.map(s => s.eyeMetrics?.reactionTime ?? null);
    const datasetSymmetry = assessments.map(s => s.faceMetrics?.symmetry ?? null);

    return res.status(200).json({
      trends: {
        labels,
        datasets: {
          overall: datasetOverall,
          reactionTime: datasetReaction,
          symmetry: datasetSymmetry
        },
        rawCount: assessments.length
      }
    });
  } catch (error) {
    next(error);
  }
};
