import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Globe,
  HeartPulse,
  PhoneCall,
  Activity,
  ShieldCheck,
  Stethoscope,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { treatmentTeam, usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { MotionReveal } from '../../../components/motion/Reveal';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';
import type { SupportedLanguage } from '../../../services/language/types';

// ============================================================================
// DYNAMIC DASHBOARD STRINGS FOR ALL 6 INDIC & ENGLISH LANGUAGES
// English, Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml), Kannada (kn)
// ============================================================================
const dashboardCopyByLang: Record<string, any> = {
  en: {
    comfortEyebrow: 'Senior Citizen Care',
    comfortSubtitle: 'Large buttons, clear voice guidance, zero clinical jargon.',
    listenBtn: 'Listen to Overview',
    stopVoiceBtn: 'Stop Voice',
    statusPill: 'All is Normal & Healthy',
    abhaPill: 'Ayushman Bharat Linked',
    greeting: (name: string, isMorning: boolean) =>
      isMorning ? `Good morning, ${name}` : `Welcome back, ${name}`,
    summary:
      'Your brain health, memory recall, and reflexes are completely healthy and matching your normal baseline. No signs of unexpected decline.',
    docNoteTitle: "Doctor's Clinical Note",
    docNoteBody:
      '"Patient is active and oriented. Eye tracking and speech tempo are well preserved. Recommended to continue routine morning walks and memory activities."',
    docSign: 'Dr. Priya Sundaram (PHC Medical Officer) · 18 Nov 2026',
    startCheckin: 'Start 5-Minute Check-in',
    protocolNote: 'PHC Certified Clinical Protocol · ICMR Guidelines',
    healthIndex: 'Health Index',
    healthyRange: 'Healthy Geriatric Range',
    lastChecked: 'Last checked: 18 Nov 2026',
    screensTitle: 'Important Care Screens',
    screensSubtitle: 'The 4 essential screens you and your family need. Tap any card below.',
    cardAshaTag: 'Family / ASHA Help',
    cardAshaTitle: 'ASHA & Caregiver Assisted Mode',
    cardAshaDesc: 'Assisted screening setup. Pre-check glasses, hearing aid, and caregiver observation notes.',
    cardAshaBtn: 'Open ASHA Companion',
    cardAbhaTag: 'Govt PM-JAY Cover',
    cardAbhaTitle: 'Ayushman Bharat (ABHA) Card',
    cardAbhaDesc: '14-digit ABHA health ID, ₹5 Lakh senior coverage, and Primary Health Centre linkage.',
    cardAbhaBtn: 'View Health Card',
    cardVitalsTag: 'BP: 128/82 mmHg',
    cardVitalsTitle: 'Daily Medicines & Blood Pressure',
    cardVitalsDesc: 'Track morning, afternoon, and night pill doses with large touch targets.',
    cardVitalsBtn: 'Open Vitals & Meds',
    cardEmergencyTag: 'Dial 14416 / 108',
    cardEmergencyTitle: 'Emergency 1-Tap SOS Alert',
    cardEmergencyDesc: 'Instant alert with GPS coordinates to registered family, local PHC ambulance, and 14416.',
    cardEmergencyBtn: 'Emergency Contacts',
    habitsTitle: "Today's Simple Healthy Habits",
    habitsSubtitle: 'Tap to mark complete. Good habits keep memory sharp and blood pressure stable.',
    habitWalkTitle: '15-Min Morning Stroll',
    habitWalkDesc: 'Cardiovascular flow supports brain health.',
    habitMedsTitle: 'Morning Blood Pressure Pill',
    habitMedsDesc: 'Taken with breakfast (Telmisartan 40mg).',
    habitWaterTitle: 'Adequate Water',
    habitWaterDesc: 'Hydration prevents mental fatigue.',
    phcTitle: 'Primary Health Centre',
    caregiverPhone: 'Family Caregiver: Karthik (Son: +91 98401 23456)',
    callSonBtn: 'Call Son (Karthik)',
    appointmentsBtn: 'PHC Appointments',
    spokenText: (name: string) =>
      `Hello ${name}. Your brain health is completely stable and healthy. Your doctor and family are linked with you. Tap the green button to begin your 5-minute memory check-in.`
  },
  ta: {
    comfortEyebrow: 'முதியோர் நலப்பிரிவு',
    comfortSubtitle: 'பெரிய பொத்தான்கள், தெளிவான குரல் வழிகாட்டுதல், எளிய விளக்கம்.',
    listenBtn: 'குரல் வழியே கேட்க',
    stopVoiceBtn: 'குரலை நிறுத்து',
    statusPill: 'நினைவாற்றல் நலமாக உள்ளது',
    abhaPill: 'ஆயுஷ்மான் பாரத் இணைக்கப்பட்டது',
    greeting: (name: string, isMorning: boolean) =>
      isMorning ? `காலை வணக்கம், ${name}` : `வணக்கம், ${name}`,
    summary:
      'உங்கள் மூளை நலம், நினைவாற்றல் மற்றும் உடலியக்க அசைவுகள் அனைத்தும் முற்றிலும் இயல்பாக உள்ளன. தேவையற்ற சரிவு அல்லது சோர்வு இல்லை.',
    docNoteTitle: 'மருத்துவரின் மருத்துவக் குறிப்பு',
    docNoteBody:
      '"நோயாளி சுறுசுறுப்பாகவும் விழிப்புடனும் உள்ளார். கண் பார்வை மற்றும் பேச்சு வேகம் சீராக உள்ளது. காலை நடைப்பயிற்சியை தொடர்ந்து மேற்கொள்ளவும்."',
    docSign: 'டாக்டர் பிரியா சுந்தரம் (ஆரம்ப சுகாதார நிலைய மருத்துவர்) · 18 நவம்பர் 2026',
    startCheckin: '5 நிமிட பரிசோதனையைத் தொடங்கு',
    protocolNote: 'அரசு ஆரம்ப சுகாதார நிலைய அங்கீகரிக்கப்பட்ட நரம்பியல் பரிசோதனை முறை',
    healthIndex: 'நலக் குறியீடு',
    healthyRange: 'இயல்பான நல நிலை',
    lastChecked: 'கடைசி ஆய்வு: 18 நவம்பர் 2026',
    screensTitle: 'முக்கிய பராமரிப்புப் பக்கங்கள்',
    screensSubtitle: 'நீங்களும் உங்கள் குடும்பமும் பயன்படுத்தக்கூடிய 4 முக்கிய பக்கங்கள். கீழே தொடவும்.',
    cardAshaTag: 'ஆஷா & குடும்ப உதவி',
    cardAshaTitle: 'ஆஷா & பராமரிப்பாளர் உதவி பக்கம்',
    cardAshaDesc: 'உதவி ஸ்கிரீனிங் முறை. கண் கண்ணாடி, கேட்கும் கருவி மற்றும் பராமரிப்பாளர் குறிப்புகளை சரிபார்க்கவும்.',
    cardAshaBtn: 'ஆஷா உதவியைத் திறக்க',
    cardAbhaTag: 'அரசு மருத்துவக் காப்பீடு',
    cardAbhaTitle: 'ஆயுஷ்மான் பாரத் (ABHA) அட்டை',
    cardAbhaDesc: '14 இலக்க ABHA அடையாள அட்டை, ₹5 லட்ச அரசு முதியோர் மருத்துவக் காப்பீடு மற்றும் நல மையம்.',
    cardAbhaBtn: 'மருத்துவ அட்டையைப் பார்க்க',
    cardVitalsTag: 'ரத்த அழுத்தம்: 128/82 mmHg',
    cardVitalsTitle: 'தினசரி மாத்திரைகள் & ரத்த அழுத்தம்',
    cardVitalsDesc: 'காலை, மதியம், இரவு மாத்திரைகளை பெரிய தொடு பொத்தான்கள் மூலம் எளிதாகக் குறிக்கவும்.',
    cardVitalsBtn: 'மாத்திரைப் பட்டியலைத் திறக்க',
    cardEmergencyTag: 'அழைப்பு 14416 / 108',
    cardEmergencyTitle: 'அவசர 1-தொடு உதவி (SOS)',
    cardEmergencyDesc: 'குடும்பத்தினர், அரசு ஆம்புலன்ஸ் (108) மற்றும் 14416 உதவி மையத்திற்கு உடனடி ஜிபிஎஸ் அழைப்பு.',
    cardEmergencyBtn: 'அவசர எண்களைப் பார்க்க',
    habitsTitle: 'இன்றைய எளிய நற்பழக்கங்கள்',
    habitsSubtitle: 'முடித்தவுடன் தொடவும். நற்பழக்கங்கள் நினைவாற்றலை கூர்மையாக்கும்.',
    habitWalkTitle: '15 நிமிட காலை நடைப்பயிற்சி',
    habitWalkDesc: 'ரத்த ஓட்டம் மூளையின் சுறுசுறுப்பை அதிகரிக்கும்.',
    habitMedsTitle: 'காலை ரத்த அழுத்த மாத்திரை',
    habitMedsDesc: 'காலை உணவுக்குப் பின் உட்கொண்டேன் (Telmisartan 40mg).',
    habitWaterTitle: 'போதுமான தண்ணீர் குடித்தல்',
    habitWaterDesc: 'போதுமான நீர்ச்சத்து சோர்வைத் தடுக்கும்.',
    phcTitle: 'ஆரம்ப சுகாதார நிலையம்',
    caregiverPhone: 'குடும்ப பராமரிப்பாளர்: கார்த்திக் (மகன்: +91 98401 23456)',
    callSonBtn: 'மகனை அழைக்க',
    appointmentsBtn: 'மருத்துவ சந்திப்புகள்',
    spokenText: (name: string) =>
      `வணக்கம் ${name}. உங்கள் மூளை ஆரோக்கியம் மற்றும் நினைவாற்றல் நிலை மிகவும் சீராக உள்ளது. எந்தக் கவலையும் வேண்டாம். உங்கள் 5 நிமிட நினைவாற்றல் பரிசோதனையைத் தொடங்க பச்சை நிறப் பொத்தானைத் தொடவும்.`
  },
  hi: {
    comfortEyebrow: 'वरिष्ठ नागरिक देखभाल',
    comfortSubtitle: 'बड़े बटन, स्पष्ट आवाज मार्गदर्शन, कोई कठिन शब्द नहीं।',
    listenBtn: 'बोलकर सुनें',
    stopVoiceBtn: 'आवाज बंद करें',
    statusPill: 'सब कुछ सामान्य और स्वस्थ है',
    abhaPill: 'आयुष्मान भारत से जुड़ा हुआ',
    greeting: (name: string, isMorning: boolean) =>
      isMorning ? `शुभ प्रभात, ${name}` : `नमस्ते, ${name}`,
    summary:
      'आपका मस्तिष्क स्वास्थ्य, याददाश्त और सजगता पूरी तरह से सामान्य और स्वस्थ हैं। किसी भी अवांछित गिरावट के संकेत नहीं हैं।',
    docNoteTitle: 'डॉक्टर की चिकित्सीय सलाह',
    docNoteBody:
      '"मरीज सक्रिय और सतर्क हैं। आँखों की गति और बोलने की गति पूरी तरह स्थिर है। नियमित सुबह की सैर और याददाश्त अभ्यास जारी रखें।"',
    docSign: 'डॉ. प्रिया सुंदरम (पीएचसी चिकित्सा अधिकारी) · 18 नवंबर 2026',
    startCheckin: '5 मिनट की जांच शुरू करें',
    protocolNote: 'प्राथमिक स्वास्थ्य केंद्र प्रमाणित न्यूरोलॉजिकल जांच प्रोटोकॉल',
    healthIndex: 'स्वास्थ्य सूचकांक',
    healthyRange: 'स्वस्थ सामान्य स्थिति',
    lastChecked: 'पिछली जांच: 18 नवंबर 2026',
    screensTitle: 'महत्वपूर्ण देखभाल पृष्ठ',
    screensSubtitle: 'आपके और आपके परिवार के लिए आवश्यक 4 मुख्य पृष्ठ। नीचे टैप करें।',
    cardAshaTag: 'आशा व परिवार सहायता',
    cardAshaTitle: 'आशा व देखभालकर्ता सहायक मोड',
    cardAshaDesc: 'सहायक स्क्रीनिंग। जांच से पहले चश्मा, श्रवण यंत्र और देखभालकर्ता के नोट्स जांचें।',
    cardAshaBtn: 'आशा साथी खोलें',
    cardAbhaTag: 'पीएम-जय सरकारी सुरक्षा',
    cardAbhaTitle: 'आयुष्मान भारत (ABHA) कार्ड',
    cardAbhaDesc: '14 अंकों की ABHA आईडी, ₹5 लाख की वरिष्ठ स्वास्थ्य सुरक्षा और स्थानीय प्राथमिक स्वास्थ्य केंद्र।',
    cardAbhaBtn: 'स्वास्थ्य कार्ड देखें',
    cardVitalsTag: 'रक्तचाप: 128/82 mmHg',
    cardVitalsTitle: 'दैनिक दवाएं और रक्तचाप ट्रैकर',
    cardVitalsDesc: 'सुबह, दोपहर और रात की खुराक को बड़े आसान बटनों से आसानी से मार्क करें।',
    cardVitalsBtn: 'दवा सूची खोलें',
    cardEmergencyTag: 'डायल 14416 / 108',
    cardEmergencyTitle: 'आपातकालीन 1-टैप एसओएस अलर्ट',
    cardEmergencyDesc: 'पंजीकृत परिवार, सरकारी एम्बुलेंस (108) और 14416 हेल्पलाइन को जीपीएस लोकेशन के साथ तुरंत अलर्ट।',
    cardEmergencyBtn: 'आपातकालीन संपर्क देखें',
    habitsTitle: 'आज की सरल स्वस्थ आदतें',
    habitsSubtitle: 'पूरा होने पर टैप करें। अच्छी आदतें याददाश्त तेज रखती हैं।',
    habitWalkTitle: '15 मिनट की सुबह की सैर',
    habitWalkDesc: 'रक्त प्रवाह मस्तिष्क को सक्रिय और तरोताजा रखता है।',
    habitMedsTitle: 'सुबह की रक्तचाप की गोली',
    habitMedsDesc: 'नाश्ते के बाद दवा ली गई (Telmisartan 40mg)।',
    habitWaterTitle: 'पर्याप्त पानी की मात्रा',
    habitWaterDesc: 'पर्याप्त पानी मानसिक थकान को रोकता है।',
    phcTitle: 'प्राथमिक स्वास्थ्य केंद्र',
    caregiverPhone: 'देखभालकर्ता: कार्तिक (बेटा: +91 98401 23456)',
    callSonBtn: 'बेटे को कॉल करें',
    appointmentsBtn: 'अपॉइंटमेंट्स',
    spokenText: (name: string) =>
      `नमस्ते ${name} जी। आपका स्वास्थ्य और याददाश्त बिल्कुल सामान्य और अच्छी है। चिंता की कोई बात नहीं। 5 मिनट की त्वरित मस्तिष्क जांच के लिए हरे बटन को दबाएं।`
  },
  te: {
    comfortEyebrow: 'సీనియర్ సిటిజన్ సంరక్షణ',
    comfortSubtitle: 'పెద్ద బటన్లు, స్పష్టమైన వాయిస్ మార్గదర్శకత్వం, ఎలాంటి కఠినమైన పదాలు లేవు.',
    listenBtn: 'వాయిస్ వినండి',
    stopVoiceBtn: 'వాయిస్ ఆపండి',
    statusPill: 'అంతా సాధారణం & ఆరోగ్యంగా ఉంది',
    abhaPill: 'ఆయుష్మాన్ భారత్ అనుసంధానించబడింది',
    greeting: (name: string, isMorning: boolean) =>
      isMorning ? `శుభోదయం, ${name} గారు` : `నమస్కారం, ${name} గారు`,
    summary:
      'మీ మెదడు ఆరోగ్యం, జ్ఞాపకశక్తి మరియు ప్రతిస్పందనలు పూర్తిగా సాధారణంగా మరియు ఆరోగ్యంగా ఉన్నాయి. ఎలాంటి ఆందోళన అవసరం లేదు.',
    docNoteTitle: 'వైద్యుల క్లినికల్ గమనిక',
    docNoteBody:
      '"రోగి చురుకుగా మరియు అప్రమత్తంగా ఉన్నారు. కంటి కదలిక మరియు మాట్లాడే వేగం స్థిరంగా ఉన్నాయి. రోజువారీ ఉదయం నడకను కొనసాగించండి."',
    docSign: 'డా. ప్రియ సుందరం (పీహెచ్‌సీ మెడికల్ ఆఫీసర్) · 18 నవంబర్ 2026',
    startCheckin: '5 నిమిషాల పరీక్ష ప్రారంభించండి',
    protocolNote: 'ప్రాథమిక ఆరోగ్య కేంద్ర ప్రామాణిక న్యూరాలజీ ప్రోటోకాల్',
    healthIndex: 'ఆరోగ్య సూచిక',
    healthyRange: 'సాధారణ ఆరోగ్య పరిధి',
    lastChecked: 'చివరి పరీక్ష: 18 నవంబర్ 2026',
    screensTitle: 'ముఖ్యమైన సంరక్షణ పేజీలు',
    screensSubtitle: 'మీరు మరియు మీ కుటుంబానికి అవసరమైన 4 ముఖ్య పేజీలు. కింద నొక్కండి.',
    cardAshaTag: 'ఆశా & కుటుంబ సహాయం',
    cardAshaTitle: 'ఆశా & సంరక్షకుల సహాయక మోడ్',
    cardAshaDesc: 'సహాయక స్క్రీనింగ్. కళ్లద్దాలు, వినికిడి పరికరం మరియు సంరక్షకుల గమనికలను తనిఖీ చేయండి.',
    cardAshaBtn: 'ఆశా సహాయాన్ని తెరవండి',
    cardAbhaTag: 'ప్రభుత్వ పీఎం-జే కవరేజ్',
    cardAbhaTitle: 'ఆయుష్మాన్ భారత్ (ABHA) కార్డ్',
    cardAbhaDesc: '14 అంకెల ABHA ఐడీ, ₹5 లక్షల సీనియర్ ఆరోగ్య కవరేజ్ మరియు స్థానిక ప్రాథమిక ఆరోగ్య కేంద్రం.',
    cardAbhaBtn: 'ఆరోగ్య కార్డు చూడండి',
    cardVitalsTag: 'రక్తపోటు: 128/82 mmHg',
    cardVitalsTitle: 'రోజువారీ మందులు & రక్తపోటు',
    cardVitalsDesc: 'ఉదయం, మధ్యాహ్నం, రాత్రి మందుల మోతాదులను పెద్ద బటన్లతో సులభంగా గుర్తించండి.',
    cardVitalsBtn: 'మందుల జాబితా తెరవండి',
    cardEmergencyTag: 'డయల్ 14416 / 108',
    cardEmergencyTitle: 'అత్యవసర 1-ట్యాప్ ఎస్ఓఎస్ అలర్ట్',
    cardEmergencyDesc: 'జీపీఎస్ స్థానంతో కుటుంబ సభ్యులు, ప్రభుత్వ అంబులెన్స్ (108) మరియు 14416కు తక్షణ అలర్ట్.',
    cardEmergencyBtn: 'అత్యవసర నంబర్లు చూడండి',
    habitsTitle: 'నేటి సాధారణ ఆరోగ్యపు అలవాట్లు',
    habitsSubtitle: 'పూర్తయిన తర్వాత నొక్కండి. మంచి అలవాట్లు జ్ఞాపకశక్తిని చురుగ్గా ఉంచుతాయి.',
    habitWalkTitle: '15 నిమిಷాల ఉదయపు నడక',
    habitWalkDesc: 'రక్త ప్రసరణ మెదడును చురుగ్గా ఉంచుతుంది.',
    habitMedsTitle: 'ఉదయపు రక్తపోటు మాత్ర',
    habitMedsDesc: 'అల్పాహారం తర్వాత తీసుకున్నారు (Telmisartan 40mg).',
    habitWaterTitle: 'తగినంత నీరు త్రాగడం',
    habitWaterDesc: 'తగినంత నీరు అలసటను తగ్గిస్తుంది.',
    phcTitle: 'ప్రాథమిక ఆరోగ్య కేంద్రం',
    caregiverPhone: 'సంరక్షకుడు: కార్తీక్ (కుమారుడు: +91 98401 23456)',
    callSonBtn: 'కుమారుడికి కాల్ చేయండి',
    appointmentsBtn: 'అపాయింట్‌మెంట్లు',
    spokenText: (name: string) =>
      `నమస్కారం ${name} గారు. మీ మెదడు ఆరోగ్యం మరియు జ్ఞాపకశక్తి పూర్తిగా స్థిరంగా ఉన్నాయి. ఎలాంటి ఆందోళన అవసరం లేదు. 5 నిమిషాల పరీక్ష కోసం ఆకుపచ్చ బటన్‌ను నొక్కండి.`
  },
  ml: {
    comfortEyebrow: 'മുതിർന്നവരുടെ പരിചരണം',
    comfortSubtitle: 'വലിയ ബട്ടണുകൾ, വ്യക്തമായ ശബ്ദ നിർദ്ദേശങ്ങൾ, സങ്കീർണ്ണമായ പദങ്ങളില്ല.',
    listenBtn: 'ശബ്ദത്തിൽ കേൾക്കുക',
    stopVoiceBtn: 'ശബ്ദം നിർത്തുക',
    statusPill: 'എല്ലാം സാധാരണവും സുരക്ഷിതവുമാണ്',
    abhaPill: 'ആയുഷ്മാൻ ഭാരത് ബന്ധിപ്പിച്ചു',
    greeting: (name: string, isMorning: boolean) =>
      isMorning ? `സുപ്രഭാതം, ${name}` : `നമസ്കാരം, ${name}`,
    summary:
      'നിങ്ങളുടെ തലച്ചോറിന്റെ ആരോഗ്യം, ഓർമ്മശക്തി, ചലനങ്ങൾ എന്നിവ തികച്ചും സാധാരണവും ആരോഗ്യകരവുമാണ്. ആശങ്കപ്പെടേണ്ടതില്ല.',
    docNoteTitle: 'ഡോക്ടറുടെ കുറിപ്പ്',
    docNoteBody:
      '"രോഗി ഉന്മേഷവാനും ജാഗരൂകനുമാണ്. കണ്ണിന്റെ ചലനങ്ങളും സംസാര രീതിയും സ്ഥിരതയുള്ളതാണ്. രാവിലെയുള്ള നടത്തം തുടരുക."',
    docSign: 'ഡോ. പ്രിയ സുന്ദരം (പിഎച്ച്‌സി മെഡിക്കൽ ഓഫീസർ) · 18 നവംബർ 2026',
    startCheckin: '5 മിനിറ്റ് പരിശോധന ആരംഭിക്കുക',
    protocolNote: 'പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം അംഗീകരിച്ച ന്യൂറോളജിക്കൽ പ്രോട്ടോക്കോൾ',
    healthIndex: 'ആരോഗ്യ സൂചിക',
    healthyRange: 'സാധാരണ ആരോഗ്യ പരിധി',
    lastChecked: 'അവസാനം പരിശോധിച്ചത്: 18 നവംബർ 2026',
    screensTitle: 'പ്രധാന പരിചരണ പേജുകൾ',
    screensSubtitle: 'നിങ്ങൾക്കും കുടുംബത്തിനും ആവശ്യമായ 4 പ്രധാന പേജുകൾ. താഴെ അമർത്തുക.',
    cardAshaTag: 'ആശ & കുടുംബ സഹായം',
    cardAshaTitle: 'ആശ & പരിചരണ സഹായ മോഡ്',
    cardAshaDesc: 'പരിശോധനയ്ക്ക് മുന്നോടിയായി കണ്ണട, ശ്രവണസഹായി, പരിചരണ കുറിപ്പുകൾ എന്നിവ പരിശോധിക്കുക.',
    cardAshaBtn: 'ആശ സഹായി തുറക്കുക',
    cardAbhaTag: 'സർക്കാർ പിഎം-ജെ കവറേജ്',
    cardAbhaTitle: 'ആയുഷ്മാൻ ഭാരത് (ABHA) കാർഡ്',
    cardAbhaDesc: '14 അക്ക ABHA ഐഡി, ₹5 ലക്ഷം രൂപയുടെ ആരോഗ്യ സുരക്ഷ, പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം.',
    cardAbhaBtn: 'ആരോഗ്യ കാർഡ് കാണുക',
    cardVitalsTag: 'രക്തസമ്മർദ്ദം: 128/82 mmHg',
    cardVitalsTitle: 'ദിവസേനയുള്ള മരുന്നുകളും ബിപിയും',
    cardVitalsDesc: 'രാവിലെ, ഉച്ചയ്ക്ക്, രാത്രി മരുന്നുകൾ വലിയ ബട്ടണുകൾ ഉപയോഗിച്ച് രേഖപ്പെടുത്തുക.',
    cardVitalsBtn: 'മരുന്ന് പട്ടിക തുറക്കുക',
    cardEmergencyTag: 'ഡയൽ 14416 / 108',
    cardEmergencyTitle: 'അടിയന്തര 1-ടച്ച് എസ്ഒഎസ് അലർട്ട്',
    cardEmergencyDesc: 'ജിപിഎസ് ലൊക്കേഷനോടെ കുടുംബാംഗങ്ങൾക്കും ആംബുലൻസിനും (108) 14416 നും തത്സമയ സന്ദേശം.',
    cardEmergencyBtn: 'അടിയന്തര നമ്പറുകൾ കാണുക',
    habitsTitle: 'ഇന്നത്തെ ലളിതമായ ആരോഗ്യ ശീലങ്ങൾ',
    habitsSubtitle: 'പൂർത്തിയാകുമ്പോൾ അടയാളപ്പെടുത്തുക. നല്ല ശീലങ്ങൾ ഓർമ്മശക്തി വർദ്ധിപ്പിക്കും.',
    habitWalkTitle: '15 മിനിറ്റ് പ്രഭാത നടത്തം',
    habitWalkDesc: 'രക്തയോട്ടം തലച്ചോറിനെ ഉന്മേഷമുള്ളതാക്കുന്നു.',
    habitMedsTitle: 'രാവിലെയുള്ള ബിപി മരുന്ന്',
    habitMedsDesc: 'പ്രഭാതഭക്ഷണത്തിന് ശേഷം കഴിച്ചു (Telmisartan 40mg).',
    habitWaterTitle: 'ആവശ്യത്തിന് വെള്ളം കുടിക്കുക',
    habitWaterDesc: 'ആവശ്യത്തിന് വെള്ളം ക്ഷീണം അകറ്റും.',
    phcTitle: 'പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം',
    caregiverPhone: 'പരിചാരകൻ: കാർത്തിക് (മകൻ: +91 98401 23456)',
    callSonBtn: 'മകനെ വിളിക്കുക',
    appointmentsBtn: 'അപ്പോയിന്റ്മെന്റുകൾ',
    spokenText: (name: string) =>
      `നമസ്കാരം ${name}. നിങ്ങളുടെ തലച്ചോറിന്റെ ആരോഗ്യം തികച്ചും സുരക്ഷിതമാണ്. ആശങ്കപ്പെടേണ്ടതില്ല. 5 മിനിറ്റ് പരിശോധന ആരംഭിക്കാൻ പച്ച ബട്ടൺ അമർത്തുക.`
  },
  kn: {
    comfortEyebrow: 'ಹಿರಿಯ ನಾಗರಿಕರ ಆರೈಕೆ',
    comfortSubtitle: 'ದೊಡ್ಡ ಬಟನ್‌ಗಳು, ಸ್ಪಷ್ಟ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ, ಯಾವುದೇ ಕಷ್ಟಕರ ಪದಗಳಿಲ್ಲ.',
    listenBtn: 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ',
    stopVoiceBtn: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ',
    statusPill: 'ಎಲ್ಲವೂ ಸಾಮಾನ್ಯ ಮತ್ತು ಆರೋಗ್ಯಕರವಾಗಿದೆ',
    abhaPill: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಜೋಡಿಸಲಾಗಿದೆ',
    greeting: (name: string, isMorning: boolean) =>
      isMorning ? `ಶುಭೋದಯ, ${name} ಅವರೇ` : `ನಮಸ್ಕಾರ, ${name} ಅವರೇ`,
    summary:
      'ನಿಮ್ಮ ಮೆದುಳಿನ ಆರೋಗ್ಯ, ಸ್ಮರಣಾಶಕ್ತಿ ಮತ್ತು ಚಲನೆಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಸಾಮಾನ್ಯವಾಗಿದ್ದು, ಯಾವುದೇ ಆತಂಕವಿಲ್ಲ.',
    docNoteTitle: 'ವೈದ್ಯರ ಟಿಪ್ಪಣಿ',
    docNoteBody:
      '"ರೋಗಿಯು ಚಟುವಟಿಕೆಯಿಂದ ಮತ್ತು ಜಾಗರೂಕರಾಗಿದ್ದಾರೆ. ಕಣ್ಣಿನ ಚಲನೆ ಮತ್ತು ಮಾತನಾಡುವ ವೇಗವು ಸ್ಥಿರವಾಗಿದೆ. ಪ್ರತಿದಿನ ಮುಂಜಾನೆಯ ನಡಿಗೆಯನ್ನು ಮುಂದುವರಿಸಿ."',
    docSign: 'ಡಾ. ಪ್ರಿಯಾ ಸುಂದರಂ (ಪಿಎಚ್‌ಸಿ ವೈದ್ಯಾಧಿಕಾರಿ) · 18 ನವೆಂಬರ್ 2026',
    startCheckin: '5 ನಿಮಿಷಗಳ ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ',
    protocolNote: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ ಅನುಮೋದಿತ ನರಶಾಸ್ತ್ರ ಪ್ರೋಟೋಕಾಲ್',
    healthIndex: 'ಆರೋಗ್ಯ ಸೂಚ್ಯಂಕ',
    healthyRange: 'ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಶ್ರೇಣಿ',
    lastChecked: 'ಕೊನೆಯ ಪರಿಶೀಲನೆ: 18 ನವೆಂಬರ್ 2026',
    screensTitle: 'ಮುಖ್ಯ ಆರೈಕೆ ಪುಟಗಳು',
    screensSubtitle: 'ನಿಮಗೆ ಮತ್ತು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಅಗತ್ಯವಿರುವ 4 ಮುಖ್ಯ ಪುಟಗಳು. ಕೆಳಗೆ ಒತ್ತಿರಿ.',
    cardAshaTag: 'ಆಶಾ & ಕುಟುಂಬ ನೆರವು',
    cardAshaTitle: 'ಆಶಾ & ಆರೈಕೆದಾರರ ಸಹಾಯಕ ಮೋಡ್',
    cardAshaDesc: 'ಪರೀಕ್ಷೆಗೆ ಮುನ್ನ ಕನ್ನಡಕ, ಶ್ರವಣ ಸಾಧನ ಮತ್ತು ಆರೈಕೆದಾರರ ಟಿಪ್ಪಣಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    cardAshaBtn: 'ಆಶಾ ಸಹಾಯ ತೆರೆಯಿರಿ',
    cardAbhaTag: 'ಸರ್ಕಾರಿ ಪಿಎಂ-ಜೆ ರಕ್ಷಣೆ',
    cardAbhaTitle: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ (ABHA) ಕಾರ್ಡ್',
    cardAbhaDesc: '14 ಅಂಕಿಯ ABHA ಐಡಿ, ₹5 ಲಕ್ಷ ಹಿರಿಯ ನಾಗರಿಕರ ಆರೋಗ್ಯ ರಕ್ಷಣೆ ಮತ್ತು ಸ್ಥಳೀಯ ಆರೋಗ್ಯ ಕೇಂದ್ರ.',
    cardAbhaBtn: 'ಆರೋಗ್ಯ ಕಾರ್ಡ್ ನೋಡಿ',
    cardVitalsTag: 'ರಕ್ತದೊತ್ತಡ: 128/82 mmHg',
    cardVitalsTitle: 'ದೈನಂದಿನ ಮಾತ್ರೆಗಳು ಮತ್ತು ರಕ್ತದೊತ್ತಡ',
    cardVitalsDesc: 'ಬೆಳಿಗ್ಗೆ, ಮಧ್ಯಾಹ್ನ ಮತ್ತು ರಾತ್ರಿಯ ಔಷಧಿಗಳನ್ನು ದೊಡ್ಡ ಬಟನ್‌ಗಳೊಂದಿಗೆ ಸುಲಭವಾಗಿ ಗುರುತಿಸಿ.',
    cardVitalsBtn: 'ಮಾತ್ರೆಗಳ ಪಟ್ಟಿ ತೆರೆಯಿರಿ',
    cardEmergencyTag: 'ಡಯಲ್ 14416 / 108',
    cardEmergencyTitle: 'ತುರ್ತು 1-ಟ್ಯಾಪ್ ಎಸ್‌ಒಎಸ್ ಎಚ್ಚರಿಕೆ',
    cardEmergencyDesc: 'ಜಿಪಿಎಸ್ ಸ್ಥಳದೊಂದಿಗೆ ಕುಟುಂಬ ಸದಸ್ಯರು, ಆಂಬ್ಯುಲೆನ್ಸ್ (108) ಮತ್ತು 14416 ಸಹಾಯವಾಣಿಗೆ ತಕ್ಷಣದ ಎಚ್ಚರಿಕೆ.',
    cardEmergencyBtn: 'ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ನೋಡಿ',
    habitsTitle: 'ಇಂದಿನ ಸರಳ ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸಗಳು',
    habitsSubtitle: 'ಪೂರ್ಣಗೊಂಡಾಗ ಗುರುತು ಮಾಡಿ. ಉತ್ತಮ ಅಭ್ಯಾಸಗಳು ಸ್ಮರಣಾಶಕ್ತಿಯನ್ನು ಚುರುಕಾಗಿರಿಸುತ್ತವೆ.',
    habitWalkTitle: '15 ನಿಮಿಷಗಳ ಮುಂಜಾನೆಯ ನಡಿಗೆ',
    habitWalkDesc: 'ರಕ್ತ ಪರಿಚಲನೆ ಮೆದುಳನ್ನು ಚುರುಕಾಗಿರಿಸುತ್ತದೆ.',
    habitMedsTitle: 'ಮುಂಜಾನೆಯ ಬಿಪಿ ಮಾತ್ರೆ',
    habitMedsDesc: 'ಉಪಾಹಾರದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ (Telmisartan 40mg).',
    habitWaterTitle: 'ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯುವುದು',
    habitWaterDesc: 'ಸಾಕಷ್ಟು ನೀರು ದಣಿವನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.',
    phcTitle: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ',
    caregiverPhone: 'ಆರೈಕೆದಾರ: ಕಾರ್ತಿಕ್ (ಮಗ: +91 98401 23456)',
    callSonBtn: 'ಮಗನಿಗೆ ಕರೆ ಮಾಡಿ',
    appointmentsBtn: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
    spokenText: (name: string) =>
      `ನಮಸ್ಕಾರ ${name} ಅವರೇ. ನಿಮ್ಮ ಮೆದುಳಿನ ಆರೋಗ್ಯವು ಸಂಪೂರ್ಣವಾಗಿ ಸ್ಥಿರವಾಗಿದೆ. ಯಾವುದೇ ಆತಂಕವಿಲ್ಲ. 5 ನಿಮಿಷಗಳ ಪರೀಕ್ಷೆಗಾಗಿ ಹಸಿರು ಬಟನ್ ಒತ್ತಿರಿ.`
  }
};

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { speak, isSpeaking, stopSpeaking } = useVoiceAssistantStore();

  // Simple daily habit checks
  const [morningWalk, setMorningWalk] = useState(true);
  const [morningMeds, setMorningMeds] = useState(true);
  const [waterGlasses, setWaterGlasses] = useState(true);

  // Pick active localized dictionary (supports all 6 languages, defaults to en)
  const t = dashboardCopyByLang[currentLanguage] || dashboardCopyByLang.en;

  const firstName = (user?.name || 'Ramanathan').split(' ')[0];
  const isMorning = new Date().getHours() < 12;

  const handleVoiceSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(t.spokenText(firstName));
    }
  };

  const handleLanguageSwitch = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    stopSpeaking();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. TOP COMFORT BAR & INSTANT LANGUAGE SELECTOR (ALL 6 LANGUAGES) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-lg shadow-xs">
            👴
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t.comfortEyebrow}
            </h3>
            <p className="text-xs text-slate-500">
              {t.comfortSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick 1-Click Language Switcher (All 6 Languages) */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <Globe className="h-3.5 w-3.5 text-slate-400 ms-1.5 me-0.5" />
            {[
              { id: 'en', label: 'English' },
              { id: 'ta', label: 'தமிழ்' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'te', label: 'తెలుగు' },
              { id: 'ml', label: 'മലയാളം' },
              { id: 'kn', label: 'ಕನ್ನಡ' }
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleLanguageSwitch(id as SupportedLanguage)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  currentLanguage === id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Big Spoken Audio Button */}
          <button
            type="button"
            onClick={handleVoiceSummary}
            className="flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 transition active:scale-95 shrink-0"
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4 text-rose-600 animate-pulse" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-700" />
            )}
            <span>{isSpeaking ? t.stopVoiceBtn : t.listenBtn}</span>
          </button>
        </div>
      </div>

      {/* 2. REASSURING HERO CARD: All is Normal */}
      <MotionReveal>
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 p-6 sm:p-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t.statusPill}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {t.abhaPill}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t.greeting(firstName, isMorning)}
              </h1>

              <p className="text-base text-slate-700 leading-relaxed">
                {t.summary}
              </p>

              {/* Doctor Reassurance Note */}
              <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-xs sm:text-sm text-slate-700 flex items-start gap-3 shadow-xs">
                <Stethoscope className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-bold">{t.docNoteTitle}:</strong> {t.docNoteBody}
                  <div className="mt-1 text-[11px] text-slate-500 font-medium">
                    — {t.docSign}
                  </div>
                </div>
              </div>

              {/* PRIMARY CLINICAL SCREENING BUTTON */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/patient/assessment/intro"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-700 px-8 py-4 text-base font-black text-white shadow-lg hover:bg-emerald-800 transition active:scale-95"
                >
                  <Activity className="h-5 w-5" />
                  <span>{t.startCheckin}</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>{t.protocolNote}</span>
                </div>
              </div>
            </div>

            {/* Health Dial */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/90 p-6 text-center shadow-xs min-w-[220px]">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-3xl shadow-inner border-4 border-emerald-200">
                88
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">{t.healthIndex}</p>
              <p className="text-xs text-emerald-700 font-semibold">{t.healthyRange}</p>
              <div className="mt-3 w-full border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                {t.lastChecked}
              </div>
            </div>
          </div>
        </div>
      </MotionReveal>

      {/* 3. ONLY THE IMPORTANT PATIENT SCREENS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {t.screensTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t.screensSubtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1: ASHA & Caregiver Mode */}
          <Link
            to="/patient/asha-companion"
            className="group flex flex-col justify-between rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md text-2xl font-bold">
                  🤝
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {t.cardAshaTag}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  {t.cardAshaTitle}
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {t.cardAshaDesc}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-emerald-700 group-hover:underline">
              {t.cardAshaBtn} <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 2: Ayushman Bharat ABHA Health Card */}
          <Link
            to="/patient/abha-health"
            className="group flex flex-col justify-between rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/70 to-white p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md text-2xl font-bold">
                  🪪
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                  {t.cardAbhaTag}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-800 transition">
                  {t.cardAbhaTitle}
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {t.cardAbhaDesc}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-orange-700 group-hover:underline">
              {t.cardAbhaBtn} <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 3: Senior Vitals & Daily Medicine Tracker */}
          <Link
            to="/patient/geriatric-vitals"
            className="group flex flex-col justify-between rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md text-2xl font-bold">
                  💊
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  {t.cardVitalsTag}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-800 transition">
                  {t.cardVitalsTitle}
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {t.cardVitalsDesc}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-blue-700 group-hover:underline">
              {t.cardVitalsBtn} <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 4: Emergency SOS & Tele-MANAS */}
          <Link
            to="/patient/emergency-sos"
            className="group flex flex-col justify-between rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50/70 to-white p-6 shadow-sm hover:border-red-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md text-2xl font-bold">
                  🚨
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                  {t.cardEmergencyTag}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-800 transition">
                  {t.cardEmergencyTitle}
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {t.cardEmergencyDesc}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-red-700 group-hover:underline">
              {t.cardEmergencyBtn} <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4. TODAY'S 3 SIMPLE HEALTH HABITS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          {t.habitsTitle}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.habitsSubtitle}
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          <button
            type="button"
            onClick={() => setMorningWalk(!morningWalk)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
              morningWalk ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">🚶</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">{t.habitWalkTitle}</h4>
                {morningWalk && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">{t.habitWalkDesc}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMorningMeds(!morningMeds)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
              morningMeds ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">💊</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">{t.habitMedsTitle}</h4>
                {morningMeds && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">{t.habitMedsDesc}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setWaterGlasses(!waterGlasses)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
              waterGlasses ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">💧</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">{t.habitWaterTitle}</h4>
                {waterGlasses && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">{t.habitWaterDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. FAMILY & DOCTOR DIRECT CONTACT STRIP */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-xl">
            👨‍⚕️
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {t.phcTitle}: {treatmentTeam.doctor || 'Dr. Priya Sundaram'}
            </h4>
            <p className="text-xs text-slate-500">
              {t.caregiverPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+919840123456"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs transition"
          >
            <PhoneCall className="h-4 w-4 text-emerald-700" /> {t.callSonBtn}
          </a>
          <Link
            to="/patient/appointments"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition"
          >
            <CalendarDays className="h-4 w-4 text-emerald-400" /> {t.appointmentsBtn}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
