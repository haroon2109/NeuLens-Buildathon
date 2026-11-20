import type { LandingCopy } from './landingCopy';
import { en as enLandingCopy } from './landingCopy.en';

export function createLocalizedLandingCopy(overrides: Partial<LandingCopy>): LandingCopy {
  return {
    ...enLandingCopy,
    ...overrides,
    nav: overrides.nav || enLandingCopy.nav,
    header: { ...enLandingCopy.header, ...(overrides.header || {}) },
    hero: { ...enLandingCopy.hero, ...(overrides.hero || {}) },
    tagline: { ...enLandingCopy.tagline, ...(overrides.tagline || {}) },
    challenge: { ...enLandingCopy.challenge, ...(overrides.challenge || {}) },
    approach: { ...enLandingCopy.approach, ...(overrides.approach || {}) },
    measurement: { ...enLandingCopy.measurement, ...(overrides.measurement || {}) },
    how: { ...enLandingCopy.how, ...(overrides.how || {}) },
    baseline: { ...enLandingCopy.baseline, ...(overrides.baseline || {}) },
    context: { ...enLandingCopy.context, ...(overrides.context || {}) },
    oversight: { ...enLandingCopy.oversight, ...(overrides.oversight || {}) },
    clinicians: { ...enLandingCopy.clinicians, ...(overrides.clinicians || {}) },
    research: { ...enLandingCopy.research, ...(overrides.research || {}) },
    faq: { ...enLandingCopy.faq, ...(overrides.faq || {}) },
    demoForm: { ...enLandingCopy.demoForm, ...(overrides.demoForm || {}) },
    contact: { ...enLandingCopy.contact, ...(overrides.contact || {}) },
    footer: { ...enLandingCopy.footer, ...(overrides.footer || {}) },
  };
}

// ============================================================================
// TAMIL (ta)
// ============================================================================
export const taLandingCopy: LandingCopy = createLocalizedLandingCopy({
  nav: [
    { label: 'சவால்', href: '#challenge' },
    { label: 'எங்கள் அணுகுமுறை', href: '#approach' },
    { label: 'பரிசோதனை முறை', href: '#measurement' },
    { label: 'செயல்படும் விதம்', href: '#how-it-works' },
    { label: 'மருத்துவர்களுக்கு', href: '#for-clinicians' },
    { label: 'ஆய்வுகள்', href: '#research' },
  ],
  header: {
    ...enLandingCopy.header,
    clinicianPortal: 'மருத்துவர் போர்டல்',
    patientPortal: 'நோயாளி போர்டல்',
    explore: 'செயல்படும் முறையை அறிக',
    language: 'மொழி',
  },
  hero: {
    ...enLandingCopy.hero,
    eyebrow: 'மூளை நலம் | ஆரம்பகால ஸ்கிரீனிங்',
    titleLine1: 'மூளை நலனைப் புரிந்துகொள்வோம்.',
    titleLine2: 'மாற்றங்களை முன்கூட்டியே கண்டறிவோம்.',
    lead: 'நியூல்ன்ஸ் அறிவாற்றல், கண் பார்வை, குரல் ஒலிப்பு மற்றும் முக அசைவுகளை ஒரே அமைதியான பரிசோதனை அமர்வில் ஒருங்கிணைக்கிறது — தனிநபர் அடிப்படை நிலையை உருவாக்கவும் முன்கூட்டியே மருத்துவ ஆலோசனைகளைத் தொடங்கவும் உதவுகிறது.',
    audience: 'நரம்பியல் நிபுணர்கள், முதியோர் நல மருத்துவர்கள், மருத்துவமனைகள் மற்றும் ஆரம்ப சுகாதார நிலையங்களுக்காக உருவாக்கப்பட்டது.',
    patientPortal: 'நோயாளி போர்டல்',
    explore: 'செயல்படும் முறையை அறிக',
    disclaimer: 'முன்மாதிரி வடிவம் · முழு மருத்துவ சான்றளிக்கப்படவில்லை · மருத்துவரின் நேரடி மேற்பார்வைக்கு மட்டுமே',
    clinicianSupervised: 'மருத்துவரின் மேற்பார்வையில்',
    fourTypes: 'நான்கு பரிசோதனை முறைகள்',
    oneSession: 'ஒரே வழிகாட்டப்பட்ட அமர்வு',
  },
  tagline: {
    ...enLandingCopy.tagline,
    eyebrow: 'எங்கள் பார்வை',
    statement: 'ஆரம்ப விழிப்புணர்வு என்பது ஒவ்வொரு தனிநபரின் மாற்றத்தையும் துல்லியமாக அறிவதிலிருந்து தொடங்குகிறது.',
    body: 'மக்கள் தொகை சராசரிகள் ஒரு பொதுவான குழுவை மட்டுமே விவரிக்கும். தனிநபர் அடிப்படை பதிவுகள் மட்டுமே ஒருவருக்கு ஏற்பட்டுள்ள மாற்றத்தின் உண்மையான மருத்துவ முக்கியத்துவத்தை வெளிப்படுத்தும்.',
  },
  challenge: {
    ...enLandingCopy.challenge,
    eyebrow: 'மருத்துவ சவால்',
    title: 'மாற்றங்கள் மெதுவாகவே நிகழ்கின்றன. சிகிச்சையோ தாமதமாகிறது.',
    lead: 'நினைவாற்றல் மற்றும் அன்றாட செயல்பாட்டு மாற்றங்கள் வழக்கமான உரையாடலில் வெளிப்படுவதற்கு முன்பே தொடங்குகின்றன. சவால் அவற்றைக் கவனிப்பது மட்டுமல்ல — இந்த நபருக்கு எந்த மாற்றம் முக்கியமானது என்பதை அறிவதுதான்.',
  },
  approach: {
    ...enLandingCopy.approach,
    eyebrow: 'நியூல்ன்ஸ் அணுகுமுறை',
    title: 'தனிநபரை மையமாகக் கொண்ட பன்முக மருத்துவப் பார்வை.',
    lead: 'நான்கு வகையான உடலியக்க அவதானிப்புகளை ஒரே அமைதியான அமர்வில் ஒருங்கிணைக்கிறது. மருத்துவரின் அனுபவ முடிவுகளுக்கு மாற்றாக இல்லாமல், அவர்களுக்கு தெளிவான மருத்துவத் தகவல்களை வழங்குகிறது.',
  },
  footer: {
    ...enLandingCopy.footer,
    tagline: 'முன்கூட்டியே மூளை நல மாற்றங்களை கண்டறிவதற்கான மருத்துவத் தளம்.',
    clinicianPortal: 'மருத்துவர் போர்டல்',
    patientPortal: 'நோயாளி போர்டல்',
    rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  },
});

// ============================================================================
// HINDI (hi)
// ============================================================================
export const hiLandingCopy: LandingCopy = createLocalizedLandingCopy({
  nav: [
    { label: 'चुनौतियां', href: '#challenge' },
    { label: 'हमारा दृष्टिकोण', href: '#approach' },
    { label: 'मापन विधि', href: '#measurement' },
    { label: 'यह कैसे काम करता है', href: '#how-it-works' },
    { label: 'डॉक्टरों के लिए', href: '#for-clinicians' },
    { label: 'शोध', href: '#research' },
  ],
  header: {
    ...enLandingCopy.header,
    clinicianPortal: 'चिकित्सक पोर्टल',
    patientPortal: 'रोगी पोर्टल',
    explore: 'जानें यह कैसे काम करता है',
    language: 'भाषा',
  },
  hero: {
    ...enLandingCopy.hero,
    eyebrow: 'मस्तिष्क स्वास्थ्य | प्रारंभिक जांच',
    titleLine1: 'मस्तिष्क स्वास्थ्य को समझें।',
    titleLine2: 'परिवर्तनों को समय रहते पहचानें।',
    lead: 'न्यूलेंस संज्ञानात्मक, दृष्टि, आवाज़ और चेहरे के भावों को एक ही संरचित जांच सत्र में एक साथ लाता है — व्यक्तिगत मस्तिष्क-स्वास्थ्य आधार रेखा बनाने और समय रहते चिकित्सीय चर्चा को सक्षम करने के लिए।',
    audience: 'न्यूरोलॉजिस्ट, वृद्धावस्था विशेषज्ञ, अस्पताल, क्लीनिक और प्राथमिक स्वास्थ्य केंद्रों के लिए निर्मित।',
    patientPortal: 'रोगी पोर्टल',
    explore: 'जानें यह कैसे काम करता है',
    disclaimer: 'प्रोटोटाइप · चिकित्सकीय रूप से प्रमाणित नहीं · केवल चिकित्सक की देखरेख में उपयोग के लिए',
    clinicianSupervised: 'चिकित्सक की देखरेख में',
    fourTypes: 'चार अवलोकन प्रकार',
    oneSession: 'एक निर्देशित सत्र',
  },
  tagline: {
    ...enLandingCopy.tagline,
    eyebrow: 'हमारा दृष्टिकोण',
    statement: 'प्रारंभिक जागरूकता की शुरुआत यह जानने से होती है कि प्रत्येक व्यक्ति के लिए परिवर्तन का क्या अर्थ है।',
    body: 'जनसंख्या औसत केवल एक समूह का वर्णन कर सकते हैं। व्यक्तिगत आधार रेखाएं डॉक्टर को यह समझने में मदद करती हैं कि किसी व्यक्ति के लिए बदलाव का क्या महत्व है।',
  },
  challenge: {
    ...enLandingCopy.challenge,
    eyebrow: 'चिकित्सकीय चुनौती',
    title: 'परिवर्तन अक्सर धीमा होता है। देखभाल अक्सर देर से मिलती है।',
    lead: 'संज्ञानात्मक और दैनिक कार्यप्रणाली में बदलाव नियमित बातचीत में स्पष्ट होने से बहुत पहले शुरू हो सकते हैं। चुनौती केवल उन्हें पहचानना नहीं है — यह जानना है कि इस व्यक्ति के लिए कौन से बदलाव मायने रखते हैं।',
  },
  approach: {
    ...enLandingCopy.approach,
    eyebrow: 'न्यूलेंस दृष्टिकोण',
    title: 'व्यक्ति-केंद्रित एक संरचित, बहु-आयामी दृष्टिकोण।',
    lead: 'न्यूलेंस चार प्रकार के अवलोकनों को एक शांत सत्र में जोड़ता है। इसका उद्देश्य डॉक्टर के निर्णय को बदलना नहीं, बल्कि उन्हें स्पष्ट जानकारी प्रदान करना है।',
  },
  footer: {
    ...enLandingCopy.footer,
    tagline: 'मस्तिष्क स्वास्थ्य में प्रारंभिक परिवर्तनों की पहचान के लिए चिकित्सकीय मंच।',
    clinicianPortal: 'चिकित्सक पोर्टल',
    patientPortal: 'रोगी पोर्टल',
    rights: 'सर्वाधिकार सुरक्षित।',
  },
});

// ============================================================================
// TELUGU (te)
// ============================================================================
export const teLandingCopy: LandingCopy = createLocalizedLandingCopy({
  nav: [
    { label: 'సవాలు', href: '#challenge' },
    { label: 'మా విధానం', href: '#approach' },
    { label: 'పరీక్షా పద్ధతి', href: '#measurement' },
    { label: 'ఎలా పనిచేస్తుంది', href: '#how-it-works' },
    { label: 'వైద్యుల కోసం', href: '#for-clinicians' },
    { label: 'పరిశోధన', href: '#research' },
  ],
  header: {
    ...enLandingCopy.header,
    clinicianPortal: 'వైద్యుల పోర్టల్',
    patientPortal: 'రోగి పోర్టల్',
    explore: 'ఎలా పనిచేస్తుందో చూడండి',
    language: 'భాష',
  },
  hero: {
    ...enLandingCopy.hero,
    eyebrow: 'మెదడు ఆరోగ్యం | ముందస్తు పరీక్ష',
    titleLine1: 'మెదడు ఆరోగ్యాన్ని అర్థం చేసుకోండి.',
    titleLine2: 'మార్పులను ముందే గుర్తించండి.',
    lead: 'న్యూలెన్స్ జ్ఞాపకశక్తి, కంటి చూపు, స్వరం మరియు ముఖ కదలికలను ఒకే సులభమైన పరీక్షలో పరిశీలిస్తుంది — వ్యక్తిగత ఆరోగ్య రికార్డును నిర్వహించడానికి సహాయపడుతుంది.',
    audience: 'న్యూరాలజిస్టులు, వృద్ధాప్య నిపుణులు, ఆసుపత్రులు మరియు ఆరోగ్య కేంద్రాల కోసం రూపొందించబడింది.',
    patientPortal: 'రోగి పోర్టల్',
    explore: 'ఎలా పనిచేస్తుందో చూడండి',
    disclaimer: 'నమూనా రూపకల్పన · వైద్యుల పర్యవేక్షణలో మాత్రమే ఉపయోగించాలి',
    clinicianSupervised: 'వైద్యుల పర్యవేక్షణలో',
    fourTypes: 'నాలుగు పరిశీలన పద్ధతులు',
    oneSession: 'ఒకే మార్గదర్శక సెషన్',
  },
  footer: {
    ...enLandingCopy.footer,
    tagline: 'మెదడు ఆరోగ్య మార్పులను ముందస్తుగా గుర్తించే వేదిక.',
    clinicianPortal: 'వైద్యుల పోర్టల్',
    patientPortal: 'రోగి పోర్టల్',
    rights: 'అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.',
  },
});

// ============================================================================
// MALAYALAM (ml)
// ============================================================================
export const mlLandingCopy: LandingCopy = createLocalizedLandingCopy({
  nav: [
    { label: 'വെല്ലുവിളി', href: '#challenge' },
    { label: 'ഞങ്ങളുടെ സമീപനം', href: '#approach' },
    { label: 'പരിശോധനാ രീതി', href: '#measurement' },
    { label: 'പ്രവർത്തിക്കുന്ന രീതി', href: '#how-it-works' },
    { label: 'ഡോക്ടർമാർക്കായി', href: '#for-clinicians' },
    { label: 'ഗവേഷണം', href: '#research' },
  ],
  header: {
    ...enLandingCopy.header,
    clinicianPortal: 'ഡോക്ടർ പോർട്ടൽ',
    patientPortal: 'രോഗി പോർട്ടൽ',
    explore: 'പ്രവർത്തിക്കുന്ന രീതി അറിയുക',
    language: 'ഭാഷ',
  },
  hero: {
    ...enLandingCopy.hero,
    eyebrow: 'തലച്ചോറിന്റെ ആരോഗ്യം | നേരത്തെയുള്ള സ്ക്രീനിംഗ്',
    titleLine1: 'തലച്ചോറിന്റെ ആരോഗ്യം മനസ്സിലാക്കുക.',
    titleLine2: 'മാറ്റങ്ങൾ നേരത്തെ തിരിച്ചറിയുക.',
    lead: 'ഓർമ്മശക്തി, കണ്ണിന്റെ ചലനം, ശബ്ദം, മുഖഭാവങ്ങൾ എന്നിവ ഒരു ലളിതമായ പരിശോധനയിലൂടെ ന്യൂലെൻസ് വിലയിരുത്തുന്നു.',
    audience: 'ന്യൂറോളജിസ്റ്റുകൾ, ആശുപത്രികൾ, പ്രാഥമിക ആരോഗ്യ കേന്ദ്രങ്ങൾ എന്നിവയ്ക്കായി തയ്യാറാക്കിയത്.',
    patientPortal: 'രോഗി പോർട്ടൽ',
    explore: 'പ്രവർത്തിക്കുന്ന രീതി അറിയുക',
    disclaimer: 'പ്രോട്ടോടൈപ്പ് · ഡോക്ടറുടെ നേരിട്ടുള്ള മേൽനോട്ടത്തിൽ മാത്രം ഉപയോഗിക്കുക',
    clinicianSupervised: 'ഡോക്ടറുടെ മേൽനോട്ടത്തിൽ',
    fourTypes: 'നാല് നിരീക്ഷണ രീതികൾ',
    oneSession: 'ഒരു സെഷൻ',
  },
  footer: {
    ...enLandingCopy.footer,
    tagline: 'തലച്ചോറിന്റെ ആരോഗ്യ മാറ്റങ്ങൾ നേരത്തെ തിരിച്ചറിയാനുള്ള ക്ലിനിക്കൽ പ്ലാറ്റ്‌ഫോം.',
    clinicianPortal: 'ഡോക്ടർ പോർട്ടൽ',
    patientPortal: 'രോഗി പോർട്ടൽ',
    rights: 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
  },
});

// ============================================================================
// KANNADA (kn)
// ============================================================================
export const knLandingCopy: LandingCopy = createLocalizedLandingCopy({
  nav: [
    { label: 'ಸವಾಲು', href: '#challenge' },
    { label: 'ನಮ್ಮ ವಿಧಾನ', href: '#approach' },
    { label: 'ಮಾಪನ ವಿಧಾನ', href: '#measurement' },
    { label: 'ಕಾರ್ಯನಿರ್ವಹಣೆ', href: '#how-it-works' },
    { label: 'ವೈದ್ಯರಿಗಾಗಿ', href: '#for-clinicians' },
    { label: 'ಸಂಶೋಧನೆ', href: '#research' },
  ],
  header: {
    ...enLandingCopy.header,
    clinicianPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್',
    patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    explore: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ತಿಳಿಯಿರಿ',
    language: 'ಭಾಷೆ',
  },
  hero: {
    ...enLandingCopy.hero,
    eyebrow: 'ಮೆದುಳಿನ ಆರೋಗ್ಯ | ಆರಂಭಿಕ ತಪಾಸಣೆ',
    titleLine1: 'ಮೆದುಳಿನ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
    titleLine2: 'ಬದಲಾವಣೆಗಳನ್ನು ಮೊದಲೇ ಗುರುತಿಸಿ.',
    lead: 'ನ್ಯೂಲೆನ್ಸ್ ಜ್ಞಾಪಕಶಕ್ತಿ, ದೃಷ್ಟಿ, ಧ್ವನಿ ಮತ್ತು ಮುಖದ ಚಲನೆಗಳನ್ನು ಒಂದು ಸರಳ ತಪಾಸಣಾ ಅವಧಿಯಲ್ಲಿ ಸಂಯೋಜಿಸುತ್ತದೆ.',
    audience: 'ನರಶಾಸ್ತ್ರಜ್ಞರು, ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
    patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    explore: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ತಿಳಿಯಿರಿ',
    disclaimer: 'ಮಾದರಿ ರೂಪ · ವೈದ್ಯರ ನೇರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ ಮಾತ್ರ ಬಳಸಿ',
    clinicianSupervised: 'ವೈದ್ಯರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ',
    fourTypes: 'ನಾಲ್ಕು ವೀಕ್ಷಣಾ ವಿಧಗಳು',
    oneSession: 'ಒಂದು ಮಾರ್ಗದರ್ಶಿ ಅವಧಿ',
  },
  footer: {
    ...enLandingCopy.footer,
    tagline: 'ಮೆದುಳಿನ ಆರೋಗ್ಯ ಬದಲಾವಣೆಗಳನ್ನು ಮೊದಲೇ ಗುರುತಿಸುವ ವೈದ್ಯಕೀಯ ವೇದಿಕೆ.',
    clinicianPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್',
    patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    rights: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
  },
});
