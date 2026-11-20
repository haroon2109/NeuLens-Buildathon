import { useLanguageStore } from '../../services/language/LanguageManager';
import type { SupportedLanguage } from '../../services/language/types';

/**
 * Language copy for the screening surface itself.
 *
 * The portal chrome and the functional check-in already use the translation
 * files. The activity instructions did not, so an Arabic session showed Arabic
 * navigation followed by English task prompts. This module is the single source
 * for the wording a participant sees while being assessed.
 *
 * Arabic wording here is a working translation. It is NOT a validated Arabic
 * administration: translation/back-translation, cognitive interviews and local
 * sign-off are still outstanding, and the language registry keeps Arabic tasks
 * marked as not ready for administration.
 */

export interface ScreeningCopy {
  intro: {
    title: string;
    body: string;
    listenTitle: string;
    listenHelp: string;
    cameraNeeded: string;
    allowCamera: string;
    cameraReady: string;
    preparing: string;
    start: string;
  };
  header: {
    repeat: string;
    activities: [string, string, string, string, string];
  };
  announcements: [string, string, string, string, string];
  game1: {
    title: string;
    body: string;
    targets: string;
    camera: string;
    notMeasured: string;
    completeTitle: string;
    completeBody: string;
    continueTo2: string;
  };
  game2: {
    title: string;
    body: string;
  };
  game3: {
    title: string;
    body: string;
    hear: string;
    recordedWords: string;
    tapToSpeak: string;
    recording: string;
    recorded: string;
    analysing: string;
    continueTo4: string;
  };
  game4: {
    title: string;
    body: string;
    hear: string;
    expressionOf: (index: number, total: number) => string;
    next: string;
    continueTo5: string;
    unavailableTitle: string;
    unavailableBody: string;
    continueWithout: string;
    cameraStarting: string;
    expressions: Array<{ key: string; label: string; prompt: string }>;
  };
  game5: {
    title: string;
    body: string;
    hear: string;
    hearText: string;
    nextNumber: string;
  };
  calibration: {
    title: string;
    body: string;
    pointOf: (index: number, total: number) => string;
    checking: string;
    cameraUnavailable: string;
    starting: string;
    continueWithout: string;
    failedEyes: string;
    failedFit: string;
    tryAgain: string;
    continueAnyway: string;
    distance: string;
  };
  sensor: {
    aligned: string;
    alignFace: string;
    detected: string;
    speakToTest: string;
    micLevel: string;
    testVoice: string;
    calibrationProgress: string;
    initializingCamera: string;
    levelGood: string;
    levelFair: string;
    levelPoor: string;
  };
  saving: {
    savingTitle: string;
    savingBody: string;
    errorTitle: string;
    errorBody: string;
    errorDetailLabel: string;
    retry: string;
    waiting: string;
    secure: string;
  };
  chrome: {
    textLabel: string;
    repeatGuidance: string;
    repeatShort: string;
    help: string;
    footer: string;
  };
  completion: {
    title: string;
    thanks: string;
    badge: string;
    identifierLabel: string;
    nameLabel: string;
    dateLabel: string;
    keepNote: string;
    download: string;
    downloaded: string;
    print: string;
    returnHome: string;
    confidential: string;
  };
}

const en: ScreeningCopy = {
  intro: {
    title: "Let's Begin",
    body: 'We will guide you through a few simple activities. Listen carefully and follow each instruction. Take your time.',
    listenTitle: 'Listen to Instructions',
    listenHelp:
      'You can listen to instructions aloud at any time during an activity by pressing "Repeat Instructions".',
    cameraNeeded: 'Camera and microphone access are needed to continue',
    allowCamera: 'Please allow camera and microphone access to proceed',
    cameraReady: 'Camera and microphone are ready',
    preparing: 'Preparing camera and microphone...',
    start: 'Start Assessment'
  },
  header: {
    repeat: 'Repeat Instructions',
    activities: [
      'Activity 1 of 5: Eye Movement Tracking',
      'Activity 2 of 5: Memory Match',
      'Activity 3 of 5: Spoken Repeat',
      'Activity 4 of 5: Facial Movement',
      'Activity 5 of 5: Number Path'
    ]
  },
  announcements: [
    'Activity 1 of 5: Focus Orbit. Tap or focus the moving blue circle and press Enter when it appears.',
    'Activity 2 of 5: Cortex Match. Turn over two cards at a time and match the pairs.',
    'Activity 3 of 5: Spoken Repeat. Say the sentence you hear out loud.',
    'Activity 4 of 5: Facial Movement. Copy the expression shown on the screen.',
    'Activity 5 of 5: Connect the Numbers. Press the number keys 1 to 6 in order, or tap each circle.'
  ],
  game1: {
    title: 'Follow the Moving Circle',
    body: 'Keep your eyes on the blue circle as it moves. You can also touch it on the screen.',
    targets: 'Targets Completed',
    camera: 'Camera',
    notMeasured: 'Not measured',
    completeTitle: 'Activity 1 Complete',
    completeBody: 'Great job! You have completed the first activity.',
    continueTo2: 'Continue to Activity 2'
  },
  game2: {
    title: 'Find the Matching Pairs',
    body: 'Tap cards to turn them over and match pairs with identical symbols.'
  },
  game3: {
    title: 'Repeat the Sentence Aloud',
    body: 'Listen to the sentence, then tap the microphone button and read it aloud clearly.',
    hear: 'Hear Sentence Aloud',
    recordedWords: 'Recorded Words',
    tapToSpeak: 'Tap Microphone to Speak',
    recording: 'Recording... Tap to Stop',
    recorded: 'Voice Recorded Successfully!',
    analysing: 'Analysing voice…',
    continueTo4: 'Continue to Activity 4'
  },
  game4: {
    title: 'Activity 4: Facial Expressions',
    body: 'Look at the camera and make the facial expression shown below.',
    hear: 'Hear Instruction Aloud',
    expressionOf: (index, total) => `Expression ${index} of ${total}`,
    next: 'Next Expression',
    continueTo5: 'Continue to Activity 5',
    unavailableTitle: 'Camera not available',
    unavailableBody:
      'This activity reads facial movement through the camera, so it cannot be scored without one. It will be recorded as not measured — the rest of the assessment still counts.',
    continueWithout: 'Continue without this activity',
    cameraStarting: 'Starting camera...',
    expressions: [
      { key: 'smile', label: '🙂 Smile', prompt: 'Please smile naturally' },
      { key: 'relax', label: '😐 Relax', prompt: 'Please relax your face' },
      { key: 'blink', label: '😉 Blink', prompt: 'Please blink your eyes naturally' },
      { key: 'mouth', label: '😲 Open Mouth', prompt: 'Please open your mouth gently' }
    ]
  },
  game5: {
    title: 'Activity 5: Connect the Numbers',
    body: 'Tap each numbered circle in order, starting from 1 to 6.',
    hear: 'Hear Instructions',
    hearText: 'Tap each numbered circle in order, starting from number 1 up to number 6.',
    nextNumber: 'Next Number to Tap'
  },
  calibration: {
    title: 'Quick camera check',
    body: 'Look at each blue dot as it appears. This helps the camera understand where you are looking. It takes about ten seconds.',
    pointOf: (index, total) => `Point ${index} of ${total}`,
    checking: 'Checking calibration…',
    cameraUnavailable: 'The camera is not available right now. You can continue without the eye activity.',
    starting: 'Starting the camera…',
    continueWithout: 'Continue without calibration',
    failedEyes: 'We could not see your eyes clearly at that point. Let us try again.',
    failedFit:
      'The calibration did not line up well enough. You can try again, or continue without it — the activity still works.',
    tryAgain: 'Try again',
    continueAnyway: 'Continue anyway',
    distance: "Sit about an arm's length from the screen and keep your head still."
  },
  sensor: {
    aligned: 'Aligned',
    alignFace: 'Align Face',
    detected: 'Detected',
    speakToTest: 'Speak to Test',
    micLevel: 'Microphone Input Level',
    testVoice: 'Test AI Voice Output',
    calibrationProgress: 'Calibration Progress',
    initializingCamera: 'Initializing camera sensor...',
    levelGood: 'good',
    levelFair: 'fair',
    levelPoor: 'poor'
  },
  saving: {
    savingTitle: 'Saving Your Assessment...',
    savingBody:
      'Please wait while your screening activities are securely saved. You will receive your confirmation shortly.',
    errorTitle: 'Assessment Not Saved',
    errorBody: 'Your activities were not saved, so no result was produced.',
    errorDetailLabel: 'Technical detail',
    retry: 'Retry saving',
    waiting: 'Your completion confirmation is waiting for a successful save',
    secure: 'Secure Hospital Connection'
  },
  chrome: {
    textLabel: 'Text',
    repeatGuidance: 'Repeat Spoken Guidance',
    repeatShort: 'Repeat',
    help: 'Help',
    footer: 'Hospital Neurological Screening Session • Private & Secure'
  },
  completion: {
    title: 'Assessment Completed',
    thanks: 'Thank you. You have completed your screening activities.',
    badge: 'Completed',
    identifierLabel: 'Your Patient Identifier',
    nameLabel: 'Patient Name',
    dateLabel: 'Completed On',
    keepNote:
      'Please keep this Patient ID safe for future reference. When returning to the clinic or speaking with your doctor, provide this ID number.',
    download: 'Download Slip (.txt)',
    downloaded: 'Downloaded!',
    print: 'Print Confirmation',
    returnHome: 'Return to Home',
    confidential: 'Confidential clinical record • Session safely closes on return'
  }
};

const ta: ScreeningCopy = {
  intro: {
    title: 'மதிப்பீட்டைத் தொடங்குவோம்',
    body: 'நாங்கள் சில எளிய பயிற்சிகள் மூலம் உங்களுக்கு வழிகாட்டுவோம். வழிமுறைகளைக் கவனமாகக் கேட்டுப் பின்பற்றவும். அவசரப்படாமல் நிதானமாகச் செய்யுங்கள்.',
    listenTitle: 'வழிமுறைகளைக் கேட்கவும்',
    listenHelp: 'பயிற்சியின் போது எப்போது வேண்டுமானாலும் "வழிமுறைகளை மீண்டும் கூறு" என்பதை அழுத்தி வழிமுறைகளைக் கேட்கலாம்.',
    cameraNeeded: 'தொடர கேமரா மற்றும் மைக்ரோஃபோன் அணுகல் தேவை',
    allowCamera: 'தொடர கேமரா மற்றும் மைக்ரோஃபோன் அனுமதியை வழங்கவும்',
    cameraReady: 'கேமரா மற்றும் மைக்ரோஃபோன் தயாராக உள்ளன',
    preparing: 'கேமரா மற்றும் மைக்ரோஃபோன் தயாராகிறது...',
    start: 'மதிப்பீட்டைத் தொடங்கவும்'
  },
  header: {
    repeat: 'வழிமுறைகளை மீண்டும் கூறு',
    activities: [
      'பயிற்சி 1 / 5: கண் அசைவு கண்காணிப்பு (Focus Orbit)',
      'பயிற்சி 2 / 5: படங்களைப் பொருத்துதல் (Cortex Match)',
      'பயிற்சி 3 / 5: வாக்கியத்தை உரக்கக் கூறுதல் (Vocal Echo)',
      'பயிற்சி 4 / 5: முக பாவனைகள் (Mimic Sync)',
      'பயிற்சி 5 / 5: எண்களை இணைத்தல் (Path Mapper)'
    ]
  },
  announcements: [
    'பயிற்சி 1 / 5: நகரும் நீலப் புள்ளியை உங்கள் கண்களால் பின்தொடரவும் அல்லது தொடவும்.',
    'பயிற்சி 2 / 5: படங்களைப் பொருத்துதல். அட்டைகளைத் தொட்டு ஒரே மாதிரியான படங்களை இணைக்கவும்.',
    'பயிற்சி 3 / 5: வாக்கியத்தை மீண்டும் கூறுதல். திரையில் தோன்றும் வாக்கியத்தை மைக்கில் தெளிவாக வாசிக்கவும்.',
    'பயிற்சி 4 / 5: முக பாவனைகள். திரையில் காட்டப்படும் முகபாவனையை கேமரா முன் காட்டவும்.',
    'பயிற்சி 5 / 5: எண்களை இணைத்தல். 1 முதல் 6 வரையிலான எண்களை வரிசையாகத் தொடவும்.'
  ],
  game1: {
    title: 'நகரும் புள்ளியைப் பின்தொடரவும்',
    body: 'நீலப் புள்ளி நகரும் போது உங்கள் பார்வையை அதன் மீது நிலைநிறுத்துங்கள். தலையை அசைக்காமல் கண்களால் மட்டுமே பார்க்கவும்.',
    targets: 'முடிக்கப்பட்ட இலக்குகள்',
    camera: 'கேமரா',
    notMeasured: 'அளவிடப்படவில்லை',
    completeTitle: 'பயிற்சி 1 முடிந்தது',
    completeBody: 'அருமை! முதல் பயிற்சியை வெற்றிகரமாக முடித்துவிட்டீர்கள்.',
    continueTo2: 'பயிற்சி 2-க்குச் செல்லவும்'
  },
  game2: {
    title: 'பொருந்தும் படங்களைக் கண்டறியவும்',
    body: 'அட்டைகளைத் தட்டிப் புரட்டி, விளக்கு (🪔), மாம்பழம் (🥭), மயில் (🦚), தாமரை (🪷) போன்ற ஒரே மாதிரியான ஜோடிப் படங்களைப் பொருத்தவும்.'
  },
  game3: {
    title: 'வாக்கியத்தை உரக்கப் படிக்கவும்',
    body: 'மைக்கை அழுத்தி, திரையில் உள்ள எளிய வாக்கியத்தைத் தெளிவாகவும் சத்தமாகவும் வாசியுங்கள்.',
    hear: 'வாக்கியத்தைக் கேட்கவும்',
    recordedWords: 'பதிவான வார்த்தைகள்',
    tapToSpeak: 'மைக்கை அழுத்திப் பேசவும்',
    recording: 'பதிவாகிறது... நிறுத்தத் தொடவும்',
    recorded: 'குரல் வெற்றிகரமாகப் பதிவானது!',
    analysing: 'குரல் பகுப்பாய்வு செய்யப்படுகிறது…',
    continueTo4: 'பயிற்சி 4-க்குச் செல்லவும்'
  },
  game4: {
    title: 'பயிற்சி 4: முக பாவனைகள்',
    body: 'கேமராவை நேராகப் பார்த்து, கீழே காட்டப்பட்டுள்ள எளிய முக பாவனைகளைச் செய்யவும்.',
    hear: 'வழிமுறையைக் கேட்கவும்',
    expressionOf: (index, total) => `பாவனை ${index} / ${total}`,
    next: 'அடுத்த பாவனை',
    continueTo5: 'பயிற்சி 5-க்குச் செல்லவும்',
    unavailableTitle: 'கேமரா கிடைக்கவில்லை',
    unavailableBody: 'இந்த பயிற்சிக்கு கேமரா தேவை. கேமரா இல்லாவிட்டால் இது அளவிடப்படாததாகப் பதிவு செய்யப்படும்.',
    continueWithout: 'இப்பயிற்சி இன்றித் தொடரவும்',
    cameraStarting: 'கேமரா தொடங்குகிறது...',
    expressions: [
      { key: 'smile', label: '🙂 புன்னகைக்கவும்', prompt: 'இயல்பாகப் புன்னகைக்கவும்' },
      { key: 'relax', label: '😐 முகத்தை தளர்த்தவும்', prompt: 'முகத்தை அமைதியாக வைத்திருக்கவும்' },
      { key: 'blink', label: '😉 கண் சிமிட்டவும்', prompt: 'கண்களை இயல்பாகச் சிமிட்டவும்' },
      { key: 'mouth', label: '😲 வாயைத் திறக்கவும்', prompt: 'வாயை மெதுவாகத் திறக்கவும்' }
    ]
  },
  game5: {
    title: 'பயிற்சி 5: எண்களை இணைத்தல்',
    body: '1 முதல் 6 வரையிலான வட்டங்களை வரிசைப்படி ஒன்றன்பின் ஒன்றாகத் தொடவும்.',
    hear: 'வழிமுறையைக் கேட்கவும்',
    hearText: 'எண் 1 முதல் எண் 6 வரை வரிசையாக வட்டங்களைத் தொடவும்.',
    nextNumber: 'அடுத்துத் தொட வேண்டிய எண்'
  },
  calibration: {
    title: 'விரைவான கேமரா சரிபார்ப்பு',
    body: 'நீலப் புள்ளி தோன்றும் இடங்களைப் பார்க்கவும். இது உங்கள் பார்வையின் திசையை கேமரா அறிய உதவும்.',
    pointOf: (index, total) => `புள்ளி ${index} / ${total}`,
    checking: 'சரிபார்க்கப்படுகிறது…',
    cameraUnavailable: 'கேமரா தற்போது கிடைக்கவில்லை. கண் பயிற்சி இன்றித் தொடரலாம்.',
    starting: 'கேமரா இயங்குகிறது…',
    continueWithout: 'சரிபார்ப்பு இன்றித் தொடரவும்',
    failedEyes: 'உங்கள் கண்களைத் தெளிவாகக் காண முடியவில்லை. மீண்டும் முயற்சிப்போம்.',
    failedFit: 'சரிபார்ப்பு போதுமானதாக இல்லை. மீண்டும் முயற்சி செய்யலாம் அல்லது அப்படியே தொடரலாம்.',
    tryAgain: 'மீண்டும் முயற்சி செய்க',
    continueAnyway: 'அப்படியே தொடரவும்',
    distance: 'திரையிலிருந்து ஒரு கை தூரத்தில் தலையை அசைக்காமல் வசதியாக அமரவும்.'
  },
  sensor: {
    aligned: 'சரியாக உள்ளது',
    alignFace: 'முகத்தை நேராக வைக்கவும்',
    detected: 'கண்டறியப்பட்டது',
    speakToTest: 'பேசிப் பரிசோதிக்கவும்',
    micLevel: 'மைக்ரோஃபோன் ஒலி அளவு',
    testVoice: 'குரல் ஒலியைச் சோதிக்கவும்',
    calibrationProgress: 'சரிபார்ப்பு முன்னேற்றம்',
    initializingCamera: 'கேமரா சென்சார் இயங்குகிறது...',
    levelGood: 'நன்று',
    levelFair: 'பரவாயில்லை',
    levelPoor: 'போதாது'
  },
  saving: {
    savingTitle: 'உங்கள் மதிப்பீடு சேமிக்கப்படுகிறது...',
    savingBody: 'உங்கள் மதிப்பீட்டு முடிவுகள் பாதுகாப்பாகப் பதிவு செய்யப்படும் வரை காத்திருக்கவும்.',
    errorTitle: 'மதிப்பீடு சேமிக்கப்படவில்லை',
    errorBody: 'தொழில்நுட்பக் காரணத்தால் முடிவுகள் சேமிக்கப்படவில்லை.',
    errorDetailLabel: 'தொழில்நுட்ப விவரம்',
    retry: 'மீண்டும் சேமிக்க முயலவும்',
    waiting: 'சேமிப்பிற்காகக் காத்திருக்கிறது',
    secure: 'பாதுகாப்பான மருத்துவமனை இணைப்பு'
  },
  chrome: {
    textLabel: 'எழுத்து அளவு',
    repeatGuidance: 'குரல் வழிகாட்டலை மீண்டும் சொல்',
    repeatShort: 'மீண்டும்',
    help: 'உதவி',
    footer: 'நரம்பியல் அறிவாற்றல் மதிப்பீடு • பாதுகாப்பானது & தனித்துவமானது'
  },
  completion: {
    title: 'மதிப்பீடு நிறைவடைந்தது',
    thanks: 'நன்றி! நீங்கள் அனைத்துப் பயிற்சிகளையும் வெற்றிகரமாக முடித்துவிட்டீர்கள்.',
    badge: 'நிறைவுற்றது',
    identifierLabel: 'உங்கள் நோயாளி அடையாள எண் (Patient ID)',
    nameLabel: 'நோயாளி பெயர்',
    dateLabel: 'முடிக்கப்பட்ட தேதி',
    keepNote: 'எதிர்காலக் குறிப்பிற்காக இந்த அடையாள எண்ணைப் பத்திரமாக வைத்திருக்கவும். மருத்துவரிடம் ஆலோசனை பெறும்போது இதைக் காண்பிக்கவும்.',
    download: 'சீட்டைத் தரவிறக்கு (.txt)',
    downloaded: 'தரவிறக்கப்பட்டது!',
    print: 'அச்சிடுக',
    returnHome: 'முகப்புப் பக்கத்திற்குத் திரும்பு',
    confidential: 'பாதுகாக்கப்பட்ட மருத்துவ ஆவணம் • வெளியேறும்போது அமர்வு பாதுகாப்பாக முடிவடையும்'
  }
};

const hi: ScreeningCopy = {
  intro: {
    title: 'आइए शुरू करें',
    body: 'हम आपको कुछ आसान गतिविधियों के माध्यम से मार्गदर्शन करेंगे। निर्देशों को ध्यान से सुनें और पालन करें। अपना समय लें और शांति से करें।',
    listenTitle: 'निर्देश सुनें',
    listenHelp: 'गतिविधि के दौरान किसी भी समय "निर्देश दोहराएं" बटन दबाकर आप बोलकर निर्देश सुन सकते हैं।',
    cameraNeeded: 'आगे बढ़ने के लिए कैमरा और माइक्रोफ़ोन की अनुमति आवश्यक है',
    allowCamera: 'कृपया जारी रखने के लिए कैमरा और माइक्रोफ़ोन की अनुमति दें',
    cameraReady: 'कैमरा और माइक्रोफ़ोन तैयार हैं',
    preparing: 'कैमरा और माइक्रोफ़ोन तैयार हो रहे हैं...',
    start: 'स्क्रीनिंग शुरू करें'
  },
  header: {
    repeat: 'निर्देश दोहराएं',
    activities: [
      'गतिविधि 1 / 5: आँखों की गति ट्रैकिंग (Focus Orbit)',
      'गतिविधि 2 / 5: कार्ड मिलान स्मृति (Cortex Match)',
      'गतिविधि 3 / 5: वाक्य दोहराना (Vocal Echo)',
      'गतिविधि 4 / 5: चेहरे के भाव (Mimic Sync)',
      'गतिविधि 5 / 5: संख्या पथ जोड़ना (Path Mapper)'
    ]
  },
  announcements: [
    'गतिविधि 1 / 5: घूमते हुए नीले घेरे को आँखों से देखें या स्क्रीन पर स्पर्श करें।',
    'गतिविधि 2 / 5: कार्ड मिलान। एक जैसे भारतीय प्रतीकों (दीया, आम, मोर, कमल) वाले कार्डों का मिलान करें।',
    'गतिविधि 3 / 5: वाक्य दोहराना। स्क्रीन पर दिख रहे वाक्य को माइक में स्पष्ट रूप से बोलें।',
    'गतिविधि 4 / 5: चेहरे के भाव। स्क्रीन पर दिखाए गए भाव को कैमरे के सामने बनाएं।',
    'गतिविधि 5 / 5: संख्या पथ। 1 से 6 तक की संख्याओं को क्रम से स्पर्श करें।'
  ],
  game1: {
    title: 'घूमते घेरे को आँखों से ट्रैक करें',
    body: 'सिर को स्थिर रखें और केवल आँखों से नीले बिंदु का पीछा करें। आप स्क्रीन पर उसे छू भी सकते हैं।',
    targets: 'पूरे किए गए लक्ष्य',
    camera: 'कैमरा',
    notMeasured: 'मापा नहीं गया',
    completeTitle: 'गतिविधि 1 पूर्ण हुई',
    completeBody: 'बहुत बढ़िया! आपने पहली गतिविधि पूरी कर ली है।',
    continueTo2: 'गतिविधि 2 पर आगे बढ़ें'
  },
  game2: {
    title: 'मिलते-जुलते कार्ड खोजें',
    body: 'कार्डों को पलटकर दीया (🪔), आम (🥭), मोर (🦚), कमल (🪷) जैसे परिचित प्रतीकों के जोड़ों का मिलान करें।'
  },
  game3: {
    title: 'वाक्य को ऊँची आवाज़ में बोलें',
    body: 'माइक बटन दबाएं और स्क्रीन पर दिए गए सरल वाक्य को स्पष्ट रूप से पढ़ें।',
    hear: 'वाक्य सुनें',
    recordedWords: 'दर्ज किए गए शब्द',
    tapToSpeak: 'बोलने के लिए माइक दबाएं',
    recording: 'रिकॉर्डिंग जारी है... रोकने के लिए दबाएं',
    recorded: 'आवाज़ सफलतापूर्वक दर्ज हो गई!',
    analysing: 'आवाज़ का विश्लेषण हो रहा है…',
    continueTo4: 'गतिविधि 4 पर आगे बढ़ें'
  },
  game4: {
    title: 'गतिविधि 4: चेहरे के भाव',
    body: 'कैमरे की ओर देखें और नीचे दिए गए सामान्य भाव बनाएं।',
    hear: 'निर्देश सुनें',
    expressionOf: (index, total) => `भाव ${index} / ${total}`,
    next: 'अगला भाव',
    continueTo5: 'गतिविधि 5 पर आगे बढ़ें',
    unavailableTitle: 'कैमरा उपलब्ध नहीं है',
    unavailableBody: 'यह गतिविधि चेहरे की गति मापती है। बिना कैमरे के इसे मापा नहीं जा सकेगा।',
    continueWithout: 'इस गतिविधि के बिना जारी रखें',
    cameraStarting: 'कैमरा चालू हो रहा है...',
    expressions: [
      { key: 'smile', label: '🙂 मुस्कुराएं', prompt: 'कृपया स्वाभाविक रूप से मुस्कुराएं' },
      { key: 'relax', label: '😐 चेहरा शांत रखें', prompt: 'चेहरा सामान्य और शांत रखें' },
      { key: 'blink', label: '😉 पलक झपकाएं', prompt: 'स्वाभाविक रूप से पलकें झपकाएं' },
      { key: 'mouth', label: '😲 मुँह खोलें', prompt: 'कृपया मुँह धीरे से खोलें' }
    ]
  },
  game5: {
    title: 'गतिविधि 5: संख्याओं को जोड़ें',
    body: 'क्रम अनुसार 1 से 6 तक के गोलों को एक के बाद एक स्पर्श करें।',
    hear: 'निर्देश सुनें',
    hearText: 'संख्या 1 से शुरू करके संख्या 6 तक क्रम से गोलों को स्पर्श करें।',
    nextNumber: 'अगली संख्या'
  },
  calibration: {
    title: 'त्वरित कैमरा सत्यापन',
    body: 'नीले बिंदु को देखें जहाँ वह दिखाई दे। इससे कैमरे को आपकी दृष्टि समझने में मदद मिलती है।',
    pointOf: (index, total) => `बिंदु ${index} / ${total}`,
    checking: 'जांच जारी है…',
    cameraUnavailable: 'कैमरा उपलब्ध नहीं है। आप इस गतिविधि के बिना जारी रख सकते हैं।',
    starting: 'कैमरा शुरू हो रहा है…',
    continueWithout: 'सत्यापन के बिना जारी रखें',
    failedEyes: 'उस बिंदु पर आपकी आँखें स्पष्ट नहीं दिखीं। आइए दोबारा प्रयास करें।',
    failedFit: 'सत्यापन ठीक से नहीं हो सका। आप पुनः प्रयास कर सकते हैं या ऐसे ही जारी रख सकते हैं।',
    tryAgain: 'पुनः प्रयास करें',
    continueAnyway: 'ऐसे ही जारी रखें',
    distance: 'स्क्रीन से एक हाथ की दूरी पर बैठें और सिर स्थिर रखें।'
  },
  sensor: {
    aligned: 'सही स्थिति में',
    alignFace: 'चेहरा सीधा रखें',
    detected: 'पहचान लिया गया',
    speakToTest: 'बोलकर जांचें',
    micLevel: 'माइक्रोफ़ोन इनपुट स्तर',
    testVoice: 'एआई आवाज़ का परीक्षण करें',
    calibrationProgress: 'कैलिब्रेशन प्रगति',
    initializingCamera: 'कैमरा सेंसर प्रारंभ हो रहा है...',
    levelGood: 'अच्छा',
    levelFair: 'सामान्य',
    levelPoor: 'कम'
  },
  saving: {
    savingTitle: 'आपका मूल्यांकन सहेजा जा रहा है...',
    savingBody: 'कृपया प्रतीक्षा करें जब तक आपकी स्क्रीनिंग सुरक्षित रूप से दर्ज न हो जाए।',
    errorTitle: 'मूल्यांकन सहेजा नहीं गया',
    errorBody: 'तकनीकी कारण से गतिविधियाँ दर्ज नहीं हो सकीं।',
    errorDetailLabel: 'तकनीकी विवरण',
    retry: 'पुनः प्रयास करें',
    waiting: 'सफल सहेजने की प्रतीक्षा में',
    secure: 'सुरक्षित क्लिनिकल कनेक्शन'
  },
  chrome: {
    textLabel: 'अक्षर आकार',
    repeatGuidance: 'आवाज़ निर्देश दोहराएं',
    repeatShort: 'दोहराएं',
    help: 'मदद',
    footer: 'संज्ञानात्मक स्वास्थ्य मूल्यांकन सत्र • निजी और सुरक्षित'
  },
  completion: {
    title: 'मूल्यांकन पूर्ण हुआ',
    thanks: 'धन्यवाद! आपने सभी स्क्रीनिंग गतिविधियाँ सफलतापूर्वक पूरी कर ली हैं।',
    badge: 'पूर्ण',
    identifierLabel: 'आपकी रोगी पहचान संख्या (Patient ID)',
    nameLabel: 'रोगी का नाम',
    dateLabel: 'पूर्ण होने की तिथि',
    keepNote: 'कृपया भविष्य के संदर्भ के लिए यह आईडी सुरक्षित रखें। क्लिनिक में डॉक्टर से मिलते समय यह संख्या बताएं।',
    download: 'पर्ची डाउनलोड करें (.txt)',
    downloaded: 'डाउनलोड हो गया!',
    print: 'प्रिंट करें',
    returnHome: 'मुख्य पृष्ठ पर वापस जाएं',
    confidential: 'गोपनीय मेडिकल रिकॉर्ड • वापस जाने पर सत्र सुरक्षित रूप से समाप्त हो जाएगा'
  }
};

export const getScreeningCopy = (language: SupportedLanguage): ScreeningCopy => {
  if (language === 'ta') return ta;
  if (language === 'hi') return hi;
  return en;
};

/** Reactive copy for the screening surface, following the selected language. */
export const useScreeningCopy = (): ScreeningCopy => {
  const language = useLanguageStore((state) => state.currentLanguage);
  return getScreeningCopy(language);
};
