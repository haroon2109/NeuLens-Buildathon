/**
 * Gnani Voice API Client (Frontend)
 * Neulens
 *
 * Communicates with the secure backend at /api/v1/voice
 * Kept strictly isolated from secret credentials.
 */

export interface TranscriptionResponse {
  success: boolean;
  transcript: string;
  language?: string;
  requestId?: string;
  confidence?: number;
  latencyMs?: number;
  error?: string;
}

export interface VoiceHealthResponse {
  status: 'ok' | 'degraded' | 'unconfigured';
  configured: boolean;
  message: string;
  stt?: {
    model: string;
    endpoint: string;
    supportedLanguages: string[];
  };
  tts?: {
    model: string;
    endpoint: string;
    supportedLanguages: string[];
    cacheEntries: number;
  };
}

export interface VoiceAcousticMetrics {
  duration_seconds: number;
  speech_duration_seconds: number;
  voiced_ratio: number;
  pause_count: number;
  pause_durations_ms: number[];
  mean_pause_ms: number | null;
  longest_pause_ms: number | null;
  syllable_count: number | null;
  speech_rate_syllables_per_minute: number | null;
  speech_rate_words_per_minute: number | null;
  word_count: number | null;
  response_latency_ms: number | null;
  pitch_mean_hz: number | null;
  pitch_sd_hz: number | null;
  pitch_min_hz: number | null;
  pitch_max_hz: number | null;
  intensity_mean_db: number | null;
  intensity_sd_db: number | null;
  jitter_percent: number | null;
  shimmer_percent: number | null;
  speech_errors: number | null;
  speech_accuracy_percent: number | null;
  vad: 'silero' | 'energy';
  quality: {
    score: number;
    level: 'good' | 'fair' | 'poor';
    reasons: string[];
    comparable: boolean;
    summary: string;
  };
  note: string;
  [key: string]: unknown;
}

export interface VoiceAcousticResponse {
  success?: boolean;
  pipeline: 'voice';
  model_inference: boolean;
  metrics: VoiceAcousticMetrics;
  observations: string[];
}

export interface VoiceAcousticOptions {
  transcript?: string;
  targetText?: string;
  responseLatencyMs?: number;
  syllableCount?: number;
  language?: string;
}

const API_BASE_URL = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '');
const API_BASE = `${API_BASE_URL}/api/v1/voice`;

export class GnaniVoiceApiClient {
  private healthCache: { data: VoiceHealthResponse; timestamp: number } | null = null;

  /**
   * Check whether backend Gnani integration is configured and active.
   * Cached for 60 seconds to avoid unnecessary requests.
   */
  public async getHealth(forceRefresh = false): Promise<VoiceHealthResponse> {
    const now = Date.now();
    if (!forceRefresh && this.healthCache && (now - this.healthCache.timestamp < 60000)) {
      return this.healthCache.data;
    }

    try {
      const res = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json() as VoiceHealthResponse;
        this.healthCache = { data, timestamp: now };
        return data;
      }
    } catch (e) {
      console.warn('[GnaniVoiceApi]: Backend health check unreachable:', e);
    }

    return {
      status: 'unconfigured',
      configured: false,
      message: 'Backend voice endpoint unreachable. Using browser speech synthesis fallback.'
    };
  }

  /**
   * Transcribe an audio Blob using Gnani Prisma v2.5 (v3 REST) through backend
   */
  public async transcribeAudio(
    audioBlob: Blob,
    language: string,
    filename = 'recorded_audio.webm'
  ): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, filename);
    formData.append('language', language);

    try {
      const response = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          transcript: '',
          error: errJson.error || `HTTP ${response.status}: Failed to transcribe audio`
        };
      }

      const json = await response.json();
      return {
        success: true,
        transcript: json.transcript || '',
        language: json.language,
        requestId: json.requestId,
        confidence: json.confidence,
        latencyMs: json.latencyMs
      };
    } catch (err: any) {
      console.error('[GnaniVoiceApi]: Transcription request error:', err);
      return {
        success: false,
        transcript: '',
        error: err.message || 'Network error during audio transcription'
      };
    }
  }

  /**
   * Measure acoustic properties of a recorded clip.
   *
   * The backend forwards it to the FastAPI service, which decodes the WebM
   * clip and runs VAD + Praat/librosa analysis. Returns null when the service
   * is not configured or unavailable so the caller can use browser metrics.
   */
  public async analyzeAcoustics(
    audioBlob: Blob,
    options: VoiceAcousticOptions = {},
    filename = 'recorded_audio.webm'
  ): Promise<VoiceAcousticResponse | null> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, filename);
    if (options.transcript) formData.append('transcript', options.transcript);
    if (options.targetText) formData.append('target_text', options.targetText);
    if (options.language) formData.append('language', options.language);
    if (typeof options.responseLatencyMs === 'number' && Number.isFinite(options.responseLatencyMs)) {
      formData.append('response_latency_ms', String(Math.max(0, Math.round(options.responseLatencyMs))));
    }
    if (typeof options.syllableCount === 'number' && Number.isFinite(options.syllableCount)) {
      formData.append('syllable_count', String(Math.max(0, Math.round(options.syllableCount))));
    }

    try {
      const response = await fetch(`${API_BASE}/acoustics`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn('[GnaniVoiceApi]: Acoustic analysis unavailable:', response.status, errJson.error);
        return null;
      }

      return (await response.json()) as VoiceAcousticResponse;
    } catch (err: any) {
      console.warn('[GnaniVoiceApi]: Acoustic analysis request error:', err?.message);
      return null;
    }
  }

  /**
   * Synthesize audio from text using Gnani Timbre v2.5 through backend
   */
  public async synthesizeSpeech(
    text: string,
    language: string,
    voice?: string,
    speed = 0.95,
    signal?: AbortSignal
  ): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE}/synthesize`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/wav, audio/*;q=0.9'
        },
        body: JSON.stringify({
          text,
          language,
          voice,
          speed
        }),
        signal
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn('[GnaniVoiceApi]: TTS returned status:', response.status, errJson);
        return null;
      }

      const blob = await response.blob();
      return blob;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request intentionally aborted by a newer speak() call or stop()
        return null;
      }
      console.warn('[GnaniVoiceApi]: Network error during speech synthesis:', err);
      return null;
    }
  }
}

export const gnaniVoiceApi = new GnaniVoiceApiClient();
