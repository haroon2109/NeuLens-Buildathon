/**
 * Voice Controller — Gnani AI Integration
 * Neulens
 */

import { Request, Response } from 'express';
import { gnaniSttService } from '../services/gnani/gnaniStt.service';
import { gnaniTtsService } from '../services/gnani/gnaniTts.service';
import { gnaniEvonService } from '../services/gnani/evon.service';
import { GNANI_LANGUAGE_CATALOG, SupportedLanguageCode } from '../services/gnani/types';
import { transcribeQuerySchema, synthesizeBodySchema, evonSummarySchema } from '../validation/voice.schemas';

// Daily budget protection for the shared paid Gnani key. A paid key is active,
// so STT transcription and TTS synthesis draw from one daily allowance that
// resets at 00:00 UTC. Per-IP per-minute rate limits above still guard against
// bursts; this budget caps total key spend for the day. Gnani's own 429s are
// already serialized by the Gnani queue.

const DEFAULT_DAILY_BUDGET = 1000;
const parsedDailyBudget = Number(process.env.GNANI_DAILY_BUDGET);
const DAILY_BUDGET =
  Number.isFinite(parsedDailyBudget) && parsedDailyBudget > 0
    ? Math.floor(parsedDailyBudget)
    : DEFAULT_DAILY_BUDGET;

interface DailyBudgetState {
  used: number;
  dayKey: string;
  resetsAt: number;
}

let dailyBudget: DailyBudgetState = { used: 0, dayKey: '', resetsAt: 0 };

function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function nextUtcMidnight(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

function checkDailyBudget(now = Date.now()): boolean {
  const dayKey = utcDayKey(now);

  if (dailyBudget.dayKey !== dayKey) {
    dailyBudget = { used: 0, dayKey, resetsAt: nextUtcMidnight(now) };
  }

  if (dailyBudget.used >= DAILY_BUDGET) {
    return false;
  }

  dailyBudget.used++;
  return true;
}

export function getDailyBudgetState() {
  return {
    limit: DAILY_BUDGET,
    used: dailyBudget.dayKey === utcDayKey(Date.now()) ? dailyBudget.used : 0,
    remaining: Math.max(
      0,
      DAILY_BUDGET - (dailyBudget.dayKey === utcDayKey(Date.now()) ? dailyBudget.used : 0)
    ),
    resetsAt: dailyBudget.dayKey === utcDayKey(Date.now()) ? dailyBudget.resetsAt : nextUtcMidnight(Date.now())
  };
}

// Lightweight in-memory rate limiter to prevent credit depletion (5,000 credit budget preservation)
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

function checkRateLimit(key: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(key);

  if (!bucket || now > bucket.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count++;
  return true;
}

export class VoiceController {
  /**
   * GET /api/v1/voice/health
   * Safe status check indicating whether Gnani models are configured.
   * Does NOT consume paid credits or expose credentials.
   */
  public async getHealth(req: Request, res: Response) {
    const configured = gnaniSttService.isConfigured() && gnaniTtsService.isConfigured();
    const evonStatus = gnaniEvonService.getStatus();

    return res.status(200).json({
      status: configured ? 'ok' : 'degraded',
      configured,
      message: configured
        ? 'Gnani AI speech engines active (Prisma STT v2.5 / Timbre TTS v2.5)'
        : 'Gnani AI API key not configured. Backend will return safe fallbacks.',
      stt: {
        model: 'Prisma v2.5 (v3 REST)',
        endpoint: '/api/v1/voice/transcribe',
        supportedLanguages: Object.keys(GNANI_LANGUAGE_CATALOG)
      },
      tts: {
        model: 'Timbre v2.5',
        endpoint: '/api/v1/voice/synthesize',
        supportedLanguages: Object.keys(GNANI_LANGUAGE_CATALOG),
        cacheEntries: gnaniTtsService.getCacheSize()
      },
      evon: evonStatus,
      quota: getDailyBudgetState()
    });
  }

  /**
   * GET /api/v1/voice/voices
   * Returns supported languages and verified Timbre v2.5 voices catalog.
   */
  public async getVoices(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      languages: GNANI_LANGUAGE_CATALOG
    });
  }

  /**
   * POST /api/v1/voice/transcribe
   * Transcribe recorded audio file using Gnani Prisma v2.5 (v3 REST).
   */
  public async transcribe(req: Request, res: Response) {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';

    // Rate limiting: 20 transcription requests per minute per IP
    if (!checkRateLimit(`transcribe:${clientIp}`, 20, 60000)) {
      return res.status(429).json({
        error: 'Too many transcription requests. Please wait a minute before retrying.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Daily budget for the shared paid Gnani key (STT + TTS).
    if (!checkDailyBudget()) {
      return res.status(429).json({
        error: 'Daily Gnani speech budget exhausted. Speech features resume at 00:00 UTC.',
        code: 'QUOTA_EXCEEDED',
        resetsAt: dailyBudget.resetsAt
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Missing audio file. Please upload audio via form field "audio_file" or "audio".'
      });
    }

    // Supported audio mime types: wav, webm, ogg, mp3, m4a, flac
    const allowedMimePrefixes = ['audio/', 'video/webm', 'application/octet-stream'];
    const isAllowedMime = allowedMimePrefixes.some(prefix => req.file?.mimetype?.startsWith(prefix));
    
    if (!isAllowedMime) {
      return res.status(415).json({
        error: `Unsupported media type "${req.file.mimetype}". Expected audio file (WAV, WebM, MP3, OGG).`
      });
    }

    // Parse and validate query parameters / form body
    const rawLang = req.body?.language || req.query?.language || 'en';
    const validation = transcribeQuerySchema.safeParse({
      language: rawLang,
      format: req.body?.format || req.query?.format,
      itnNativeNumerals: req.body?.itnNativeNumerals ?? req.query?.itnNativeNumerals
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid transcription parameters',
        details: validation.error.issues
      });
    }

    const { language, format, itnNativeNumerals } = validation.data;

    // Check configuration
    if (!gnaniSttService.isConfigured()) {
      return res.status(503).json({
        error: 'Gnani STT service is not configured on the server (GNANI_API_KEY missing).',
        configured: false,
        transcript: '',
        fallbackAvailable: true
      });
    }

    try {
      const result = await gnaniSttService.transcribe(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          languageCode: language,
          format,
          itnNativeNumerals
        }
      );

      return res.status(200).json({
        success: result.success,
        transcript: result.transcript,
        language: result.language,
        requestId: result.requestId,
        confidence: result.confidence,
        latencyMs: result.latencyMs,
        ...(result.error ? { error: result.error } : {})
      });
    } catch (err: any) {
      console.error('[VoiceController]: Transcription failure:', err.message);
      return res.status(502).json({
        error: 'Speech-to-text processing failed',
        message: err.message,
        transcript: ''
      });
    }
  }

  /**
   * POST /api/v1/voice/acoustics
   * Forward a recorded clip to the FastAPI service for acoustic analysis
   * (timing, pitch, intensity, Praat jitter/shimmer, speech rate).
   *
   * The AI service is called server-to-server with a shared key: platform
   * sessions are authenticated here, and the key must never reach a browser.
   */
  public async acoustics(req: Request, res: Response) {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';

    if (!checkRateLimit(`acoustics:${clientIp}`, 20, 60000)) {
      return res.status(429).json({
        error: 'Too many acoustic analysis requests. Please wait a minute before retrying.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Missing audio file. Upload it via form field "audio_file" or "audio".'
      });
    }

    const baseUrl = (process.env.AI_SERVICE_URL || '').replace(/\/+$/, '');
    if (!baseUrl) {
      return res.status(503).json({
        error: 'Acoustic analysis is not configured on this server (AI_SERVICE_URL missing).',
        code: 'AI_SERVICE_UNCONFIGURED',
        fallbackAvailable: true
      });
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' }),
      req.file.originalname || 'recording.webm'
    );

    const body = req.body || {};
    for (const field of ['transcript', 'target_text', 'language'] as const) {
      if (typeof body[field] === 'string' && body[field].length) {
        form.append(field, body[field]);
      }
    }
    for (const field of ['response_latency_ms', 'syllable_count'] as const) {
      const value = Number(body[field]);
      if (Number.isFinite(value) && value >= 0) {
        form.append(field, String(Math.round(value)));
      }
    }

    const headers: Record<string, string> = {};
    if (process.env.AI_SERVICE_INTERNAL_KEY) {
      headers['X-Internal-Key'] = process.env.AI_SERVICE_INTERNAL_KEY;
    }

    try {
      const upstream = await fetch(`${baseUrl}/v1/ai/voice/acoustics`, {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(30000)
      });

      const payload: any = await upstream.json().catch(() => null);

      if (!upstream.ok) {
        console.warn('[VoiceController]: Acoustic analysis failed:', upstream.status, payload?.detail);
        return res.status(upstream.status === 422 ? 422 : upstream.status === 413 ? 413 : 502).json({
          error: payload?.detail || 'Acoustic analysis failed',
          code: 'AI_SERVICE_ERROR',
          fallbackAvailable: true
        });
      }

      return res.status(200).json({ success: true, ...payload });
    } catch (err: any) {
      console.error('[VoiceController]: Acoustic analysis unreachable:', err?.message);
      return res.status(503).json({
        error: 'The acoustic analysis service is unavailable.',
        code: 'AI_SERVICE_UNAVAILABLE',
        fallbackAvailable: true
      });
    }
  }

  /**
   * POST /api/v1/voice/synthesize
   * Synthesize audio from text using Gnani Timbre v2.5.
   */
  public async synthesize(req: Request, res: Response) {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';

    // Rate limiting: 45 synthesis requests per minute per IP
    if (!checkRateLimit(`tts:${clientIp}`, 45, 60000)) {
      return res.status(429).json({
        error: 'Too many speech synthesis requests. Please wait a minute before retrying.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Daily budget for the shared paid Gnani key (STT + TTS).
    if (!checkDailyBudget()) {
      return res.status(429).json({
        error: 'Daily Gnani speech budget exhausted. Speech features resume at 00:00 UTC.',
        code: 'QUOTA_EXCEEDED',
        resetsAt: dailyBudget.resetsAt
      });
    }

    const validation = synthesizeBodySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed for synthesis request',
        details: validation.error.issues
      });
    }

    const { text, language, voice, speed, sampleRate, bypassCache } = validation.data;

    if (!gnaniTtsService.isConfigured()) {
      return res.status(503).json({
        error: 'Gnani TTS service is not configured on the server (GNANI_API_KEY missing).',
        configured: false,
        fallbackRecommended: true
      });
    }

    try {
      const result = await gnaniTtsService.synthesize({
        text,
        language,
        voice,
        speed,
        sampleRate,
        bypassCache
      });

      res.setHeader('Content-Type', result.contentType || 'audio/wav');
      res.setHeader('Content-Length', result.audioBuffer.length);
      res.setHeader('X-Gnani-Voice', result.voice);
      res.setHeader('X-Gnani-Language', result.language);
      res.setHeader('X-Gnani-Cached', result.cached ? 'true' : 'false');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h

      return res.status(200).send(result.audioBuffer);
    } catch (err: any) {
      console.error('[VoiceController]: Synthesis failure:', err.message);
      return res.status(502).json({
        error: 'Text-to-speech synthesis failed',
        message: err.message,
        fallbackRecommended: true
      });
    }
  }

  /**
   * POST /api/v1/voice/evon-summary (Optional Evaluation Service)
   * Evaluates Evon 30B reasoning model for structured clinician documentation.
   */
  public async evonSummary(req: Request, res: Response) {
    const validation = evonSummarySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed for Evon summary request',
        details: validation.error.issues
      });
    }

    const result = await gnaniEvonService.generateClinicianDraft(validation.data);
    return res.status(result.available ? 200 : 503).json(result);
  }
}

export const voiceController = new VoiceController();
