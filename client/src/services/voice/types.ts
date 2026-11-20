import { SupportedLanguage } from '../language/types';

export interface TTSOptions {
  rate?: number;   // 0.5 to 2.0 (default ~0.95 for calm healthcare assistant pace)
  pitch?: number;  // 0.5 to 2.0 (default 1.0)
  volume?: number; // 0.0 to 1.0
  voice?: string;  // Explicit voice name (e.g. 'Asmita', 'Nalini', 'Kaveri')
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  interrupt?: boolean; // Default true: stop previous speech before speaking new text
}

export interface ITextToSpeechService {
  speak(text: string, lang: SupportedLanguage, options?: TTSOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  isSpeaking(): boolean;
  isSupported(): boolean;
  isGnaniActive(): Promise<boolean>;
}

export interface ISpeechRecognitionService {
  startListening(
    lang: SupportedLanguage,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (err: any) => void
  ): boolean;
  stopListening(): void;
  isListening(): boolean;
  isSupported(): boolean;
  transcribeClip(
    audioBlob: Blob,
    lang: SupportedLanguage
  ): Promise<{ success: boolean; transcript: string; error?: string }>;
}

export type AssistantVisualStatus = 'idle' | 'speaking' | 'listening' | 'warning' | 'success' | 'transcribing';

export interface ScreenInstructionState {
  icon: string;
  badge: string;
  heading: string;
  subtitle: string;
  whereAmI: string;
  whatToDo: string;
  whatNext: string;
}

export interface VoiceEngineEvent {
  type: 'speech_start' | 'speech_end' | 'repeat_requested' | 'help_requested' | 'guidance_cue';
  text?: string;
  cueType?: 'face_not_centered' | 'look_at_screen' | 'speak_louder' | 'inactivity_repeat';
}
