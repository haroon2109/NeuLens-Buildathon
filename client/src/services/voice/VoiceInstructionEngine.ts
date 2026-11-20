import { create } from 'zustand';
import { SupportedLanguage } from '../language/types';
import { useLanguageStore } from '../language/LanguageManager';
import { TextToSpeechService } from './TextToSpeechService';
import { SpeechRecognitionService } from './SpeechRecognitionService';
import { AssistantVisualStatus, ScreenInstructionState, TTSOptions } from './types';

interface VoiceAssistantState {
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
  volume: number;
  status: AssistantVisualStatus;
  lastSpokenText: string;
  subtitles: string;
  currentInstructionBanner: ScreenInstructionState | null;
  lastCueTime: Record<string, number>;
  isGnaniEngine: boolean;

  // Actions
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stopSpeaking: () => void;
  repeatInstruction: () => Promise<void>;
  provideSimplerExplanation: () => Promise<void>;
  triggerContextCue: (cue: 'face_not_centered' | 'look_at_screen' | 'speak_louder' | 'inactivity_repeat' | 'takeYourTime') => Promise<void>;
  setInstructionBanner: (banner: ScreenInstructionState | null) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  startVoiceControl: () => void;
  stopVoiceControl: () => void;
  setStatus: (status: AssistantVisualStatus) => void;
  transcribeClip: (audioBlob: Blob) => Promise<{ success: boolean; transcript: string; error?: string }>;
  checkGnaniStatus: () => Promise<boolean>;
}

export const useVoiceAssistantStore = create<VoiceAssistantState>((set, get) => ({
  isSpeaking: false,
  isListening: false,
  isMuted: false,
  volume: 1.0,
  status: 'idle',
  lastSpokenText: '',
  subtitles: '',
  currentInstructionBanner: null,
  lastCueTime: {},
  isGnaniEngine: true,

  setStatus: (status) => set({ status }),

  checkGnaniStatus: async () => {
    const active = await TextToSpeechService.isGnaniActive();
    set({ isGnaniEngine: active });
    return active;
  },

  setVolume: (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    TextToSpeechService.setVolume(clamped);
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      const restore = volume > 0 ? volume : 1.0;
      TextToSpeechService.setVolume(restore);
      set({ isMuted: false, volume: restore });
    } else {
      TextToSpeechService.setVolume(0);
      set({ isMuted: true });
    }
  },

  setInstructionBanner: (banner) => set({ currentInstructionBanner: banner }),

  speak: async (text: string, options: TTSOptions = {}) => {
    const { isMuted } = get();
    const currentLang = useLanguageStore.getState().currentLanguage;

    if (!text || text.trim() === '') return;

    set({
      isSpeaking: true,
      status: 'speaking',
      lastSpokenText: text,
      subtitles: text
    });

    if (isMuted) {
      // If muted, briefly simulate reading time for screen synchronization
      const wordCount = text.split(/\s+/).length;
      const readingMs = Math.max(2000, Math.min(6000, wordCount * 300));
      await new Promise(r => setTimeout(r, readingMs));
      set({ isSpeaking: false, status: get().isListening ? 'listening' : 'idle' });
      return;
    }

    try {
      await TextToSpeechService.speak(text, currentLang, {
        ...options,
        onStart: () => {
          set({ isSpeaking: true, status: 'speaking' });
          options.onStart?.();
        },
        onEnd: () => {
          set({ isSpeaking: false, status: get().isListening ? 'listening' : 'idle' });
          options.onEnd?.();
        },
        onError: (err) => {
          set({ isSpeaking: false, status: get().isListening ? 'listening' : 'idle' });
          options.onError?.(err);
        }
      });
    } catch (err) {
      set({ isSpeaking: false, status: get().isListening ? 'listening' : 'idle' });
    }
  },

  stopSpeaking: () => {
    TextToSpeechService.stop();
    set({ isSpeaking: false, status: get().isListening ? 'listening' : 'idle' });
  },

  transcribeClip: async (audioBlob: Blob) => {
    const lang = useLanguageStore.getState().currentLanguage;
    set({ status: 'transcribing' });
    try {
      const result = await SpeechRecognitionService.transcribeClip(audioBlob, lang);
      set({ status: get().isSpeaking ? 'speaking' : get().isListening ? 'listening' : 'idle' });
      return result;
    } catch (err: any) {
      set({ status: 'idle' });
      return { success: false, transcript: '', error: err.message };
    }
  },

  repeatInstruction: async () => {
    const { lastSpokenText, currentInstructionBanner, speak } = get();
    const t = useLanguageStore.getState().getTranslation();

    if (currentInstructionBanner && currentInstructionBanner.whatToDo) {
      const repeatPhrase = `${currentInstructionBanner.heading}. ${currentInstructionBanner.whatToDo}`;
      await speak(repeatPhrase);
    } else if (lastSpokenText) {
      await speak(lastSpokenText);
    } else {
      await speak(t.contextual.takeYourTime);
    }
  },

  provideSimplerExplanation: async () => {
    const { currentInstructionBanner, speak } = get();
    const t = useLanguageStore.getState().getTranslation();

    if (currentInstructionBanner && currentInstructionBanner.whatToDo) {
      const simple = `${t.contextual.simplerHelp} ${currentInstructionBanner.subtitle}`;
      await speak(simple);
    } else {
      await speak(t.contextual.takeYourTime);
    }
  },

  triggerContextCue: async (cueType) => {
    const { lastCueTime, speak, isSpeaking } = get();
    // Throttle cues: minimum 12 seconds between the exact same cue, and never while speaking or synthesizing
    const now = Date.now();
    const lastTime = lastCueTime[cueType] || 0;
    if (now - lastTime < 12000 || isSpeaking || TextToSpeechService.isSpeaking()) {
      return;
    }

    set((state) => ({
      lastCueTime: { ...state.lastCueTime, [cueType]: now }
    }));

    const t = useLanguageStore.getState().getTranslation();
    let cueText = '';

    switch (cueType) {
      case 'face_not_centered':
        cueText = t.contextual.faceNotCentered;
        break;
      case 'look_at_screen':
        cueText = t.contextual.lookAtScreen;
        break;
      case 'speak_louder':
        cueText = t.contextual.speakLouder;
        break;
      case 'inactivity_repeat':
      case 'takeYourTime':
        cueText = t.contextual.takeYourTime;
        break;
    }

    if (cueText) {
      set({ status: 'warning' });
      await speak(cueText, { rate: 0.95 });
    }
  },

  startVoiceControl: () => {
    const lang = useLanguageStore.getState().currentLanguage;
    const started = SpeechRecognitionService.startListening(
      lang,
      (transcript) => {
        if (!transcript) return;
        const recognizedCmd = (SpeechRecognitionService.constructor as any).checkKeywords
          ? (SpeechRecognitionService.constructor as any).checkKeywords(transcript, lang)
          : null;

        if (recognizedCmd === 'repeat') {
          get().repeatInstruction();
        } else if (recognizedCmd === 'help') {
          get().provideSimplerExplanation();
        }
      },
      (err) => {
        console.log('[VoiceAssistant] Speech recognition event:', err);
      }
    );
    set({ isListening: started, status: started ? 'listening' : 'idle' });
  },

  stopVoiceControl: () => {
    SpeechRecognitionService.stopListening();
    set({ isListening: false, status: get().isSpeaking ? 'speaking' : 'idle' });
  }
}));

export const VoiceInstructionEngine = {
  speak: (text: string, options?: TTSOptions) => useVoiceAssistantStore.getState().speak(text, options),
  stopSpeaking: () => useVoiceAssistantStore.getState().stopSpeaking(),
  repeatInstruction: () => useVoiceAssistantStore.getState().repeatInstruction(),
  provideSimplerExplanation: () => useVoiceAssistantStore.getState().provideSimplerExplanation(),
  triggerContextCue: (cue: 'face_not_centered' | 'look_at_screen' | 'speak_louder' | 'inactivity_repeat') =>
    useVoiceAssistantStore.getState().triggerContextCue(cue),
  setInstructionBanner: (banner: ScreenInstructionState | null) =>
    useVoiceAssistantStore.getState().setInstructionBanner(banner),
  startVoiceControl: () => useVoiceAssistantStore.getState().startVoiceControl(),
  stopVoiceControl: () => useVoiceAssistantStore.getState().stopVoiceControl(),
  transcribeClip: (blob: Blob) => useVoiceAssistantStore.getState().transcribeClip(blob),
  checkGnaniStatus: () => useVoiceAssistantStore.getState().checkGnaniStatus()
};
