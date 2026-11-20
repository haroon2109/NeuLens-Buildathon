import { Router } from 'express';
import { CognitiveController } from '../controllers/cognitive.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Patient-facing cognitive assessment API. Patients may only ever read or
// submit their own session; the controller resolves the record from the token.
router.use(authenticateToken, requireRole(['PATIENT']));

router.get('/library', CognitiveController.library);
router.get('/context', CognitiveController.context);
router.post('/plan', CognitiveController.createPlan);
router.post('/sessions', CognitiveController.submit);
router.get('/history', CognitiveController.history);

export default router;
