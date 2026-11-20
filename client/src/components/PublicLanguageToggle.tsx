import React from 'react';
import { useLanguageStore } from '../services/language/LanguageManager';
import type { SupportedLanguage } from '../services/language/types';

const NAMES: Record<string, string> = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  ml: 'മലയാളം',
  kn: 'ಕನ್ನಡ',
};

/**
 * Multilingual language switch for the public site.
 * Prioritizes Indian languages: English, Tamil, Hindi, Telugu, Malayalam, Kannada.
 */
export const PublicLanguageToggle: React.FC<{
  tone?: 'light' | 'dark';
  className?: string;
}> = ({ tone = 'light', className = '' }) => {
  const { currentLanguage, setLanguage } = useLanguageStore();

  return (
    <div
      role="group"
      aria-label="Site language"
      className={`inline-flex flex-wrap items-center gap-0.5 rounded-full border p-0.5 ${
        tone === 'dark' ? 'border-white/25' : 'border-nl-line bg-white'
      } ${className}`}
    >
      {(['en', 'ta', 'hi', 'te', 'ml', 'kn'] as const).map((lang) => {
        const active = currentLanguage === lang;
        return (
          <button
            key={lang}
            type="button"
            lang={lang}
            aria-pressed={active}
            onClick={() => setLanguage(lang as SupportedLanguage)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? tone === 'dark'
                  ? 'bg-white text-nl-forest-deep'
                  : 'bg-nl-mint text-nl-forest'
                : tone === 'dark'
                  ? 'text-white/75 hover:text-white'
                  : 'text-nl-muted hover:text-nl-forest'
            }`}
          >
            {NAMES[lang]}
          </button>
        );
      })}
    </div>
  );
};

export default PublicLanguageToggle;
