/**
 * Voice copilot question answering.
 *
 * Open-ended patient questions are answered through the configured
 * OpenAI-compatible LLM. Portal commands stay deterministic on the client.
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth';
import { answerQuestion, isAssistantConfigured, streamAnswer } from '../services/assistantLlm';
import { warn } from '../services/logger';
import {
  generateClinicianSummary,
  interpretAssessmentMetadata,
  explainObservedChanges,
  generateMultilingualInstructions
} from '../services/geminiService';

const router = Router();

const chatSchema = z.object({
  message: z.string().trim().min(1).max(800),
  language: z.enum(['en', 'ta', 'hi', 'ar']),
  context: z
    .object({
      page: z.string().max(160).optional(),
      pageTitle: z.string().max(160).optional(),
      summary: z.string().max(600).optional()
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(800)
      })
    )
    .max(10)
    .optional()
});

// Small in-memory guard so one session cannot hammer the provider.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

router.get('/status', authenticateToken, (_req, res) => {
  res.json({ configured: isAssistantConfigured() });
});

router.post('/chat/stream', authenticateToken, requireRole(['PATIENT']), async (req: any, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'A question between 1 and 800 characters is required.' });
  }

  if (!isAssistantConfigured()) {
    return res.status(503).json({ error: 'The assistant is not configured.', configured: false });
  }

  const key = req.user?.id || req.ip || 'anonymous';
  if (rateLimited(key)) {
    return res.status(429).json({ error: 'Too many questions. Please wait a moment and try again.' });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await streamAnswer(parsed.data, (text) => send('delta', { text }));
    send('done', { reply: result.reply });
  } catch (error: any) {
    warn('assistant.chat.stream_failed', {
      code: error?.code,
      message: error?.message,
      detail: error?.detail
    });
    send('error', { error: 'The assistant could not answer that right now.' });
  } finally {
    res.end();
  }
  return undefined;
});

router.post('/chat', authenticateToken, requireRole(['PATIENT']), async (req: any, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'A question between 1 and 800 characters is required.' });
  }

  if (!isAssistantConfigured()) {
    return res.status(503).json({ error: 'The assistant is not configured.', configured: false });
  }

  const key = req.user?.id || req.ip || 'anonymous';
  if (rateLimited(key)) {
    return res.status(429).json({ error: 'Too many questions. Please wait a moment and try again.' });
  }

  try {
    const result = await answerQuestion(parsed.data);
    return res.json({ reply: result.reply, configured: true });
  } catch (error: any) {
    warn('assistant.chat.failed', {
      code: error?.code,
      message: error?.message,
      detail: error?.detail
    });
    return res.status(502).json({ error: 'The assistant could not answer that right now.' });
  }
});

// ----------------------------------------------------------------------------
// Google Gemini Core AI Engine Endpoints (Startup Buildathon India 2026)
// ----------------------------------------------------------------------------

/**
 * 1. Generating structured clinician-facing summaries.
 */
router.post('/gemini/clinician-summary', authenticateToken, async (req: any, res) => {
  try {
    const result = await generateClinicianSummary(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate clinician summary' });
  }
});

/**
 * 2. Interpreting assessment metadata and task responses.
 */
router.post('/gemini/interpret-metadata', authenticateToken, async (req: any, res) => {
  try {
    const result = await interpretAssessmentMetadata(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to interpret metadata' });
  }
});

/**
 * 3. Explaining observed changes in understandable language (Personal Baseline & RCI).
 */
router.post('/gemini/explain-changes', authenticateToken, async (req: any, res) => {
  try {
    const result = await explainObservedChanges(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to explain observed changes' });
  }
});

/**
 * 4. Multilingual instructions and patient-friendly explanations.
 */
router.post('/gemini/multilingual-instructions', async (req, res) => {
  try {
    const result = await generateMultilingualInstructions(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate instructions' });
  }
});

export default router;
