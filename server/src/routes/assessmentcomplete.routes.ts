import { Router } from 'express';
import { submitAssessmentComplete } from '../controllers/assessmentcomplete.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', submitAssessmentComplete);

export default router;