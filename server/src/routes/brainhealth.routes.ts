import { Router } from 'express';
import { getBrainHealthProfile, createBrainHealthProfile } from '../controllers/brainhealth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getBrainHealthProfile);
router.post('/', createBrainHealthProfile);

export default router;