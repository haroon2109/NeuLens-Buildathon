import { Router } from 'express';
import { getLongitudinalHistory, createLongitudinalRecord } from '../controllers/longitudinal.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getLongitudinalHistory);
router.post('/', createLongitudinalRecord);

export default router;