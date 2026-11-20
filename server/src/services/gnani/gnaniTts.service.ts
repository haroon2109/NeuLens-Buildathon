/**
 * Gnani AI Timbre v2.5 Text-to-Speech (TTS) Service
 * Official endpoint: POST https://api.vachana.ai/api/v1/tts/inference
 */

import crypto from 'crypto';
import { withGnaniQueue } from './gnaniQueue';
import { GNANI_LANGUAGE_CATALOG, GnaniTtsOptions, GnaniTtsResult, SupportedLanguageCode } from './types';

interface CachedAudioEntry {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
}

export class GnaniTtsService {
  private baseUrl: string;
  private apiKey: string | null;
  private timeoutMs: number;
  private memoryCache: Map<string, CachedAudioEntry> = new Map();
  private maxCacheEntries: number = 200;

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

  public getCacheSize(): number {
    return this.memoryCache.size;
  }

  public clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Resolve language code to standard Gnani BCP-47 tag and matching default voice
   */
  public resolveVoiceAndLanguage(lang: string, requestedVoice?: string): { bcp47: string; voice: string } {
    const code = (lang || 'en').toLowerCase() as SupportedLanguageCode;
    const catalogEntry = GNANI_LANGUAGE_CATALOG[code];

    if (catalogEntry) {
      const bcp47 = catalogEntry.bcp47;
      let voice = catalogEntry.defaultVoice;

      if (requestedVoice && catalogEntry.availableVoices.includes(requestedVoice)) {
        voice = requestedVoice;
      }
      return { bcp47, voice };
    }

    // Direct BCP-47 lookup (e.g. 'ta-IN')
    for (const item of Object.values(GNANI_LANGUAGE_CATALOG)) {
      if (item.bcp47.toLowerCase() === lang.toLowerCase()) {
        const voice = requestedVoice && item.availableVoices.includes(requestedVoice)
          ? requestedVoice
          : item.defaultVoice;
        return { bcp47: item.bcp47, voice };
      }
    }

    // Default fallback
    return { bcp47: 'en-IN', voice: 'Kaveri' };
  }

  private generateCacheKey(text: string, bcp47: string, voice: string, speed: number): string {
    const raw = `${bcp47}:${voice}:${speed.toFixed(2)}:${text.trim()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Synthesize spoken audio from text using Gnani Timbre v2.5
   */
  public async synthesize(options: GnaniTtsOptions): Promise<GnaniTtsResult> {
    const startTime = Date.now();
    const text = (options.text || '').trim();

    if (!text) {
      throw new Error('Synthesis text cannot be empty.');
    }

    if (text.length > 2500) {
      throw new Error('Synthesis text exceeds maximum character limit of 2,500 characters.');
    }

    const { bcp47, voice } = this.resolveVoiceAndLanguage(options.language, options.voice);
    const speed = options.speed !== undefined ? Math.max(0.5, Math.min(2.0, options.speed)) : 0.95;

    // Check Cache (Optimizing 5,000 credit budget for static healthcare instructions)
    const cacheKey = this.generateCacheKey(text, bcp47, voice, speed);
    if (!options.bypassCache && this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)!;
      return {
        audioBuffer: cached.buffer,
        contentType: cached.contentType,
        cached: true,
        voice,
        language: bcp47,
        latencyMs: Date.now() - startTime
      };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gnani speech service is not configured (missing GNANI_API_KEY).');
    }

    const targetUrl = `${this.baseUrl}/api/v1/tts/inference`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const payload = {
      text,
      voice,
      model: 'timbre-v2.5',
      language: bcp47,
      speed,
      audio_config: {
        encoding: 'linear_pcm',
        container: 'wav',
        num_channels: 1,
        sample_rate: options.sampleRate || 24000,
        sample_width: 2
      }
    };

    try {
      const response = await withGnaniQueue(() =>
        fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key-ID': apiKey
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[GnaniTtsService]: Upstream returned HTTP ${response.status}: ${response.statusText}`);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Gnani speech service authentication failed (401/403).');
        }
        if (response.status === 429) {
          throw new Error('Gnani speech service rate limit exceeded (429).');
        }
        if (response.status === 400) {
          throw new Error(`Invalid TTS payload or unsupported voice for language: ${errorText || 'Bad Request'}`);
        }
        throw new Error(`Upstream Gnani TTS error: HTTP ${response.status}`);
      }

      // Read audio binary array buffer
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'audio/wav';

      // Store in memory cache (LRU eviction if over limit)
      if (this.memoryCache.size >= this.maxCacheEntries) {
        const firstKey = this.memoryCache.keys().next().value;
        if (firstKey) this.memoryCache.delete(firstKey);
      }

      this.memoryCache.set(cacheKey, {
        buffer: audioBuffer,
        contentType,
        timestamp: Date.now()
      });

      return {
        audioBuffer,
        contentType,
        cached: false,
        voice,
        language: bcp47,
        latencyMs
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Gnani TTS request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const gnaniTtsService = new GnaniTtsService();
