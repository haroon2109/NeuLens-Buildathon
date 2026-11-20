import { LanguageTranslation } from '../types';

export const enTranslation: LanguageTranslation = {
  languageName: 'English',
  nativeName: 'English',
  welcome: {
    greeting: 'Hello and Welcome!',
    spokenWelcome:
      "Hello! I'm your Neulens assistant. We're about to begin your neurological screening assessment. I'll guide you step-by-step throughout the entire process.",
    chooseLanguageSpoken: 'Please choose your preferred language to begin your assessment.',
    chooseLanguageTitle: 'Select Your Preferred Language',
    chooseLanguageSubtitle: 'The voice assistant and on-screen instructions will use your chosen language.',
    startAssessmentBtn: 'Begin Assessment'
  },
  intro: {
    title: 'Self-Guided Neurological Assessment',
    subtitle: 'A gentle, interactive 5-step screening designed for all age groups.',
    spokenIntro:
      'Please sit comfortably and face the screen. I will guide you with spoken instructions. If you need me to repeat anything, just tap the speaker button or say Repeat.',
    consentNotice: 'Your camera and microphone are used solely for real-time local cognitive analysis.',
    audioPrivacyNotice: 'Data is protected and evaluated strictly for health screening purposes.',
    startScreeningBtn: 'Start Hardware Check & Calibration',
    checklistComfort: 'Sit upright in a comfortable chair with good lighting.',
    checklistPosition: 'Keep your face centered toward the screen.',
    checklistAudio: 'Speak clearly into the microphone when prompted.'
  },
  sensorCheck: {
    title: 'Camera & Microphone Verification',
    spokenCheck:
      "First, let's verify your camera and microphone. Look straight at the camera, and say Hello Neulens when prompted.",
    cameraTitle: 'Camera Position Check',
    cameraDesc: 'Ensure your entire face is visible and stable.',
    cameraAligned: 'Face correctly positioned and tracking active.',
    cameraNeedAdjustment: 'Please align your face inside the guide frame.',
    micTitle: 'Microphone Sensitivity Check',
    micDesc: 'Say "Hello Neulens" or any word to test your voice level.',
    micPrompt: 'Say "Hello Neulens" into the mic...',
    micTestSuccess: 'Microphone detected clear voice signal.',
    micNeedSpeak: 'Waiting for voice audio...',
    calibrationSuccess: 'Sensors calibrated. Ready for assessment.',
    spokenReady: 'Excellent! Your camera and microphone are working well. Let us begin the first task.',
    continueBtn: 'Proceed to Task 1'
  },
  game1: {
    title: 'Focus Orbit',
    spokenIntro:
      "Now we'll check your eye movement. Please follow the moving dot on the screen with your eyes while keeping your head still.",
    spokenGuidance: 'Hold your gaze on the dot as it travels across the screen.',
    screenHeading: 'FOLLOW THE MOVING DOT',
    screenSubtitle: 'Follow the dot with your eyes. Keep your head straight and still.',
    screenIcon: '👁️ ➔ 🔴',
    whatToDo: 'Follow the glowing dot with your eyes until it fills with color.',
    whatNotToDo: 'Do not turn your head. Move only your eyes.',
    whereToLook: 'Directly at the moving dot on your screen.',
    simplerExplanation: 'Watch the red dot. Keep your head still and look right at it.',
    nextTaskPreview: 'Next: Cortex Memory Match'
  },
  game2: {
    title: 'Cortex Match',
    spokenIntro:
      'Next is a memory task. Tap the cards to flip them and find the matching medical symbols.',
    spokenGuidance: 'Remember where each symbol is and match all identical pairs.',
    screenHeading: 'FIND MATCHING CARDS',
    screenSubtitle: 'Touch a card to reveal its symbol, then touch its matching pair.',
    screenIcon: '🧠 ➔ 🃏',
    whatToDo: 'Flip cards two by two to find matching pairs.',
    whatNotToDo: 'Do not rush. Take your time to recall the cards.',
    whereToLook: 'Look across the grid of cards on the screen.',
    simplerExplanation: 'Tap one card, then tap another card to see if they match.',
    nextTaskPreview: 'Next: Vocal Echo Voice Task'
  },
  game3: {
    title: 'Vocal Echo',
    spokenIntro:
      'Now we will analyze your speech. Press the record button and read the sentence displayed on the screen aloud.',
    spokenGuidance: 'Press record, speak clearly into the microphone, then stop when finished.',
    screenHeading: 'READ THE SENTENCE ALOUD',
    screenSubtitle: 'Press Record and speak the highlighted sentence clearly into the mic.',
    screenIcon: '🎤 ➔ 🗣️',
    whatToDo: 'Press Start Recording and read the sentence at your normal pace.',
    whatNotToDo: 'Do not whisper or rush through the words.',
    whereToLook: 'Read the highlighted sentence shown in the center of the screen.',
    simplerExplanation: 'Tap the record button and read the words out loud. Speak clearly.',
    nextTaskPreview: 'Next: Facial Expression Tracking'
  },
  game4: {
    title: 'Mimic Sync',
    spokenIntro:
      'Now we will check your facial movements. Follow the prompts on the screen: smile, relax, blink, and open your mouth.',
    spokenGuidance: 'Look straight at the camera and perform each facial expression naturally.',
    screenHeading: 'FOLLOW FACIAL PROMPTS',
    screenSubtitle: 'Follow each prompt: smile, relax, blink, and gently open your mouth.',
    screenIcon: '👤 ➔ 🙂',
    whatToDo: 'Hold each facial expression until the progress bar completes.',
    whatNotToDo: 'Do not move away from the camera.',
    whereToLook: 'Look straight into the camera lens.',
    simplerExplanation: 'Make the face shown on the screen until the green bar fills up.',
    nextTaskPreview: 'Next: Path Mapper Trail Task'
  },
  game5: {
    title: 'Path Mapper',
    spokenIntro:
      'This is a visual connection task. Tap the numbers in order from 1 to 6.',
    spokenGuidance: 'Tap number 1, then number 2, and continue in sequence until number 6.',
    screenHeading: 'CONNECT NUMBERS 1 TO 6',
    screenSubtitle: 'Tap number 1 first, then 2, 3, 4, 5, and 6 in sequence.',
    screenIcon: '🔢 ➔ 1️⃣2️⃣3️⃣',
    whatToDo: 'Touch each numbered circle in sequential numerical order.',
    whatNotToDo: 'Do not skip numbers.',
    whereToLook: 'Search across the screen to locate the next number.',
    simplerExplanation: 'Find number 1 and tap it. Then find number 2 and tap it.',
    nextTaskPreview: 'Next: AI Analysis & Results'
  },
  functionCheckIn: {
    title: 'Everyday Activities Check-in',
    subtitle: 'This helps your care team understand everyday activities. It is not a diagnosis.',
    interpretationNotice: 'Language versions and tasks have not been locally validated. Scores are exploratory and should be interpreted with your care team.',
    prompt: 'Compared with your usual ability, how are these activities going?',
    activities: {
      appointments: 'Remembering appointments',
      medication: 'Managing medicines',
      finances: 'Handling money or bills',
      household: 'Preparing a simple meal or doing household tasks'
    },
    answers: {
      same: 'About the same',
      harder: 'More difficult',
      help: 'I need more help'
    },
    accessibilityPrompt: 'For interpreting this screening, please note whether you had difficulty with:',
    accessibility: {
      vision: 'Seeing the screen',
      hearing: 'Hearing instructions',
      motor: 'Touching or moving on the screen',
      digitalFamiliarity: 'Using a touchscreen or digital device'
    },
    accessibilityAnswers: {
      noDifficulty: 'No difficulty',
      someDifficulty: 'Some difficulty',
      needSupport: 'Needed help'
    },
    contextPrompt: 'Compared with your usual week, how have these been recently?',
    contextFactors: {
      sleep: 'Sleep quality or duration',
      activity: 'Physical activity',
      moodStress: 'Mood or stress'
    },
    contextAnswers: {
      usual: 'About usual',
      somewhatWorse: 'Somewhat worse',
      substantiallyWorse: 'Much worse'
    },
    externalConsent: 'I agree to let the clinic retrieve relevant information from its connected FHIR health record for this screening and clinician review. This is optional.',
    continueBtn: 'Continue to completion',
    skipBtn: 'Skip these questions'
  },
  submitting: {
    title: 'Processing Biomarkers',
    spokenSubmitting:
      'Thank you! All tasks are complete. Our AI is now processing your ocular, vocal, and cognitive biomarkers.',
    subtitle: 'Computing cross-domain neurocognitive baseline index...'
  },
  results: {
    completedHeader: 'Assessment Complete',
    spokenComplete: 'Your screening assessment is complete. Let me walk you through your results.',
    disclaimerText: 'Screening result ≠ Medical diagnosis',
    disclaimerNotice:
      'Notice: This assessment measures physiological and cognitive markers for early risk screening. It is NOT a clinical diagnosis of dementia, Alzheimer’s, or any neurological condition. A formal diagnosis requires clinical consultation.',
    lowRiskExplanation:
      'This screening did not show a change outside the range recorded for you earlier. It does not rule out a health condition.',
    moderateRiskExplanation:
      'Some observations differed from your earlier sessions. This can happen for many reasons and is a prompt for clinical review, not a diagnosis.',
    highRiskExplanation:
      'Several observations differed from your earlier sessions. Please arrange a review with a qualified clinician. This is not a diagnosis.',
    nextStepsNormal:
      'Keep up regular physical and mental activity. Repeat screening as advised by your care team.',
    nextStepsFollowup:
      'You can download your summary and share it with your healthcare provider.'
  },
  contextual: {
    faceNotCentered: 'Please move slightly closer to the camera and keep your head straight.',
    lookAtScreen: 'Please look toward the screen.',
    speakLouder: "I couldn't hear you clearly. Please speak a little louder.",
    takeYourTime: 'Take your time. There is no rush.',
    simplerHelp: "Let me explain simply: follow what is highlighted on your screen.",
    taskCompleted: 'Great job! Moving to the next task.',
    goodJob: 'Well done!'
  },
  assistant: {
    name: 'Neulens',
    speakingStatus: 'Speaking...',
    listeningStatus: 'Listening...',
    calmStatus: 'Ready to assist',
    repeatBtn: 'Repeat Instruction',
    helpBtn: 'Help / Simple Guide',
    volumeBtn: 'Sound Volume',
    languageBtn: 'Change Language',
    stepOf: 'Step'
  }
};
