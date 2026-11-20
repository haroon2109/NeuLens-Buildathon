import { Router } from 'express';
import { ExternalInstrumentController } from '../controllers/externalinstrument.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// A validated instrument score is clinical data: clinician only, never patient
// or anonymous access, and never returned by a patient-facing endpoint.
const clinicianGuard = [authenticateToken, requireRole(['CLINICIAN', 'ADMIN'])];
router.get('/catalog', ...clinicianGuard, ExternalInstrumentController.catalog);
router.get('/patients/:patientId', ...clinicianGuard, ExternalInstrumentController.list);
router.post('/patients/:patientId', ...clinicianGuard, ExternalInstrumentController.create);

export default router;
