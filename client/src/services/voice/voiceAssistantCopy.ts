import { SupportedLanguage } from '../language/types';

/**
 * Copy for the patient voice copilot. One typed interface for both languages,
 * so a missing Arabic string is a compile error.
 */
export interface VoiceAssistantCopy {
  buttonLabel: string;
  panelTitle: string;
  panelSubtitle: string;
  statusIdle: string;
  statusListening: string;
  statusWaitingForWake: string;
  wakePrompt: (name: string) => string;
  wakeHint: string;
  backgroundOn: string;
  backgroundOff: string;
  backgroundActive: string;
  statusThinking: string;
  statusSpeaking: string;
  startListening: string;
  stopListening: string;
  micHint: string;
  unsupported: string;
  you: string;
  assistant: string;
  emptyState: string;
  suggestionsTitle: string;
  suggestions: string[];
  openingPage: (page: string) => string;
  greeting: (name: string) => string;
  capabilities: string;
  summary: (parts: string[]) => string;
  summaryNothing: string;
  noAppointments: string;
  nextAppointment: (title: string, date: string, time: string) => string;
  carePlanStatus: (progress: number, nextReview: string) => string;
  carePlanNoReview: (progress: number) => string;
  stopped: string;
  languageSwitched: string;
  notUnderstood: string;
  modelUnavailable: string;
  micDenied: string;
  permissionTitle: string;
  permissionBody: string;
  permissionBullet1: string;
  permissionBullet2: string;
  permissionBullet3: string;
  permissionAllow: string;
  permissionNotNow: string;
  permissionDenied: string;
  permissionClose: string;
  summaryBrain: string;
  summaryAppointments: string;
  summaryNotifications: string;
  close: string;
}

const en: VoiceAssistantCopy = {
  buttonLabel: 'Voice assistant',
  panelTitle: 'NeuLens assistant',
  panelSubtitle: 'Speak in English, Tamil, or Hindi',
  statusIdle: 'Tap the microphone and speak',
  statusListening: 'Listening…',
  statusWaitingForWake: 'Say “Hey NeuLens” to start',
  wakePrompt: (name) => `Yes ${name}? I'm listening.`,
  wakeHint: 'Wake me by saying “Hey NeuLens”, then speak your command.',
  backgroundOn: 'Turn off hands-free listening',
  backgroundOff: 'Turn on hands-free listening',
  backgroundActive: 'Hands-free listening is on',
  statusThinking: 'One moment…',
  statusSpeaking: 'Speaking…',
  startListening: 'Start listening',
  stopListening: 'Stop listening',
  micHint: 'Try “open my brain health” or “when is my next appointment?”',
  unsupported: 'Voice input needs Chrome, Edge or Safari with microphone access.',
  you: 'You',
  assistant: 'Assistant',
  emptyState: 'Ask me to open a page or explain your results.',
  suggestionsTitle: 'Try saying',
  suggestions: ['Open my brain health', 'When is my next appointment?', 'What should I do next?', 'Switch to Tamil', 'Switch to Hindi'],
  openingPage: (page) => `Opening ${page}.`,
  greeting: (name) => `Hello ${name}. What would you like to see?`,
  capabilities:
    'I can open any page in your portal, read your brain health summary, tell you your next appointment, and explain your care plan. You can speak in English, Tamil, or Hindi.',
  summary: (parts) => `Here is your summary. ${parts.join(' ')}`,
  summaryNothing: 'I do not have assessment results to summarize yet. Starting an assessment is the best next step.',
  noAppointments: 'You have no upcoming appointments scheduled.',
  nextAppointment: (title, date, time) => `Your next appointment is ${title} on ${date} at ${time}.`,
  carePlanStatus: (progress, nextReview) =>
    `Your care plan is ${progress}% complete. The next review is ${nextReview}.`,
  carePlanNoReview: (progress) => `Your care plan is ${progress}% complete.`,
  stopped: 'Stopped.',
  languageSwitched: 'Switched to English.',
  notUnderstood:
    'I did not catch a command in that. You can ask me to open a page, read your summary, or check your appointments.',
  modelUnavailable:
    'I cannot answer that one here yet. I can open any page, read your summary, or check your appointments — or your clinician can discuss it with you.',
  micDenied: 'Microphone access was blocked. Allow it in your browser settings and try again.',
  permissionTitle: 'Allow microphone access',
  permissionBody:
    'NeuLens uses your microphone to hear “Hey NeuLens” and your voice commands, in English, Tamil, or Hindi. It only listens while hands-free mode is on.',
  permissionBullet1: 'Your voice is processed to understand your commands.',
  permissionBullet2: 'You can turn hands-free listening off at any time.',
  permissionBullet3: 'Nothing is recorded for anyone else to hear.',
  permissionAllow: 'Allow microphone',
  permissionNotNow: 'Not now',
  permissionDenied:
    'Microphone access is blocked in this browser. Open your browser settings, allow the microphone for this site, then try again.',
  permissionClose: 'Close',
  summaryBrain: 'Your brain health score is',
  summaryAppointments: 'next appointment',
  summaryNotifications: 'unread notifications',
  close: 'Close assistant'
};

const ta: VoiceAssistantCopy = {
  buttonLabel: 'குரல் உதவியாளர்',
  panelTitle: 'NeuLens குரல் உதவியாளர்',
  panelSubtitle: 'தமிழ், ஆங்கிலம் அல்லது ஹிந்தியில் பேசவும்',
  statusIdle: 'மைக்கைத் தட்டிப் பேசவும்',
  statusListening: 'கேட்கிறது…',
  statusWaitingForWake: 'தொடங்க “Hey NeuLens” என்று சொல்லவும்',
  wakePrompt: (name) => `சொல்லுங்க ${name}? நான் கேட்கிறேன்.`,
  wakeHint: '“Hey NeuLens” என்று கூறி உதவியாளரை அழைக்கவும்.',
  backgroundOn: 'ஹேண்ட்ஸ்-ப்ரீ கேட்கும் பயன்முறையை அணைக்கவும்',
  backgroundOff: 'ஹேண்ட்ஸ்-ப்ரீ கேட்கும் பயன்முறையை இயக்கவும்',
  backgroundActive: 'ஹேண்ட்ஸ்-ப்ரீ பயன்முறை இயங்குகிறது',
  statusThinking: 'ஒரு நிமிடம்…',
  statusSpeaking: 'பேசுகிறது…',
  startListening: 'கேட்கத் தொடங்கு',
  stopListening: 'கேட்பதை நிறுத்து',
  micHint: '“என் மூளை நலம் திற” அல்லது “அடுத்த அப்பாயின்ட்மெண்ட் எப்போது?” என்று கேட்கவும்',
  unsupported: 'குரல் உள்ளீட்டிற்கு மைக்ரோஃபோன் அணுகல் கொண்ட நவீன உலாவி தேவை.',
  you: 'நீங்கள்',
  assistant: 'உதவியாளர்',
  emptyState: 'பக்கத்தைத் திறக்க அல்லது முடிவுகளை விளக்க என்னிடம் கேளுங்கள்.',
  suggestionsTitle: 'இவற்றைச் சொல்லிப் பாருங்கள்',
  suggestions: ['என் மூளை நலம் திற', 'அடுத்த அப்பாயின்ட்மெண்ட் எப்போது?', 'அடுத்து நான் என்ன செய்ய வேண்டும்?', 'தமிழுக்கு மாற்று'],
  openingPage: (page) => `${page} பக்கத்தைத் திறக்கிறது.`,
  greeting: (name) => `வணக்கம் ${name}. உங்களுக்கு என்ன வேண்டும்?`,
  capabilities:
    'நான் உங்கள் போர்ட்டலின் எந்தப் பக்கத்தையும் திறக்கலாம், மூளை நலச் சுருக்கத்தை வாசிக்கலாம், அடுத்த சந்திப்பு நேரத்தைக் கூறலாம்.',
  summary: (parts) => `இதோ உங்கள் சுருக்கம்: ${parts.join(' ')}`,
  summaryNothing: 'சுருக்கிக் கூற இதுவரை மதிப்பீட்டு முடிவுகள் எதுவும் இல்லை. புதிய மதிப்பீட்டைத் தொடங்குவது நல்லது.',
  noAppointments: 'அடுத்த சந்திப்புகள் எதுவும் திட்டமிடப்படவில்லை.',
  nextAppointment: (title, date, time) => `உங்கள் அடுத்த சந்திப்பு ${date} அன்று ${time} மணிக்கு: ${title}.`,
  carePlanStatus: (progress, nextReview) => `பராமரிப்புத் திட்டம் ${progress}% முடிந்தது. அடுத்த ஆய்வு ${nextReview}.`,
  carePlanNoReview: (progress) => `பராமரிப்புத் திட்டம் ${progress}% முடிந்தது.`,
  stopped: 'நிறுத்தப்பட்டது.',
  languageSwitched: 'தமிழுக்கு மாற்றப்பட்டது.',
  notUnderstood: 'சரியாகப் புரியவில்லை. பக்கத்தைத் திறக்கவோ அல்லது சுருக்கத்தைக் கேட்கவோ சொல்லலாம்.',
  modelUnavailable: 'தற்போது இதற்கான பதில் கிடைக்கவில்லை. உங்கள் மருத்துவரிடம் ஆலோசனை பெறலாம்.',
  micDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதி வழங்கவும்.',
  permissionTitle: 'மைக்ரோஃபோன் அணுகலை அனுமதிக்கவும்',
  permissionBody: 'உங்கள் குரல் கட்டளைகளைப் புரிந்துகொள்ள NeuLens மைக்ரோஃபோனைப் பயன்படுத்துகிறது.',
  permissionBullet1: 'உங்கள் கட்டளைகளைப் புரிந்துகொள்ள குரல் உள்நாட்டில் பகுப்பாய்வு செய்யப்படுகிறது.',
  permissionBullet2: 'எப்போது வேண்டுமானாலும் ஹேண்ட்ஸ்-ப்ரீ கேட்கும் முறையை நிறுத்தலாம்.',
  permissionBullet3: 'உங்கள் உரையாடல்கள் பாதுகாப்பாகவும் ரகசியமாகவும் பராமரிக்கப்படுகின்றன.',
  permissionAllow: 'மைக்கை அனுமதி',
  permissionNotNow: 'இப்போது வேண்டாம்',
  permissionDenied: 'மைக் அணுகல் தடுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் மாற்றவும்.',
  permissionClose: 'மூடு',
  summaryBrain: 'உங்கள் மூளை நல மதிப்பெண்',
  summaryAppointments: 'அடுத்த மருத்துவ சந்திப்பு',
  summaryNotifications: 'படிக்காத அறிவிப்புகள்',
  close: 'உதவியாளரை மூடு'
};

const hi: VoiceAssistantCopy = {
  buttonLabel: 'वॉइस सहायक',
  panelTitle: 'NeuLens सहायक',
  panelSubtitle: 'हिन्दी, तमिल या अंग्रेज़ी में बोलें',
  statusIdle: 'माइक दबाएं और बोलें',
  statusListening: 'सुन रहा है…',
  statusWaitingForWake: 'शुरू करने के लिए “Hey NeuLens” कहें',
  wakePrompt: (name) => `जी ${name}? मैं सुन रहा हूँ।`,
  wakeHint: '“Hey NeuLens” बोलकर सक्रिय करें, फिर निर्देश दें।',
  backgroundOn: 'हैंड्स-फ्री लिसनिंग बंद करें',
  backgroundOff: 'हैंड्स-फ्री लिसनिंग चालू करें',
  backgroundActive: 'हैंड्स-फ्री लिसनिंग सक्रिय है',
  statusThinking: 'एक पल…',
  statusSpeaking: 'बोल रहा है…',
  startListening: 'सुनना शुरू करें',
  stopListening: 'सुनना बंद करें',
  micHint: '“दिमागी सेहत खोलें” या “अगला अपॉइंटमेंट कब है?” बोलें',
  unsupported: 'आवाज़ इनपुट के लिए माइक्रोफ़ोन अनुमति की आवश्यकता है।',
  you: 'आप',
  assistant: 'सहायक',
  emptyState: 'कोई पेज खोलने या परिणाम समझाने के लिए कहें।',
  suggestionsTitle: 'यह बोलकर देखें',
  suggestions: ['दिमागी सेहत खोलें', 'अगला अपॉइंटमेंट कब है?', 'मुझे आगे क्या करना चाहिए?', 'हिन्दी में बदलें'],
  openingPage: (page) => `${page} खोला जा रहा है।`,
  greeting: (name) => `नमस्ते ${name}! आप क्या देखना चाहेंगे?`,
  capabilities:
    'मैं आपके पोर्टल का कोई भी पेज खोल सकता हूँ, आपकी रिपोर्ट का सारांश पढ़ सकता हूँ और अपॉइंटमेंट बता सकता हूँ।',
  summary: (parts) => `यह आपका सारांश है: ${parts.join(' ')}`,
  summaryNothing: 'संक्षेप करने के लिए अभी कोई परिणाम उपलब्ध नहीं हैं। एक नया टेस्ट शुरू करना सबसे अच्छा अगला कदम है।',
  noAppointments: 'कोई आगामी अपॉइंटमेंट निर्धारित नहीं है।',
  nextAppointment: (title, date, time) => `आपका अगला अपॉइंटमेंट ${date} को ${time} बजे है: ${title}।`,
  carePlanStatus: (progress, nextReview) => `केयर प्लान ${progress}% पूरा हुआ। अगली समीक्षा ${nextReview} को है।`,
  carePlanNoReview: (progress) => `केयर प्लान ${progress}% पूरा हुआ।`,
  stopped: 'रोक दिया गया।',
  languageSwitched: 'हिन्दी में बदला गया।',
  notUnderstood: 'मुझे स्पष्ट समझ नहीं आया। आप पेज खोलने या सारांश पढ़ने के लिए कह सकते हैं।',
  modelUnavailable: 'मैं अभी इसका उत्तर देने में असमर्थ हूँ। आप अपने डॉक्टर से चर्चा कर सकते हैं।',
  micDenied: 'माइक्रोफ़ोन अनुमति अवरुद्ध है। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।',
  permissionTitle: 'माइक्रोफ़ोन की अनुमति दें',
  permissionBody: 'NeuLens आपकी आवाज़ सुनने और सहायता करने के लिए माइक्रोफ़ोन का उपयोग करता है।',
  permissionBullet1: 'आपके निर्देशों को समझने के लिए आवाज़ को प्रोसेस किया जाता है।',
  permissionBullet2: 'आप किसी भी समय हैंड्स-फ्री मोड बंद कर सकते हैं।',
  permissionBullet3: 'आपकी बातचीत पूरी तरह गोपनीय और सुरक्षित है।',
  permissionAllow: 'माइक की अनुमति दें',
  permissionNotNow: 'अभी नहीं',
  permissionDenied: 'माइक्रोफ़ोन एक्सेस ब्लॉक है। ब्राउज़र सेटिंग्स में इसे चालू करें।',
  permissionClose: 'बंद करें',
  summaryBrain: 'आपका ब्रेन हेल्थ स्कोर है',
  summaryAppointments: 'अगला अपॉइंटमेंट',
  summaryNotifications: 'अपठित सूचनाएं',
  close: 'सहायक बंद करें'
};

const ar: VoiceAssistantCopy = {
  buttonLabel: 'المساعد الصوتي',
  panelTitle: 'مساعد نيولينز',
  panelSubtitle: 'تحدّث بالإنجليزية أو العربية',
  statusIdle: 'اضغط على الميكروفون وتحدّث',
  statusListening: 'أستمع إليك…',
  statusWaitingForWake: 'قل «يا نيولينز» للبدء',
  wakePrompt: (name) => `نعم ${name}؟ أستمع إليك.`,
  wakeHint: 'نادني بقول «يا نيولينز» ثم قل أمرك.',
  backgroundOn: 'إيقاف الاستماع الحر',
  backgroundOff: 'تشغيل الاستماع الحر',
  backgroundActive: 'الاستماع الحر مُفعّل',
  statusThinking: 'لحظة…',
  statusSpeaking: 'أتحدث…',
  startListening: 'ابدأ الاستماع',
  stopListening: 'أوقف الاستماع',
  micHint: 'جرّب «افتح صحة الدماغ» أو «متى موعدي القادم؟»',
  unsupported: 'الإدخال الصوتي يحتاج متصفح كروم أو إيدج أو سفاري مع إذن الميكروفون.',
  you: 'أنت',
  assistant: 'المساعد',
  emptyState: 'اطلب مني فتح صفحة أو شرح نتائجك.',
  suggestionsTitle: 'جرّب أن تقول',
  suggestions: ['افتح صحة الدماغ', 'متى موعدي القادم؟', 'ماذا أفعل الآن؟', 'تحدّث بالإنجليزية'],
  openingPage: (page) => `أفتح ${page}.`,
  greeting: (name) => `مرحبًا ${name}. ماذا تريد أن ترى؟`,
  capabilities:
    'أستطيع فتح أي صفحة في بوابتك، وقراءة ملخص صحة الدماغ، وإخبارك بموعدك القادم، وشرح خطة الرعاية. يمكنك التحدث بالإنجليزية أو العربية.',
  summary: (parts) => `هذا ملخصك. ${parts.join(' ')}`,
  summaryNothing: 'لا توجد لدي نتائج تقييم لتلخيصها بعد. أفضل خطوة تالية هي بدء تقييم.',
  noAppointments: 'لا توجد مواعيد قادمة مجدولة.',
  nextAppointment: (title, date, time) => `موعدك القادم هو ${title} في ${date} الساعة ${time}.`,
  carePlanStatus: (progress, nextReview) => `أنجزت ${progress}% من خطة الرعاية. المراجعة القادمة ${nextReview}.`,
  carePlanNoReview: (progress) => `أنجزت ${progress}% من خطة الرعاية.`,
  stopped: 'توقفت.',
  languageSwitched: 'تم التبديل إلى العربية.',
  notUnderstood: 'لم ألتقط أمرًا واضحًا. يمكنك أن تطلب مني فتح صفحة أو قراءة الملخص أو التحقق من مواعيدك.',
  modelUnavailable: 'لا أستطيع الإجابة عن ذلك هنا بعد. أستطيع فتح أي صفحة أو قراءة ملخصك أو التحقق من مواعيدك، ويمكن لفريق رعايتك مناقشته معك.',
  micDenied: 'تم حجب إذن الميكروفون. اسمح به من إعدادات المتصفح ثم حاول مرة أخرى.',
  permissionTitle: 'السماح بالوصول إلى الميكروفون',
  permissionBody:
    'يستخدم نيولينز الميكروفون لسماع «يا نيولينز» وأوامرك الصوتية، بالإنجليزية أو العربية. يستمع فقط أثناء تفعيل الاستماع الحر.',
  permissionBullet1: 'تتم معالجة صوتك لفهم أوامرك.',
  permissionBullet2: 'يمكنك إيقاف الاستماع الحر في أي وقت.',
  permissionBullet3: 'لا يُسجّل شيء للاستماع من قِبل أي شخص آخر.',
  permissionAllow: 'السماح للميكروفون',
  permissionNotNow: 'ليس الآن',
  permissionDenied: 'الوصول إلى الميكروفون محجوب في هذا المتصفح. افتح إعدادات المتصفح، اسمح للميكروفون لهذا الموقع، ثم حاول مرة أخرى.',
  permissionClose: 'إغلاق',
  summaryBrain: 'درجة صحة دماغك هي',
  summaryAppointments: 'الموعد القادم',
  summaryNotifications: 'إشعارات غير مقروءة',
  close: 'إغلاق المساعد'
};

export function getVoiceAssistantCopy(language: SupportedLanguage): VoiceAssistantCopy {
  if (language === 'ta') return ta;
  if (language === 'hi') return hi;
  if (language === 'ar') return ar;
  return en;
}
