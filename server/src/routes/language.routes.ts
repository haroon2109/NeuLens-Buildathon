import { Router } from 'express';
import { getParticipantLanguageReadiness } from '../services/assessmentLanguageReadiness';

const router = Router();

/**
 * GET /api/v1/language-readiness
 *
 * Public: the participant-facing view of which languages can administer the
 * tasks and which are still being reviewed. The language-selection screen uses
 * this to show the truth instead of offering every language as equivalent, and
 * the submission gate uses the same registry, so the two cannot disagree.
 */
router.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(getParticipantLanguageReadiness());
});

export default router;
