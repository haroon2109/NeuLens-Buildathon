import React, { useState } from 'react';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Globe, Sparkles , Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAssistantAvatarProps {
  currentStepIndex?: number;
  totalSteps?: number;
  onOpenLanguageModal?: () => void;
  compact?: boolean;
}

export const VoiceAssistantAvatar: React.FC<VoiceAssistantAvatarProps> = ({
  currentStepIndex = 1,
  totalSteps = 5,
  onOpenLanguageModal,
  compact = false
}) => {
  const {
    isSpeaking,
    isListening,
    isMuted,
    status,
    subtitles,
    repeatInstruction,
    provideSimplerExplanation,
    toggleMute
  } = useVoiceAssistantStore();

  const { currentLanguage, getLanguageInfo, getTranslation } = useLanguageStore();
  const t = getTranslation();
  const langInfo = getLanguageInfo();

  const [showSubtitleTooltip, setShowSubtitleTooltip] = useState(true);

  // Status visual mapping
  let statusText = t.assistant.calmStatus;
  let statusColor = 'text-health-blue-light';
  let badgeBg = 'bg-health-blue bg-opacity-15 border-health-blue border-opacity-30';

  if (status === 'transcribing') {
    statusText = 'Transcribing speech...';
    statusColor = 'text-amber-300';
    badgeBg = 'bg-amber-500 bg-opacity-20 border-amber-500 border-opacity-40';
  } else if (status === 'speaking' || isSpeaking) {
    statusText = t.assistant.speakingStatus;
    statusColor = 'text-health-teal';
    badgeBg = 'bg-health-teal bg-opacity-15 border-health-teal border-opacity-30';
  } else if (status === 'listening' || isListening) {
    statusText = t.assistant.listeningStatus;
    statusColor = 'text-health-purple-light';
    badgeBg = 'bg-health-purple bg-opacity-15 border-health-purple border-opacity-30';
  } else if (status === 'warning') {
    statusText = 'Guidance Alert';
    statusColor = 'text-orange-400';
    badgeBg = 'bg-orange-500 bg-opacity-15 border-orange-500 border-opacity-30';
  }

  return (
    <div className="w-full bg-health-gray-900 bg-opacity-60 backdrop-blur-md border border-white border-opacity-10 rounded-2xl p-3 sm:p-4 shadow-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Avatar & Live Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Animated Ring when speaking */}
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-health-blue to-health-teal shadow-[0_0_18px_rgba(52,199,89,0.4)]'
                  : isListening
                  ? 'bg-gradient-to-tr from-health-purple to-health-blue shadow-[0_0_18px_rgba(175,82,222,0.4)]'
                  : 'bg-health-gray-800 border border-white border-opacity-10'
              }`}
            >
              <Bot className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden="true" />
            </div>

            {/* Glowing active indicator dot */}
            <span
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-health-gray-950 ${
                isSpeaking
                  ? 'bg-health-teal animate-pulse'
                  : isListening
                  ? 'bg-health-purple animate-ping'
                  : 'bg-health-blue'
              }`}
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                {t.assistant.name}
                <Sparkles className="w-3.5 h-3.5 text-health-blue-light" />
              </h3>

              {/* Step indicator */}
              {totalSteps > 0 && (
                <span className="text-xs font-bold text-health-gray-400 bg-health-gray-950 px-2 py-0.5 rounded-md border border-health-gray-800">
                  {t.assistant.stepOf} {currentStepIndex}/{totalSteps}
                </span>
              )}
            </div>

            {/* Voice status pill + animated audio wave */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${badgeBg} ${statusColor}`}>
                {/* 3-bar animated soundwave */}
                <span className="flex items-end gap-0.5 h-2.5">
                  <span
                    className={`w-0.5 rounded-full bg-current ${
                      isSpeaking ? 'h-full animate-bounce' : 'h-1'
                    }`}
                  />
                  <span
                    className={`w-0.5 rounded-full bg-current ${
                      isSpeaking ? 'h-2/3 animate-bounce' : 'h-1.5'
                    }`}
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className={`w-0.5 rounded-full bg-current ${
                      isSpeaking ? 'h-full animate-bounce' : 'h-1'
                    }`}
                    style={{ animationDelay: '0.3s' }}
                  />
                </span>
                {statusText}
              </span>

              {/* Selected Language badge */}
              <button
                type="button"
                onClick={onOpenLanguageModal}
                className="text-xs font-medium text-health-gray-300 hover:text-white bg-health-gray-950 hover:bg-health-gray-800 border border-health-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                title="Change Language"
              >
                <span>{langInfo.flag}</span>
                <span>{langInfo.nativeName}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Accessibility & Elderly-Friendly Quick Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* 1. Repeat Instruction Button */}
          <button
            type="button"
            onClick={() => repeatInstruction()}
            className="px-3 py-2 bg-health-blue bg-opacity-20 hover:bg-opacity-35 text-health-blue-light hover:text-white border border-health-blue border-opacity-30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            aria-label={t.assistant.repeatBtn}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.assistant.repeatBtn}</span>
            <span className="sm:hidden">Repeat</span>
          </button>

          {/* 2. Help / Simpler Explanation Button */}
          <button
            type="button"
            onClick={() => provideSimplerExplanation()}
            className="px-3 py-2 bg-health-gray-800 hover:bg-health-gray-700 text-health-gray-200 hover:text-white border border-white border-opacity-10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            aria-label={t.assistant.helpBtn}
          >
            <HelpCircle className="w-3.5 h-3.5 text-health-teal" />
            <span className="hidden sm:inline">{t.assistant.helpBtn}</span>
            <span className="sm:hidden">Help</span>
          </button>

          {/* 3. Mute / Unmute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500 bg-opacity-20 border-red-500 border-opacity-30 text-red-400'
                : 'bg-health-gray-800 hover:bg-health-gray-700 border-white border-opacity-10 text-health-gray-300'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={t.assistant.volumeBtn}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-health-blue-light" />}
          </button>

          {/* 4. Language Selector Modal Trigger */}
          {onOpenLanguageModal && (
            <button
              type="button"
              onClick={onOpenLanguageModal}
              className="p-2 bg-health-gray-800 hover:bg-health-gray-700 border border-white border-opacity-10 text-health-gray-300 hover:text-white rounded-xl text-xs flex items-center justify-center transition-all"
              title="Change Language"
              aria-label={t.assistant.languageBtn}
            >
              <Globe className="w-4 h-4 text-health-purple-light" />
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Real-Time Speech Subtitles Bar */}
      {subtitles && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 pt-2.5 border-t border-white border-opacity-5 flex items-start gap-2 text-xs text-health-gray-300"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-health-teal bg-health-teal bg-opacity-10 px-1.5 py-0.5 rounded shrink-0 font-display">
              Spoken AI
            </span>
            <p className="italic leading-relaxed text-health-gray-200">
              "{subtitles}"
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
