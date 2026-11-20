import { SupportedLanguage, LanguageInfo, LanguageTranslation } from '../types';
import { enTranslation } from './en';
import { arTranslation } from './ar';
import { taTranslation } from './ta';
import { hiTranslation } from './hi';
import { teTranslation } from './te';
import { mlTranslation } from './ml';
import { knTranslation } from './kn';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English (India)',
    script: 'Latin',
    flag: '🇮🇳',
    bcp47: 'en-IN',
    sampleGreeting: 'Hello, I will guide you through your assessment.',
    repeatKeywords: ['repeat', 'again', 'say again', 'pardon'],
    helpKeywords: ['help', 'what to do', 'explain', 'how to']
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    flag: '🇮🇳',
    bcp47: 'ta-IN',
    speechAvailable: true,
    sampleGreeting: 'வணக்கம், நான் உங்களுக்கு வழிகாட்டுவேன்.',
    repeatKeywords: ['repeat', 'மறுபடியும்', 'மீண்டும் சொல்லுங்க', 'மீண்டும்', 'சொல்லுங்க'],
    helpKeywords: ['help', 'உதவி', 'என்ன செய்யணும்', 'விளக்குங்க']
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    flag: '🇮🇳',
    bcp47: 'hi-IN',
    sampleGreeting: 'नमस्ते, मैं मार्गदर्शन करूँगा।',
    repeatKeywords: ['repeat', 'दोहराएं', 'फिर से', 'फिर से बोलिए'],
    helpKeywords: ['help', 'मदद', 'क्या करना है', 'समझाएं']
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    flag: '🇮🇳',
    bcp47: 'te-IN',
    sampleGreeting: 'నమస్కారం, నేను మార్గదర్శిని.',
    repeatKeywords: ['repeat', 'మళ్ళీ చెప్పండి', 'మళ్ళీ', 'చెప్పండి'],
    helpKeywords: ['help', 'సహాయం', 'ఏం చేయాలి', 'సహాయము']
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    flag: '🇮🇳',
    bcp47: 'ml-IN',
    sampleGreeting: 'നമസ്കാരം, ഞാൻ സഹായിക്കാം.',
    repeatKeywords: ['repeat', 'വീണ്ടും പറയൂ', 'വീണ്ടും', 'പറയൂ'],
    helpKeywords: ['help', 'സഹായം', 'എന്താണ് ചെയ്യേണ്ടത്', 'സഹായിക്കൂ']
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    flag: '🇮🇳',
    bcp47: 'kn-IN',
    sampleGreeting: 'ನಮಸ್ಕಾರ, ನಾನು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ.',
    repeatKeywords: ['repeat', 'ಮತ್ತೆ ಹೇಳಿ', 'ಮತ್ತೆ', 'ಹೇಳಿ'],
    helpKeywords: ['help', 'ಸಹಾಯ', 'ಏನು ಮಾಡಬೇಕು', 'ವಿವರಿಸಿ']
  }
];

export const translations: Record<SupportedLanguage, LanguageTranslation> = {
  en: enTranslation,
  ar: arTranslation,
  ta: taTranslation,
  hi: hiTranslation,
  te: teTranslation,
  ml: mlTranslation,
  kn: knTranslation
};

export function getTranslation(lang: SupportedLanguage): LanguageTranslation {
  return translations[lang] || translations.en;
}

export function getLanguageInfo(lang: SupportedLanguage): LanguageInfo {
  return SUPPORTED_LANGUAGES.find(l => l.id === lang) || SUPPORTED_LANGUAGES[0];
}
