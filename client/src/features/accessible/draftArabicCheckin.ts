/**
 * Culturally adapted Indian content for the accessible, sensor-free check-in pathway
 * (word-list recall + daily-function check-in in Tamil, Hindi, and English).
 *
 * Designed for diverse literacy levels:
 * - High-contrast visual pictograms and familiar Indian everyday objects
 * - Spoken vernacular audio guidance
 * - No complex medical jargon
 */

export type ValidationStatus = 'ADAPTED_INDIAN_PATHWAY';

export interface DraftWordItem {
  /** Stable English source id, used for scoring/recording. */
  id: string;
  /** Tamil display/reading form. */
  ta: string;
  /** Hindi display/reading form. */
  hi: string;
  /** English source word. */
  en: string;
}

export const ACCESSIBLE_CHECKIN_VALIDATION = {
  status: 'ADAPTED_INDIAN_PATHWAY' as ValidationStatus,
  pathway: 'accessible-indian-wordlist-functional-v1',
  requires: [
    'vernacular_audio_guidance',
    'education_aware_scoring',
    'everyday_familiar_stimuli',
    'longitudinal_personal_baseline'
  ],
  note:
    'Culturally adapted Indian check-in. Administered with or without camera/mic. Results are recorded for clinician decision support against the patient’s own personal baseline.'
};

export const INDIAN_WORD_LIST: DraftWordItem[] = [
  { id: 'lamp', ta: 'விளக்கு', hi: 'दीया', en: 'Lamp' },
  { id: 'mango', ta: 'மாம்பழம்', hi: 'आम', en: 'Mango' },
  { id: 'tree', ta: 'ஆலமரம்', hi: 'बरगद', en: 'Banyan Tree' },
  { id: 'chair', ta: 'நாற்காலி', hi: 'कुर्सी', en: 'Chair' },
  { id: 'garden', ta: 'தோட்டம்', hi: 'बगीचा', en: 'Garden' },
  { id: 'book', ta: 'புத்தகம்', hi: 'किताब', en: 'Book' },
  { id: 'river', ta: 'ஆறு', hi: 'नदी', en: 'River' },
  { id: 'basket', ta: 'கூடை', hi: 'टोकरी', en: 'Basket' }
];

/** Distractors for recognition (not in the studied list). Culturally adapted. */
export const INDIAN_WORD_DISTRACTORS: DraftWordItem[] = [
  { id: 'tea', ta: 'தேநீர்', hi: 'चाय', en: 'Tea' },
  { id: 'market', ta: 'சந்தை', hi: 'बाज़ार', en: 'Market' },
  { id: 'clock', ta: 'கடிகாரம்', hi: 'घड़ी', en: 'Clock' },
  { id: 'peacock', ta: 'மயில்', hi: 'मोर', en: 'Peacock' }
];

// Retain legacy aliases for backwards compatibility with tests
export const ARABIC_WORD_LIST = INDIAN_WORD_LIST;
export const ARABIC_WORD_DISTRACTORS = INDIAN_WORD_DISTRACTORS;

export const ARABIC_WORDLIST_COPY = {
  title: 'வார்த்தை நினைவாற்றல் / शब्द स्मृति',
  titleEn: 'Word list recall',
  studyIntro:
    'வார்த்தைகள் காட்டப்படும் மற்றும் வாசிக்கப்படும். கவனமாகக் கேட்கவும். தயாரானதும் நீங்கள் நினைவில் வைத்திருக்கும் வார்த்தைகளைத் தேர்ந்தெடுக்கவும்.',
  studyIntroEn:
    'Words will be shown and can be read aloud. Listen or read carefully. When ready, choose every word you remember.',
  readAloud: 'வார்த்தைகளை உரக்கப் படிக்க / बोलकर सुनें',
  readAloudEn: 'Read the words aloud',
  readAgain: 'மீண்டும் படிக்க / पुनः सुनें',
  readAgainEn: 'Read the words again',
  ready: 'நான் தயாராக உள்ளேன் / मैं तैयार हूँ',
  readyEn: 'I am ready to choose',
  recallPrompt: 'பட்டியலில் இருந்த வார்த்தைகளைத் தேர்ந்தெடுக்கவும் / सूची वाले शब्द चुनें।',
  recallPromptEn: 'Select every word that was in the list.',
  recallHelper: 'அவசரமில்லை, நிதானமாகத் தேர்ந்தெடுக்கவும் / कोई समय सीमा नहीं है।',
  recallHelperEn: 'Choose all that apply. There is no time limit.',
  confirm: 'உறுதி செய் / पुष्टि करें',
  confirmEn: 'Confirm choices',
  next: 'அடுத்து / अगला',
  nextEn: 'Next'
};

export interface FunctionalItem {
  id: 'appointments' | 'medication' | 'finances' | 'household';
  ta: string;
  hi: string;
  ar: string;
  en: string;
}

export interface FunctionalOption {
  value: 0 | 1 | 2;
  ta: string;
  hi: string;
  ar: string;
  en: string;
}

export const ARABIC_FUNCTIONAL_COPY = {
  title: 'அன்றாட செயல்பாடுகள் / दैनिक गतिविधियाँ',
  titleEn: 'Daily activities check-in',
  intro:
    'இந்தக் கேள்விகள் அன்றாட நடவடிக்கைகள் பற்றியவை. சரியான அல்லது தவறான பதில்கள் எதுவும் இல்லை. எந்தக் கேள்வியையும் தவிர்க்கலாம்.',
  introEn:
    'These questions are about everyday activities. Not a test and not a diagnosis. There are no right or wrong answers. You can skip any question.',
  prompt: 'வழக்கமான திறனுடன் ஒப்பிடுகையில், இந்தச் செயல்பாடுகள் எவ்வாறு உள்ளன?',
  promptEn: 'Compared with your usual ability, how are these activities going?',
  items: [
    { id: 'appointments', ta: 'சந்திப்புகளை நினைவில் வைத்தல்', hi: 'समय और अपॉइंटमेंट याद रखना', ar: 'تذكّر المواعيد', en: 'Remembering appointments' },
    { id: 'medication', ta: 'மருந்துகளை உட்கொள்ளுதல்', hi: 'दवाइयों का समय पर प्रबंधन', ar: 'إدارة الأدوية', en: 'Managing medicines' },
    { id: 'finances', ta: 'பணம் அல்லது கட்டணங்களைக் கையாளுதல்', hi: 'पैसे या बिल का हिसाब रखना', ar: 'التعامل مع المال أو الفواتير', en: 'Handling money or bills' },
    { id: 'household', ta: 'எளிய உணவு தயாரித்தல் அல்லது வீட்டு வேலைகள்', hi: 'साधारण भोजन बनाना या घरेलू काम', ar: 'إعداد وجبة بسيطة أو القيام بالأعمال المنزلية', en: 'Preparing a simple meal or doing household tasks' }
  ] as FunctionalItem[],
  options: [
    { value: 0, ta: 'வழக்கம் போல இயல்பாக உள்ளது', hi: 'हमेशा की तरह सामान्य', ar: 'كما المعتاد تقريبًا', en: 'About the same' },
    { value: 1, ta: 'முன்பை விட சற்று கடினமாக உள்ளது', hi: 'पहले से कुछ कठिन हो गया है', ar: 'أصبح أصعب', en: 'More difficult' },
    { value: 2, ta: 'அதிக உதவி தேவைப்படுகிறது', hi: 'अधिक सहायता की आवश्यकता है', ar: 'أحتاج مساعدة أكبر', en: 'I need more help' }
  ] as FunctionalOption[],
  skip: 'தவிர்க்க / छोड़ें',
  skipEn: 'Skip this question',
  finish: 'நிறைவு செய் / पूर्ण करें',
  finishEn: 'Finish check-in'
};
