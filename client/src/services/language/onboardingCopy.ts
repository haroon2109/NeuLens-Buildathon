import type { SupportedLanguage } from './types';
import { en } from './onboardingCopy.en';
import { ar } from './onboardingCopy.ar';

export interface OnboardingCopy {
  steps: string[];
  progressLabel: string;
  homeLabel: string;
  back: string;
  welcome: {
    eyebrow: string;
    title: (name: string) => string;
    description: string;
    sceneTitle: string;
    whatToExpect: string;
    items: Array<{ title: string; detail: string }>;
    beforeTitle: string;
    beforeBody: string;
    pills: string[];
    disclaimer: string;
    goDashboard: string;
    start: string;
  };
  personal: {
    eyebrow: string;
    title: string;
    description: string;
    errors: { name: string; dob: string };
    name: string;
    namePlaceholder: string;
    dob: string;
    language: string;
    education: string;
    educationPlaceholder: string;
    educationOptions: Array<{ value: string; label: string }>;
    email: string;
    phone: string;
    emergencyTitle: string;
    optional: string;
    emergencyName: string;
    emergencyNamePlaceholder: string;
    emergencyPhone: string;
    emergencyPhonePlaceholder: string;
    continue: string;
  };
  health: {
    eyebrow: string;
    title: string;
    description: string;
    conditionsLabel: string;
    conditions: Array<{ value: string; label: string }>;
    sensoryLabel: string;
    sensory: Array<{ value: string; label: string }>;
    medications: string;
    medicationsPlaceholder: string;
    family: string;
    familyPlaceholder: string;
    previous: string;
    previousOptions: Array<{ value: string; label: string }>;
    lifestyle: string;
    lifestylePlaceholder: string;
    continue: string;
  };
  accessibility: {
    eyebrow: string;
    title: string;
    description: string;
    language: string;
    voiceNote: string;
    hearSample: string;
    textSize: string;
    sizes: Array<{ label: string; detail: string }>;
    highContrast: string;
    highContrastDetail: string;
    audio: string;
    audioDetail: string;
    touch: string;
    touchOptions: Array<{ value: string; label: string }>;
    checkTitle: string;
    checkBody: string;
    camera: string;
    microphone: string;
    ready: string;
    checking: string;
    testCamera: string;
    testMicrophone: string;
    demoNote: string;
    builtTitle: string;
    builtBody: string;
    finish: string;
  };
}

export const getOnboardingCopy = (language: SupportedLanguage): OnboardingCopy =>
  language === 'ar' ? ar : en;
