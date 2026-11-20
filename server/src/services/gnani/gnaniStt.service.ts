/**
 * Gnani AI Prisma v2.5 / v3 Speech-to-Text (STT) Service
 * Official endpoint: POST https://api.vachana.ai/stt/v3
 */

import { spawn } from 'child_process';
import { GNANI_LANGUAGE_CATALOG, GnaniSttOptions, GnaniSttResult, SupportedLanguageCode } from './types';
import { withGnaniQueue } from './gnaniQueue';

export class GnaniSttService {
  private baseUrl: string;
  private apiKey: string | null;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = (process.env.GNANI_API_BASE_URL || 'https://api.vachana.ai').replace(/\/+$/, '');
    this.apiKey = process.env.GNANI_API_KEY ? process.env.GNANI_API_KEY.replace(/^["']|["']$/g, '').trim() : null;
    this.timeoutMs = parseInt(process.env.GNANI_TIMEOUT_MS || '15000', 10);
  }

  public getApiKey(): string | null {
    const raw = process.env.GNANI_API_KEY || this.apiKey;
    return raw ? raw.replace(/^["']|["']$/g, '').trim() : null;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 0);
  }

  /**
   * Gnani ships no reviewed Arabic STT voice in this build, so Arabic audio
   * is never routed through a different-language voice. Callers fall back to
   * on-screen text only.
   */
  public isArabicVoiceAvailable(): boolean {
    return false;
  }

  /**
   * Resolve language code to standard Gnani BCP-47 tag (e.g., 'ta' -> 'ta-IN')
   */
  public resolveBcp47(lang: string): string {
    const key = lang.toLowerCase() as SupportedLanguageCode;
    if (GNANI_LANGUAGE_CATALOG[key]) {
      return GNANI_LANGUAGE_CATALOG[key].bcp47;
    }
    // If already in BCP-47 format (e.g. 'ta-IN', 'en-US')
    if (lang.includes('-')) {
      return lang;
    }
    return 'en-IN';
  }

  public needsTranscode(mimeType: string, filename: string): boolean {
    const mime = (mimeType || '').toLowerCase();
    const name = (filename || '').toLowerCase();
    // Gnani accepts ogg/aac/m4a/flac/mp3/wav; browsers record WebM/Opus,
    // which Gnani rejects, so transcode those (and raw Opus) to 16 kHz WAV.
    return mime.includes('webm') || mime.includes('opus') || name.endsWith('.webm') || name.endsWith('.opus');
  }

  public async transcodeToWav(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-i', 'pipe:0',
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        '-f', 'wav',
        'pipe:1'
      ], { stdio: ['pipe', 'pipe', 'pipe'] });

      const chunks: Buffer[] = [];
      let stderr = '';

      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      ffmpeg.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      ffmpeg.on('error', (err: Error) => {
        reject(new Error(`ffmpeg transcode failed to start: ${err.message}`));
      });

      ffmpeg.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`ffmpeg transcode failed (exit ${code}): ${stderr.trim() || 'unknown error'}`));
          return;
        }
        resolve(Buffer.concat(chunks));
      });

      ffmpeg.stdin.write(audioBuffer);
      ffmpeg.stdin.end();
    });
  }

  /**
   * Transcribe pre-recorded audio buffer using Gnani Prisma v3 REST API
   *
   * @param audioBuffer Audio file buffer (WAV, WebM, MP3, OGG up to 60s)
   * @param originalFilename Original file name for MIME hint
   * @param mimeType Audio MIME type (e.g., 'audio/webm', 'audio/wav')
   * @param options Language and formatting options
   */
  public async transcribe(
    audioBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    options: GnaniSttOptions
  ): Promise<GnaniSttResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      return {
        success: false,
        transcript: '',
        language: options.languageCode,
        requestId: undefined,
        latencyMs: Date.now() - startTime
      };
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio payload is empty or invalid.');
    }

    // Enforce 60s / 15MB upper safety boundary for REST
    const maxSizeBytes = 15 * 1024 * 1024;
    if (audioBuffer.length > maxSizeBytes) {
      throw new Error(`Audio file exceeds maximum allowed size of 15MB.`);
    }

    // Arabic is shown on-screen only; never route Arabic audio to STT.
    if (options.languageCode.toLowerCase() === 'ar' && !this.isArabicVoiceAvailable()) {
      return {
        success: false,
        transcript: '',
        language: 'en-IN',
        requestId: undefined,
        latencyMs: Date.now() - startTime,
        error: 'No reviewed Arabic voice is configured; Arabic is shown on-screen only.'
      };
    }

    let uploadBuffer = audioBuffer;
    let uploadMime = mimeType || 'audio/wav';
    let uploadName = originalFilename || 'recording.wav';

    if (this.needsTranscode(uploadMime, uploadName)) {
      uploadBuffer = await this.transcodeToWav(audioBuffer);
      uploadMime = 'audio/wav';
      uploadName = uploadName.replace(/\.[^.]+$/, '') + '.wav';
      if (!uploadName.endsWith('.wav')) uploadName = `${uploadName}.wav`;
    }

    const bcp47 = this.resolveBcp47(options.languageCode);

    const targetUrl = `${this.baseUrl}/stt/v3`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Build standard multipart/form-data payload via native Node 20 FormData & Blob
      const formData = new FormData();
      const audioBlob = new Blob([uploadBuffer], { type: uploadMime || 'audio/wav' });

      formData.append('audio_file', audioBlob, uploadName);
      formData.append('language_code', bcp47);
      formData.append('preferred_language', bcp47);
      formData.append('format', options.format || 'transcribe');
      formData.append('itn_native_numerals', options.itnNativeNumerals !== false ? 'true' : 'false');

      const apiKey = this.getApiKey();
      if (!apiKey) {
        return {
          success: false,
          transcript: '',
          language: options.languageCode,
          requestId: undefined,
          latencyMs: Date.now() - startTime
        };
      }

      const response = await withGnaniQueue(() =>
        fetch(targetUrl, {
          method: 'POST',
          headers: {
            'X-API-Key-ID': apiKey
          },
          body: formData,
          signal: controller.signal
        })
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[GnaniSttService]: Upstream returned HTTP ${response.status}: ${response.statusText}`);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Gnani speech service authentication failed (401/403).');
        }
        if (response.status === 429) {
          throw new Error('Gnani speech service rate limit exceeded (429).');
        }
        if (response.status === 400) {
          throw new Error(`Unsupported audio format or malformed request parameters: ${errorText || 'Bad Request'}`);
        }
        throw new Error(`Upstream Gnani STT service error: HTTP ${response.status}`);
      }

      const json = await response.json() as any;

      // Extract transcript according to documented schema
      // Response format: { success: true, request_id: "...", transcript: "..." }
      const transcript = (json.transcript || json.text || json.result || '').trim();
      const requestId = json.request_id || json.requestId || undefined;
      const confidence = typeof json.confidence === 'number' ? json.confidence : undefined;

      return {
        success: true,
        transcript,
        language: bcp47,
        requestId,
        confidence,
        latencyMs
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Gnani STT request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const gnaniSttService = new GnaniSttService();
