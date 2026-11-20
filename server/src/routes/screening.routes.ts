import { Router } from 'express';
import { submitScreening, getScreeningHistory, getScreeningById } from '../controllers/screening.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth to all screening routes
router.use(authenticateToken);

router.post('/', submitScreening);
router.get('/', getScreeningHistory);
router.get('/:id', getScreeningById);

export default router;
