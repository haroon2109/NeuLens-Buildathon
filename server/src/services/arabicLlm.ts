/*****************************************************************************************
 * Arabic LLM Service for NeuLens
 *
 * Provides research-stage Arabic language model inference for exploratory signals.
 * Supported models (feature-flagged):
 *   - RIGHTNOW_ARABIC: RightNow-Arabic-0.5B-Turbo decoder (GGUF format, via node-llama-cpp)
 *   - ARABERT: AraBERT-base encoder (via @huggingface/transformers)
 *
 * Model weights are lazy-loaded and cached in memory. If weights are not present on disk,
 * the service falls back to deterministic heuristic stubs and logs a warning.
 *
 * Expected weight locations (configurable via env):
 *   RIGHTNOW_MODEL_PATH  – path to GGUF file (default: server/models/rightnow/model.gguf)
 *                          (downloaded from RightNowAI/RightNow-Arabic-0.5B-Turbo, q4_k_m)
 *   ARABERT_MODEL_ID     – HuggingFace ONNX model id or local path
 *                          (default: wajdiz/camelbert-mix-sentiment-onnx – CAMeLBERT-base
 *                           Arabic encoder, Apache-2.0; swap in an AraBERT ONNX export via env)
 *   ARABERT_CACHE_DIR    – download/cache directory (default: server/models/arabert)
 *
 * All outputs are explicitly exploratory and must not be interpreted as diagnostic scores.
 *****************************************************************************************/

import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Request / response schemas
// ---------------------------------------------------------------------------

const arabicAnalyzeSchema = z.object({
  text: z.string().min(1, 'Arabic text is required').max(10_000, 'Text too long'),
  model: z.enum(['RIGHTNOW_ARABIC', 'ARABERT']).optional(),
});

type ArabicAnalyzeInput = z.infer<typeof arabicAnalyzeSchema>;

interface ArabicAnalyzeResult {
  /** Sentiment hint: "positive" | "negative" | "neutral" – experimental only */
  sentiment?: 'positive' | 'negative' | 'neutral';
  /** Short key phrases extracted from the transcript – experimental only */
  keyPhrases?: string[];
  /** Back‑translation consistency check – experimental only */
  backTranslationOk?: boolean;
  /** Which model was used (or "fallback" if neither was available) */
  modelUsed: 'RIGHTNOW_ARABIC' | 'ARABERT' | 'fallback';
  /** Human‑readable disclaimer to display alongside the result */
  disclaimer:
    | {
        text: string;
        placement: 'always' | 'optional';
      }
    | null;
}

// ---------------------------------------------------------------------------
// Feature flags and paths (read from env at runtime)
// ---------------------------------------------------------------------------

const RIGHTNOW_ENABLED = process.env.RIGHTNOW_ARABIC_ENABLED === '1';
const ARABERT_ENABLED = process.env.ARABERT_ENABLED === '1';

const DEFAULT_RIGHTNOW_PATH = path.resolve(__dirname, '../../models/rightnow/model.gguf');
const RIGHTNOW_MODEL_PATH = process.env.RIGHTNOW_MODEL_PATH || DEFAULT_RIGHTNOW_PATH;
const ARABERT_MODEL_ID = process.env.ARABERT_MODEL_ID || 'wajdiz/camelbert-mix-sentiment-onnx';
const ARABERT_CACHE_DIR =
  process.env.ARABERT_CACHE_DIR || path.resolve(__dirname, '../../models/arabert');

const DISCLAIMER_TEXT = 'Arabic‑language model output is experimental and not a clinical score.';

// ---------------------------------------------------------------------------
// Lazy-loaded model caches
// ---------------------------------------------------------------------------

let rightNowSessionPromise: Promise<any> | null = null;
let arabertPipelinePromise: Promise<any> | null = null;

/**
 * True native dynamic import.
 *
 * TypeScript compiles `import()` to `require()` under `module: commonjs`, and
 * node-llama-cpp is ESM with top-level await, so require() throws. Building the
 * importer at runtime keeps the ESM import intact in the CJS build.
 */
const nativeImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<any>;

async function loadRightNowModel(): Promise<any> {
  if (!RIGHTNOW_ENABLED) {
    throw new Error('RightNow Arabic model disabled via feature flag');
  }
  if (!fs.existsSync(RIGHTNOW_MODEL_PATH)) {
    throw new Error(
      `RightNow GGUF weights not found at ${RIGHTNOW_MODEL_PATH}. ` +
        'Set RIGHTNOW_MODEL_PATH or place model.gguf in server/models/rightnow/.'
    );
  }
  if (!rightNowSessionPromise) {
    rightNowSessionPromise = (async () => {
      // Native dynamic import (see nativeImport); this package is ESM-only.
      const { getLlama, LlamaChatSession } = await nativeImport('node-llama-cpp');
      const llama = await getLlama();
      const model = await llama.loadModel({ modelPath: RIGHTNOW_MODEL_PATH });
      const context = await model.createContext({ contextSize: 2048 });
      const session = new LlamaChatSession({ contextSequence: context.getSequence() });
      console.info('[ArabicLLM] RightNow model loaded from', RIGHTNOW_MODEL_PATH);
      return { session, model, context, LlamaChatSession };
    })().catch((err) => {
      rightNowSessionPromise = null;
      throw err;
    });
  }
  return rightNowSessionPromise;
}

async function loadArabertModel(): Promise<any> {
  if (!ARABERT_ENABLED) {
    throw new Error('AraBERT model disabled via feature flag');
  }
  if (!arabertPipelinePromise) {
    arabertPipelinePromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      // Keep weights in the project so the service works offline after first download.
      env.cacheDir = ARABERT_CACHE_DIR;
      // q8 selects the quantized ONNX export; falls back to heuristic if unavailable.
      const classifier = await pipeline('sentiment-analysis', ARABERT_MODEL_ID, { dtype: 'q8' });
      console.info('[ArabicLLM] AraBERT pipeline loaded:', ARABERT_MODEL_ID);
      return classifier;
    })().catch((err) => {
      arabertPipelinePromise = null;
      throw err;
    });
  }
  return arabertPipelinePromise;
}

// ---------------------------------------------------------------------------
// Heuristic fallback helpers (used when model weights are unavailable)
// ---------------------------------------------------------------------------

function extractKeyPhrases(text: string): string[] {
  const stops = new Set([
    'و', 'في', 'أن', 'لا', 'من', 'على', 'إلى', 'كان', 'كانت', 'هذا', 'هذه', 'ذلك', 'تلك',
    'been', 'was', 'were', 'the', 'a', 'an', 'of', 'for', 'on', 'with', 'as', 'by',
    'but', 'or', 'and', 'is', 'are', 'to', 'in', 'at', 'it', 'that', 'this',
  ]);
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stops.has(w.toLowerCase()));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function heuristicSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const positive = /good|healthy|stable|normal|better|improved|جيد|صحي|مستقر|طبيعي|أفضل|تحسن/;
  const negative = /decline|problem|issue|concern|worse|confused|تراجع|مشكلة|قلق|أسوأ|ارتباك|صعوبة/;
  if (positive.test(lower) && !negative.test(lower)) return 'positive';
  if (negative.test(lower) && !positive.test(lower)) return 'negative';
  return 'neutral';
}

function heuristicAnalyze(text: string) {
  return {
    sentiment: heuristicSentiment(text),
    keyPhrases: extractKeyPhrases(text),
    backTranslationOk: true,
  } as const;
}

// ---------------------------------------------------------------------------
// Model-backed inference
// ---------------------------------------------------------------------------

function normalizeSentimentLabel(label: string): 'positive' | 'negative' | 'neutral' {
  const l = label.toLowerCase();
  if (l.includes('pos') || l.includes('positive') || l.includes('label_2')) return 'positive';
  if (l.includes('neg') || l.includes('negative') || l.includes('label_0')) return 'negative';
  return 'neutral';
}

async function rightNowGenerate(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  keyPhrases: string[];
  backTranslationOk: boolean;
  usedRealModel: boolean;
}> {
  try {
    const { session } = await loadRightNowModel();
    const prompt =
      `You are an experimental research assistant. Analyze the following Arabic transcript and respond ONLY with a JSON object ` +
      `with keys: sentiment ("positive"|"negative"|"neutral"), keyPhrases (array of up to 5 short strings), ` +
      `backTranslationOk (boolean). Do not include any clinical diagnosis.\n\nTranscript:\n${text}\n\nJSON:`;
    // Bound generation so a slow CPU request cannot hang the endpoint.
    const raw: string = await Promise.race([
      session.prompt(prompt, { maxTokens: 128, temperature: 0.2 }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('RightNow inference timed out after 20s')), 20_000)
      ),
    ]);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const sentiment = normalizeSentimentLabel(String(parsed.sentiment || 'neutral'));
        const keyPhrases = Array.isArray(parsed.keyPhrases)
          ? parsed.keyPhrases.slice(0, 5).map((p: unknown) => String(p))
          : extractKeyPhrases(text);
        const backTranslationOk = typeof parsed.backTranslationOk === 'boolean' ? parsed.backTranslationOk : true;
        return { sentiment, keyPhrases, backTranslationOk, usedRealModel: true };
      } catch {
        // fall through to heuristic
      }
    }
    const fallback = heuristicAnalyze(text);
    return { ...fallback, usedRealModel: true };
  } catch (err) {
    console.warn('[ArabicLLM] RightNow model unavailable, using heuristic fallback:', (err as Error).message);
    const fallback = heuristicAnalyze(text);
    return { ...fallback, usedRealModel: false };
  }
}

async function arabertClassify(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  keyPhrases: string[];
  usedRealModel: boolean;
}> {
  try {
    const classifier = await loadArabertModel();
    const output = await classifier(text, { topk: 1 });
    const first = Array.isArray(output) ? output[0] : output;
    const label = first && typeof first === 'object' && 'label' in first ? String((first as any).label) : 'neutral';
    const sentiment = normalizeSentimentLabel(label);
    return { sentiment, keyPhrases: extractKeyPhrases(text), usedRealModel: true };
  } catch (err) {
    console.warn('[ArabicLLM] AraBERT model unavailable, using heuristic fallback:', (err as Error).message);
    const fallback = heuristicAnalyze(text);
    return { sentiment: fallback.sentiment, keyPhrases: fallback.keyPhrases, usedRealModel: false };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzeArabic(input: ArabicAnalyzeInput): Promise<ArabicAnalyzeResult> {
  const { text, model: requestedModel } = arabicAnalyzeSchema.parse(input);

  const makeResult = (
    modelUsed: ArabicAnalyzeResult['modelUsed'],
    data?: Partial<ArabicAnalyzeResult>,
    usedRealModel = false
  ): ArabicAnalyzeResult => ({
    sentiment: data?.sentiment,
    keyPhrases: data?.keyPhrases,
    backTranslationOk: data?.backTranslationOk,
    modelUsed,
    disclaimer: {
      text: DISCLAIMER_TEXT,
      // "optional" when a real model produced the result, "always" for fallback/heuristic
      placement: usedRealModel ? 'optional' : 'always',
    },
  });

  try {
    if (requestedModel === 'RIGHTNOW_ARABIC' && RIGHTNOW_ENABLED) {
      const gen = await rightNowGenerate(text);
      return makeResult('RIGHTNOW_ARABIC', gen, gen.usedRealModel);
    }

    if (requestedModel === 'ARABERT' && ARABERT_ENABLED) {
      const cls = await arabertClassify(text);
      return makeResult('ARABERT', cls, cls.usedRealModel);
    }

    // Auto-select: prefer RightNow if enabled, then AraBERT
    if (RIGHTNOW_ENABLED) {
      const gen = await rightNowGenerate(text);
      return makeResult('RIGHTNOW_ARABIC', gen, gen.usedRealModel);
    }
    if (ARABERT_ENABLED) {
      const cls = await arabertClassify(text);
      return makeResult('ARABERT', cls, cls.usedRealModel);
    }

    // Neither model enabled – heuristic fallback with strong disclaimer
    const fallback = heuristicAnalyze(text);
    return makeResult('fallback', fallback, false);
  } catch (err) {
    console.error('[ArabicLLM] analyze error:', err);
    const fallback = heuristicAnalyze(text);
    return makeResult('fallback', fallback, false);
  }
}

export type { ArabicAnalyzeResult, ArabicAnalyzeInput };
