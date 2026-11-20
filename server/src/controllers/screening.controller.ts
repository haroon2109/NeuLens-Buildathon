import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { screeningSubmitSchema } from '../validation/schemas';
import { HospitalDataStore, inMemoryAssessments } from '../models/dataStore';
import { reviewStateForAssessment } from '../services/reviewState';
import { scoreBatterySession } from '../services/sessionScoring';
import { DEMO_PATIENT_USER_ID } from '../services/demoRecords';

export const submitScreening = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validatedData = screeningSubmitSchema.parse(req.body);
    const {
      taskResponses,
      reactionTime,
      blinkRate,
      fixationScore,
      speechRate,
      pauseScore,
      jitter,
      shimmer,
      symmetry,
      tremorScore,
      recommendation,
      doctorNotes
    } = validatedData;

    // The score is derived from the recorded task responses, never accepted from
    // the caller: a session with an incomplete battery has no score at all.
    const score = scoreBatterySession(taskResponses).composite;
    const reviewState = reviewStateForAssessment(score);
    const hasEye = reactionTime != null && blinkRate != null && fixationScore != null;
    const hasVoice = speechRate != null && pauseScore != null && jitter != null && shimmer != null;
    const hasFace = symmetry != null && tremorScore != null;
    const storedRecommendation = recommendation
      || (score === null
        ? 'Session recorded without an interpretable score. No interpretation is available; clinician review required.'
        : 'Assessment recorded. Clinician review required.');

    let savedAssessment: any;

    try {
      savedAssessment = await prisma.assessment.create({
        data: {
          userId: req.user.id,
          overallScore: score,
          reviewState,
          taskResponses: taskResponses ?? undefined,
          ...(hasEye ? {
            eyeMetrics: {
              create: {
                reactionTime: reactionTime as number,
                blinkRate: blinkRate as number,
                fixationScore: fixationScore as number
              }
            }
          } : {}),
          ...(hasVoice ? {
            voiceMetrics: {
              create: {
                speechRate: speechRate as number,
                pauseScore: pauseScore as number,
                jitter: jitter as number,
                shimmer: shimmer as number
              }
            }
          } : {}),
          ...(hasFace ? {
            faceMetrics: {
              create: {
                symmetry: symmetry as number,
                tremorScore: tremorScore as number
              }
            }
          } : {}),
          report: {
            create: {
              recommendation: storedRecommendation,
              doctorNotes: doctorNotes || '',
            }
          }
        },
        include: {
          eyeMetrics: true,
          voiceMetrics: true,
          faceMetrics: true,
          report: true
        }
      });
      console.log('Saved assessment via Prisma:', savedAssessment.id);
      // NEW: Establish or link to personal baseline (first interpretable assessment creates baseline)
      try {
        await HospitalDataStore.ensureBaselineAndLink(req.user.id, savedAssessment);
        console.log('Baseline linked to assessment:', savedAssessment.id);
      } catch (baselineErr) {
        console.warn('Baseline linking failed (non-fatal):', baselineErr);
      }
    } catch (dbError) {
      console.warn('Prisma DB error saving assessment. Falling back to memory store:', dbError);
      savedAssessment = {
        id: `demo-assess-${Date.now()}`,
        userId: req.user.id,
        date: new Date(),
        overallScore: score,
        reviewState,
        status: 'COMPLETED',
        reviewStatus: 'PENDING_REVIEW',
        taskResponses: taskResponses ?? null,
        eyeMetrics: hasEye ? { reactionTime, blinkRate, fixationScore } : null,
        voiceMetrics: hasVoice ? { speechRate, pauseScore, jitter, shimmer } : null,
        faceMetrics: hasFace ? { symmetry, tremorScore } : null,
        report: {
          id: `demo-rep-${Date.now()}`,
          assessmentId: `demo-assess-${Date.now()}`,
          recommendation: storedRecommendation,
          doctorNotes: doctorNotes || '',
          pdfUrl: null
        }
      };
      inMemoryAssessments.push(savedAssessment);
    }

    return res.status(201).json({
      message: 'Assessment processed successfully',
      assessment: savedAssessment
    });
  } catch (error) {
    next(error);
  }
};

export const getScreeningHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let history: any[];

    try {
      history = await prisma.assessment.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
        include: {
          eyeMetrics: true,
          voiceMetrics: true,
          faceMetrics: true,
          report: true
        }
      });
    } catch (dbError) {
      console.warn('Prisma DB error fetching history. Falling back to memory:', dbError);
      history = inMemoryAssessments
        .filter(s => s.userId === req.user?.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    return res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
};

export const getScreeningById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    let assessment: any;

    try {
      assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          eyeMetrics: true,
          voiceMetrics: true,
          faceMetrics: true,
          report: true
        }
      });

      if (assessment && assessment.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized to view this assessment' });
      }
    } catch (dbError) {
      console.warn('Prisma DB error fetching assessment by ID. Checking memory:', dbError);
      assessment = inMemoryAssessments.find(s => s.id === id);
    }

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment record not found' });
    }

    return res.status(200).json({ assessment });
  } catch (error) {
    next(error);
  }
};

export { inMemoryAssessments };
