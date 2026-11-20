import { Router } from 'express';
import { getBaseline, establishBaseline } from '../controllers/baseline.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getBaseline);
router.post('/', establishBaseline);

export default router;