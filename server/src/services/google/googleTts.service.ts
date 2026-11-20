/**
 * Google Cloud Text-to-Speech (Neural2 / Journey Voices) Service
 *
 * Provides high-fidelity, natural neural speech synthesis for NeuLens across
 * Indic languages and English with zero external third-party dependencies:
 * - Tamil (ta-IN): ta-IN-Neural2-A (Female), ta-IN-Neural2-B (Male)
 * - Hindi (hi-IN): hi-IN-Neural2-A (Female), hi-IN-Neural2-B (Male), hi-IN-Neural2-D (Female)
 * - Indian English (en-IN): en-IN-Journey-F (Female), en-IN-Journey-D (Male), en-IN-Neural2-A
 * - Telugu (te-IN): te-IN-Standard-A (Female), te-IN-Standard-B (Male)
 * - Kannada (kn-IN): kn-IN-Standard-A (Female), kn-IN-Standard-B (Male)
 * - Malayalam (ml-IN): ml-IN-Standard-A (Female), ml-IN-Standard-B (Male)
 * - Arabic (ar-XA / ar-AE): ar-XA-Neural2-A (Female), ar-XA-Neural2-B (Male)
 *
 * Features:
 * - In-memory SHA-256 prompt caching for zero-latency repeated clinical instructions.
 * - Paced elder-friendly speaking rates (default: 0.95x).
 * - Deterministic PCM/WAV fallback generator for offline testing and demo resilience.
 */

import crypto from 'crypto';
import { getGeminiConfig } from '../geminiService';
import { error as logError, info as logInfo } from '../logger';

export interface GoogleTtsOptions {
  text: string;
  language: string;
  voice?: string;
  speed?: number;
  sampleRate?: number;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  bypassCache?: boolean;
}

export interface GoogleTtsResult {
  audioBuffer: Buffer;
  contentType: string;
  cached: boolean;
  voice: string;
  language: string;
  model: 'google-cloud-neural2' | 'google-cloud-journey' | 'google-cloud-standard' | 'fallback-tone';
  provider: 'google-cloud-tts' | 'deterministic-fallback';
  latencyMs: number;
}

interface CachedAudioEntry {
  buffer: Buffer;
  contentType: string;
  voice: string;
  language: string;
  model: GoogleTtsResult['model'];
  provider: GoogleTtsResult['provider'];
  timestamp: number;
}

interface VoiceConfig {
  bcp47: string;
  defaultVoice: string;
  availableVoices: string[];
  gender: 'FEMALE' | 'MALE';
  modelType: 'google-cloud-journey' | 'google-cloud-neural2' | 'google-cloud-standard';
}

const VOICE_CATALOG: Record<string, VoiceConfig> = {
  ta: {
    bcp47: 'ta-IN',
    defaultVoice: 'ta-IN-Neural2-A',
    availableVoices: ['ta-IN-Neural2-A', 'ta-IN-Neural2-B', 'ta-IN-Standard-A', 'ta-IN-Standard-B'],
    gender: 'FEMALE',
    modelType: 'google-cloud-neural2'
  },
  hi: {
    bcp47: 'hi-IN',
    defaultVoice: 'hi-IN-Neural2-A',
    availableVoices: ['hi-IN-Neural2-A', 'hi-IN-Neural2-B', 'hi-IN-Neural2-C', 'hi-IN-Neural2-D'],
    gender: 'FEMALE',
    modelType: 'google-cloud-neural2'
  },
  en: {
    bcp47: 'en-IN',
    defaultVoice: 'en-IN-Journey-F',
    availableVoices: ['en-IN-Journey-F', 'en-IN-Journey-D', 'en-IN-Neural2-A', 'en-IN-Neural2-B'],
    gender: 'FEMALE',
    modelType: 'google-cloud-journey'
  },
  te: {
    bcp47: 'te-IN',
    defaultVoice: 'te-IN-Standard-A',
    availableVoices: ['te-IN-Standard-A', 'te-IN-Standard-B'],
    gender: 'FEMALE',
    modelType: 'google-cloud-standard'
  },
  kn: {
    bcp47: 'kn-IN',
    defaultVoice: 'kn-IN-Standard-A',
    availableVoices: ['kn-IN-Standard-A', 'kn-IN-Standard-B'],
    gender: 'FEMALE',
    modelType: 'google-cloud-standard'
  },
  ml: {
    bcp47: 'ml-IN',
    defaultVoice: 'ml-IN-Standard-A',
    availableVoices: ['ml-IN-Standard-A', 'ml-IN-Standard-B'],
    gender: 'FEMALE',
    modelType: 'google-cloud-standard'
  },
  ar: {
    bcp47: 'ar-XA',
    defaultVoice: 'ar-XA-Neural2-A',
    availableVoices: ['ar-XA-Neural2-A', 'ar-XA-Neural2-B', 'ar-XA-Standard-A'],
    gender: 'FEMALE',
    modelType: 'google-cloud-neural2'
  }
};

export class GoogleTtsService {
  private memoryCache: Map<string, CachedAudioEntry> = new Map();
  private maxCacheEntries = 300;

  public isConfigured(): boolean {
    const config = getGeminiConfig();
    return config.isConfigured;
  }

  public getCacheSize(): number {
    return this.memoryCache.size;
  }

  public clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Resolves language code to Google Cloud TTS voice configuration.
   */
  public resolveVoice(lang: string, requestedVoice?: string): { bcp47: string; voiceName: string; gender: 'FEMALE' | 'MALE'; modelType: GoogleTtsResult['model'] } {
    const key = (lang || 'en').toLowerCase().split('-')[0];
    const catalog = VOICE_CATALOG[key] || VOICE_CATALOG.en;

    let voiceName = catalog.defaultVoice;
    let gender = catalog.gender;

    if (requestedVoice && catalog.availableVoices.includes(requestedVoice)) {
      voiceName = requestedVoice;
      gender = requestedVoice.endsWith('-B') || requestedVoice.endsWith('-C') || requestedVoice.endsWith('-D') ? 'MALE' : 'FEMALE';
    }

    const modelType = voiceName.includes('Journey')
      ? 'google-cloud-journey'
      : voiceName.includes('Neural2')
        ? 'google-cloud-neural2'
        : 'google-cloud-standard';

    return {
      bcp47: catalog.bcp47,
      voiceName,
      gender,
      modelType
    };
  }

  private generateCacheKey(text: string, bcp47: string, voice: string, speed: number, encoding: string): string {
    const raw = `${bcp47}:${voice}:${speed.toFixed(2)}:${encoding}:${text.trim()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Generates a 0.5-second silent/low-frequency WAV tone buffer for offline mock resilience.
   */
  private generateOfflineWavBuffer(): Buffer {
    const sampleRate = 16000;
    const numSamples = Math.floor(sampleRate * 0.4);
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
      buffer.writeInt16LE(0, 44 + i * 2);
    }

    return buffer;
  }

  /**
   * Synthesize audio from text using Google Cloud Text-to-Speech (Neural2 / Journey).
   */
  public async synthesize(options: GoogleTtsOptions): Promise<GoogleTtsResult> {
    const startTime = Date.now();
    const text = (options.text || '').trim();

    if (!text) {
      throw new Error('Synthesis text cannot be empty.');
    }

    if (text.length > 3000) {
      throw new Error('Synthesis text exceeds maximum character limit of 3,000 characters.');
    }

    const speed = options.speed !== undefined ? Math.max(0.6, Math.min(1.5, options.speed)) : 0.95;
    const encoding = options.audioEncoding || 'MP3';
    const { bcp47, voiceName, gender, modelType } = this.resolveVoice(options.language, options.voice);

    // Check In-Memory Prompt Cache (Instant ~0ms retrieval for recurring instruction prompts)
    const cacheKey = this.generateCacheKey(text, bcp47, voiceName, speed, encoding);
    if (!options.bypassCache && this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)!;
      return {
        audioBuffer: cached.buffer,
        contentType: cached.contentType,
        cached: true,
        voice: cached.voice,
        language: cached.language,
        model: cached.model,
        provider: cached.provider,
        latencyMs: Date.now() - startTime
      };
    }

    const config = getGeminiConfig();
    const apiKey = config.apiKey;

    if (!apiKey) {
      // Deterministic offline fallback buffer for sandbox/test environments
      const offlineBuffer = this.generateOfflineWavBuffer();
      this.memoryCache.set(cacheKey, {
        buffer: offlineBuffer,
        contentType: 'audio/wav',
        voice: voiceName,
        language: bcp47,
        model: 'fallback-tone',
        provider: 'deterministic-fallback',
        timestamp: Date.now()
      });
      return {
        audioBuffer: offlineBuffer,
        contentType: 'audio/wav',
        cached: false,
        voice: voiceName,
        language: bcp47,
        model: 'fallback-tone',
        provider: 'deterministic-fallback',
        latencyMs: Date.now() - startTime
      };
    }

    const targetUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const payload = {
      input: {
        text
      },
      voice: {
        languageCode: bcp47,
        name: voiceName,
        ssmlGender: gender
      },
      audioConfig: {
        audioEncoding: encoding,
        speakingRate: speed,
        sampleRateHertz: options.sampleRate || (encoding === 'MP3' ? 24000 : 16000)
      }
    };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Google Cloud TTS error (${response.status}): ${errorText.slice(0, 250)}`);
      }

      const json = (await response.json()) as { audioContent?: string };
      if (!json.audioContent) {
        throw new Error('Google Cloud TTS returned empty audio payload.');
      }

      const audioBuffer = Buffer.from(json.audioContent, 'base64');
      const contentType = encoding === 'MP3' ? 'audio/mpeg' : encoding === 'OGG_OPUS' ? 'audio/ogg' : 'audio/wav';

      // Store in LRU cache
      if (this.memoryCache.size >= this.maxCacheEntries) {
        const oldestKey = this.memoryCache.keys().next().value;
        if (oldestKey) this.memoryCache.delete(oldestKey);
      }

      this.memoryCache.set(cacheKey, {
        buffer: audioBuffer,
        contentType,
        voice: voiceName,
        language: bcp47,
        model: modelType,
        provider: 'google-cloud-tts',
        timestamp: Date.now()
      });

      logInfo('Google Cloud TTS synthesized successfully', {
        language: bcp47,
        voice: voiceName,
        model: modelType,
        bytes: audioBuffer.length,
        latencyMs: Date.now() - startTime
      });

      return {
        audioBuffer,
        contentType,
        cached: false,
        voice: voiceName,
        language: bcp47,
        model: modelType,
        provider: 'google-cloud-tts',
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      clearTimeout(timeout);
      logError('Google Cloud TTS synthesis failed, generating graceful fallback tone', { error: err.message });

      const fallbackBuffer = this.generateOfflineWavBuffer();
      return {
        audioBuffer: fallbackBuffer,
        contentType: 'audio/wav',
        cached: false,
        voice: voiceName,
        language: bcp47,
        model: 'fallback-tone',
        provider: 'deterministic-fallback',
        latencyMs: Date.now() - startTime
      };
    }
  }
}

export const googleTtsService = new GoogleTtsService();
