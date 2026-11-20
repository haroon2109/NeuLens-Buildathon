/**
 * Gnani AI Speech Integration Types
 * Neulens
 */

export type SupportedLanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn' | 'ar';

export const GNANI_ARABIC_LANGUAGE_CODE: SupportedLanguageCode = 'ar';

export interface LanguageVoiceMapping {
  languageCode: SupportedLanguageCode;
  bcp47: string;
  languageName: string;
  defaultVoice: string;
  availableVoices: string[];
}

export const GNANI_LANGUAGE_CATALOG: Record<SupportedLanguageCode, LanguageVoiceMapping> = {
  en: {
    languageCode: 'en',
    bcp47: 'en-IN',
    languageName: 'English (Indian)',
    defaultVoice: 'Kaveri',
    availableVoices: ['Kaveri', 'Yashvi', 'Arjun']
  },
  ta: {
    languageCode: 'ta',
    bcp47: 'ta-IN',
    languageName: 'Tamil',
    defaultVoice: 'Asmita',
    availableVoices: ['Asmita', 'Trisha', 'Brinda', 'Vedika', 'Noopur']
  },
  hi: {
    languageCode: 'hi',
    bcp47: 'hi-IN',
    languageName: 'Hindi',
    defaultVoice: 'Nalini',
    availableVoices: ['Nalini', 'Deepak', 'Poorvi']
  },
  te: {
    languageCode: 'te',
    bcp47: 'te-IN',
    languageName: 'Telugu',
    defaultVoice: 'Suhana',
    availableVoices: ['Suhana', 'Lehara', 'Lavanya', 'Yukti', 'Varuni']
  },
  kn: {
    languageCode: 'kn',
    bcp47: 'kn-IN',
    languageName: 'Kannada',
    defaultVoice: 'Saanvi',
    availableVoices: ['Saanvi', 'Kavin']
  },
  ml: {
    languageCode: 'ml',
    bcp47: 'ml-IN',
    languageName: 'Malayalam',
    defaultVoice: 'Reshma',
    availableVoices: ['Reshma', 'Riyaan']
  },
  ar: {
    languageCode: 'ar',
    bcp47: 'ar-AE',
    languageName: 'Arabic (UAE)',
    defaultVoice: 'Zahira',
    availableVoices: ['Zahira', 'Zayan']
  }
};

export interface GnaniSttOptions {
  languageCode: string;
  preferredLanguage?: string;
  itnNativeNumerals?: boolean;
  format?: 'transcribe' | 'detailed';
}

export interface GnaniSttResult {
  success: boolean;
  transcript: string;
  language: string;
  requestId?: string;
  confidence?: number;
  durationSeconds?: number;
  latencyMs?: number;
  error?: string;
}

export interface GnaniTtsOptions {
  text: string;
  language: SupportedLanguageCode | string;
  voice?: string;
  speed?: number;
  sampleRate?: number;
  bypassCache?: boolean;
}

export interface GnaniTtsResult {
  audioBuffer: Buffer;
  contentType: string;
  cached: boolean;
  voice: string;
  language: string;
  latencyMs: number;
}

export interface GnaniServiceHealth {
  status: 'ok' | 'degraded' | 'unconfigured';
  apiKeyConfigured: boolean;
  baseUrl: string;
  stt: {
    model: string;
    endpoint: string;
    supportedLanguages: SupportedLanguageCode[];
  };
  tts: {
    model: string;
    endpoint: string;
    supportedLanguages: SupportedLanguageCode[];
    cacheSize: number;
  };
  evon: {
    model: string;
    available: boolean;
    reason: string;
  };
}
