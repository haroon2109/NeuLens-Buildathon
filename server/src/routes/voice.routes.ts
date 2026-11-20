/**
 * Voice Routes — Gnani AI Integration
 * Neulens
 */

import { Router } from 'express';
import multer from 'multer';
import { voiceController } from '../controllers/voice.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Configure Multer for in-memory temporary storage (max 15MB audio payload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
    files: 1
  }
});

// Helper middleware to accept either "audio_file" or "audio" form field
const handleAudioUpload = (req: any, res: any, next: any) => {
  upload.fields([
    { name: 'audio_file', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ])(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Audio file exceeds 15MB limit.' });
      }
      return res.status(400).json({ error: err.message || 'File upload error.' });
    }

    // Normalize field onto req.file
    if (req.files) {
      if (req.files.audio_file && req.files.audio_file[0]) {
        req.file = req.files.audio_file[0];
      } else if (req.files.audio && req.files.audio[0]) {
        req.file = req.files.audio[0];
      }
    }
    next();
  });
};

/**
 * Health & Capabilities
 * GET /api/v1/voice/health
 */
router.get('/health', (req, res) => voiceController.getHealth(req, res));

/**
 * Verified Voice Catalog
 * GET /api/v1/voice/voices
 */
router.get('/voices', (req, res) => voiceController.getVoices(req, res));

/**
 * Every processing endpoint handles patient audio or speech and spends vendor
 * quota, so all three require an authenticated session. Only the static
 * capability catalog above stays public.
 *
 * Speech-to-Text (STT) via Gnani Prisma v2.5
 * POST /api/v1/voice/transcribe
 */
router.post(
  '/transcribe',
  authenticateToken,
  handleAudioUpload,
  (req, res) => voiceController.transcribe(req, res)
);

/**
 * Acoustic analysis of a recorded clip via the FastAPI AI service
 * POST /api/v1/voice/acoustics
 */
router.post(
  '/acoustics',
  authenticateToken,
  handleAudioUpload,
  (req, res) => voiceController.acoustics(req, res)
);

/**
 * Text-to-Speech (TTS) via Gnani Timbre v2.5
 * POST /api/v1/voice/synthesize
 */
router.post(
  '/synthesize',
  authenticateToken,
  (req, res) => voiceController.synthesize(req, res)
);

/**
 * Optional Evon 30B Reasoning Model Clinician Summary
 * POST /api/v1/voice/evon-summary
 */
router.post(
  '/evon-summary',
  authenticateToken,
  requireRole(['CLINICIAN', 'ADMIN']),
  (req, res) => voiceController.evonSummary(req, res)
);

export default router;
