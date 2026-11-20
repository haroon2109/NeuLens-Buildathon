import { Router } from 'express';
import { getTrends } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/trends', authenticateToken, getTrends);

export default router;
