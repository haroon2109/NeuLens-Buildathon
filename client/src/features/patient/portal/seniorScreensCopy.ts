import type { SupportedLanguage } from '../../../services/language/types';

export interface SeniorScreensCopy {
  asha: {
    eyebrow: string;
    title: string;
    description: string;
    listenVernacular: string;
    stopVoice: string;
    seniorCitizen: string;
    startAssisted: string;
    checklistTitle: string;
    checklistDetail: string;
    glassesTitle: string;
    glassesDesc: string;
    hearingTitle: string;
    hearingDesc: string;
    quietTitle: string;
    quietDesc: string;
    alertTitle: string;
    alertDesc: string;
    notesTitle: string;
    notesDetail: string;
    notesPlaceholder: string;
    autoSynced: string;
    saveNotes: string;
    savedSuccess: string;
    protocolAlert: string;
    voiceGuidanceText: string;
  };
  abha: {
    eyebrow: string;
    title: string;
    description: string;
    govAuthority: string;
    abhaCardTitle: string;
    abhaNumLabel: string;
    abhaAddrLabel: string;
    linkedPhcLabel: string;
    lastSyncLabel: string;
    activeVerified: string;
    scanAnyPhc: string;
    benefitsTitle: string;
    benefit1Title: string;
    benefit1Desc: string;
    benefit2Title: string;
    benefit2Desc: string;
    benefit3Title: string;
    benefit3Desc: string;
    syncBtn: string;
    syncingBtn: string;
    syncedBadge: string;
  };
  vitals: {
    eyebrow: string;
    title: string;
    description: string;
    bpLabel: string;
    bpTarget: string;
    sugarLabel: string;
    sugarTarget: string;
    medAdherence: string;
    medAdherenceDetail: string;
    habitsLabel: string;
    habitsDetail: string;
    todaySchedule: string;
    tapToMark: string;
    morningPill: string;
    morningPillDetail: string;
    afternoonPill: string;
    afternoonPillDetail: string;
    nightPill: string;
    nightPillDetail: string;
    taken: string;
    pending: string;
    logVitals: string;
    logVitalsDetail: string;
    systolicLabel: string;
    diastolicLabel: string;
    fastingSugarLabel: string;
    hydrationLabel: string;
    vitalsNormal: string;
  };
  sos: {
    eyebrow: string;
    title: string;
    description: string;
    sosHeading: string;
    sosSubtitle: string;
    sosTriggerBtn: string;
    sosTriggered: string;
    sosDispatched: string;
    teleManasTitle: string;
    teleManasNum: string;
    teleManasDesc: string;
    teleManasCall: string;
    ambulanceTitle: string;
    ambulanceNum: string;
    ambulanceDesc: string;
    ambulanceCall: string;
    caregiverTitle: string;
    caregiverNum: string;
    caregiverDesc: string;
    caregiverCall: string;
  };
}

export const seniorScreensCopyByLang: Record<SupportedLanguage, SeniorScreensCopy> = {
  en: {
    asha: {
      eyebrow: 'National Health Mission · Geriatric Support',
      title: 'ASHA & Caregiver Assisted Companion',
      description: 'Assisted cognitive screening protocol for seniors (60+) administered by ASHA workers, ANMs, or family delegates.',
      listenVernacular: 'Listen to Voice Guidance',
      stopVoice: 'Stop Voice Guidance',
      seniorCitizen: 'Senior Citizen (Age 68)',
      startAssisted: 'Start Assisted 5-Min Screening',
      checklistTitle: 'Pre-Screening Sensory Checklist',
      checklistDetail: 'Verifies sensory accommodations before launching eye tracking or voice tasks to prevent false negatives.',
      glassesTitle: 'Reading Glasses / Spectacles in Place',
      glassesDesc: 'Crucial for clear screen visibility and visual object recognition.',
      hearingTitle: 'Hearing Aid Verified (If Applicable)',
      hearingDesc: 'Ensures clear reception of vernacular voice prompts in your mother tongue.',
      quietTitle: 'Low Background Noise (PHC / Home)',
      quietDesc: 'Prevents acoustic noise interference during speech recording.',
      alertTitle: 'Senior Alertness & Hydration Confirmed',
      alertDesc: 'Morning screenings 1-2 hours after breakfast yield the most consistent longitudinal comparison.',
      notesTitle: 'ASHA / Caregiver Field Observations',
      notesDetail: 'Recorded qualitative observations are appended directly to the doctor’s dossier.',
      notesPlaceholder: 'Record any confusion, tremor, gait difficulty, or memory concerns mentioned by the senior or family...',
      autoSynced: 'Auto-synced with Rural Health Center',
      saveNotes: 'Save Observations',
      savedSuccess: 'Saved Successfully!',
      protocolAlert: 'Clinical Protocol: ASHA workers must not prompt answers during memory tasks to preserve baseline clinical accuracy.',
      voiceGuidanceText: 'Welcome to the ASHA and Family Caregiver Companion mode. Designed for assisted screening of 60+ seniors in rural and urban clinics.'
    },
    abha: {
      eyebrow: 'Ayushman Bharat Digital Mission (ABDM)',
      title: 'ABHA Digital Health & PHC Linkage',
      description: 'Unified Indian health identifier linking NeuLens neurocognitive screening results with your National Health Record.',
      govAuthority: 'National Health Authority',
      abhaCardTitle: 'Ayushman Bharat Health Account (ABHA)',
      abhaNumLabel: 'ABHA Number',
      abhaAddrLabel: 'ABHA Address',
      linkedPhcLabel: 'Linked Primary Health Centre',
      lastSyncLabel: 'Last ABDM Cloud Sync',
      activeVerified: 'Active & Verified',
      scanAnyPhc: 'Scan at any PHC / District Hospital / AIIMS',
      benefitsTitle: 'ABHA Integration Benefits for Seniors',
      benefit1Title: 'Seamless PHC to District Referral',
      benefit1Desc: 'If cognitive decline is detected, your local PHC doctor can instantly refer you to district neurologists with your complete test history.',
      benefit2Title: 'Free Medicine Under PM-JAY',
      benefit2Desc: 'Prescribed neuroprotective medicines, anti-hypertensives, and vitamin supplements are covered at government empanelled clinics.',
      benefit3Title: 'Family Proxy Access',
      benefit3Desc: 'Nominate your son, daughter, or registered caregiver to view health records and emergency reports via the ABDM gateway.',
      syncBtn: 'Sync with Ayushman Bharat Now',
      syncingBtn: 'Syncing with ABDM Gateway...',
      syncedBadge: 'Synced with ABDM'
    },
    vitals: {
      eyebrow: 'Geriatric Care Protocol · Daily Comorbidity Tracking',
      title: 'Senior Vitals & Daily Routine Tracker',
      description: 'Daily monitoring of blood pressure, blood glucose, and medication adherence. Crucial for distinguishing metabolic fluctuations from neurocognitive changes.',
      bpLabel: 'Blood Pressure',
      bpTarget: 'Normal Geriatric Range (Target: <135/85)',
      sugarLabel: 'Fasting Blood Sugar',
      sugarTarget: 'Normal Glycemic Control',
      medAdherence: 'Medication Adherence',
      medAdherenceDetail: 'Morning & Afternoon Taken',
      habitsLabel: 'Daily Wellness Habits',
      habitsDetail: 'Morning Walk & Hydration on track',
      todaySchedule: "Today's Medication Schedule",
      tapToMark: 'Tap to mark each dose as taken',
      morningPill: 'Morning Pills',
      morningPillDetail: 'Amlodipine 5mg (BP) + Multivitamin · 8:00 AM',
      afternoonPill: 'Afternoon Pills',
      afternoonPillDetail: 'Metformin 500mg (Blood Sugar) · 1:30 PM',
      nightPill: 'Night Pills',
      nightPillDetail: 'Atorvastatin 10mg (Cholesterol) · 9:00 PM',
      taken: 'Taken',
      pending: 'Pending',
      logVitals: 'Log Today’s Vitals',
      logVitalsDetail: 'Enter morning readings from home digital monitor',
      systolicLabel: 'Systolic BP (Top)',
      diastolicLabel: 'Diastolic BP (Bottom)',
      fastingSugarLabel: 'Fasting Blood Sugar (mg/dL)',
      hydrationLabel: 'Hydration (Glasses of Water)',
      vitalsNormal: 'Vitals are within stable geriatric limits today. Safe for cognitive screening.'
    },
    sos: {
      eyebrow: 'Emergency Protocols · 24x7 Elder Protection',
      title: 'Emergency SOS & Family Alert',
      description: 'One-touch immediate alert for acute confusion, disorientation, wandering episodes, or medical emergencies.',
      sosHeading: 'Need Immediate Assistance?',
      sosSubtitle: 'Pressing the emergency button will send an instant SMS and WhatsApp alert with GPS coordinates to your registered family caregivers and notify the local PHC.',
      sosTriggerBtn: 'Trigger Immediate Senior SOS',
      sosTriggered: '✓ SOS Sent to Family & Emergency Services',
      sosDispatched: 'Alert dispatched: Son (Karthik Swaminathan: +91 98401 23456) & Thanjavur PHC Ambulance notified.',
      teleManasTitle: 'Tele-MANAS Helpline',
      teleManasNum: 'Dial 14416 (Toll-Free)',
      teleManasDesc: "Government of India's 24x7 National Mental Health helpline offering free psychological support in 20+ Indian languages.",
      teleManasCall: 'Call 14416 Now',
      ambulanceTitle: 'National Ambulance',
      ambulanceNum: 'Dial 108 (24x7 Rapid Response)',
      ambulanceDesc: 'Direct dispatch for acute medical emergencies, sudden weakness, stroke symptoms (FAST), or severe falls.',
      ambulanceCall: 'Call 108 Now',
      caregiverTitle: 'Registered Caregiver',
      caregiverNum: 'Karthik (Son) · +91 98401 23456',
      caregiverDesc: 'Primary family proxy who receives assessment summaries, appointment reminders, and sudden change alerts.',
      caregiverCall: 'Call Caregiver'
    }
  },

  ta: {
    asha: {
      eyebrow: 'தேசிய சுகாதார இயக்கம் · முதியோர் நலம்',
      title: 'ஆஷா & பராமரிப்பாளர் உதவி பக்கம்',
      description: 'ஆஷா பணியாளர்கள் அல்லது குடும்பப் பராமரிப்பாளர்கள் மூலம் முதியோருக்கான (60+) உதவி பரிசோதனை முறை.',
      listenVernacular: 'குரல் வழியே கேட்க',
      stopVoice: 'குரலை நிறுத்து',
      seniorCitizen: 'முதியவர் (வயது 68)',
      startAssisted: '5 நிமிட உதவியுடன் கூடிய பரிசோதனை',
      checklistTitle: 'பரிசோதனைக்கு முந்தைய தயார்நிலை',
      checklistDetail: 'கண் பார்வை அல்லது பேச்சு சோதனைகளை தொடங்குவதற்கு முன் இந்த 4 வசதிகளை உறுதி செய்யவும்.',
      glassesTitle: 'பார்வைக் கண்ணாடி அணிந்துள்ளாரா',
      glassesDesc: 'திரையை தெளிவாகப் பார்க்க கண்ணாடி சுத்தமாக அணிந்திருப்பதை உறுதிசெய்யவும்.',
      hearingTitle: 'கேட்கும் கருவி இயங்குகிறதா (தேவைப்பட்டால்)',
      hearingDesc: 'குரல் வழிகாட்டுதலை தெளிவாகக் கேட்க பேட்டரி மற்றும் ஒலியளவை சரிபார்க்கவும்.',
      quietTitle: 'அமைதியான, வெளிச்சமான சூழல்',
      quietDesc: 'டிவி/ரேடியோ இரைச்சல் இல்லாமல் போதுமான வெளிச்சம் இருப்பதை உறுதிசெய்யவும்.',
      alertTitle: 'முதியவர் விழிப்புணர்வுடன் உள்ளாரா',
      alertDesc: 'காலை உணவுக்கு 1-2 மணி நேரத்திற்குப் பின் செய்வது சிறந்த முடிவுகளைத் தரும்.',
      notesTitle: 'ஆஷா / பராமரிப்பாளர் குறிப்புகள்',
      notesDetail: 'முதியவரின் நடத்தைகள் மற்றும் நடுக்கம் பற்றிய குறிப்புகள் மருத்துவரின் பதிவேட்டில் சேர்க்கப்படும்.',
      notesPlaceholder: 'நினைவாற்றல் குறைபாடு, நடுக்கம் அல்லது குடும்பத்தினர் கூறிய தகவல்களை இங்கே பதிவு செய்யவும்...',
      autoSynced: 'ஆரம்ப சுகாதார நிலையத்துடன் தானாக இணைக்கப்பட்டது',
      saveNotes: 'குறிப்புகளைச் சேமி',
      savedSuccess: 'வெற்றிகரமாகச் சேமிக்கப்பட்டது!',
      protocolAlert: 'மருத்துவ நெறிமுறை: நினைவாற்றல் சோதனையின் போது ஆஷா பணியாளர்கள் பதில்களைக் கூறக்கூடாது.',
      voiceGuidanceText: 'வணக்கம். இது ஆஷா மற்றும் குடும்ப பராமரிப்பாளர் உதவி பக்கம். முதியவர்கள் எளிதாக நினைவாற்றல் பரிசோதனையை செய்ய நாங்கள் உதவுகிறோம்.'
    },
    abha: {
      eyebrow: 'ஆயுஷ்மான் பாரத் டிஜிட்டல் இயக்கம் (ABDM)',
      title: 'ஆயுஷ்மான் பாரத் (ABHA) மருத்துவ அட்டை',
      description: 'உங்கள் நியூல்ன்ஸ் நரம்பியல் பரிசோதனை முடிவுகளை தேசிய சுகாதார கணக்குடன் இணைக்கும் எண்.',
      govAuthority: 'தேசிய சுகாதார ஆணையம்',
      abhaCardTitle: 'ஆயுஷ்மான் பாரத் சுகாதார கணக்கு (ABHA)',
      abhaNumLabel: 'ABHA எண்',
      abhaAddrLabel: 'ABHA முகவரி',
      linkedPhcLabel: 'இணைக்கப்பட்ட ஆரம்ப சுகாதார நிலையம்',
      lastSyncLabel: 'கடைசி தேசிய சர்வர் இணைப்பு',
      activeVerified: 'செயலில் உள்ளது & சரிபார்க்கப்பட்டது',
      scanAnyPhc: 'அரசு ஆரம்ப சுகாதார நிலையம் / எய்ம்ஸ்-ல் ஸ்கேன் செய்யலாம்',
      benefitsTitle: 'முதியோருக்கான ஆயுஷ்மான் பாரத் நன்மைகள்',
      benefit1Title: 'மாவட்ட மருத்துவமனைக்கு உடனடி பரிந்துரை',
      benefit1Desc: 'நினைவாற்றலில் மாற்றம் கண்டறியப்பட்டால், ஆரம்ப சுகாதார நிலைய மருத்துவர் உடனடியாக நரம்பியல் நிபுணரிடம் பரிந்துரைக்கலாம்.',
      benefit2Title: 'பிஎம்-ஜே கீழ் இலவச மருந்துகள்',
      benefit2Desc: 'இரத்த அழுத்தம், சர்க்கரை மற்றும் மூளை நல மருந்துகளுக்கு அரசு அங்கீகரித்த மருத்துவமனைகளில் முழு காப்பீடு.',
      benefit3Title: 'குடும்ப உறுப்பினர் உதவி',
      benefit3Desc: 'அவசர கால அறிக்கைகள் மற்றும் மருத்துவ பதிவுகளைப் பார்க்க மகன்/மகளுக்கு அனுமதி வழங்கலாம்.',
      syncBtn: 'ஆயுஷ்மான் பாரத் உடன் இணைக்க',
      syncingBtn: 'தேசிய சர்வரில் இணைகிறது...',
      syncedBadge: 'இணைக்கப்பட்டது'
    },
    vitals: {
      eyebrow: 'முதியோர் பராமரிப்பு · தினசரி நலம் மற்றும் மருந்துகள்',
      title: 'தினசரி இரத்த அழுத்தம் & மாத்திரைகள்',
      description: 'இரத்த அழுத்தம், சர்க்கரை அளவு மற்றும் மாத்திரை உட்கொள்ளலைத் தினமும் கண்காணித்தல்.',
      bpLabel: 'இரத்த அழுத்தம் (BP)',
      bpTarget: 'முதியோருக்கான இயல்பான அளவு (<135/85)',
      sugarLabel: 'காலை சர்க்கரை அளவு',
      sugarTarget: 'இயல்பான சர்க்கரை அளவு',
      medAdherence: 'மருந்து உட்கொள்ளல்',
      medAdherenceDetail: 'காலை & மதியம் உட்கொள்ளப்பட்டது',
      habitsLabel: 'தினசரி பழக்கங்கள்',
      habitsDetail: 'காலை நடைப்பயிற்சி & நீர்ச்சத்து முடிந்தது',
      todaySchedule: 'இன்றைய மாத்திரை அட்டவணை',
      tapToMark: 'மாத்திரை சாப்பிட்ட பின் தொடவும்',
      morningPill: 'காலை மாத்திரைகள்',
      morningPillDetail: 'இரத்த அழுத்த மாத்திரை (Amlodipine 5mg) + மல்டிவிடமின் · காலை 8:00',
      afternoonPill: 'மதிய மாத்திரைகள்',
      afternoonPillDetail: 'சர்க்கரை மாத்திரை (Metformin 500mg) · மதியம் 1:30',
      nightPill: 'இரவு மாத்திரைகள்',
      nightPillDetail: 'கொலஸ்ட்ரால் மாத்திரை (Atorvastatin 10mg) · இரவு 9:00',
      taken: 'சாப்பிடப்பட்டது',
      pending: 'மீதமுள்ளது',
      logVitals: 'இன்றைய அளவுகளைப் பதிவு செய்',
      logVitalsDetail: 'டிஜிட்டல் கருவியில் காட்டும் காலை அளவுகளை உள்ளிடவும்',
      systolicLabel: 'இரத்த அழுத்தம் - மேல் அளவு (Systolic)',
      diastolicLabel: 'இரத்த அழுத்தம் - கீழ் அளவு (Diastolic)',
      fastingSugarLabel: 'வெறும் வயிற்று சர்க்கரை அளவு (mg/dL)',
      hydrationLabel: 'குடித்த தண்ணீர் (டம்ளர்கள்)',
      vitalsNormal: 'இன்றைய அளவுகள் இயல்பான முதியோர் வரம்பிற்குள் உள்ளன. பரிசோதனை செய்ய பாதுகாப்பானது.'
    },
    sos: {
      eyebrow: 'அவசரகால உதவி · 24x7 முதியோர் பாதுகாப்பு',
      title: 'அவசர கால எஸ்.ஓ.எஸ் & குடும்ப அழைப்பு',
      description: 'திடீர் குழப்பம், பாதை மறதி, தடுமாற்றம் அல்லது மருத்துவ அவசரத்திற்கு 1-தொடு உடனடி உதவி.',
      sosHeading: 'உடனடி உதவி தேவையா?',
      sosSubtitle: 'இந்த சிவப்பு பொத்தானை அழுத்தினால், உங்கள் குடும்பத்தினருக்கும் உள்ளூர் ஆரம்ப சுகாதார நிலையத்திற்கும் இருப்பிட தகவலுடன் அவசர செய்தி செல்லும்.',
      sosTriggerBtn: 'உடனடி அவசர உதவி கோருக (SOS)',
      sosTriggered: '✓ குடும்பத்தினருக்கும் ஆம்புலன்ஸுக்கும் தகவல் அனுப்பப்பட்டது',
      sosDispatched: 'தகவல் அனுப்பப்பட்டது: மகன் கார்த்திக் (+91 98401 23456) & தஞ்சாவூர் சுகாதார நிலைய ஆம்புலன்ஸ்.',
      teleManasTitle: 'டெலி-மானாஸ் உதவி எண் (Tele-MANAS)',
      teleManasNum: 'அழைக்கவும் 14416 (இலவசம்)',
      teleManasDesc: 'இந்திய அரசின் 24x7 இலவச மனநல உதவி எண். தமிழ் உட்பட 20+ இந்திய மொழிகளில் சேவை.',
      teleManasCall: '14416-ஐ அழைக்கவும்',
      ambulanceTitle: 'தேசிய ஆம்புலன்ஸ் சேவை',
      ambulanceNum: 'அழைக்கவும் 108 (24 மணி நேர சேவை)',
      ambulanceDesc: 'பக்கவாதம், திடீர் மயக்கம் அல்லது கீழே விழுந்து காயம் ஏற்பட்டால் உடனடி ஆம்புலன்ஸ் சேவை.',
      ambulanceCall: '108-ஐ அழைக்கவும்',
      caregiverTitle: 'குடும்பப் பொறுப்பாளர்',
      caregiverNum: 'கார்த்திக் (மகன்) · +91 98401 23456',
      caregiverDesc: 'உங்கள் பரிசோதனை முடிவுகள் மற்றும் அவசர கால எச்சரிக்கைகளைப் பெறும் முதன்மை குடும்ப உறுப்பினர்.',
      caregiverCall: 'மகனை அழைக்கவும்'
    }
  },

  hi: {
    asha: {
      eyebrow: 'राष्ट्रीय स्वास्थ्य मिशन · वरिष्ठ नागरिक देखभाल',
      title: 'आशा व देखभालकर्ता सहायक मोड',
      description: 'आशा कार्यकर्ताओं अथवा परिवार के सदस्यों द्वारा वरिष्ठ नागरिकों (60+) के लिए सहायक संज्ञानात्मक जांच।',
      listenVernacular: 'आवाज़ में सुनें',
      stopVoice: 'आवाज़ बंद करें',
      seniorCitizen: 'वरिष्ठ नागरिक (आयु 68)',
      startAssisted: '5 मिनट की सहायक जांच शुरू करें',
      checklistTitle: 'जांच पूर्व संवेदी तैयारी सूची',
      checklistDetail: 'दृष्टि अथवा ध्वनि संबंधी गलतियों से बचने के लिए इन 4 बातों की पुष्टि करें।',
      glassesTitle: 'चश्मा पहना हुआ है',
      glassesDesc: 'स्क्रीन को स्पष्ट देखने के लिए चश्मा साफ और ठीक से पहना होना चाहिए।',
      hearingTitle: 'हियरिंग एड की जांच (यदि लागू हो)',
      hearingDesc: 'ध्वनि निर्देशों को स्पष्ट सुनने के लिए बैटरी और वॉल्यूम जांचें।',
      quietTitle: 'शांत और रोशनी वाला कमरा',
      quietDesc: 'टीवी या रेडियो का शोर न हो और पर्याप्त रोशनी हो।',
      alertTitle: 'वरिष्ठ नागरिक की सतर्कता एवं जल स्तर',
      alertDesc: 'सुबह के नाश्ते के 1-2 घंटे बाद जांच कराने से सबसे सटीक परिणाम मिलते हैं।',
      notesTitle: 'आशा / देखभालकर्ता के अवलोकन',
      notesDetail: 'व्यक्तिगत व्यवहार व हाथों के कंपन संबंधी नोट्स डॉक्टर की फ़ाइल में जोड़े जाएंगे।',
      notesPlaceholder: 'किसी भी प्रकार की उलझन, हाथों के कंपन या चलने में कठिनाई को यहां दर्ज करें...',
      autoSynced: 'स्वास्थ्य केंद्र से स्वतः संयोजित',
      saveNotes: 'अवलोकन सुरक्षित करें',
      savedSuccess: 'सफलतापूर्वक सहेजा गया!',
      protocolAlert: 'नैदानिक प्रोटोकॉल: स्मृति जांच के दौरान आशा कार्यकर्ताओं को स्वयं उत्तर नहीं बताने चाहिए।',
      voiceGuidanceText: 'नमस्ते। यह आशा कार्यकर्ता और परिवार देखभालकर्ता सहायक पृष्ठ है। 60 वर्ष से अधिक उम्र के बुजुर्गों के लिए सहज जांच।'
    },
    abha: {
      eyebrow: 'आयुष्मान भारत डिजिटल मिशन (ABDM)',
      title: 'आयुष्मान भारत (ABHA) स्वास्थ्य कार्ड',
      description: 'आपकी न्यूलेंस संज्ञानात्मक जांच को राष्ट्रीय स्वास्थ्य रिकॉर्ड से जोड़ने वाला विशिष्ट पहचान पत्र।',
      govAuthority: 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
      abhaCardTitle: 'आयुष्मान भारत स्वास्थ्य खाता (ABHA)',
      abhaNumLabel: 'ABHA संख्या',
      abhaAddrLabel: 'ABHA पता',
      linkedPhcLabel: 'संबद्ध प्राथमिक स्वास्थ्य केंद्र',
      lastSyncLabel: 'अंतिम क्लाउड समन्वय',
      activeVerified: 'सक्रिय एवं सत्यापित',
      scanAnyPhc: 'किसी भी स्वास्थ्य केंद्र / एम्स में स्कैन करें',
      benefitsTitle: 'वरिष्ठ नागरिकों के लिए ABHA के लाभ',
      benefit1Title: 'ज़िला अस्पताल के लिए तत्काल रेफरल',
      benefit1Desc: 'स्मृति में गिरावट का संकेत मिलने पर प्राथमिक केंद्र के डॉक्टर तुरंत ज़िला न्यूरोलॉजिस्ट को रेफर कर सकते हैं।',
      benefit2Title: 'पीएम-जय के तहत मुफ्त दवाइयां',
      benefit2Desc: 'रक्तचाप, मधुमेह और मस्तिष्क सुरक्षा की दवाइयां सरकारी अनुमोदित केंद्रों पर पूरी तरह कवर हैं।',
      benefit3Title: 'परिवार के सदस्यों की पहुंच',
      benefit3Desc: 'आपातकालीन रिपोर्ट और रिकॉर्ड देखने के लिए बेटे या बेटी को नामांकित करें।',
      syncBtn: 'आयुष्मान भारत से समन्वय करें',
      syncingBtn: 'समन्वय हो रहा है...',
      syncedBadge: 'सफलतापूर्वक संबद्ध'
    },
    vitals: {
      eyebrow: 'वरिष्ठ नागरिक देखभाल · दैनिक स्वास्थ्य एवं दवाएं',
      title: 'दैनिक रक्तचाप एवं दवा ट्रैकर',
      description: 'रक्तचाप, शुगर और दवाओं की नियमित निगरानी।',
      bpLabel: 'रक्तचाप (BP)',
      bpTarget: 'सामान्य वरिष्ठ सीमा (<135/85)',
      sugarLabel: 'फास्टिंग ब्लड शुगर',
      sugarTarget: 'सामान्य नियंत्रण',
      medAdherence: 'दवाओं का सेवन',
      medAdherenceDetail: 'सुबह और दोपहर की खुराक ली गई',
      habitsLabel: 'दैनिक आदतें',
      habitsDetail: 'सुबह की सैर व जलपान पूर्ण',
      todaySchedule: 'आज की दवाओं की समय-सारणी',
      tapToMark: 'दवा लेने के बाद निशान लगाएं',
      morningPill: 'सुबह की दवा',
      morningPillDetail: 'रक्तचाप दवा (Amlodipine 5mg) + मल्टीविटामिन · 8:00 AM',
      afternoonPill: 'दोपहर की दवा',
      afternoonPillDetail: 'शुगर की दवा (Metformin 500mg) · 1:30 PM',
      nightPill: 'रात की दवा',
      nightPillDetail: 'कोलेस्ट्रॉल दवा (Atorvastatin 10mg) · 9:00 PM',
      taken: 'ली गई',
      pending: 'बाकी है',
      logVitals: 'आज के स्वास्थ्य माप दर्ज करें',
      logVitalsDetail: 'डिजिटल मीटर से सुबह के माप भरें',
      systolicLabel: 'ऊपरी रक्तचाप (सिस्टोलिक)',
      diastolicLabel: 'निचला रक्तचाप (डायस्टोलिक)',
      fastingSugarLabel: 'फास्टिंग शुगर (mg/dL)',
      hydrationLabel: 'पानी के गिलास',
      vitalsNormal: 'आज के स्वास्थ्य माप पूरी तरह स्थिर हैं। जांच के लिए सुरक्षित।'
    },
    sos: {
      eyebrow: 'आपातकालीन सहायता · 24x7 सुरक्षा',
      title: 'आपातकालीन एस.ओ.एस एवं परिवार अलर्ट',
      description: 'अचानक उलझन, रास्ता भूलने अथवा चिकित्सकीय आपातकाल के लिए 1-टच त्वरित सहायता।',
      sosHeading: 'तुरंत सहायता की आवश्यकता है?',
      sosSubtitle: 'यह लाल बटन दबाने से आपके परिवार और स्थानीय स्वास्थ्य केंद्र को आपकी लोकेशन के साथ आपातकालीन संदेश जाएगा।',
      sosTriggerBtn: 'तत्काल सीनियर एस.ओ.एस भेजें',
      sosTriggered: '✓ परिवार व एम्बुलेंस को अलर्ट भेजा गया',
      sosDispatched: 'अलर्ट भेजा गया: सुपुत्र (कार्तिक) और तंजावुर पीएचसी एम्बुलेंस सूचित।',
      teleManasTitle: 'टेली-मानस हेल्पलाइन (Tele-MANAS)',
      teleManasNum: 'डायल करें 14416 (टोल-फ्री)',
      teleManasDesc: 'भारत सरकार की 24x7 निःशुल्क मानसिक स्वास्थ्य व परामर्श सेवा (20+ भारतीय भाषाओं में)।',
      teleManasCall: '14416 पर कॉल करें',
      ambulanceTitle: 'राष्ट्रीय एम्बुलेंस सेवा',
      ambulanceNum: 'डायल करें 108 (24 घंटे त्वरित सेवा)',
      ambulanceDesc: 'गंभीर आपातकाल, अचानक कमजोरी, स्ट्रोक के लक्षण या गिरने पर तुरंत एम्बुलेंस सेवा।',
      ambulanceCall: '108 पर कॉल करें',
      caregiverTitle: 'पंजीकृत देखभालकर्ता',
      caregiverNum: 'कार्तिक (सुपुत्र) · +91 98401 23456',
      caregiverDesc: 'प्राथमिक पारिवारिक संपर्क जो आपकी जांच रिपोर्ट और आपातकालीन अलर्ट प्राप्त करते हैं।',
      caregiverCall: 'पुत्र को कॉल करें'
    }
  },

  te: {
    asha: {
      eyebrow: 'జాతీయ ఆరోగ్య మిషన్ · వృద్ధుల సంరక్షణ',
      title: 'ఆశా & సంరక్షకుల సహాయక మోడ్',
      description: 'ఆశా కార్యకర్తలు లేదా కుటుంబ సభ్యుల సహాయంతో 60+ వృద్ధుల కోసం నరాల మరియు జ్ఞాపకశక్తి పరీక్ష.',
      listenVernacular: 'వాయిస్ వినండి',
      stopVoice: 'వాయిస్ ఆపండి',
      seniorCitizen: 'సీనియర్ సిటిజన్ (వయస్సు 68)',
      startAssisted: '5 నిమిషాల సహాయక పరీక్ష ప్రారంభించండి',
      checklistTitle: 'పరీక్షకు ముందస్తు సంసిద్ధత',
      checklistDetail: 'కంటి చూపు లేదా గొంతు పరీక్షలకు ముందు ఈ 4 విషయాలను నిర్ధారించుకోండి.',
      glassesTitle: 'చదువుకునే కళ్లద్దాలు ఉన్నాయా',
      glassesDesc: 'స్క్రీన్ స్పష్టంగా కనిపించడానికి అద్దాలు సరిగ్గా ధరించాలి.',
      hearingTitle: 'వినికిడి యంత్రం తనిఖీ (అవసరమైతే)',
      hearingDesc: 'వాయిస్ సూచనలు స్పష్టంగా వినడానికి బ్యాటరీ మరియు వాల్యూమ్ తనిఖీ చేయండి.',
      quietTitle: 'ప్రశాంతమైన మరియు వెలుతురు గల గది',
      quietDesc: 'టీవీ లేదా రేడియో శబ్దం లేకుండా తగినంత కాంతి ఉండాలి.',
      alertTitle: 'వృద్ధుల అప్రమత్తత మరియు నీరు తాగడం',
      alertDesc: 'ఉదయం అల్పాహారం తర్వాత 1-2 గంటలకు పరీక్ష చేయడం ఉత్తమం.',
      notesTitle: 'ఆశా / సంరక్షకుల గమనికలు',
      notesDetail: 'చేతుల వణుకు మరియు జ్ఞాపకశక్తికి సంబంధించిన వివరాలు డాక్టర్ రికార్డులో చేరుతాయి.',
      notesPlaceholder: 'ఏదైనా గందరగోళం, వణుకు లేదా కుటుంబ సభ్యులు చెప్పిన విషయాలను ఇక్కడ నమోదు చేయండి...',
      autoSynced: 'ఆరోగ్య కేంద్రంతో అనుసంధానించబడింది',
      saveNotes: 'గమనికలు భద్రపరచండి',
      savedSuccess: 'విజయవంతంగా భద్రపరచబడింది!',
      protocolAlert: 'వైద్య విధానం: జ్ఞాపకశక్తి పరీక్ష సమయంలో ఆశా కార్యకర్తలు సమాధానాలు చెప్పకూడదు.',
      voiceGuidanceText: 'నమస్కారం. ఇది ఆశా కార్యకర్త మరియు కుటుంబ సంరక్షకుల సహాయక పేజీ.'
    },
    abha: {
      eyebrow: 'ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ (ABDM)',
      title: 'ఆయుష్మాన్ భారత్ (ABHA) ఆరోగ్య కార్డు',
      description: 'మీ న్యూలెన్స్ పరీక్ష ఫలితాలను జాతీయ ఆరోగ్య రికార్డుతో అనుసంధానించే విశిష్ట గుర్తింపు సంఖ్య.',
      govAuthority: 'జాతీయ ఆరోగ్య అథారిటీ',
      abhaCardTitle: 'ఆయుష్మాన్ భారత్ హెల్త్ అకౌంట్ (ABHA)',
      abhaNumLabel: 'ABHA సంఖ్య',
      abhaAddrLabel: 'ABHA చిరునామా',
      linkedPhcLabel: 'అనుసంధానించబడిన ప్రాథమిక ఆరోగ్య కేంద్రం',
      lastSyncLabel: 'చివరి క్లౌడ్ సమన్వయం',
      activeVerified: 'యాక్టివ్ & ధృవీకరించబడింది',
      scanAnyPhc: 'ఏదైనా ఆరోగ్య కేంద్రం / ఎయిమ్స్‌లో స్కాన్ చేయవచ్చు',
      benefitsTitle: 'వృద్ధుల కోసం ABHA ప్రయోజనాలు',
      benefit1Title: 'జిల్లా ఆసుపత్రికి తక్షణ రిఫెరల్',
      benefit1Desc: 'జ్ఞాపకశక్తిలో మార్పు కనిపిస్తే, స్థానిక వైద్యులు వెంటనే న్యూరాలజిస్ట్‌కు రిఫర్ చేయగలరు.',
      benefit2Title: 'పీఎం-జే కింద ఉచిత మందులు',
      benefit2Desc: 'బీపీ, షుగర్ మరియు మెదడు ఆరోగ్య మందులు ప్రభుత్వ గుర్తింపు పొందిన క్లినిక్‌లలో లభిస్తాయి.',
      benefit3Title: 'కుటుంబ సభ్యుల అనుమతి',
      benefit3Desc: 'అత్యవసర నివేదికలను చూసేందుకు కుమారుడు లేదా కుమార్తెకు అనుమతి ఇవ్వవచ్చు.',
      syncBtn: 'ఆయుష్మాన్ భారత్‌తో లింక్ చేయండి',
      syncingBtn: 'లింక్ అవుతోంది...',
      syncedBadge: 'విజయవంతంగా లింక్ చేయబడింది'
    },
    vitals: {
      eyebrow: 'వృద్ధుల సంరక్షణ · రోజువారీ ఆరోగ్యం & మందులు',
      title: 'రోజువారీ రక్తపోటు & మాత్రల ట్రాకర్',
      description: 'రక్తపోటు, షుగర్ మరియు మందుల సమయాలను ప్రతిరోజూ ట్రాక్ చేయండి.',
      bpLabel: 'రక్తపోటు (BP)',
      bpTarget: 'సాధారణ సీనియర్ పరిధి (<135/85)',
      sugarLabel: 'ఫాస్టింగ్ షుగర్',
      sugarTarget: 'సాధారణ పరిధి',
      medAdherence: 'మందులు వేసుకోవడం',
      medAdherenceDetail: 'ఉదయం & మధ్యాహ్నం మాత్రలు పూర్తయ్యాయి',
      habitsLabel: 'రోజువారీ అలవాట్లు',
      habitsDetail: 'ఉదయం నడక & నీరు తాగడం పూర్తయింది',
      todaySchedule: 'నేటి మందుల సమయ పట్టిక',
      tapToMark: 'మాత్ర వేసుకున్న తర్వాత నొక్కండి',
      morningPill: 'ఉదయం మాత్రలు',
      morningPillDetail: 'రక్తపోటు మాత్ర (Amlodipine 5mg) + విటమిన్ · 8:00 AM',
      afternoonPill: 'మధ్యాహ్నం మాత్రలు',
      afternoonPillDetail: 'షుగర్ మాత్ర (Metformin 500mg) · 1:30 PM',
      nightPill: 'రాత్రి మాత్రలు',
      nightPillDetail: 'కొలెస్ట్రాల్ మాత్ర (Atorvastatin 10mg) · 9:00 PM',
      taken: 'వేసుకున్నారు',
      pending: 'బాకీ ఉంది',
      logVitals: 'నేటి రీడింగులను నమోదు చేయండి',
      logVitalsDetail: 'డిజిటల్ మీటర్ రీడింగులను నమోదు చేయండి',
      systolicLabel: 'పై రక్తపోటు (సిస్టోలిక్)',
      diastolicLabel: 'కింది రక్తపోటు (డయాస్టోలిక్)',
      fastingSugarLabel: 'ఫాస్టింగ్ షుగర్ (mg/dL)',
      hydrationLabel: 'తాగిన నీరు (గ్లాసులు)',
      vitalsNormal: 'నేటి ఆరోగ్య రీడింగులు పూర్తిగా సాధారణంగా ఉన్నాయి. పరీక్షకు సురక్షితం.'
    },
    sos: {
      eyebrow: 'అత్యవసర సహాయం · 24x7 భద్రత',
      title: 'ఎమర్జెన్సీ ఎస్.ఓ.ఎస్ & కుటుంబ అలర్ట్',
      description: 'హఠాత్తుగా గందరగోళం, దారి మర్చిపోవడం లేదా వైద్య అత్యవసర పరిస్థితికి 1-ట్యాప్ సహాయం.',
      sosHeading: 'తక్షణ సహాయం కావాలా?',
      sosSubtitle: 'ఈ ఎరుపు బటన్ నొక్కడం వల్ల మీ కుటుంబ సభ్యులకు మరియు స్థానిక ఆరోగ్య కేంద్రానికి మీ లొకేషన్‌తో మెసేజ్ వెళ్తుంది.',
      sosTriggerBtn: 'తక్షణ సీనియర్ SOS పంపండి',
      sosTriggered: '✓ కుటుంబ సభ్యులు & అంబులెన్స్‌కు సమాచారం పంపబడింది',
      sosDispatched: 'అలర్ట్ పంపబడింది: కుమారుడు కార్తీక్ & తంజావూరు పీహెచ్‌సీ అంబులెన్స్.',
      teleManasTitle: 'టెలి-మానస్ హెల్ప్‌లైన్ (Tele-MANAS)',
      teleManasNum: 'డయల్ 14416 (ఉచితం)',
      teleManasDesc: 'భారత ప్రభుత్వ ఉచిత మానసిక ఆరోగ్య హెల్ప్‌లైన్ (తెలుగుతో సహా 20+ భాషల్లో).',
      teleManasCall: '14416 కు కాల్ చేయండి',
      ambulanceTitle: 'జాతీయ అంబులెన్స్ సేవ',
      ambulanceNum: 'డయల్ 108 (24 గంటల సేవ)',
      ambulanceDesc: 'తీవ్ర అనారోగ్యం, పక్షవాత లక్షణాలు లేదా ప్రమాదాలు జరిగినప్పుడు తక్షణ అంబులెన్స్.',
      ambulanceCall: '108 కు కాల్ చేయండి',
      caregiverTitle: 'కుటుంబ సంరక్షకులు',
      caregiverNum: 'కార్తీక్ (కుమారుడు) · +91 98401 23456',
      caregiverDesc: 'మీ పరీక్ష ఫలితాలు మరియు అత్యవసర హెచ్చరికలను అందుకునే ప్రాథమిక కుటుంబ సభ్యుడు.',
      caregiverCall: 'కుమారుడికి కాల్ చేయండి'
    }
  },

  ml: {
    asha: {
      eyebrow: 'ദേശീയ ആരോഗ്യ ദൗത്യം · മുതിർന്നവരുടെ സംരക്ഷണം',
      title: 'ആശ & പരിചരണ സഹായി മോഡ്',
      description: 'ആശ പ്രവർത്തകരുടെയോ കുടുംബാംഗങ്ങളുടെയോ സഹായത്തോടെയുള്ള ഓർമ്മ പരിശോധന.',
      listenVernacular: 'ശബ്ദത്തിൽ കേൾക്കുക',
      stopVoice: 'ശബ്ദം നിർത്തുക',
      seniorCitizen: 'മുതിർന്ന പൗരൻ (പ്രായം 68)',
      startAssisted: '5 മിനിറ്റ് പരിശോധന ആരംഭിക്കുക',
      checklistTitle: 'പരിശോധനയ്ക്ക് മുന്നോടിയായുള്ള തയ്യാറെടുപ്പ്',
      checklistDetail: 'കാഴ്ച അല്ലെങ്കിൽ ശബ്ദ തടസ്സങ്ങൾ ഒഴിവാക്കാൻ ഈ 4 കാര്യങ്ങൾ ഉറപ്പാക്കുക.',
      glassesTitle: 'കണ്ണട ധരിച്ചിട്ടുണ്ടോ',
      glassesDesc: 'സ്ക്രീൻ വ്യക്തമായി കാണാൻ കണ്ണട ധരിച്ചിട്ടുണ്ടെന്ന് ഉറപ്പാക്കുക.',
      hearingTitle: 'ശ്രവണ സഹായി പ്രവർത്തിക്കുന്നുണ്ടോ',
      hearingDesc: 'ശബ്ദ നിർദ്ദേശങ്ങൾ വ്യക്തമായി കേൾക്കാൻ ബാറ്ററി പരിശോധിക്കുക.',
      quietTitle: 'ശാന്തവും വെളിച്ചമുള്ളതുമായ മുറി',
      quietDesc: 'ടിവി അല്ലെങ്കിൽ റേഡിയോ ശബ്ദങ്ങൾ ഇല്ലാത്ത സ്ഥലം ഉറപ്പാക്കുക.',
      alertTitle: 'മുതിർന്ന വ്യക്തിയുടെ ആരോഗ്യാവസ്ഥ',
      alertDesc: 'പ്രഭാതഭക്ഷണത്തിന് 1-2 മണിക്കൂർ ശേഷം പരിശോധന നടത്തുന്നത് ഉചിതം.',
      notesTitle: 'ആശ പ്രവർത്തകയുടെ നിരീക്ഷണങ്ങൾ',
      notesDetail: 'കൈവിറയൽ, മറവി എന്നിവയെക്കുറിച്ചുള്ള വിവരങ്ങൾ ഡോക്ടറുടെ ഫയലിൽ ചേർക്കും.',
      notesPlaceholder: 'എന്തെങ്കിലും മറവിയോ കൈവിറയലോ ഉണ്ടെങ്കിൽ ഇവിടെ രേഖപ്പെടുത്തുക...',
      autoSynced: 'ആരോഗ്യ കേന്ദ്രവുമായി ബന്ധിപ്പിച്ചു',
      saveNotes: 'വിവരങ്ങൾ സംരക്ഷിക്കുക',
      savedSuccess: 'വിജയകരമായി സംരക്ഷിച്ചു!',
      protocolAlert: 'ക്ലിനിക്കൽ പ്രോട്ടോക്കോൾ: ഓർമ്മ പരിശോധനയിൽ ആശ പ്രവർത്തകർ ഉത്തരം പറഞ്ഞു കൊടുക്കരുത്.',
      voiceGuidanceText: 'നമസ്കാരം. ഇത് ആശ പ്രവർത്തകരുടെയും കുടുംബത്തിന്റെയും സഹായി പേജ് ആണ്.'
    },
    abha: {
      eyebrow: 'ആയുഷ്മാൻ ഭാരത് ഡിജിറ്റൽ മിഷൻ (ABDM)',
      title: 'ആയുഷ്മാൻ ഭാരത് (ABHA) ഹെൽത്ത് കാർഡ്',
      description: 'നിങ്ങളുടെ ന്യൂലെൻസ് പരിശോധനാ ഫലങ്ങൾ ദേശീയ ആരോഗ്യ രേഖയുമായി ബന്ധിപ്പിക്കുന്ന കാർഡ്.',
      govAuthority: 'ദേശീയ ആരോഗ്യ അതോറിറ്റി',
      abhaCardTitle: 'ആയുഷ്മാൻ ഭാരത് ഹെൽത്ത് അക്കൗണ്ട് (ABHA)',
      abhaNumLabel: 'ABHA നമ്പർ',
      abhaAddrLabel: 'ABHA വിലാസം',
      linkedPhcLabel: 'ബന്ധിപ്പിച്ച പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം',
      lastSyncLabel: 'അവസാന അപ്ഡേറ്റ്',
      activeVerified: 'സജീവം & പരിശോധിച്ചു',
      scanAnyPhc: 'ഏതൊരു ആരോഗ്യ കേന്ദ്രത്തിലും സ്കാൻ ചെയ്യാം',
      benefitsTitle: 'മുതിർന്നവർക്കുള്ള ABHA ആനുകൂല്യങ്ങൾ',
      benefit1Title: 'ജില്ലാ ആശുപത്രിയിലേക്ക് നേരിട്ടുള്ള റഫറൽ',
      benefit1Desc: 'ഓർമ്മക്കുറവ് കണ്ടെത്തിയാൽ പ്രാദേശിക ഡോക്ടർക്ക് വേഗത്തിൽ വിദഗ്ദ്ധ ചികിത്സയ്ക്ക് റഫർ ചെയ്യാം.',
      benefit2Title: 'പിഎം-ജെ പ്രകാരം സൗജന്യ മരുന്നുകൾ',
      benefit2Desc: 'രക്തസമ്മർദ്ദം, പ്രമേഹം എന്നിവയ്ക്കുള്ള മരുന്നുകൾ സൗജന്യമായി ലഭിക്കുന്നു.',
      benefit3Title: 'കുടുംബാംഗങ്ങൾക്ക് വിവരങ്ങൾ ലഭ്യമാക്കൽ',
      benefit3Desc: 'മകനോ മകൾക്കോ അടിയന്തര റിപ്പോർട്ടുകൾ കാണാൻ അനുമതി നൽകാം.',
      syncBtn: 'ആയുഷ്മാൻ ഭാരതുമായി ബന്ധിപ്പിക്കുക',
      syncingBtn: 'ബന്ധിപ്പിക്കുന്നു...',
      syncedBadge: 'വിജയകരമായി ബന്ധിപ്പിച്ചു'
    },
    vitals: {
      eyebrow: 'മുതിർന്നവരുടെ പരിചരണം · ദൈനംദിന ആരോഗ്യം & മരുന്നുകൾ',
      title: 'രക്തസമ്മർദ്ദവും ഗുളികകളും',
      description: 'രക്തസമ്മർദ്ദവും മരുന്നുകളുടെ സമയവും ദിവസവും രേഖപ്പെടുത്തുക.',
      bpLabel: 'രക്തസമ്മർദ്ദം (BP)',
      bpTarget: 'സാധാരണ നില (<135/85)',
      sugarLabel: 'പ്രമേഹ നില',
      sugarTarget: 'സാധാരണ പരിധി',
      medAdherence: 'മരുന്നുകൾ കഴിക്കുന്നത്',
      medAdherenceDetail: 'രാവിലത്തെയും ഉച്ചയ്ക്കത്തെയും മരുന്നുകൾ കഴിച്ചു',
      habitsLabel: 'ദൈനംദിന ശീലങ്ങൾ',
      habitsDetail: 'രാവിലത്തെ നടത്തവും വെള്ളം കുടിയും പൂർത്തിയായി',
      todaySchedule: 'ഇന്നത്തെ മരുന്ന് സമയക്രമം',
      tapToMark: 'മരുന്ന് കഴിച്ച ശേഷം അടയാളപ്പെടുത്തുക',
      morningPill: 'രാവിലത്തെ മരുന്നുകൾ',
      morningPillDetail: 'പ്രഷർ ഗുളിക (Amlodipine 5mg) + വൈറ്റമിൻ · 8:00 AM',
      afternoonPill: 'ഉച്ചയ്ക്കത്തെ മരുന്നുകൾ',
      afternoonPillDetail: 'ഷുഗർ ഗുളിക (Metformin 500mg) · 1:30 PM',
      nightPill: 'രാത്രിയിലെ മരുന്നുകൾ',
      nightPillDetail: 'കൊളസ്ട്രോൾ ഗുളിക (Atorvastatin 10mg) · 9:00 PM',
      taken: 'കഴിച്ചു',
      pending: 'കഴിക്കാനുണ്ട്',
      logVitals: 'ഇന്നത്തെ ആരോഗ്യ വിവരങ്ങൾ രേഖപ്പെടുത്തുക',
      logVitalsDetail: 'രാവിലത്തെ ഡിജിറ്റൽ മീറ്റർ റീഡിംഗുകൾ നൽകുക',
      systolicLabel: 'സിസ്റ്റോളിക് ബിപി (മുകളിൽ)',
      diastolicLabel: 'ഡയസ്റ്റോളിക് ബിപി (താഴെ)',
      fastingSugarLabel: 'ഫാസ്റ്റിംഗ് ഷുഗർ (mg/dL)',
      hydrationLabel: 'കുടിച്ച വെള്ളം (ഗ്ലാസ്സ്)',
      vitalsNormal: 'ഇന്നത്തെ റീഡിംഗുകൾ സാധാരണ നിലയിലാണ്. പരിശോധനയ്ക്ക് സുരക്ഷിതം.'
    },
    sos: {
      eyebrow: 'അടിയന്തര സഹായം · 24x7 സുരക്ഷ',
      title: 'അടിയന്തര എസ്.ഒ.എസ് & കുടുംബ അലേർട്ട്',
      description: 'പെട്ടെന്നുള്ള ആശയക്കുഴപ്പം, വഴി മറക്കൽ അല്ലെങ്കിൽ അടിയന്തര ആരോഗ്യ പ്രശ്നങ്ങൾക്ക് 1-ടച്ച് സഹായം.',
      sosHeading: 'ഉടൻ സഹായം ആവശ്യമുണ്ടോ?',
      sosSubtitle: 'ഈ ചുവന്ന ബട്ടൺ അമർത്തുമ്പോൾ നിങ്ങളുടെ കുടുംബാംഗങ്ങൾക്കും അടുത്തുള്ള പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിനും സന്ദേശം പോകും.',
      sosTriggerBtn: 'ഉടൻ സീനിയർ SOS അയക്കുക',
      sosTriggered: '✓ കുടുംബാംഗങ്ങൾക്കും ആംബുലൻസിനും വിവരം നൽകി',
      sosDispatched: 'സന്ദേശം നൽകി: മകൻ കാർത്തിക് & തഞ്ചാവൂർ ആരോഗ്യ കേന്ദ്രം ആംബുലൻസ്.',
      teleManasTitle: 'ടെലി-മാനസ് ഹെൽപ്പ്‌ലൈൻ (Tele-MANAS)',
      teleManasNum: 'ഡയൽ ചെയ്യുക 14416 (സൗജന്യം)',
      teleManasDesc: 'ഭാരത സർക്കാരിന്റെ 24 മണിക്കൂർ സൗജന്യ മാനസികാരോഗ്യ സേവനം (മലയാളം ഉൾപ്പെടെ).',
      teleManasCall: '14416 വിളിക്കുക',
      ambulanceTitle: 'ദേശീയ ആംബുലൻസ് സർവീസ്',
      ambulanceNum: 'ഡയൽ ചെയ്യുക 108 (24 മണിക്കൂർ)',
      ambulanceDesc: 'ഗുരുതരമായ അടിയന്തര സാഹചര്യങ്ങളിൽ ഉടൻ ആംബുലൻസ് ലഭ്യമാക്കുന്നു.',
      ambulanceCall: '108 വിളിക്കുക',
      caregiverTitle: 'കുടുംബ സഹായി',
      caregiverNum: 'കാർത്തിക് (മകൻ) · +91 98401 23456',
      caregiverDesc: 'നിങ്ങളുടെ പരിശോധനാ റിപ്പോർട്ടുകൾ ലഭിക്കുന്ന കുടുംബാംഗം.',
      caregiverCall: 'മകനെ വിളിക്കുക'
    }
  },

  kn: {
    asha: {
      eyebrow: 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಅಭಿಯಾನ · ಹಿರಿಯ ನಾಗರಿಕರ ಆರೈಕೆ',
      title: 'ಆಶಾ & ಆರೈಕೆದಾರರ ಸಹಾಯಕ ಮೋಡ್',
      description: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರು ಅಥವಾ ಕುಟುಂಬದವರ ನೆರವಿನೊಂದಿಗೆ 60+ ವಯೋಮಾನದವರಿಗೆ ಸರಳ ಜ್ಞಾಪಕಶಕ್ತಿ ತಪಾಸಣೆ.',
      listenVernacular: 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ',
      stopVoice: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ',
      seniorCitizen: 'ಹಿರಿಯ ನಾಗರಿಕರು (ವಯಸ್ಸು 68)',
      startAssisted: '5 ನಿಮಿಷಗಳ ಸಹಾಯಕ ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ',
      checklistTitle: 'ತಪಾಸಣಾ ಪೂರ್ವ ಸಿದ್ಧತೆ',
      checklistDetail: 'ಕಣ್ಣಿನ ಮತ್ತು ಧ್ವನಿ ಪರೀಕ್ಷೆಗೂ ಮುನ್ನ ಈ 4 ವಿಷಯಗಳನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
      glassesTitle: 'ಓದುವ ಕನ್ನಡಕ ಧರಿಸಿದ್ದೀರಾ',
      glassesDesc: 'ಪರದೆಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ನೋಡಲು ಕನ್ನಡಕವನ್ನು ಧರಿಸಿರುವುದು ಅಗತ್ಯ.',
      hearingTitle: 'ಶ್ರವಣ ಸಾಧನ ತಪಾಸಣೆ (ಅಗತ್ಯವಿದ್ದರೆ)',
      hearingDesc: 'ಧ್ವನಿ ಸೂಚನೆಗಳು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಲು ಬ್ಯಾಟರಿ ಪರಿಶೀಲಿಸಿ.',
      quietTitle: 'ಶಾಂತ ಮತ್ತು ಬೆಳಕಿನ ಕೊಠಡಿ',
      quietDesc: 'ಟಿವಿ ಶಬ್ದವಿಲ್ಲದ ಮತ್ತು ಸೂಕ್ತ ಬೆಳಕಿರುವ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.',
      alertTitle: 'ಹಿರಿಯರ ಚುರುಕುತನ ಮತ್ತು ಆರೋಗ್ಯ ಸ್ಥಿತಿ',
      alertDesc: 'ಬೆಳಗಿನ ಉಪಹಾರದ 1-2 ಗಂಟೆಗಳ ನಂತರ ತಪಾಸಣೆ ಮಾಡುವುದು ಸೂಕ್ತ.',
      notesTitle: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರ ಟಿಪ್ಪಣಿಗಳು',
      notesDetail: 'ಕೈ ನಡುಕ ಮತ್ತು ಜ್ಞಾಪಕಶಕ್ತಿಯ ವಿವರಗಳು ವೈದ್ಯರ ಕಡತಕ್ಕೆ ಸೇರಿಸಲ್ಪಡುತ್ತವೆ.',
      notesPlaceholder: 'ಯಾವುದಾದರೂ ಗೊಂದಲ, ನಡುಕ ಅಥವಾ ಕುಟುಂಬದವರು ತಿಳಿಸಿದ ವಿಷಯಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...',
      autoSynced: 'ಆರೋಗ್ಯ ಕೇಂದ್ರದೊಂದಿಗೆ ಜೋಡಿಸಲಾಗಿದೆ',
      saveNotes: 'ಟಿಪ್ಪಣಿಗಳನ್ನು ಉಳಿಸಿ',
      savedSuccess: 'ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!',
      protocolAlert: 'ವೈದ್ಯಕೀಯ ನಿಯಮ: ಜ್ಞಾಪಕಶಕ್ತಿ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರು ಉತ್ತರಗಳನ್ನು ಹೇಳಿಕೊಡಬಾರದು.',
      voiceGuidanceText: 'ನಮಸ್ಕಾರ. ಇದು ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಮತ್ತು ಕುಟುಂಬ ಆರೈಕೆದಾರರ ಸಹಾಯಕ ಪುಟ.'
    },
    abha: {
      eyebrow: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಡಿಜಿಟಲ್ ಮಿಷನ್ (ABDM)',
      title: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ (ABHA) ಆರೋಗ್ಯ ಕಾರ್ಡ್',
      description: 'ನಿಮ್ಮ ನ್ಯೂಲೆನ್ಸ್ ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶಗಳನ್ನು ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ದಾಖಲೆಯೊಂದಿಗೆ ಜೋಡಿಸುವ ಸಂಖ್ಯೆ.',
      govAuthority: 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಪ್ರಾಧಿಕಾರ',
      abhaCardTitle: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಹೆಲ್ತ್ ಅಕೌಂಟ್ (ABHA)',
      abhaNumLabel: 'ABHA ಸಂಖ್ಯೆ',
      abhaAddrLabel: 'ABHA ವಿಳಾಸ',
      linkedPhcLabel: 'ಸಂಪರ್ಕಿತ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ',
      lastSyncLabel: 'ಕೊನೆಯ ಕ್ಲೌಡ್ ನವೀಕರಣ',
      activeVerified: 'ಸಕ್ರಿಯ & ದೃಢೀಕೃತ',
      scanAnyPhc: 'ಯಾವುದೇ ಆರೋಗ್ಯ ಕೇಂದ್ರ / ಏಮ್ಸ್‌ನಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಬಹುದು',
      benefitsTitle: 'ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ABHA ಪ್ರಯೋಜನಗಳು',
      benefit1Title: 'ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗೆ ತ್ವರಿತ ರೆಫರಲ್',
      benefit1Desc: 'ಜ್ಞಾಪಕಶಕ್ತಿಯಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದರೆ ಸ್ಥಳೀಯ ವೈದ್ಯರು ತಕ್ಷಣ ನರಶಾಸ್ತ್ರಜ್ಞರಿಗೆ ರೆಫರ್ ಮಾಡಬಹುದು.',
      benefit2Title: 'ಪಿಎಂ-ಜೆ ಅಡಿಯಲ್ಲಿ ಉಚಿತ ಔಷಧಿಗಳು',
      benefit2Desc: 'ರಕ್ತದೊತ್ತಡ, ಮಧುಮೇಹ ಮತ್ತು ಮೆದುಳಿನ ಆರೋಗ್ಯದ ಔಷಧಿಗಳು ಉಚಿತವಾಗಿ ದೊರೆಯುತ್ತವೆ.',
      benefit3Title: 'ಕುಟುಂಬದವರಿಗೆ ಮಾಹಿತಿ ಲಭ್ಯತೆ',
      benefit3Desc: 'ತುರ್ತು ವರದಿಗಳನ್ನು ನೋಡಲು ಮಗ ಅಥವಾ ಮಗಳಿಗೆ ಅನುಮತಿ ನೀಡಬಹುದು.',
      syncBtn: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್‌ನೊಂದಿಗೆ ಜೋಡಿಸಿ',
      syncingBtn: 'ಜೋಡಿಸಲಾಗುತ್ತಿದೆ...',
      syncedBadge: 'ಯಶಸ್ವಿಯಾಗಿ ಜೋಡಿಸಲಾಗಿದೆ'
    },
    vitals: {
      eyebrow: 'ಹಿರಿಯ ನಾಗರಿಕರ ಆರೈಕೆ · ದಿನನಿತ್ಯದ ಆರೋಗ್ಯ & ಮಾತ್ರೆಗಳು',
      title: 'ದೈನಂದಿನ ರಕ್ತದೊತ್ತಡ & ಮಾತ್ರೆಗಳ ಟ್ರ್ಯಾಕರ್',
      description: 'ರಕ್ತದೊತ್ತಡ, ಶುಗರ್ ಮತ್ತು ಮಾತ್ರೆಗಳ ಸಮಯವನ್ನು ಪ್ರತಿದಿನ ದಾಖಲಿಸಿ.',
      bpLabel: 'ರಕ್ತದೊತ್ತಡ (BP)',
      bpTarget: 'ಸಾಮಾನ್ಯ ಹಿರಿಯರ ಮಿತಿ (<135/85)',
      sugarLabel: 'ಫಾಸ್ಟಿಂಗ್ ಶುಗರ್',
      sugarTarget: 'ಸಾಮಾನ್ಯ ನಿಯಂತ್ರಣ',
      medAdherence: 'ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದು',
      medAdherenceDetail: 'ಬೆಳಗ್ಗೆ ಮತ್ತು ಮಧ್ಯಾಹ್ನದ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ',
      habitsLabel: 'ದೈನಂದಿನ ಅಭ್ಯಾಸಗಳು',
      habitsDetail: 'ಬೆಳಗಿನ ನಡಿಗೆ & ನೀರು ಕುಡಿಯುವುದು ಪೂರ್ಣಗೊಂಡಿದೆ',
      todaySchedule: 'ಇಂದಿನ ಮಾತ್ರೆಗಳ ವೇಳಾಪಟ್ಟಿ',
      tapToMark: 'ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡ ನಂತರ ಗುರುತಿಸಿ',
      morningPill: 'ಬೆಳಗಿನ ಮಾತ್ರೆಗಳು',
      morningPillDetail: 'ಬಿಪಿ ಮಾತ್ರೆ (Amlodipine 5mg) + ವಿಟಮಿನ್ · 8:00 AM',
      afternoonPill: 'ಮಧ್ಯಾಹ್ನದ ಮಾತ್ರೆಗಳು',
      afternoonPillDetail: 'ಶುಗರ್ ಮಾತ್ರೆ (Metformin 500mg) · 1:30 PM',
      nightPill: 'ರಾತ್ರಿಯ ಮಾತ್ರೆಗಳು',
      nightPillDetail: 'ಕೊಲೆಸ್ಟ್ರಾಲ್ ಮಾತ್ರೆ (Atorvastatin 10mg) · 9:00 PM',
      taken: 'ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ',
      pending: 'ಬಾಕಿ ಇದೆ',
      logVitals: 'ಇಂದಿನ ರೀಡಿಂಗ್ ದಾಖಲಿಸಿ',
      logVitalsDetail: 'ಡಿಜಿಟಲ್ ಮೀಟರ್‌ನಿಂದ ಬೆಳಗಿನ ರೀಡಿಂಗ್ ನಮೂದಿಸಿ',
      systolicLabel: 'ಸಿಸ್ಟೋಲಿಕ್ ಬಿಪಿ (ಮೇಲಿನ)',
      diastolicLabel: 'ಡಯಾಸ್ಟೋಲಿಕ್ ಬಿಪಿ (ಕೆಳಗಿನ)',
      fastingSugarLabel: 'ಫಾಸ್ಟಿಂಗ್ ಶುಗರ್ (mg/dL)',
      hydrationLabel: 'ಕುಡಿದ ನೀರು (ಲೋಟಗಳು)',
      vitalsNormal: 'ಇಂದಿನ ರೀಡಿಂಗ್‌ಗಳು ಸಾಮಾನ್ಯ ಮಿತಿಯಲ್ಲಿದ್ದು, ತಪಾಸಣೆಗೆ ಸುರಕ್ಷಿತವಾಗಿದೆ.'
    },
    sos: {
      eyebrow: 'ತುರ್ತು ಸಹಾಯ · 24x7 ರಕ್ಷಣೆ',
      title: 'ಎಮರ್ಜೆನ್ಸಿ SOS & ಕುಟುಂಬದ ಅಲರ್ಟ್',
      description: 'ಹಠಾತ್ ಗೊಂದಲ, ದಾರಿ ಮರೆಯುವುದು ಅಥವಾ ತುರ್ತು ವೈದ್ಯಕೀಯ ಪರಿಸ್ಥಿತಿಗೆ 1-ಟ್ಯಾಪ್ ಸಹಾಯ.',
      sosHeading: 'ತಕ್ಷಣದ ಸಹಾಯ ಬೇಕೇ?',
      sosSubtitle: 'ಈ ಕೆಂಪು ಬಟನ್ ಒತ್ತುವುದರಿಂದ ನಿಮ್ಮ ಕುಟುಂಬದವರಿಗೆ ಮತ್ತು ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ನಿಮ್ಮ ಸ್ಥಳದೊಂದಿಗೆ ಸಂದೇಶ ರವಾನೆಯಾಗುತ್ತದೆ.',
      sosTriggerBtn: 'ತುರ್ತು ಸೀನಿಯರ್ SOS ಕಳುಹಿಸಿ',
      sosTriggered: '✓ ಕುಟುಂಬ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಮಾಹಿತಿ ರವಾನಿಸಲಾಗಿದೆ',
      sosDispatched: 'ಮಾಹಿತಿ ರವಾನಿಸಲಾಗಿದೆ: ಮಗ ಕಾರ್ತಿಕ್ & ತಂಜಾವೂರು ಆರೋಗ್ಯ ಕೇಂದ್ರದ ಆಂಬ್ಯುಲೆನ್ಸ್.',
      teleManasTitle: 'ಟೆಲಿ-ಮಾನಸ್ ಹೆಲ್ಪ್‌ಲೈನ್ (Tele-MANAS)',
      teleManasNum: 'ಡಯಲ್ 14416 (ಉಚಿತ)',
      teleManasDesc: 'ಭಾರತ ಸರ್ಕಾರದ 24 ಗಂಟೆಗಳ ಉಚಿತ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿ (ಕನ್ನಡ ಸೇರಿದಂತೆ).',
      teleManasCall: '14416 ಗೆ ಕರೆ ಮಾಡಿ',
      ambulanceTitle: 'ರಾಷ್ಟ್ರೀಯ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇವೆ',
      ambulanceNum: 'ಡಯಲ್ 108 (24 ಗಂಟೆಗಳ ಸೇವೆ)',
      ambulanceDesc: 'ತೀವ್ರ ಅನಾರೋಗ್ಯ, ಪಾರ್ಶ್ವವಾಯು ಲಕ್ಷಣಗಳು ಅಥವಾ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ತಕ್ಷಣ ಆಂಬ್ಯುಲೆನ್ಸ್.',
      ambulanceCall: '108 ಗೆ ಕರೆ ಮಾಡಿ',
      caregiverTitle: 'ನೋಂದಾಯಿತ ಆರೈಕೆದಾರರು',
      caregiverNum: 'ಕಾರ್ತಿಕ್ (ಮಗ) · +91 98401 23456',
      caregiverDesc: 'ನಿಮ್ಮ ತಪಾಸಣಾ ಫಲಿತಾಂಶಗಳು ಮತ್ತು ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳನ್ನು ಸ್ವೀಕರಿಸುವ ಕುಟುಂಬದ ಮುಖ್ಯ ಸದಸ್ಯ.',
      caregiverCall: 'ಮಗನಿಗೆ ಕರೆ ಮಾಡಿ'
    }
  },

  ar: {
    asha: {
      eyebrow: 'الرعاية الصحية الأولية · رعاية كبار السن',
      title: 'مساعد الرعاية لكبار السن',
      description: 'بروتوكول فحص الذاكرة لكبار السن مع مرافق الرعاية.',
      listenVernacular: 'استمع للتوجيه الصوتي',
      stopVoice: 'إيقاف الصوت',
      seniorCitizen: 'كبار السن (68 عامًا)',
      startAssisted: 'بدء الفحص بمساعدة (5 دقائق)',
      checklistTitle: 'قائمة الجاهزية قبل الفحص',
      checklistDetail: 'تأكد من هذه النقاط الأربع قبل بدء الفحص البصري والصوتي.',
      glassesTitle: 'ارتداء النظارات الطبية',
      glassesDesc: 'ضروري لرؤية الشاشة بوضوح ومتابعة العناصر البصرية.',
      hearingTitle: 'التأكد من السماعة الطبية',
      hearingDesc: 'لضمان سماع التعليمات الصوتية بوضوح.',
      quietTitle: 'غرفة هادئة وإضاءة جيدة',
      quietDesc: 'تجنب الضوضاء وتأكد من كفاية الإضاءة.',
      alertTitle: 'يقظة وتركيز المريض',
      alertDesc: 'يفضل إجراء الفحص بعد الإفطار بساعة أو ساعتين.',
      notesTitle: 'ملاحظات مقدم الرعاية',
      notesDetail: 'يتم تسجيل أي ملاحظات حول الحركة أو الذاكرة وإضافتها لملف الطبيب.',
      notesPlaceholder: 'سجل أي ملاحظات حول التركيز أو الرعشة هنا...',
      autoSynced: 'متصل بالمركز الصحي',
      saveNotes: 'حفظ الملاحظات',
      savedSuccess: 'تم الحفظ بنجاح!',
      protocolAlert: 'بروتوكول طبي: يجب عدم إعطاء إجابات للمريض أثناء الفحص لضمان دقة التقييم.',
      voiceGuidanceText: 'مرحبًا بك في صفحة مساعدة كبار السن للفحص الإدراكي.'
    },
    abha: {
      eyebrow: 'الملف الصحي الرقمي',
      title: 'بطاقة الصحة الرقمية والربط الطبي',
      description: 'ربط نتائج فحوصات نيولنس مع سجلك الطبي الوطني الموحد.',
      govAuthority: 'الهيئة الصحية الوطنية',
      abhaCardTitle: 'حساب الصحة الرقمي',
      abhaNumLabel: 'رقم الملف الصحي',
      abhaAddrLabel: 'العنوان الصحي الرقمي',
      linkedPhcLabel: 'المركز الصحي المرتبط',
      lastSyncLabel: 'آخر مزامنة سحابية',
      activeVerified: 'نشط وموثق',
      scanAnyPhc: 'يمكن مسح الرمز في أي مركز صحي أو مستشفى',
      benefitsTitle: 'مزايا الربط الصحي الرقمي',
      benefit1Title: 'إحالة فورية للمستشفى التخصصي',
      benefit1Desc: 'في حال ملاحظة أي تراجع يتم تحويلك فورًا لطبيب الأعصاب مع سجلك الكامل.',
      benefit2Title: 'تغطية الأدوية المعتمدة',
      benefit2Desc: 'تغطية أدوية الضغط والسكري وصحة الدماغ في المراكز المعتمدة.',
      benefit3Title: 'وصول أفراد العائلة المعتمدين',
      benefit3Desc: 'إمكانية إشراك الابن أو الابنة لمتابعة التقارير الطبية وحالات الطوارئ.',
      syncBtn: 'مزامنة السجل الصحي الآن',
      syncingBtn: 'جارٍ المزامنة...',
      syncedBadge: 'تمت المزامنة بنجاح'
    },
    vitals: {
      eyebrow: 'رعاية كبار السن · المؤشرات الحيوية اليومية والأدوية',
      title: 'متابع ضغط الدم وجدول الأدوية اليومي',
      description: 'متابعة يومية لضغط الدم والسكر والالتزام بجرعات الدواء.',
      bpLabel: 'ضغط الدم',
      bpTarget: 'المعدل الطبيعي لكبار السن (<135/85)',
      sugarLabel: 'سكر الدم الصائم',
      sugarTarget: 'مستوى منضبط',
      medAdherence: 'الالتزام بالأدوية',
      medAdherenceDetail: 'تم تناول جرعات الصباح والظهيرة',
      habitsLabel: 'العادات الصحية',
      habitsDetail: 'المشي الصباحي وشرب الماء مكتمل',
      todaySchedule: 'جدول أدوية اليوم',
      tapToMark: 'اضغط لتأكيد تناول الجرعة',
      morningPill: 'أدوية الصباح',
      morningPillDetail: 'دواء الضغط + فيتامينات · 8:00 صباحًا',
      afternoonPill: 'أدوية الظهيرة',
      afternoonPillDetail: 'دواء السكر · 1:30 ظهرًا',
      nightPill: 'أدوية المساء',
      nightPillDetail: 'دواء الكوليسترول · 9:00 مساءً',
      taken: 'تم التناول',
      pending: 'متبقي',
      logVitals: 'تسجيل قراءات اليوم',
      logVitalsDetail: 'أدخل قراءات الجهاز الرقمي الصباحية',
      systolicLabel: 'الضغط الانقباضي (العلوي)',
      diastolicLabel: 'الضغط الانبساطي (السفلي)',
      fastingSugarLabel: 'سكر الدم الصائم (mg/dL)',
      hydrationLabel: 'شرب الماء (أكواب)',
      vitalsNormal: 'المؤشرات الحيوية مستقرة وضمن الحدود الطبيعية. آمن لإجراء الفحص.'
    },
    sos: {
      eyebrow: 'بروتوكولات الطوارئ · حماية كبار السن على مدار الساعة',
      title: 'نداء الاستغاثة الطارئ وتنبيه العائلة',
      description: 'تنبيه فوري بضغطة واحدة لحالات الارتباك الحاد أو التوهان أو الطوارئ الطبية.',
      sosHeading: 'هل تحتاج إلى مساعدة فورية؟',
      sosSubtitle: 'الضغط على هذا الزر يرسل إشعارًا فوريًا لمقدم الرعاية المسجل مع موقعك الجغرافي ويخطر المركز الصحي.',
      sosTriggerBtn: 'إرسال نداء استغاثة عاجل (SOS)',
      sosTriggered: '✓ تم إرسال النداء للعائلة وخدمات الإسعاف',
      sosDispatched: 'تم إرسال التنبيه: تم إخطار الابن وإسعاف المركز الصحي.',
      teleManasTitle: 'خط الدعم الصحي النفسي',
      teleManasNum: 'الاتصال بالرقم المجاني للطوارئ',
      teleManasDesc: 'خدمة دعم مجانية على مدار 24 ساعة.',
      teleManasCall: 'اتصل الآن',
      ambulanceTitle: 'الإسعاف الوطني',
      ambulanceNum: 'الاتصال بالإسعاف (24/7)',
      ambulanceDesc: 'استجابة سريعة لحالات السكتة الدماغية المفاجئة أو السقوط الحاد.',
      ambulanceCall: 'طلب الإسعاف الآن',
      caregiverTitle: 'مقدم الرعاية المسجل',
      caregiverNum: 'الابن (المسؤول الرئيسي)',
      caregiverDesc: 'يتلقى ملخصات الفحص وتنبيهات الطوارئ والتغييرات الصحية.',
      caregiverCall: 'الاتصال بمقدم الرعاية'
    }
  }
};
