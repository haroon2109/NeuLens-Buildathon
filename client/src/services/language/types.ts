export type SupportedLanguage = 'en' | 'ar' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  flag: string;
  bcp47: string;
  /** Writing direction for this language. Defaults to ltr when absent. */
  dir?: 'ltr' | 'rtl';
  /**
   * Whether spoken instructions are currently available from the configured
   * speech provider. Arabic on-screen text is available; spoken Arabic is
   * marked pending until an Arabic voice is configured and reviewed.
   */
  speechAvailable?: boolean;
  sampleGreeting: string;
  repeatKeywords: string[];
  helpKeywords: string[];
}

export interface TaskInstruction {
  title: string;
  spokenIntro: string;
  spokenGuidance: string;
  screenHeading: string;
  screenSubtitle: string;
  screenIcon: string;
  whatToDo: string;
  whatNotToDo: string;
  whereToLook: string;
  simplerExplanation: string;
  nextTaskPreview: string;
}

export interface ContextualPrompts {
  faceNotCentered: string;
  lookAtScreen: string;
  speakLouder: string;
  takeYourTime: string;
  simplerHelp: string;
  taskCompleted: string;
  goodJob: string;
}

export interface ResultExplanation {
  completedHeader: string;
  spokenComplete: string;
  disclaimerText: string;
  disclaimerNotice: string;
  lowRiskExplanation: string;
  moderateRiskExplanation: string;
  highRiskExplanation: string;
  nextStepsNormal: string;
  nextStepsFollowup: string;
}

export interface LanguageTranslation {
  languageName: string;
  nativeName: string;
  welcome: {
    greeting: string;
    spokenWelcome: string;
    chooseLanguageSpoken: string;
    chooseLanguageTitle: string;
    chooseLanguageSubtitle: string;
    startAssessmentBtn: string;
  };
  intro: {
    title: string;
    subtitle: string;
    spokenIntro: string;
    consentNotice: string;
    audioPrivacyNotice: string;
    startScreeningBtn: string;
    checklistComfort: string;
    checklistPosition: string;
    checklistAudio: string;
  };
  sensorCheck: {
    title: string;
    spokenCheck: string;
    cameraTitle: string;
    cameraDesc: string;
    cameraAligned: string;
    cameraNeedAdjustment: string;
    micTitle: string;
    micDesc: string;
    micPrompt: string;
    micTestSuccess: string;
    micNeedSpeak: string;
    calibrationSuccess: string;
    spokenReady: string;
    continueBtn: string;
  };
  game1: TaskInstruction;
  game2: TaskInstruction;
  game3: TaskInstruction;
  game4: TaskInstruction;
  game5: TaskInstruction;
  functionCheckIn: {
    title: string;
    subtitle: string;
    interpretationNotice: string;
    prompt: string;
    activities: {
      appointments: string;
      medication: string;
      finances: string;
      household: string;
    };
    answers: {
      same: string;
      harder: string;
      help: string;
    };
    accessibilityPrompt: string;
    accessibility: {
      vision: string;
      hearing: string;
      motor: string;
      digitalFamiliarity: string;
    };
    accessibilityAnswers: {
      noDifficulty: string;
      someDifficulty: string;
      needSupport: string;
    };
    contextPrompt: string;
    contextFactors: {
      sleep: string;
      activity: string;
      moodStress: string;
    };
    contextAnswers: {
      usual: string;
      somewhatWorse: string;
      substantiallyWorse: string;
    };
    externalConsent: string;
    continueBtn: string;
    skipBtn: string;
  };
  submitting: {
    title: string;
    spokenSubmitting: string;
    subtitle: string;
  };
  results: ResultExplanation;
  contextual: ContextualPrompts;
  assistant: {
    name: string;
    speakingStatus: string;
    listeningStatus: string;
    calmStatus: string;
    repeatBtn: string;
    helpBtn: string;
    volumeBtn: string;
    languageBtn: string;
    stepOf: string;
  };
}
