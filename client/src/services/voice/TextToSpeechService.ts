/**
 * Gnani AI Timbre v2.5 Text-to-Speech Service
 *
 * Dedicated speech engine powered exclusively by Gnani AI Timbre v2.5
 * via the secure backend (/api/v1/voice/synthesize).
 *
 * NOTE: Browser Web Speech API failover has been completely removed to prevent
 * voice overlap and maintain pristine clinical vocal quality.
 */

import { SupportedLanguage } from '../language/types';
import { getLanguageInfo } from '../language/translations';
import { ITextToSpeechService, TTSOptions } from './types';
import { gnaniVoiceApi } from './gnaniVoiceApi';
import { SpeechRecognitionService } from './SpeechRecognitionService';

class GnaniTTSService implements ITextToSpeechService {
  // HTML Audio state for Gnani Timbre playback
  private currentAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private currentAbortController: AbortController | null = null;

  // Session ID to cancel stale or in-flight requests and prevent overlapping speech
  private activeSessionId: number = 0;

  // General state
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private isAudioPlaying: boolean = false;
  private isSynthesizing: boolean = false;
  private gnaniStatusKnown: boolean | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined';
  }

  public async isGnaniActive(): Promise<boolean> {
    if (this.gnaniStatusKnown !== null) {
      return this.gnaniStatusKnown;
    }
    const health = await gnaniVoiceApi.getHealth();
    this.gnaniStatusKnown = health.configured;
    return health.configured;
  }

  public isSpeaking(): boolean {
    return this.isAudioPlaying || this.isSynthesizing;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.isMuted = this.volume === 0;

    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Immediately abort any in-flight Gnani synthesis request and stop active audio playback.
   */
  public stop(): void {
    // 1. Invalidate any in-flight synthesis or pending playback session
    this.activeSessionId++;

    // 2. Abort active network request to Gnani backend
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch (e) {
        // Ignore abort errors
      }
      this.currentAbortController = null;
    }

    // 3. Stop and tear down current HTML Audio element
    if (this.currentAudio) {
      this.currentAudio.onplay = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }

    // 4. Revoke active object URL to free memory
    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch (e) {
        // Ignore revocation errors
      }
      this.currentObjectUrl = null;
    }

    this.isAudioPlaying = false;
    this.isSynthesizing = false;
  }

  public pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  public resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    }
  }

  /**
   * Main speech entrypoint.
   * Synthesizes and plays spoken audio exclusively via Gnani AI Timbre v2.5.
   * Any previous speech is immediately aborted to eliminate voice collisions.
   */
  public async speak(text: string, lang: SupportedLanguage, options: TTSOptions = {}): Promise<void> {
    if (this.isMuted || this.volume <= 0 || !text || text.trim() === '') {
      return;
    }

    // While the portal is transcribing the patient's recording, defer the
    // task-completion greeting so it never overlaps the Gnani STT request.
    if (SpeechRecognitionService.isTranscribing()) {
      return;
    }

    // The configured speech provider has no reviewed voice for this language.
    // Do not send the text through a different-language voice: the on-screen
    // instructions remain available and the caller is told speech is pending.
    if (getLanguageInfo(lang).speechAvailable === false) {
      options.onError?.(new Error('Spoken instructions are not yet available in this language. On-screen text is shown instead.'));
      return;
    }

    // Interrupt and abort any prior speech or in-flight synthesis request
    if (options.interrupt !== false) {
      this.stop();
    }

    const sessionId = ++this.activeSessionId;
    const controller = new AbortController();
    this.currentAbortController = controller;
    this.isSynthesizing = true;

    try {
      const audioBlob = await gnaniVoiceApi.synthesizeSpeech(
        text,
        lang,
        options.voice,
        options.rate || 0.95,
        controller.signal
      );

      // If a newer speak() call or stop() was issued while fetching, drop this audio immediately
      if (sessionId !== this.activeSessionId || controller.signal.aborted) {
        return;
      }

      this.isSynthesizing = false;

      if (!audioBlob || audioBlob.size === 0) {
        console.warn('[GnaniTTSService]: Synthesis returned empty audio blob.');
        options.onError?.(new Error('Gnani speech synthesis returned empty audio.'));
        return;
      }

      await this.playGnaniAudio(audioBlob, sessionId, options);
    } catch (err: any) {
      if (sessionId === this.activeSessionId) {
        this.isSynthesizing = false;
        if (err.name !== 'AbortError') {
          console.warn('[GnaniTTSService]: Gnani synthesis failed:', err);
          options.onError?.(err);
        }
      }
    }
  }

  /**
   * Play Gnani audio Blob via HTMLAudioElement with strict session concurrency guards
   */
  private playGnaniAudio(blob: Blob, sessionId: number, options: TTSOptions): Promise<void> {
    return new Promise((resolve) => {
      // Validate session hasn't been superseded
      if (sessionId !== this.activeSessionId) {
        resolve();
        return;
      }

      const url = URL.createObjectURL(blob);
      this.currentObjectUrl = url;

      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.volume = options.volume !== undefined ? options.volume : this.volume;

      const cleanup = () => {
        this.isAudioPlaying = false;
        audio.onplay = null;
        audio.onended = null;
        audio.onerror = null;
        // Detach the source before revoking: revoking a blob URL that the
        // element is still loading makes the browser log a spurious
        // net::ERR_FILE_NOT_FOUND for the media request.
        try {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch (e) {}
        if (this.currentObjectUrl === url) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {}
          this.currentObjectUrl = null;
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      audio.onplay = () => {
        if (sessionId !== this.activeSessionId) {
          audio.pause();
          cleanup();
          resolve();
          return;
        }
        this.isAudioPlaying = true;
        options.onStart?.();
      };

      audio.onended = () => {
        cleanup();
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        console.warn('[GnaniTTSService]: Audio playback error:', e);
        cleanup();
        options.onError?.(e);
        resolve();
      };

      audio.play().catch((err) => {
        // Autoplay policy or interruption
        cleanup();
        resolve();
      });
    });
  }
}

export const TextToSpeechService = new GnaniTTSService();
