import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { analyzeArabic } from '../services/arabicLlm';
import { authenticateToken } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';

/**
 * POST /api/v1/arabic/analyze
 *
 * Body:
 *   { text: string, model?: 'RIGHTNOW_ARABIC' | 'ARABERT' }
 *
 * Response:
 *   200 { modelUsed, sentiment?, keyPhrases?, backTranslationOk?, disclaimer }
 *   400   if validation fails
 *   500   if unexpected error
 */
const router = Router();

// This endpoint runs a local model and must not be reachable anonymously.
const analyzeLimiter = createRateLimiter({
  limit: Number(process.env.ARABIC_RATE_LIMIT_MAX ?? 20),
  windowMs: 60 * 1000,
  keyPrefix: 'arabic',
  message: 'Too many Arabic analysis requests. Please wait a minute and try again.',
});

router.post('/analyze', authenticateToken, analyzeLimiter, async (req: Request, res: Response) => {
  try {
    const result = await analyzeArabic(req.body as {
      text: string;
      model?: 'RIGHTNOW_ARABIC' | 'ARABERT';
    });
    res.json(result);
  } catch (err) {
    console.error('Arabic analyze endpoint error:', err);
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues.map((i) => i.message).join(', ') });
    } else if (err instanceof Error) {
      // Keep upstream/driver details in the server log, not the response.
      res.status(500).json({ error: 'Arabic analysis failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;