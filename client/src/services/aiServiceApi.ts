import { getSupabaseAccessToken } from '../lib/supabase';

/**
 * Thin client for the Neulens AI service (FastAPI).
 *
 * The service URL and all secrets live on the server side; the browser only
 * forwards the signed-in user's Supabase access token. Requests are rejected
 * when there is no Supabase session, so the platform's Express-authenticated
 * endpoints remain the default path.
 */

const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL as string | undefined) || 'http://localhost:8000';

export interface AiAnalysis<TMetrics = Record<string, unknown>> {
  pipeline: 'voice' | 'ocular' | 'facial' | 'cognitive' | 'longitudinal';
  model_inference: boolean;
  metrics: TMetrics;
  observations: string[];
}

export class AiServiceError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}

const post = async <TResponse>(path: string, body: unknown): Promise<TResponse> => {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new AiServiceError('Sign in to run AI processing.', 401);
  }

  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = 'The AI service could not process this request.';
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) detail = payload.detail;
    } catch {
      /* keep the default message */
    }
    throw new AiServiceError(detail, response.status);
  }

  return (await response.json()) as TResponse;
};

export const aiServiceApi = {
  analyzeVoice: (body: {
    amplitudes: number[];
    frame_ms?: number;
    pitches_hz?: number[];
    syllable_count?: number;
    language?: string;
  }) => post<AiAnalysis>('/v1/ai/voice/analyze', body),

  analyzeOcular: (body: {
    gaze: Array<{ x: number; y: number; t: number }>;
    ear?: number[];
  }) => post<AiAnalysis>('/v1/ai/ocular/analyze', body),

  analyzeFacial: (body: {
    frames: Array<{ smile_left?: number; smile_right?: number; jaw_open?: number; brow_up?: number }>;
  }) => post<AiAnalysis>('/v1/ai/facial/analyze', body),

  analyzeCognitive: (tasks: Record<string, Record<string, unknown>>) =>
    post<AiAnalysis>('/v1/ai/cognitive/analyze', { tasks }),

  analyzeLongitudinal: (history: Array<Record<string, unknown>>) =>
    post<AiAnalysis>('/v1/ai/longitudinal/analyze', { history }),

  explain: (body: {
    audience?: 'patient' | 'clinician';
    metrics: Record<string, number>;
    session_count?: number;
    quality?: 'good' | 'limited' | 'insufficient';
  }) =>
    post<{
      text: string;
      provider: 'ollama' | 'deterministic';
      model: string | null;
      review_required: boolean;
      guardrail: string;
      note: string;
    }>('/v1/ai/explanation', body),
};
