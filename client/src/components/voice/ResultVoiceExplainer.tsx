import React, { useEffect } from 'react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { ShieldAlert, Volume2, RotateCcw, CheckCircle, ArrowRight, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultVoiceExplainerProps {
  compositeScore: number;
  onRetake?: () => void;
  onOpenLanguageModal?: () => void;
}

export const ResultVoiceExplainer: React.FC<ResultVoiceExplainerProps> = ({
  compositeScore,
  onRetake,
  onOpenLanguageModal
}) => {
  const { getTranslation, getLanguageInfo } = useLanguageStore();
  const { speak, stopSpeaking, isSpeaking } = useVoiceAssistantStore();
  const t = getTranslation();
  const langInfo = getLanguageInfo();

  let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  let spokenText = t.results.lowRiskExplanation;

  if (compositeScore < 60) {
    riskCategory = 'HIGH';
    spokenText = t.results.highRiskExplanation;
  } else if (compositeScore < 80) {
    riskCategory = 'MODERATE';
    spokenText = t.results.moderateRiskExplanation;
  }

  const fullSpokenExplanation = `${t.results.spokenComplete} ${spokenText} ${t.results.disclaimerText}. ${
    riskCategory === 'LOW' ? t.results.nextStepsNormal : t.results.nextStepsFollowup
  }`;

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(fullSpokenExplanation);
    }, 700);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [compositeScore]);

  const handleReplay = () => {
    speak(fullSpokenExplanation);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-health-gray-900 bg-opacity-70 border border-white border-opacity-10 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-health-blue bg-opacity-5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner with AI Voice Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white border-opacity-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-health-blue bg-opacity-20 flex items-center justify-center text-health-blue-light shadow-md">
            <HeartPulse className="w-5 h-5 text-health-teal" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              {t.results.completedHeader}
            </h3>
            <p className="text-xs text-health-gray-400">
              Spoken outcome explanation in {langInfo.nativeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            className="btn-glass text-xs py-2 px-3 text-health-blue-light flex items-center gap-1.5"
            title="Listen to Explanation Again"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-health-teal' : ''}`} />
            <span>Listen Again</span>
          </button>

          {onOpenLanguageModal && (
            <button
              type="button"
              onClick={onOpenLanguageModal}
              className="btn-glass text-xs py-2 px-3 text-health-gray-300 flex items-center gap-1"
            >
              <span>{langInfo.flag}</span>
              <span>{langInfo.nativeName}</span>
            </button>
          )}
        </div>
      </div>

      {/* Spoken Explanation Text Card */}
      <div className="p-4 bg-health-gray-950 rounded-2xl border border-white border-opacity-5 space-y-2">
        <span className="text-xs uppercase tracking-wider font-bold text-health-teal flex items-center gap-1.5 font-display">
          <Volume2 className="w-3.5 h-3.5" /> Spoken Assessment Outcome
        </span>
        <p className="text-sm font-medium text-health-gray-200 leading-relaxed italic">
          "{spokenText}"
        </p>
      </div>

      {/* Strict Medical Disclaimer Notice: "Screening result ≠ Medical diagnosis" */}
      <div className="p-4 bg-orange-950 bg-opacity-20 border border-orange-500 border-opacity-30 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-left">
          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            {t.results.disclaimerText}
          </h4>
          <p className="text-xs text-health-gray-300 leading-relaxed">
            {t.results.disclaimerNotice}
          </p>
        </div>
      </div>

      {/* Spoken Next Steps */}
      <div className="text-xs text-health-gray-400 text-left pt-1">
        <strong className="text-white block mb-0.5">Recommended Next Steps:</strong>
        <span>
          {riskCategory === 'LOW' ? t.results.nextStepsNormal : t.results.nextStepsFollowup}
        </span>
      </div>
    </motion.div>
  );
};
