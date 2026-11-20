import React, { useState, useEffect } from 'react';
import { ScreeningPage } from '../screening/ScreeningPage';
import { useAuthStore } from '../../store/authStore';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { useScreeningStore, type ScreeningStep } from '../../store/screeningStore';
import { 
  Volume2, 
  RotateCcw, 
  HelpCircle, 
  Type, 
  ShieldCheck, 
  User,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { InterruptedState } from '../../components/systemStates';
import { useScreeningCopy } from '../screening/screeningCopy';

export const PatientAssessmentPage: React.FC = () => {
  const { user } = useAuthStore();
  const copy = useScreeningCopy();
  const { repeatInstruction, provideSimplerExplanation, isSpeaking } = useVoiceAssistantStore();

  const SNAPSHOT_KEY = 'neulens:assessment-progress';
  const [interruptedSnapshot, setInterruptedSnapshot] = useState<{
    step: ScreeningStep;
    savedAt: string;
    patientId: string;
  } | null>(null);

  useEffect(() => {
    const current = useScreeningStore.getState().currentStep;
    if (current === 'language-select') {
      useScreeningStore.getState().setStep('intro');
    }
  }, []);

  const getStageLabel = (step: ScreeningStep) => {
    switch (step) {
      case 'language-select':
        return 'Language preference';
      case 'intro':
        return 'Introduction & consent review';
      case 'sensor-check':
        return 'Camera, microphone, and speaker check';
      case 'functional-assessment':
        return 'Daily function questions';
      case 'game1':
        return 'Eye movement activity';
      case 'game2':
        return 'Memory & pattern game';
      case 'game3':
        return 'Spoken sentence repeat';
      case 'game4':
        return 'Facial movement activity';
      case 'game5':
        return 'Number & attention path';
      case 'submitting':
        return 'Sending your results';
      case 'results':
        return 'Your results';
      default:
        return 'Activity';
    }
  };

  const handleResume = () => {
    if (interruptedSnapshot) {
      useScreeningStore.getState().setStep(interruptedSnapshot.step);
    }
    setInterruptedSnapshot(null);
    localStorage.removeItem(SNAPSHOT_KEY);
  };

  const handleRestart = () => {
    useScreeningStore.getState().resetSession();
    useScreeningStore.getState().setStep('intro');
    setInterruptedSnapshot(null);
    localStorage.removeItem(SNAPSHOT_KEY);
  };

  // Age-adaptation: font size scaling for seniors and low vision patients
  const [fontSizeScale, setFontSizeScale] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const fontClasses = {
    normal: 'text-base',
    large: 'text-lg [&_h1]:text-4xl [&_h2]:text-3xl [&_p]:text-lg [&_button]:text-base',
    xlarge: 'text-xl [&_h1]:text-5xl [&_h2]:text-4xl [&_p]:text-xl [&_button]:text-lg [&_button]:py-5'
  };

  const patientId = user?.patientId || '';

  const currentStep = useScreeningStore((state) => state.currentStep);

  // Persist a resume snapshot every time the player moves to another mid-session step.
  useEffect(() => {
    if (interruptedSnapshot) return; // never overwrite the paused snapshot while it is offered

    const endSteps: ScreeningStep[] = ['results', 'submitting', 'language-select'];
    if (endSteps.includes(currentStep)) {
      localStorage.removeItem(SNAPSHOT_KEY);
      setInterruptedSnapshot(null);
      return;
    }

    const snapshot = { step: currentStep, savedAt: new Date().toISOString(), patientId };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  }, [currentStep, patientId, interruptedSnapshot]);

  // Read the snapshot back on mount so the interrupted UI can render before the runner does.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { step: ScreeningStep; savedAt: string; patientId: string };
      if (parsed.patientId === patientId && useScreeningStore.getState().currentStep !== parsed.step) {
        setInterruptedSnapshot(parsed);
      }
    } catch {
      /* ignore corrupt snapshot */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patientName = user?.name || 'Valued Patient';

  return (
    <div className={`patient-portal min-h-screen bg-warm text-ink flex flex-col justify-between transition-all ${fontClasses[fontSizeScale]}`}>
      
      {/* Top Accessibility Support Header */}
      <header className="bg-white border-b border-line sticky top-0 z-40 shadow-card">
        <div className="max-w-5xl mx-auto px-6 h-[72px] flex items-center justify-between gap-3">
          
          {/* Active Patient Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-mint text-forest flex items-center justify-center">
              <User className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-ink block leading-tight truncate">
                {patientName}
              </span>
              <span className="mt-0.5 inline-block font-mono text-[13px] font-semibold text-forest bg-mint border border-sage/50 px-2 py-0.5 rounded-md">
                {patientId}
              </span>
            </div>
          </div>

          {/* Age-Adaptive Accessibility Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Font Size Accessibility Toggle */}
            <div className="hidden sm:flex items-center bg-warm p-1 rounded-lg border border-line text-xs font-semibold text-body">
              <span className="px-2 text-[12px] uppercase tracking-[0.12em] text-sage-deep flex items-center gap-1">
                <Type className="w-3 h-3" />
                {copy.chrome.textLabel}
              </span>
              <button
                type="button"
                onClick={() => setFontSizeScale('normal')}
                className={`px-2.5 py-1 rounded-lg transition-all ${fontSizeScale === 'normal' ? 'bg-white shadow-card text-forest font-semibold' : 'hover:text-ink'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeScale('large')}
                className={`px-2.5 py-1 rounded-lg transition-all ${fontSizeScale === 'large' ? 'bg-white shadow-card text-forest font-semibold' : 'hover:text-ink'}`}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSizeScale('xlarge')}
                className={`px-2.5 py-1 rounded-lg transition-all ${fontSizeScale === 'xlarge' ? 'bg-white shadow-card text-forest font-semibold' : 'hover:text-ink'}`}
              >
                A++
              </button>
            </div>

            {/* Repeat Instruction Button */}
            <button
              type="button"
              onClick={() => repeatInstruction()}
              className="px-3 py-2 bg-mint hover:bg-mint/70 border border-sage/60 rounded-xl text-xs font-semibold text-forest flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copy.chrome.repeatGuidance}</span>
              <span className="sm:hidden">{copy.chrome.repeatShort}</span>
            </button>

            {/* Simpler Explanation / Help Button */}
            <button
              type="button"
              onClick={() => provideSimplerExplanation()}
              className="px-3 py-2 bg-warm hover:bg-white border border-line rounded-xl text-xs font-semibold text-body flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sage-deep" />
              <span className="hidden sm:inline">{copy.chrome.help}</span>
            </button>

          </div>

        </div>
      </header>

      {/* Main Assessment Container */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
        {interruptedSnapshot ? (
          <InterruptedState
            stageLabel={getStageLabel(interruptedSnapshot.step)}
            savedAt={new Date(interruptedSnapshot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            onResume={handleResume}
            onRestart={handleRestart}
          />
        ) : (
          <ScreeningPage patientMode={true} />
        )}
      </main>

      {/* Discrete Portal Footer */}
      <footer className="border-t border-line py-4 bg-white/70 text-center text-xs text-muted">
        {copy.chrome.footer}
      </footer>

    </div>
  );
};
