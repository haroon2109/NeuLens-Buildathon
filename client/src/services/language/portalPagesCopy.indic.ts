import type { PortalPagesCopy } from './portalPagesCopy';
import { enPortalPages } from './portalPagesCopy.en';

export function createLocalizedCopy(overrides: Partial<PortalPagesCopy>): PortalPagesCopy {
  return {
    ...enPortalPages,
    ...overrides,
    common: { ...enPortalPages.common, ...(overrides.common || {}) },
    activities: { ...enPortalPages.activities, ...(overrides.activities || {}) },
    fieldLabels: { ...enPortalPages.fieldLabels, ...(overrides.fieldLabels || {}) },
    healthProfile: { ...enPortalPages.healthProfile, ...(overrides.healthProfile || {}) },
    dailyFunction: { ...enPortalPages.dailyFunction, ...(overrides.dailyFunction || {}) },
    timeline: { ...enPortalPages.timeline, ...(overrides.timeline || {}) },
    prevention: { ...enPortalPages.prevention, ...(overrides.prevention || {}) },
    monitoring: {
      ...enPortalPages.monitoring,
      ...(overrides.monitoring || {}),
      overview: { ...enPortalPages.monitoring.overview, ...(overrides.monitoring?.overview || {}) },
      history: { ...enPortalPages.monitoring.history, ...(overrides.monitoring?.history || {}) },
      trends: { ...enPortalPages.monitoring.trends, ...(overrides.monitoring?.trends || {}) },
      change: { ...enPortalPages.monitoring.change, ...(overrides.monitoring?.change || {}) },
      reasons: { ...enPortalPages.monitoring.reasons, ...(overrides.monitoring?.reasons || {}) },
      status: { ...enPortalPages.monitoring.status, ...(overrides.monitoring?.status || {}) },
    },
    carePages: {
      ...enPortalPages.carePages,
      ...(overrides.carePages || {}),
      appointments: { ...enPortalPages.carePages.appointments, ...(overrides.carePages?.appointments || {}) },
      carePlan: { ...enPortalPages.carePages.carePlan, ...(overrides.carePages?.carePlan || {}) },
      notifications: { ...enPortalPages.carePages.notifications, ...(overrides.carePages?.notifications || {}) },
      documents: { ...enPortalPages.carePages.documents, ...(overrides.carePages?.documents || {}) },
    },
    contextPages: {
      ...enPortalPages.contextPages,
      ...(overrides.contextPages || {}),
    },
    accountPages: {
      ...enPortalPages.accountPages,
      ...(overrides.accountPages || {}),
      profile: { ...enPortalPages.accountPages.profile, ...(overrides.accountPages?.profile || {}) },
      settings: { ...enPortalPages.accountPages.settings, ...(overrides.accountPages?.settings || {}) },
      privacy: { ...enPortalPages.accountPages.privacy, ...(overrides.accountPages?.privacy || {}) },
      help: { ...enPortalPages.accountPages.help, ...(overrides.accountPages?.help || {}) },
    },
  };
}

// ----------------------------------------------------------------------------
// TAMIL (ta)
// ----------------------------------------------------------------------------
export const taPortalPages: PortalPagesCopy = createLocalizedCopy({
  common: {
    notRecorded: 'பதிவு செய்யப்படவில்லை',
    yes: 'ஆம்',
    no: 'இல்லை',
    recorded: 'பதிவு செய்யப்பட்டது',
    status: 'நிலை',
  },
  activities: {
    appointments: 'மருத்துவ சந்திப்புகளை நினைவில் வைத்தல்',
    medication: 'மாத்திரைகளை உட்கொள்ளுதல்',
    finances: 'பணம் அல்லது கட்டணம் கையாளுதல்',
    household: 'வீட்டு வேலைகள்',
    shopping: 'மளிகை பொருட்கள் வாங்குதல்',
    transport: 'பயணம் மற்றும் நடமாட்டம்',
    cooking: 'சமையல் செய்தல்',
    communication: 'தொலைபேசி பயன்பாடு',
  },
  healthProfile: {
    ...enPortalPages.healthProfile,
    eyebrow: 'நோயாளி போர்டல் · ஆரோக்கிய சுயவிவரம்',
    title: 'ஆரோக்கிய விவரம் & பின்னணி',
    description: 'உடல் நலம், தூக்கம், வாழ்க்கை முறை, மருத்துவ வரலாறு மற்றும் குடும்பப் பராமரிப்பாளர் விவரங்கள்.',
    profileTitle: 'தனிப்பட்ட & பராமரிப்பு சுயவிவரம்',
    name: 'பெயர்',
    patientId: 'நோயாளி எண்',
    clinician: 'முதன்மை மருத்துவர்',
    caregiver: 'பராமரிப்பாளர் / ஆதரவு',
    physicalTitle: 'உடல் நலம் & வரலாறு',
    conditions: 'உடல் உபாதைகள்',
    medications: 'தற்போதைய மருந்துகள்',
    familyHistory: 'குடும்ப வரலாறு',
    previousAssessments: 'முந்தைய பரிசோதனைகள்',
  },
  dailyFunction: {
    ...enPortalPages.dailyFunction,
    eyebrow: 'நோயாளி போர்டல் · தினசரி செயல்பாடுகள்',
    title: 'தினசரி செயல்பாடுகள் குறித்த கேள்விகள்',
    description: 'நினைவாற்றல் அன்றாட வாழ்க்கை பணிகளை எவ்வாறு பாதிக்கிறது என்பதை அறியும் கேள்வித்தாள்.',
    emptyTitle: 'பதிவுகள் இல்லை',
    emptyDetail: 'தினசரி செயல்பாடுகள் குறித்த வினாக்கள் பரிசோதனையின் போது கேட்கப்படும்.',
  },
  timeline: {
    ...enPortalPages.timeline,
    eyebrow: 'நோயாளி போர்டல் · சுகாதார காலவரிசை',
    title: 'சுகாதார காலவரிசை & பதிவுகள்',
    description: 'மருத்துவமனை சந்திப்புகள் மற்றும் நரம்பியல் பரிசோதனை வரலாற்றின் காலவரிசை.',
    history: 'வரலாறு',
    trends: 'நீண்டகால போக்குகள்',
  },
  prevention: {
    ...enPortalPages.prevention,
    eyebrow: 'நோயாளி போர்டல் · வாழ்க்கை முறை தடுப்புத் திட்டம்',
    title: 'தனிப்பயனாக்கப்பட்ட தடுப்புத் திட்டம்',
    description: 'தூக்கம், உடற்பயிற்சி மற்றும் நினைவாற்றலைப் பாதுகாக்க உதவும் மருத்துவரின் பரிந்துரைகள்.',
  },
  monitoring: {
    ...enPortalPages.monitoring,
    overview: {
      ...enPortalPages.monitoring.overview,
      eyebrow: 'நோயாளி போர்டல் · நரம்பியல் கண்காணிப்பு',
      title: 'மூளை நலம் மற்றும் நீண்டகாலக் கண்காணிப்பு',
      description: 'பரிசோதனை முடிவுகள் மற்றும் நினைவாற்றல் நல நிலை குறித்த கண்ணோட்டம்.',
    },
    history: {
      ...enPortalPages.monitoring.history,
      eyebrow: 'நோயாளி போர்டல் · பரிசோதனை வரலாறு',
      title: 'முந்தைய பரிசோதனை வரலாறு',
      description: 'நீங்கள் மேற்கொண்ட அனைத்து நரம்பியல் ஸ்கிரீனிங் அமர்வுகளின் முழு விவரம்.',
    },
    trends: {
      ...enPortalPages.monitoring.trends,
      eyebrow: 'நோயாளி போர்டல் · நீண்டகால போக்குகள்',
      title: 'நீண்டகால மாற்றங்கள் & போக்குகள்',
      description: 'காலப்போக்கில் நினைவாற்றல் மற்றும் உடலியக்க மாற்றங்களை கண்காணிக்கும் வரைபடம்.',
    },
    change: {
      ...enPortalPages.monitoring.change,
      eyebrow: 'நோயாளி போர்டல் · மாற்றங்களை அறிதல்',
      title: 'நினைவாற்றல் மாற்றங்களை அறிதல்',
      description: 'முந்தைய அமர்வுகளுடன் ஒப்பிட்டு குறிப்பிடத்தக்க மாற்றங்களை மருத்துவர் மதிப்பாய்வு செய்கிறார்.',
    },
  },
  carePages: {
    ...enPortalPages.carePages,
    appointments: {
      ...enPortalPages.carePages.appointments,
      eyebrow: 'நோயாளி போர்டல் · மருத்துவ சந்திப்புகள்',
      title: 'மருத்துவ சந்திப்புகள்',
      description: 'உங்கள் ஆரம்ப சுகாதார நிலைய மருத்துவர் மற்றும் நரம்பியல் நிபுணர் சந்திப்புகள்.',
    },
    carePlan: {
      ...enPortalPages.carePages.carePlan,
      eyebrow: 'நோயாளி போர்டல் · பராமரிப்புத் திட்டம்',
      title: 'மருத்துவரின் பராமரிப்புத் திட்டம்',
      description: 'மருத்துவர் பரிந்துரைத்த வாழ்க்கை முறை மாற்றங்கள் மற்றும் பரிசோதனை இடைவெளிகள்.',
    },
    notifications: {
      ...enPortalPages.carePages.notifications,
      eyebrow: 'நோயாளி போர்டல் · அறிவிப்புகள்',
      title: 'மருத்துவ அறிவிப்புகள்',
      description: 'அடுத்த பரிசோதனை நினைவூட்டல்கள் மற்றும் மருத்துவரின் ஆலோசனைகள்.',
    },
    documents: {
      ...enPortalPages.carePages.documents,
      eyebrow: 'நோயாளி போர்டல் · மருத்துவ ஆவணங்கள்',
      title: 'மருத்துவ அறிக்கைகள் மற்றும் ஆவணங்கள்',
      description: 'பதிவிறக்கம் செய்யக்கூடிய மருத்துவ சுருக்கங்கள் மற்றும் ஆய்வக முடிவுகள்.',
    },
  },
  accountPages: {
    ...enPortalPages.accountPages,
    profile: {
      ...enPortalPages.accountPages.profile,
      eyebrow: 'நோயாளி போர்டல் · சுயவிவரம்',
      title: 'எனது சுயவிவரம்',
      description: 'உங்கள் தொடர்பு விவரங்கள், முகவரி மற்றும் அவசர தொலைபேசி எண்கள்.',
    },
    settings: {
      ...enPortalPages.accountPages.settings,
      eyebrow: 'நோயாளி போர்டல் · அமைப்புகள்',
      title: 'கணக்கு அமைப்புகள்',
      description: 'மொழி விருப்பங்கள், எழுத்து அளவு மற்றும் பார்வை வசதிகள்.',
    },
    privacy: {
      ...enPortalPages.accountPages.privacy,
      eyebrow: 'நோயாளி போர்டல் · தனியுரிமை',
      title: 'தனியுரிமை மற்றும் தரவு பாதுகாப்பு',
      description: 'உங்கள் மருத்துவ தரவுகள் எவ்வாறு பாதுகாப்பாக கையாளப்படுகின்றன என்பது பற்றிய தகவல்.',
    },
    help: {
      ...enPortalPages.accountPages.help,
      eyebrow: 'நோயாளி போர்டல் · உதவி',
      title: 'உதவி மற்றும் ஆதரவு',
      description: 'தொழில்நுட்ப உதவி, ஆஷா பணியாளர் தொடர்பு மற்றும் அவசர உதவி எண்கள்.',
    },
  },
});

// ----------------------------------------------------------------------------
// HINDI (hi)
// ----------------------------------------------------------------------------
export const hiPortalPages: PortalPagesCopy = createLocalizedCopy({
  common: {
    notRecorded: 'दर्ज नहीं किया गया',
    yes: 'हाँ',
    no: 'नहीं',
    recorded: 'दर्ज किया गया',
    status: 'स्थिति',
  },
  activities: {
    appointments: 'अपॉइंटमेंट याद रखना',
    medication: 'दवाइयां प्रबंधित करना',
    finances: 'पैसे और बिल संभालना',
    household: 'घर के दैनिक काम',
    shopping: 'सामान या खरीदारी',
    transport: 'यात्रा और आवागमन',
    cooking: 'खाना बनाना',
    communication: 'फोन का उपयोग और बातचीत',
  },
  healthProfile: {
    ...enPortalPages.healthProfile,
    eyebrow: 'रोगी पोर्टल · स्वास्थ्य प्रोफ़ाइल',
    title: 'स्वास्थ्य प्रोफ़ाइल एवं पृष्ठभूमि',
    description: 'शारीरिक स्वास्थ्य, नींद, जीवनशैली, चिकित्सा इतिहास और देखभालकर्ता विवरण।',
    name: 'नाम',
    patientId: 'रोगी आईडी',
    clinician: 'प्राथमिक चिकित्सक',
    caregiver: 'देखभालकर्ता / सहायता',
  },
  dailyFunction: {
    ...enPortalPages.dailyFunction,
    eyebrow: 'रोगी पोर्टल · दैनिक कार्य',
    title: 'दैनिक कार्यप्रणाली प्रश्नावली',
    description: 'स्मृति और दैनिक जीवन की गतिविधियों का सहज मूल्यांकन।',
  },
  timeline: {
    ...enPortalPages.timeline,
    eyebrow: 'रोगी पोर्टल · स्वास्थ्य समयरेखा',
    title: 'स्वास्थ्य समयरेखा और रिकॉर्ड्स',
    description: 'चिकित्सकीय परामर्श और संज्ञानात्मक जांच का कालक्रम।',
  },
  prevention: {
    ...enPortalPages.prevention,
    eyebrow: 'रोगी पोर्टल · रोकथाम योजना',
    title: 'व्यक्तिगत रोकथाम एवं जीवनशैली योजना',
    description: 'नींद, व्यायाम और मस्तिष्क स्वास्थ्य के लिए डॉक्टर की सलाह।',
  },
  monitoring: {
    ...enPortalPages.monitoring,
    overview: {
      ...enPortalPages.monitoring.overview,
      eyebrow: 'रोगी पोर्टल · न्यूरोलॉजिकल निगरानी',
      title: 'मस्तिष्क स्वास्थ्य और दीर्घकालिक निगरानी',
      description: 'जांच परिणाम और मस्तिष्क स्वास्थ्य का व्यापक अवलोकन।',
    },
    history: {
      ...enPortalPages.monitoring.history,
      eyebrow: 'रोगी पोर्टल · जांच इतिहास',
      title: 'पिछली जांचों का इतिहास',
      description: 'आपके द्वारा किए गए सभी संज्ञानात्मक सत्रों का रिकॉर्ड।',
    },
    trends: {
      ...enPortalPages.monitoring.trends,
      eyebrow: 'रोगी पोर्टल · दीर्घकालिक रुझान',
      title: 'दीर्घकालिक रुझान और परिवर्तन',
      description: 'समय के साथ मस्तिष्क स्वास्थ्य में आने वाले रुझान।',
    },
    change: {
      ...enPortalPages.monitoring.change,
      eyebrow: 'रोगी पोर्टल · परिवर्तन पहचान',
      title: 'संज्ञानात्मक परिवर्तन की पहचान',
      description: 'सत्रों के बीच महत्वपूर्ण अंतरों की चिकित्सकीय समीक्षा।',
    },
  },
  carePages: {
    ...enPortalPages.carePages,
    appointments: {
      ...enPortalPages.carePages.appointments,
      eyebrow: 'रोगी पोर्टल · अपॉइंटमेंट्स',
      title: 'चिकित्सा अपॉइंटमेंट्स',
      description: 'प्राथमिक स्वास्थ्य केंद्र और डॉक्टर से मिलने का समय।',
    },
    carePlan: {
      ...enPortalPages.carePages.carePlan,
      eyebrow: 'रोगी पोर्टल · देखभाल योजना',
      title: 'चिकित्सक देखभाल योजना',
      description: 'डॉक्टर द्वारा अनुशंसित जीवनशैली और अनुवर्ती जांच।',
    },
    notifications: {
      ...enPortalPages.carePages.notifications,
      eyebrow: 'रोगी पोर्टल · सूचनाएं',
      title: 'चिकित्सा सूचनाएं',
      description: 'आगामी जांच की याद दिलाना और स्वास्थ्य संदेश।',
    },
    documents: {
      ...enPortalPages.carePages.documents,
      eyebrow: 'रोगी पोर्टल · दस्तावेज़',
      title: 'चिकित्सा रिपोर्ट और दस्तावेज़',
      description: 'डाउनलोड करने योग्य मेडिकल सारांश और परीक्षण रिपोर्ट।',
    },
  },
  accountPages: {
    ...enPortalPages.accountPages,
    profile: {
      ...enPortalPages.accountPages.profile,
      eyebrow: 'रोगी पोर्टल · प्रोफ़ाइल',
      title: 'मेरी प्रोफ़ाइल',
      description: 'व्यक्तिगत जानकारी और आपातकालीन संपर्क।',
    },
    settings: {
      ...enPortalPages.accountPages.settings,
      eyebrow: 'रोगी पोर्टल · सेटिंग्स',
      title: 'खाता सेटिंग्स',
      description: 'भाषा, टेक्स्ट आकार और प्रदर्शन विकल्प।',
    },
    privacy: {
      ...enPortalPages.accountPages.privacy,
      eyebrow: 'रोगी पोर्टल · गोपनीयता',
      title: 'गोपनीयता और डेटा सुरक्षा',
      description: 'आपके स्वास्थ्य डेटा की सुरक्षा की गारंटी।',
    },
    help: {
      ...enPortalPages.accountPages.help,
      eyebrow: 'रोगी पोर्टल · सहायता',
      title: 'सहायता और संपर्क',
      description: 'आशा कार्यकर्ता संपर्क और आपातकालीन हेल्पलाइन।',
    },
  },
});

// ----------------------------------------------------------------------------
// TELUGU (te)
// ----------------------------------------------------------------------------
export const tePortalPages: PortalPagesCopy = createLocalizedCopy({
  common: {
    notRecorded: 'నమోదు కాలేదు',
    yes: 'అవును',
    no: 'కాదు',
    recorded: 'నమోదైనది',
    status: 'స్థితి',
  },
  activities: {
    appointments: 'అపాయింట్‌మెంట్లను గుర్తుంచుకోవడం',
    medication: 'మందులు వేసుకోవడం',
    finances: 'డబ్బులు మరియు బిల్లులు చెల్లించడం',
    household: 'ఇంటి పనులు',
    shopping: 'షాపింగ్ చేయడం',
    transport: 'ప్రయాణం మరియు తిరగడం',
    cooking: 'వంట చేయడం',
    communication: 'ఫోన్ ఉపయోగించడం',
  },
  healthProfile: {
    ...enPortalPages.healthProfile,
    eyebrow: 'రోగి పోర్టల్ · ఆరోగ్య ప్రొఫైల్',
    title: 'ఆరోగ్య ప్రొఫైల్ & వివరాలు',
    description: 'శారీరక ఆరోగ్యం, నిద్ర, జీవనశైలి, వైద్య చరిత్ర మరియు సంరక్షకుల సమాచారం.',
  },
  dailyFunction: {
    ...enPortalPages.dailyFunction,
    eyebrow: 'రోగి పోర్టల్ · రోజువారీ విధులు',
    title: 'రోజువారీ విధుల ప్రశ్నాపత్రం',
    description: 'జ్ఞాపకశక్తి మరియు దైనందిన పనుల పరిశీలన.',
  },
  timeline: {
    ...enPortalPages.timeline,
    eyebrow: 'రోగి పోర్టల్ · టైమ్‌లైన్',
    title: 'ఆరోగ్య కాలక్రమం & రికార్డులు',
    description: 'వైద్య సందర్శనలు మరియు నరాల పరీక్షల కాలక్రమ రికార్డు.',
  },
  prevention: {
    ...enPortalPages.prevention,
    eyebrow: 'రోగి పోర్టల్ · నివారణ ప్రణాళిక',
    title: 'వ్యక్తిగత నివారణ ప్రణాళిక',
    description: 'మెదడు ఆరోగ్యాన్ని కాపాడేందుకు జీవనశైలి సలహాలు.',
  },
  monitoring: {
    ...enPortalPages.monitoring,
    overview: {
      ...enPortalPages.monitoring.overview,
      eyebrow: 'రోగి పోర్టల్ · పర్యవేక్షణ',
      title: 'మెదడు ఆరోగ్యం మరియు దీర్ఘకాలిక పర్యవేక్షణ',
      description: 'పరీక్ష ఫలితాలు మరియు జ్ఞాపకశక్తి స్థితి అవలోకనం.',
    },
    history: {
      ...enPortalPages.monitoring.history,
      eyebrow: 'రోగి పోర్టల్ · చరిత్ర',
      title: 'మునుపటి పరీక్షల చరిత్ర',
      description: 'చేసిన అన్ని న్యూరోకాగ్నిటివ్ పరీక్షల పూర్తి జాబితా.',
    },
    trends: {
      ...enPortalPages.monitoring.trends,
      eyebrow: 'రోగి పోర్టల్ · ధోరణులు',
      title: 'దీర్ఘకాలిక మార్పులు & పోకడలు',
      description: 'సమయంతో పాటు ఆరోగ్యంలో వచ్చే మార్పుల గ్రాఫ్.',
    },
    change: {
      ...enPortalPages.monitoring.change,
      eyebrow: 'రోగి పోర్టల్ · మార్పులు',
      title: 'మార్పుల గుర్తింపు',
      description: 'మునుపటి పరీక్షలతో పోల్చి చూసే వైద్య సమీక్ష.',
    },
  },
  carePages: {
    ...enPortalPages.carePages,
    appointments: {
      ...enPortalPages.carePages.appointments,
      eyebrow: 'రోగి పోర్టల్ · అపాయింట్‌మెంట్లు',
      title: 'వైద్య అపాయింట్‌మెంట్లు',
      description: 'ప్రాథమిక ఆరోగ్య కేంద్రం వైద్యుల సందర్శన సమయాలు.',
    },
    carePlan: {
      ...enPortalPages.carePages.carePlan,
      eyebrow: 'రోగి పోర్టల్ · సంరక్షణ',
      title: 'సంరక్షణ ప్రణాళిక',
      description: 'వైద్యులు సూచించిన మందులు మరియు తదుపరి చర్యలు.',
    },
    notifications: {
      ...enPortalPages.carePages.notifications,
      eyebrow: 'రోగి పోర్టల్ · నోటిఫికేషన్లు',
      title: 'వైద్య నోటిఫికేషన్లు',
      description: 'పరీక్షల రిమైండర్లు మరియు ఆరోగ్య సమాచారం.',
    },
    documents: {
      ...enPortalPages.carePages.documents,
      eyebrow: 'రోగి పోర్టల్ · పత్రాలు',
      title: 'నివేదికలు మరియు పత్రాలు',
      description: 'డౌన్‌లోడ్ చేసుకోగల వైద్య నివేదికలు.',
    },
  },
  accountPages: {
    ...enPortalPages.accountPages,
    profile: {
      ...enPortalPages.accountPages.profile,
      eyebrow: 'రోగి పోర్టల్ · ప్రొఫైల్',
      title: 'నా ప్రొఫైల్',
      description: 'వ్యక్తిగత వివరాలు మరియు సంప్రదింపు సమాచారం.',
    },
    settings: {
      ...enPortalPages.accountPages.settings,
      eyebrow: 'రోగి పోర్టల్ · సెట్టింగ్‌లు',
      title: 'ఖాతా సెట్టింగ్‌లు',
      description: 'భాష ఎంపిక మరియు డిస్‌ప్లే ఎంపికలు.',
    },
    privacy: {
      ...enPortalPages.accountPages.privacy,
      eyebrow: 'రోగి పోర్టల్ · గోప్యత',
      title: 'గోప్యత మరియు డేటా భద్రత',
      description: 'మీ ఆరోగ్య సమాచార భద్రత హామీ.',
    },
    help: {
      ...enPortalPages.accountPages.help,
      eyebrow: 'రోగి పోర్టల్ · సహాయం',
      title: 'సహాయం మరియు మద్దతు',
      description: 'ఆశా కార్యకర్త సంప్రదింపు మరియు అత్యవసర హెల్ప్‌లైన్.',
    },
  },
});

// ----------------------------------------------------------------------------
// MALAYALAM (ml)
// ----------------------------------------------------------------------------
export const mlPortalPages: PortalPagesCopy = createLocalizedCopy({
  common: {
    notRecorded: 'രേഖപ്പെടുത്തിയിട്ടില്ല',
    yes: 'അതെ',
    no: 'അല്ല',
    recorded: 'രേഖപ്പെടുത്തി',
    status: 'നില',
  },
  activities: {
    appointments: 'അപ്പോയിന്റ്മെന്റുകൾ ഓർക്കുക',
    medication: 'മരുന്നുകൾ കഴിക്കുന്നത്',
    finances: 'പണമിടപാടുകൾ നടത്തുക',
    household: 'വീട്ടുജോലികൾ',
    shopping: 'സാധനങ്ങൾ വാങ്ങൽ',
    transport: 'യാത്ര ചെയ്യൽ',
    cooking: 'ഭക്ഷണം പാകം ചെയ്യൽ',
    communication: 'ഫോൺ ഉപയോഗം',
  },
  healthProfile: {
    ...enPortalPages.healthProfile,
    eyebrow: 'രോഗി പോർട്ടൽ · പ്രൊഫൈൽ',
    title: 'ആരോഗ്യ പ്രൊഫൈൽ',
    description: 'ശാരീരിക ആരോഗ്യം, ഉറക്കം, ജീവിതശൈലി, ചികിത്സാ ചരിത്രം എന്നിവ.',
  },
  dailyFunction: {
    ...enPortalPages.dailyFunction,
    eyebrow: 'രോഗി പോർട്ടൽ · ദൈനംദിന കാര്യങ്ങൾ',
    title: 'ദൈനംദിന പ്രവർത്തന ചോദ്യാവലി',
    description: 'ഓർമ്മശക്തിയും ദൈനംദിന ജീവിതവും തമ്മിലുള്ള വിലയിരുത്തൽ.',
  },
  timeline: {
    ...enPortalPages.timeline,
    eyebrow: 'രോഗി പോർട്ടൽ · ടൈംലൈൻ',
    title: 'ആരോഗ്യ ടൈംലൈൻ & രേഖകൾ',
    description: 'ആശുപത്രി സന്ദർശനങ്ങളുടെയും പരിശോധനകളുടെയും ചരിത്രം.',
  },
  prevention: {
    ...enPortalPages.prevention,
    eyebrow: 'രോഗി പോർട്ടൽ · പ്രതിരോധം',
    title: 'വ്യക്തിഗത പ്രതിരോധ പദ്ധതി',
    description: 'തലച്ചോറിന്റെ ആരോഗ്യം സംരക്ഷിക്കുന്നതിനുള്ള ജീവിതശൈലി നിർദ്ദേശങ്ങൾ.',
  },
  monitoring: {
    ...enPortalPages.monitoring,
    overview: {
      ...enPortalPages.monitoring.overview,
      eyebrow: 'രോഗി പോർട്ടൽ · നിരീക്ഷണം',
      title: 'തലച്ചോറിന്റെ ആരോഗ്യം & നിരീക്ഷണം',
      description: 'പരിശോധനാ ഫലങ്ങളുടെ സമഗ്രമായ അവലോകനം.',
    },
    history: {
      ...enPortalPages.monitoring.history,
      eyebrow: 'രോഗി പോർട്ടൽ · ചരിത്രം',
      title: 'മുൻകാല പരിശോധനാ ചരിത്രം',
      description: 'നിങ്ങൾ പൂർത്തിയാക്കിയ എല്ലാ പരിശോധനകളുടെയും വിവരങ്ങൾ.',
    },
    trends: {
      ...enPortalPages.monitoring.trends,
      eyebrow: 'രോഗി പോർട്ടൽ · പ്രവണതകൾ',
      title: 'ദീർഘകാല പ്രവണതകൾ',
      description: 'കാലക്രമേണ ഓർമ്മശക്തിയിലുണ്ടാകുന്ന മാറ്റങ്ങളുടെ ഗ്രാഫ്.',
    },
    change: {
      ...enPortalPages.monitoring.change,
      eyebrow: 'രോഗി പോർട്ടൽ · മാറ്റങ്ങൾ',
      title: 'മാറ്റങ്ങൾ തിരിച്ചറിയൽ',
      description: 'മുൻ പരിശോധനകളുമായി താരതമ്യം ചെയ്തുള്ള ക്ലിനിക്കൽ വിലയിരുത്തൽ.',
    },
  },
  carePages: {
    ...enPortalPages.carePages,
    appointments: {
      ...enPortalPages.carePages.appointments,
      eyebrow: 'രോഗി പോർട്ടൽ · അപ്പോയിന്റ്മെന്റുകൾ',
      title: 'അപ്പോയിന്റ്മെന്റുകൾ',
      description: 'പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിലെ ഡോക്ടർ സന്ദർശനം.',
    },
    carePlan: {
      ...enPortalPages.carePages.carePlan,
      eyebrow: 'രോഗി പോർട്ടൽ · പരിചരണം',
      title: 'ചികിത്സാ പരിചരണ പദ്ധതി',
      description: 'ഡോക്ടർ നിർദ്ദേശിച്ച പരിചരണ നടപടികൾ.',
    },
    notifications: {
      ...enPortalPages.carePages.notifications,
      eyebrow: 'രോഗി പോർട്ടൽ · അറിയിപ്പുകൾ',
      title: 'അറിയിപ്പുകൾ',
      description: 'പരിശോധന ഓർമ്മപ്പെടുത്തലുകളും നിർദ്ദേശങ്ങളും.',
    },
    documents: {
      ...enPortalPages.carePages.documents,
      eyebrow: 'രോഗി പോർട്ടൽ · രേഖകൾ',
      title: 'മെഡിക്കൽ റിപ്പോർട്ടുകൾ',
      description: 'ഡൗൺലോഡ് ചെയ്യാവുന്ന പരിശോധനാ റിപ്പോർട്ടുകൾ.',
    },
  },
  accountPages: {
    ...enPortalPages.accountPages,
    profile: {
      ...enPortalPages.accountPages.profile,
      eyebrow: 'രോഗി പോർട്ടൽ · പ്രൊഫൈൽ',
      title: 'എന്റെ പ്രൊഫൈൽ',
      description: 'വ്യക്തിഗത വിവരങ്ങളും അടിയന്തര നമ്പറുകളും.',
    },
    settings: {
      ...enPortalPages.accountPages.settings,
      eyebrow: 'രോഗി പോർട്ടൽ · ക്രമീകരണങ്ങൾ',
      title: 'അക്കൗണ്ട് ക്രമീകരണങ്ങൾ',
      description: 'ഭാഷയും കാഴ്ച സൗകര്യങ്ങളും.',
    },
    privacy: {
      ...enPortalPages.accountPages.privacy,
      eyebrow: 'രോഗി പോർട്ടൽ · സ്വകാര്യത',
      title: 'സ്വകാര്യതയും സുരക്ഷയും',
      description: 'ഡാറ്റാ സംരക്ഷണം ഉറപ്പാക്കുന്നു.',
    },
    help: {
      ...enPortalPages.accountPages.help,
      eyebrow: 'രോഗി പോർട്ടൽ · സഹായം',
      title: 'സഹಾಯവും പിന്തുണയും',
      description: 'ആശ പ്രവർത്തകരുടെ സമ്പർക്ക വിവരങ്ങൾ.',
    },
  },
});

// ----------------------------------------------------------------------------
// KANNADA (kn)
// ----------------------------------------------------------------------------
export const knPortalPages: PortalPagesCopy = createLocalizedCopy({
  common: {
    notRecorded: 'ದಾಖಲಾಗಿಲ್ಲ',
    yes: 'ಹೌದು',
    no: 'ಇಲ್ಲ',
    recorded: 'ದಾಖಲಿಸಲಾಗಿದೆ',
    status: 'ಸ್ಥಿತಿ',
  },
  activities: {
    appointments: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ನೆನಪಿಡುವುದು',
    medication: 'ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದು',
    finances: 'ಹಣಕಾಸು ನಿರ್ವಹಣೆ',
    household: 'ಮನೆ ಕೆಲಸಗಳು',
    shopping: 'ಸಾಮಾನು ಖರೀದಿ',
    transport: 'ಓಡಾಟ ಮತ್ತು ಪ್ರಯಾಣ',
    cooking: 'ಅಡುಗೆ ಮಾಡುವುದು',
    communication: 'ದೂರವಾಣಿ ಬಳಕೆ',
  },
  healthProfile: {
    ...enPortalPages.healthProfile,
    eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಪ್ರೊಫೈಲ್',
    title: 'ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್',
    description: 'ದೈಹಿಕ ಆರೋಗ್ಯ, ನಿದ್ರೆ, ಜೀವನಶೈಲಿ, ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ ಮತ್ತು ಆರೈಕೆದಾರರ ವಿವರಗಳು.',
  },
  dailyFunction: {
    ...enPortalPages.dailyFunction,
    eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ದೈನಂದಿನ ಕಾರ್ಯ',
    title: 'ದೈನಂದಿನ ಕಾರ್ಯ ಪ್ರಶ್ನಾವಳಿ',
    description: 'ಜ್ಞಾಪಕಶಕ್ತಿ ಮತ್ತು ದೈನಂದಿನ ಚಟುವಟಿಕೆಗಳ ಮೌಲ್ಯಮಾಪನ.',
  },
  timeline: {
    ...enPortalPages.timeline,
    eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಟೈಮ್‌ಲೈನ್',
    title: 'ಆರೋಗ್ಯ ಕಾಲಾವಧಿ & ದಾಖಲೆಗಳು',
    description: 'ಆಸ್ಪತ್ರೆ ಭೇಟಿಗಳು ಮತ್ತು ಪರೀಕ್ಷೆಗಳ ಕಾಲಾನುಕ್ರಮ ದಾಖಲೆ.',
  },
  prevention: {
    ...enPortalPages.prevention,
    eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ತಡೆಗಟ್ಟುವಿಕೆ',
    title: 'ವೈಯಕ್ತಿಕ ತಡೆಗಟ್ಟುವಿಕೆ ಯೋಜನೆ',
    description: 'ಮೆದುಳಿನ ಆರೋಗ್ಯವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ವೈದ್ಯರ ಜೀವನಶೈಲಿ ಸಲಹೆಗಳು.',
  },
  monitoring: {
    ...enPortalPages.monitoring,
    overview: {
      ...enPortalPages.monitoring.overview,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಮೇಲ್ವಿಚಾರಣೆ',
      title: 'ಮೆದುಳಿನ ಆರೋಗ್ಯ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆ',
      description: 'ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಸ್ಥಿತಿಯ ಸಮಗ್ರ ನೋಟ.',
    },
    history: {
      ...enPortalPages.monitoring.history,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಇತಿಹಾಸ',
      title: 'ಹಿಂದಿನ ತಪಾಸಣಾ ಇತಿಹಾಸ',
      description: 'ನೀವು ಪೂರ್ಣಗೊಳಿಸಿದ ಎಲ್ಲಾ ತಪಾಸಣೆಗಳ ಪೂರ್ಣ ವಿವರ.',
    },
    trends: {
      ...enPortalPages.monitoring.trends,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಪ್ರವೃತ್ತಿಗಳು',
      title: 'ದೀರ್ಘಕಾಲೀನ ಪ್ರವೃತ್ತಿಗಳು',
      description: 'ಕಾಲಕ್ರಮೇಣ ಆರೋಗ್ಯದಲ್ಲಿನ ಬದಲಾವಣೆಗಳನ್ನು ತೋರಿಸುವ ನಕ್ಷೆ.',
    },
    change: {
      ...enPortalPages.monitoring.change,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಬದಲಾವಣೆಗಳು',
      title: 'ಬದಲಾವಣೆಗಳ ಗುರುತಿಸುವಿಕೆ',
      description: 'ಹಿಂದಿನ ತಪಾಸಣೆಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ.',
    },
  },
  carePages: {
    ...enPortalPages.carePages,
    appointments: {
      ...enPortalPages.carePages.appointments,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
      title: 'ವೈದ್ಯಕೀಯ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
      description: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ ವೈದ್ಯರ ಭೇಟಿಯ ಸಮಯ.',
    },
    carePlan: {
      ...enPortalPages.carePages.carePlan,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಆರೈಕೆ',
      title: 'ಆರೈಕೆ ಯೋಜನೆ',
      description: 'ವೈದ್ಯರು ಸೂಚಿಸಿದ ಆರೈಕೆ ಕ್ರಮಗಳು ಮತ್ತು ಮಾತ್ರೆಗಳು.',
    },
    notifications: {
      ...enPortalPages.carePages.notifications,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಸೂಚನೆಗಳು',
      title: 'ವೈದ್ಯಕೀಯ ಸೂಚನೆಗಳು',
      description: 'ತಪಾಸಣೆಯ ಜ್ಞಾಪನೆಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಸಂದೇಶಗಳು.',
    },
    documents: {
      ...enPortalPages.carePages.documents,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ದಾಖಲೆಗಳು',
      title: 'ವರದಿಗಳು ಮತ್ತು ದಾಖಲೆಗಳು',
      description: 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದಾದ ವೈದ್ಯಕೀಯ ವರದಿಗಳು.',
    },
  },
  accountPages: {
    ...enPortalPages.accountPages,
    profile: {
      ...enPortalPages.accountPages.profile,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಪ್ರೊಫೈಲ್',
      title: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
      description: 'ವೈಯಕ್ತಿಕ ವಿವರಗಳು ಮತ್ತು ತುರ್ತು ಸಂಪರ್ಕಗಳು.',
    },
    settings: {
      ...enPortalPages.accountPages.settings,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      title: 'ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      description: 'ಭಾಷೆ ಮತ್ತು ಪ್ರದರ್ಶನ ಆಯ್ಕೆಗಳು.',
    },
    privacy: {
      ...enPortalPages.accountPages.privacy,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಗೌಪ್ಯತೆ',
      title: 'ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ ಸುರಕ್ಷತೆ',
      description: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯ ಭದ್ರತೆ.',
    },
    help: {
      ...enPortalPages.accountPages.help,
      eyebrow: 'ರೋಗಿ ಪೋರ್ಟಲ್ · ಸಹಾಯ',
      title: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
      description: 'ಆಶಾ ಕಾರ್ಯಕರ್ತರ ಸಂಪರ್ಕ ಮತ್ತು ತುರ್ತು ಸಹಾಯವಾಣಿ.',
    },
  },
});
