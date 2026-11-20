import { Router } from 'express';
import { getContextInputs, createContextInput } from '../controllers/contextinput.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getContextInputs);
router.post('/', createContextInput);

export default router;