/**
 * Validation Schemas for Voice Endpoints
 * Neulens
 */

import { z } from 'zod';

const SUPPORTED_LANG_CODES = ['en', 'ta', 'hi', 'te', 'ml', 'kn', 'ar', 'en-IN', 'ta-IN', 'hi-IN', 'te-IN', 'kn-IN', 'ml-IN', 'ar-AE'] as const;

export const transcribeQuerySchema = z.object({
  language: z.enum(SUPPORTED_LANG_CODES).default('en'),
  format: z.enum(['transcribe', 'detailed']).optional().default('transcribe'),
  itnNativeNumerals: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional().default(true)
});

export const synthesizeBodySchema = z.object({
  text: z.string().trim().min(1, 'Text to synthesize cannot be empty').max(2500, 'Text exceeds 2,500 characters limit'),
  language: z.string().min(2).max(10).default('en'),
  voice: z.string().trim().min(1).max(50).optional(),
  speed: z.number().min(0.5).max(2.0).optional().default(0.95),
  sampleRate: z.number().int().min(8000).max(48000).optional().default(24000),
  bypassCache: z.boolean().optional().default(false)
});

/**
 * External synthesis accepts numeric scores only. Names, IDs, age, free text
 * and transcripts are rejected by `.strict()` so they cannot reach a
 * third-party inference endpoint. Prefer the local FastAPI `/v1/ai/explanation`
 * endpoint for plain-language drafts.
 */
export const evonSummarySchema = z.object({
  testScores: z.object({
    memoryScore: z.number().min(0).max(100),
    attentionScore: z.number().min(0).max(100),
    visuospatialScore: z.number().min(0).max(100),
    executiveScore: z.number().min(0).max(100),
    compositeScore: z.number().min(0).max(100)
  }),
  speechAcoustics: z.object({
    jitter: z.number().optional(),
    shimmer: z.number().optional(),
    pitch: z.number().optional(),
    speechRate: z.number().optional()
  }).optional(),
  language: z.enum(['en', 'ta', 'hi', 'te', 'ml', 'kn']).default('en')
}).strict();

export type TranscribeQueryInput = z.infer<typeof transcribeQuerySchema>;
export type SynthesizeBodyInput = z.infer<typeof synthesizeBodySchema>;
export type EvonSummaryInput = z.infer<typeof evonSummarySchema>;
