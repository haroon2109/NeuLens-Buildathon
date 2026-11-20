import type { SupportedLanguage } from './types';

export interface PathwayCopy {
  eyebrow: string;
  title: string;
  disclaimer: string;
  ariaLabel: string;
  preventionTitle: string;
  preventionFallback: string;
  signalsLabel: string;
  states: Record<string, string>;
  stage1: { title: string; summary: string };
  stage2: { title: string; activeSummary: string; pendingSummary: string };
  stage3: { title: string; review: string; within: string; insufficient: string };
  stage4: { title: string; summary: string };
  stage5: { title: string; review: string; monitoring: string };
}

const en: PathwayCopy = {
  eyebrow: 'Longitudinal care pathway',
  title: 'Five-stage brain-health pathway',
  disclaimer:
    'Screening support only — not a diagnosis. Poor-quality sessions are never interpreted as decline; clinicians own care decisions.',
  ariaLabel: 'Brain-health pathway',
  preventionTitle: 'Personalized prevention (supportive)',
  preventionFallback:
    'Supportive, non-diagnostic suggestions to discuss with a clinician; not medical advice or a treatment plan.',
  signalsLabel: 'Signals noted (from recorded inputs only):',
  states: {
    COLLECTED: 'Collected',
    ACTIVE: 'Active',
    PENDING: 'Pending',
    INSUFFICIENT_DATA: 'Insufficient data',
    REVIEW_SIGNAL: 'Review signal',
    WITHIN_PERSONAL_RANGE: 'Within personal range',
    SUGGESTED: 'Suggested',
    AVAILABLE: 'Available',
    CLINICAL_REVIEW_RECOMMENDED: 'Clinical review recommended',
    MONITORING: 'Monitoring',
    COMPLETED: 'Completed',
  },
  stage1: {
    title: 'Population signals and screening',
    summary:
      'Cognitive, functional, and available lifestyle/health/context screening signals are collected over time.',
  },
  stage2: {
    title: 'Personal baseline',
    activeSummary:
      'A personal brain-health baseline is established for within-person comparison (early baselines may be provisional).',
    pendingSummary: 'Complete initial screening(s) to establish a provisional personal baseline.',
  },
  stage3: {
    title: 'Meaningful change detection',
    review:
      'A meaningful review signal was detected relative to personal baseline and comparable history. Normal variation and measurement quality are considered.',
    within:
      'Recent comparable observations are within the recorded personal range. Poor quality is never treated as decline.',
    insufficient:
      'Not enough comparable, quality-checked sessions yet to determine meaningful change; continue follow-up.',
  },
  stage4: {
    title: 'Personalized prevention',
    summary:
      'Personalized, non-diagnostic prevention and brain-health support suggestions to discuss with a clinician.',
  },
  stage5: {
    title: 'Clinical referral and closed-loop outcomes',
    review:
      'Clinician review is recommended to determine appropriate care, referral needs, and follow-up; outcomes should be tracked to close the loop.',
    monitoring:
      'Continue clinician-guided monitoring and track follow-up outcomes over time; referral is a clinician decision if indicated.',
  },
};

const ar: PathwayCopy = {
  eyebrow: 'مسار الرعاية الطولي',
  title: 'مسار صحة الدماغ من خمس مراحل',
  disclaimer:
    'دعم للفحص فقط — ليس تشخيصًا. لا تُفسَّر الجلسات ضعيفة الجودة أبدًا على أنها تراجع، وقرارات الرعاية للطبيب.',
  ariaLabel: 'مسار صحة الدماغ',
  preventionTitle: 'الوقاية المخصّصة (دعمية)',
  preventionFallback:
    'اقتراحات دعمية غير تشخيصية لمناقشتها مع الطبيب، وليست نصيحة طبية أو خطة علاج.',
  signalsLabel: 'الإشارات الملحوظة (من المدخلات المسجّلة فقط):',
  states: {
    COLLECTED: 'تم الجمع',
    ACTIVE: 'مُفعّل',
    PENDING: 'قيد الانتظار',
    INSUFFICIENT_DATA: 'بيانات غير كافية',
    REVIEW_SIGNAL: 'إشارة مراجعة',
    WITHIN_PERSONAL_RANGE: 'داخل النطاق الشخصي',
    SUGGESTED: 'مقترح',
    AVAILABLE: 'متاح',
    CLINICAL_REVIEW_RECOMMENDED: 'تُوصى بمراجعة سريرية',
    MONITORING: 'قيد المتابعة',
    COMPLETED: 'مكتمل',
  },
  stage1: {
    title: 'مؤشرات الفحص على مستوى الحالات',
    summary:
      'تُجمع مؤشرات الفحص الإدراكية والوظيفية والمتاحة لنمط الحياة والصحة والسياق عبر الوقت.',
  },
  stage2: {
    title: 'خط الأساس الشخصي',
    activeSummary:
      'أُنشئ خط أساس شخصي لصحة الدماغ للمقارنة لدى الشخص نفسه (قد تكون خطوط الأساس المبكرة مؤقتة).',
    pendingSummary: 'أكمل الفحص أو الفحوص الأولية لإنشاء خط أساس شخصي مؤقت.',
  },
  stage3: {
    title: 'كشف التغيّر ذي الدلالة',
    review:
      'كُشفت إشارة مراجعة ذات دلالة مقارنةً بخط الأساس الشخصي والتاريخ القابل للمقارنة، مع مراعاة التباين الطبيعي وجودة القياس.',
    within:
      'الملاحظات القابلة للمقارنة الأخيرة ضمن النطاق الشخصي المسجّل. الجودة الضعيفة لا تُعدّ تراجعًا أبدًا.',
    insufficient:
      'لا توجد بعد جلسات كافية قابلة للمقارنة ومفحوصة الجودة لتحديد تغيّر ذي دلالة؛ يُرجى مواصلة المتابعة.',
  },
  stage4: {
    title: 'الوقاية المخصّصة',
    summary:
      'اقتراحات مخصّصة غير تشخيصية للوقاية ودعم صحة الدماغ لمناقشتها مع الطبيب.',
  },
  stage5: {
    title: 'الإحالة السريرية ونتائج الحلقة المغلقة',
    review:
      'تُوصى بمراجعة الطبيب لتحديد الرعاية المناسبة واحتياجات الإحالة والمتابعة، مع تتبّع النتائج لإغلاق الحلقة.',
    monitoring:
      'واصل المتابعة بإرشاد الطبيب وتتبّع نتائج المتابعة عبر الوقت؛ الإحالة قرار يتخذه الطبيب عند الحاجة.',
  },
};

const ta: PathwayCopy = {
  ...en,
  eyebrow: 'நீண்டகால நரம்பியல் பராமரிப்புப் பாதை',
  title: 'ஐந்து கட்ட மூளை நலப் பராமரிப்பு வழிமுறை',
  disclaimer: 'பரிசோதனை உதவி மட்டுமே — இறுதி நோய் கண்டறிதல் அல்ல. முடிவுகளை மருத்துவரே தீர்மானிக்கிறார்.',
  ariaLabel: 'மூளை நல வழிமுறை',
  preventionTitle: 'தனிப்பயனாக்கப்பட்ட தடுப்பு முறைகள்',
  preventionFallback: 'மருத்துவரிடம் ஆலோசிக்க வேண்டிய வாழ்க்கை முறை பரிந்துரைகள்.',
  signalsLabel: 'பதிவு செய்யப்பட்ட குறிப்புகள்:',
  stage1: {
    title: 'பரிசோதனை மற்றும் தகவல்கள் சேகரிப்பு',
    summary: 'அறிவாற்றல், பார்வை மற்றும் வாழ்க்கை முறை தகவல்கள் சேகரிக்கப்படுகின்றன.',
  },
  stage2: {
    title: 'தனிநபர் அடிப்படை நிலை (Baseline)',
    activeSummary: 'தனிநபர் ஒப்பீட்டிற்கான அடிப்படை மூளை நலம் நிறுவப்பட்டுள்ளது.',
    pendingSummary: 'துல்லியமான ஒப்பீட்டிற்கு கூடுதல் பரிசோதனைகள் தேவை.',
  },
  stage3: {
    title: 'குறிப்பிடத்தக்க மாற்றங்களை அறிதல்',
    review: 'தனிநபர் அடிப்படை நிலையுடன் ஒப்பிட்டு மருத்துவக் குழு ஆய்வு செய்கிறது.',
    within: 'அனைத்து அளவுகளும் உங்கள் இயல்பான வரம்பிற்குள் உள்ளன.',
    insufficient: 'மாற்றங்களை துல்லியமாக கணிக்க கூடுதல் அமர்வுகள் தேவை.',
  },
  stage4: {
    title: 'தடுப்பு மற்றும் வாழ்க்கை முறை ஆதரவு',
    summary: 'மூளை நலனைப் பாதுகாக்க மருத்துவர் பரிந்துரைத்த வாழ்க்கை முறை வழிகாட்டல்கள்.',
  },
  stage5: {
    title: 'மருத்துவப் பரிந்துரை மற்றும் தொடர் கவனிப்பு',
    review: 'தேவையான பட்சத்தில் நரம்பியல் நிபுணரிடம் ஆலோசனை பெற பரிந்துரைக்கப்படுகிறது.',
    monitoring: 'வழக்கமான பரிசோதனைகள் மூலம் ஆரோக்கியத்தை தொடர்ந்து கண்காணிக்கவும்.',
  },
};

const hi: PathwayCopy = {
  ...en,
  eyebrow: 'दीर्घकालिक देखभाल मार्ग',
  title: 'पांच-चरणीय मस्तिष्क स्वास्थ्य मार्ग',
  disclaimer: 'केवल जांच सहायता — अंतिम निदान नहीं। अंतिम निर्णय चिकित्सक का होता है।',
  ariaLabel: 'मस्तिष्क स्वास्थ्य मार्ग',
  preventionTitle: 'व्यक्तिगत रोकथाम एवं सहायता',
  preventionFallback: 'डॉक्टर से चर्चा के लिए गैर-नैदानिक जीवनशैली सुझाव।',
  signalsLabel: 'दर्ज किए गए संकेत:',
  stage1: {
    title: 'संकेत संग्रह एवं प्रारंभिक जांच',
    summary: 'संज्ञानात्मक, दृष्टि और जीवनशैली संबंधी संकेत समय के साथ एकत्र किए जाते हैं।',
  },
  stage2: {
    title: 'व्यक्तिगत आधार रेखा (Baseline)',
    activeSummary: 'व्यक्तिगत तुलना के लिए मस्तिष्क स्वास्थ्य आधार रेखा स्थापित है।',
    pendingSummary: 'सटीक आधार रेखा के लिए अतिरिक्त जांच की आवश्यकता है।',
  },
  stage3: {
    title: 'सार्थक परिवर्तन की पहचान',
    review: 'आधार रेखा से तुलना करके डॉक्टर द्वारा समीक्षा की जाती है।',
    within: 'हालिया अवलोकन आपकी व्यक्तिगत सामान्य सीमा के भीतर हैं।',
    insufficient: 'सार्थक परिवर्तन के आकलन के लिए पर्याप्त सत्र नहीं हैं।',
  },
  stage4: {
    title: 'व्यक्तिगत रोकथाम',
    summary: 'मस्तिष्क स्वास्थ्य को बनाए रखने के लिए जीवनशैली सुझाव।',
  },
  stage5: {
    title: 'चिकित्सकीय रेफरल एवं निरंतर अनुवर्ती कार्रवाई',
    review: 'उचित देखभाल के लिए विशेषज्ञ डॉक्टर से परामर्श की सिफारिश।',
    monitoring: 'नियमित अंतराल पर जांच और निगरानी जारी रखें।',
  },
};

const te: PathwayCopy = {
  ...en,
  eyebrow: 'దీర్ఘకాలిక సంరక్షణ మార్గం',
  title: 'ఐదు దశల మెదడు ఆరోగ్య మార్గం',
  disclaimer: 'పరీక్షా సహాయం మాత్రమే — రోగ నిర్ధారణ కాదు. వైద్యులే నిర్ణయాలు తీసుకుంటారు.',
  ariaLabel: 'మెదడు ఆరోగ్య మార్గం',
  preventionTitle: 'వ్యక్తిగత నివారణ చర్యలు',
};

const ml: PathwayCopy = {
  ...en,
  eyebrow: 'ദീർഘകാല പരിചരണ പാത',
  title: 'അഞ്ച് ഘട്ട തലച്ചോറ് ആരോഗ്യ പാത',
  disclaimer: 'സ്ക്രീനിംഗ് സഹായം മാത്രം — രോഗനിർണയമല്ല.',
  ariaLabel: 'തലച്ചോറ് ആരോഗ്യ പാത',
  preventionTitle: 'വ്യക്തിഗത പ്രതിരോധ നടപടികൾ',
};

const kn: PathwayCopy = {
  ...en,
  eyebrow: 'ದೀರ್ಘಕಾಲೀನ ಆರೈಕೆ ಮಾರ್ಗ',
  title: 'ಐದು ಹಂತದ ಮೆದುಳಿನ ಆರೋಗ್ಯ ಮಾರ್ಗ',
  disclaimer: 'ತಪಾಸಣಾ ನೆರವು ಮಾತ್ರ — ರೋಗನಿರ್ಣಯವಲ್ಲ.',
  ariaLabel: 'ಮೆದುಳಿನ ಆರೋಗ್ಯ ಮಾರ್ಗ',
  preventionTitle: 'ವೈಯಕ್ತಿಕ ತಡೆಗಟ್ಟುವಿಕೆ ಕ್ರಮಗಳು',
};

export const getPathwayCopy = (language: SupportedLanguage): PathwayCopy => {
  if (language === 'ar') return ar;
  if (language === 'ta') return ta;
  if (language === 'hi') return hi;
  if (language === 'te') return te;
  if (language === 'ml') return ml;
  if (language === 'kn') return kn;
  return en;
};
