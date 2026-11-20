import { create } from 'zustand';
import { SupportedLanguage, LanguageInfo, LanguageTranslation } from './types';
import { SUPPORTED_LANGUAGES, getTranslation, getLanguageInfo } from './translations';

interface LanguageState {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  getTranslation: () => LanguageTranslation;
  getLanguageInfo: () => LanguageInfo;
}

const STORAGE_KEY = 'neulens_language';
const LEGACY_STORAGE_KEY = 'cognivision_kiosk_language';

/**
 * Keeps the document language and writing direction in sync with the language
 * the user is reading. Without this, a screen reader announces Arabic or the
 * Indian-language content with English pronunciation and layout rules, and
 * Arabic renders left-to-right.
 */
const applyDocumentLanguage = (lang: SupportedLanguage): void => {
  if (typeof document === 'undefined') return;
  const info = getLanguageInfo(lang);
  document.documentElement.lang = info.bcp47;
  document.documentElement.dir = info.dir ?? 'ltr';
  document.documentElement.dataset.nlSpeech = info.speechAvailable === false ? 'unavailable' : 'available';
};

const getInitialLanguage = (): SupportedLanguage => {
  try {
    // Carry over the preference saved before the platform rename.
    const saved = (localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY)) as SupportedLanguage;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.id === saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore storage errors in sandboxed environments
  }
  // New visitors start in English; Arabic and the Indian languages are one
  // explicit choice away, and the selection persists on this device.
  return 'en';
};

const initialLanguage = getInitialLanguage();
applyDocumentLanguage(initialLanguage);

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: initialLanguage,

  setLanguage: (lang: SupportedLanguage) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Ignore
    }
    applyDocumentLanguage(lang);
    set({ currentLanguage: lang });
  },

  getTranslation: () => {
    return getTranslation(get().currentLanguage);
  },

  getLanguageInfo: () => {
    return getLanguageInfo(get().currentLanguage);
  }
}));

export const LanguageManager = {
  getCurrentLanguage: () => useLanguageStore.getState().currentLanguage,
  setLanguage: (lang: SupportedLanguage) => useLanguageStore.getState().setLanguage(lang),
  getTranslation: () => useLanguageStore.getState().getTranslation(),
  getLanguageInfo: () => useLanguageStore.getState().getLanguageInfo(),
  getSupportedLanguages: () => SUPPORTED_LANGUAGES
};
