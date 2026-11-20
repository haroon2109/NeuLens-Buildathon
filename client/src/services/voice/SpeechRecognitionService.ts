/**
 * Speech Recognition Service
 *
 * 1. Verbal Assessment Transcription: Gnani AI Prisma v2.5 / v3 REST via secure backend (/api/v1/voice/transcribe)
 * 2. Hands-Free Ambient Voice Navigation: Web Speech API continuous recognition for keywords ('repeat', 'help')
 */

import { SupportedLanguage } from '../language/types';
import { ISpeechRecognitionService } from './types';
import { getLanguageInfo } from '../language/translations';
import { gnaniVoiceApi } from './gnaniVoiceApi';

type WindowWithSpeech = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

class SpeechRecognitionServiceImpl implements ISpeechRecognitionService {
  private recognition: any = null;
  private listening: boolean = false;
  private currentLanguage: SupportedLanguage = 'en';
  private transcribing: boolean = false;
  private onResultCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private autoRestart: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const windowObj = window as unknown as WindowWithSpeech;
      const SpeechRecognitionClass = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          this.recognition = new SpeechRecognitionClass();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 3;
          this.setupListeners();
        } catch (e) {
          console.warn('[SpeechRecognition] Init error:', e);
        }
      }
    }
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        // Prefer an alternative that sounds like the wake word, since the
        // default top alternative often drops or mangles "NeuLens".
        let chosen = result[0]?.transcript || '';
        if (result.isFinal && result.length > 1) {
          const wakey = (text: string) =>
            /neu|lens|nulens|assistant|niu|نيو|نيول/i.test(text);
          for (let j = 0; j < result.length; j += 1) {
            if (wakey(result[j].transcript)) {
              chosen = result[j].transcript;
              break;
            }
          }
        }

        if (result.isFinal) {
          finalTranscript += chosen;
        } else {
          interimTranscript += chosen;
        }
      }

      if (finalTranscript.trim()) {
        this.onResultCallback?.(finalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        this.onResultCallback?.(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('[SpeechRecognition] Event error:', event.error);
        this.onErrorCallback?.(event);
      }
      if (event.error === 'not-allowed') {
        this.autoRestart = false;
        this.listening = false;
      }
    };

    this.recognition.onend = () => {
      if (this.listening && this.autoRestart) {
        try {
          this.recognition.start();
        } catch (e) {
          setTimeout(() => {
            if (this.listening && this.autoRestart) {
              try { this.recognition.start(); } catch (err) {}
            }
          }, 300);
        }
      } else {
        this.listening = false;
      }
    };
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isListening(): boolean {
    return this.listening;
  }

  /**
   * Continuous keyword listening for hands-free navigation (repeat, help)
   */
  public startListening(
    lang: SupportedLanguage,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (err: any) => void
  ): boolean {
    if (!this.recognition) return false;

    this.currentLanguage = lang;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.autoRestart = true;

    const langInfo = getLanguageInfo(lang);
    this.recognition.lang = langInfo.bcp47;

    if (!this.listening) {
      try {
        this.recognition.start();
        this.listening = true;
        return true;
      } catch (err: any) {
        if (err.name === 'InvalidStateError') {
          this.listening = true;
          return true;
        }
        console.warn('[SpeechRecognition] Start error:', err);
        return false;
      }
    }
    return true;
  }

  public stopListening(): void {
    this.autoRestart = false;
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  /**
   * Transcribe recorded audio clip using Gnani Prisma v2.5 / v3 REST API
   */
  public async transcribeClip(
    audioBlob: Blob,
    lang: SupportedLanguage
  ): Promise<{ success: boolean; transcript: string; error?: string }> {      this.transcribing = true;
    try {
      const res = await gnaniVoiceApi.transcribeAudio(audioBlob, lang);
      if (res.success) {
        return {
          success: true,
          transcript: res.transcript
        };
      }
      return {
        success: false,
        transcript: '',
        error: res.error || 'Transcription failed'
      };
    } catch (err: any) {
      console.warn('[SpeechRecognitionService]: Transcription exception:', err);
      return {
        success: false,
        transcript: '',
        error: err.message || 'Service exception'
      };
    } finally {
      this.transcribing = false;
    }
  }

  /**
   * Whether STT is currently in flight. The TTS service uses this to
   * defer/announce task-completion speech so it never overlaps a live
   * transcription request.
   */
  public isTranscribing(): boolean {
    return this.transcribing;
  }

  /**
   * Check if spoken phrase matches repeat or help keywords in the given language
   */
  public static checkKeywords(transcript: string, lang: SupportedLanguage): 'repeat' | 'help' | null {
    const text = transcript.toLowerCase();
    const langInfo = getLanguageInfo(lang);

    for (const kw of langInfo.repeatKeywords) {
      if (text.includes(kw.toLowerCase())) {
        return 'repeat';
      }
    }

    for (const kw of langInfo.helpKeywords) {
      if (text.includes(kw.toLowerCase())) {
        return 'help';
      }
    }

    return null;
  }
}

export const SpeechRecognitionService = new SpeechRecognitionServiceImpl();
