import React from 'react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { SUPPORTED_LANGUAGES } from '../../services/language/translations';
import { SupportedLanguage } from '../../services/language/types';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { Globe, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, setLanguage, getTranslation } = useLanguageStore();
  const { speak } = useVoiceAssistantStore();
  const t = getTranslation();

  if (!isOpen) return null;

  const handleSelect = (langId: SupportedLanguage) => {
    setLanguage(langId);
    const newTrans = useLanguageStore.getState().getTranslation();
    speak(newTrans.welcome.spokenWelcome);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-health-gray-900 border border-white border-opacity-15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white border-opacity-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-health-blue bg-opacity-20 flex items-center justify-center text-health-blue-light">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {t.welcome.chooseLanguageTitle}
                </h3>
                <p className="text-xs text-health-gray-400">
                  Select your preferred language
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-health-gray-400 hover:text-white hover:bg-health-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Languages Grid */}
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleSelect(lang.id)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-health-blue bg-opacity-20 border-health-blue text-white shadow-md'
                      : 'bg-health-gray-950 border-white border-opacity-10 hover:border-health-blue hover:border-opacity-40 text-health-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <span className="text-base font-bold block">{lang.nativeName}</span>
                      <span className="text-xs text-health-gray-400 block">{lang.name}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-health-blue flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-health-gray-500 pt-2">
            Spoken guidance and screen text will update immediately.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
