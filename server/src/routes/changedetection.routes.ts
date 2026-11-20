import { Router } from 'express';
import { getChangeDetections, createChangeDetection } from '../controllers/changedetection.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getChangeDetections);
router.post('/', createChangeDetection);

export default router;