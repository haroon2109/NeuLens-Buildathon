import React, { useEffect } from 'react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { SUPPORTED_LANGUAGES } from '../../services/language/translations';
import { SupportedLanguage } from '../../services/language/types';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { Globe, Check, Volume2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ElderlyLanguageSelectorProps {
  onConfirm: () => void;
}

export const ElderlyLanguageSelector: React.FC<ElderlyLanguageSelectorProps> = ({ onConfirm }) => {
  const { currentLanguage, setLanguage, getTranslation } = useLanguageStore();
  const { speak, stopSpeaking } = useVoiceAssistantStore();
  const t = getTranslation();

  // Spoken welcome on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(t.welcome.spokenWelcome);
    }, 600);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, []);

  const handleSelectLanguage = (langId: SupportedLanguage) => {
    setLanguage(langId);
    const newTranslation = useLanguageStore.getState().getTranslation();
    speak(newTranslation.welcome.spokenWelcome);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass-card p-6 sm:p-10 space-y-8 max-w-4xl mx-auto text-center relative overflow-hidden"
    >
      {/* Decorative ambient backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-health-blue bg-opacity-10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with warm welcoming branding */}
      <div className="space-y-3 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-health-blue bg-opacity-20 border-2 border-health-blue border-opacity-40 flex items-center justify-center mx-auto shadow-healthRing animate-float">
          <Globe className="w-8 h-8 text-health-blue-light" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
          {t.welcome.chooseLanguageTitle}
        </h1>
        <p className="text-sm sm:text-base text-health-gray-400 max-w-lg mx-auto leading-relaxed">
          {t.welcome.chooseLanguageSubtitle}
        </p>
      </div>

      {/* Large Grid of 6 Languages - High Contrast, Large Touch targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10 text-left">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => handleSelectLanguage(lang.id)}
              className={`p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[110px] relative overflow-hidden group active:scale-[0.98] ${
                isSelected
                  ? 'bg-health-blue bg-opacity-20 border-health-blue shadow-[0_0_24px_rgba(0,122,255,0.35)]'
                  : 'bg-health-gray-950 bg-opacity-80 border-white border-opacity-10 hover:border-health-blue hover:border-opacity-40 hover:bg-health-gray-900'
              }`}
            >
              {/* Top Row: Flag & Selection Checkmark */}
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-health-blue flex items-center justify-center text-white shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <Volume2 className="w-4 h-4 text-health-gray-600 group-hover:text-health-blue-light transition-colors" />
                  )}
                </div>
              </div>

              {/* Native Script Title (Primary Large Text) */}
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-bold font-display text-white block leading-tight">
                  {lang.nativeName}
                </span>
                <span className="text-xs text-health-gray-400 font-medium block mt-0.5">
                  {lang.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spoken greeting audio prompt note */}
      <div className="p-4 bg-health-gray-950 bg-opacity-90 rounded-2xl border border-white border-opacity-5 flex items-center justify-center gap-3 text-xs text-health-gray-300 relative z-10 max-w-xl mx-auto">
        <Volume2 className="w-4 h-4 text-health-teal shrink-0 animate-pulse" />
        <span className="italic leading-normal">
          "{t.welcome.spokenWelcome}"
        </span>
      </div>

      {/* Big Touch-Friendly Proceed Button */}
      <div className="pt-2 relative z-10">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onConfirm();
          }}
          className="btn-primary w-full py-5 text-base sm:text-lg font-bold tracking-wide rounded-2xl flex items-center justify-center gap-3 shadow-healthRing hover:shadow-glass hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <span>{t.welcome.startAssessmentBtn}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
