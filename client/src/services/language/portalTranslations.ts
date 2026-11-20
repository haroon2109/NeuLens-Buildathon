import { SupportedLanguage } from './types';
import type { ConsentKey } from '../../store/patientPortalStore';

export interface PortalNavTranslation {
  groups: Record<string, string>;
  items: Record<string, string>;
}

export interface PortalPageTranslation {
  eyebrow: string;
  title: string;
  description: string;
}

export interface PortalTranslation {
  portalName: string;
  patientPortal: string;
  signOut: string;
  skipToContent: string;
  notifications: string;
  notificationsUnread: string;
  footerLine1: string;
  footerLine2: string;
  nav: PortalNavTranslation;
  consent: PortalPageTranslation & {
    requiredItemsMarked: string;
    acceptAndContinue: string;
    back: string;
    /** Every consent item a patient must be able to read before accepting. */
    items: Record<ConsentKey, { label: string; detail: string }>;
    requiredSuffix: string;
    optionalSuffix: string;
    dataHandlingTitle: string;
    dataHandling: string[];
    clinicalNoteTitle: string;
    clinicalNoteBody: string;
    errors: {
      required: string;
      saveFailed: string;
    };
  };
  shell: {
    navLabel: string;
    expandSidebar: string;
    collapseSidebar: string;
    closeNav: string;
    openNav: string;
    unreadNotification: string;
    patientFallback: string;
    careTeam: string;
    toBeConfirmed: string;
    logoutDescription: string;
    logoutConfirm: string;
    logoutCancel: string;
    shortcuts: Record<string, string>;
    status: {
      inProgress: string;
      reviewed: string;
      followUpSuggested: string;
      awaitingReview: string;
    };
  };
  context: {
    overview: PortalPageTranslation;
    sleep: PortalPageTranslation;
    wellbeing: PortalPageTranslation;
    clinical: PortalPageTranslation;
  };
}

const en: PortalTranslation = {
  portalName: 'Patient portal',
  patientPortal: 'Patient portal',
  signOut: 'Sign out',
  skipToContent: 'Skip to content',
  notifications: 'Notifications',
  notificationsUnread: 'unread',
  footerLine1: 'Neurology & Cognitive Health',
  footerLine2: 'Screening support, not a diagnosis. Your care team guides next steps.',
  nav: {
    groups: {
      Home: 'Home',
      'Senior Care': 'Senior Care',
      Assessment: 'Assessment',
      Monitoring: 'Monitoring',
      'Health context': 'Health context',
      Care: 'Care',
      Account: 'Account'
    },
    items: {
      '/patient/dashboard': 'Dashboard',
      '/patient/brain-health': 'Brain health',
      '/patient/timeline': 'Brain Health Timeline',
      '/patient/asha-companion': 'ASHA & Caregiver Mode',
      '/patient/abha-health': 'Ayushman Bharat (ABHA)',
      '/patient/geriatric-vitals': 'Senior Vitals & Meds',
      '/patient/emergency-sos': 'Emergency SOS (14416 / 108)',
      '/patient/assessment/intro': 'Start assessment',
      '/patient/cognitive': 'Cognitive assessment',
      '/patient/cognitive/library': 'Task library',
      '/patient/history': 'History',
      '/patient/daily-function': 'Daily Function Questionnaire',
      '/patient/documents': 'Reports & documents',
      '/patient/trends': 'Longitudinal trends',
      '/patient/change-detection': 'Change detection',
      '/patient/health-profile': 'Health Profile & Context',
      '/patient/context': 'Context overview',
      '/patient/context/assessment-conditions': 'Assessment conditions',
      '/patient/context/sleep': 'Sleep & lifestyle',
      '/patient/context/wellbeing': 'Mental wellbeing',
      '/patient/context/clinical': 'Clinical & family',
      '/patient/prevention-plan': 'Personalized Prevention Plan',
      '/patient/appointments': 'Follow-up & Appointments',
      '/patient/care-plan': 'My care plan',
      '/patient/notifications': 'Notifications',
      '/patient/profile': 'My profile',
      '/patient/settings': 'Account settings',
      '/patient/privacy': 'Privacy & data',
      '/patient/help': 'Help & support'
    }
  },
  consent: {
    eyebrow: 'Screen 18 · Consent & privacy',
    title: 'Your data, your choices',
    description: 'We explain exactly what is collected and how it is used. Required items keep the screening safe and clinically meaningful; optional sharing is your choice.',
    requiredItemsMarked: 'Required items are marked *',
    acceptAndContinue: 'Accept and continue',
    back: 'Back',
    items: {
      dataCollection: {
        label: 'Assessment responses and observations',
        detail: 'Task responses, timing, and derived observations from each screening session.'
      },
      cameraMic: {
        label: 'Camera and microphone use',
        detail: 'Camera supports eye and facial movement activities; microphone supports voice activities. Processing happens during the session.'
      },
      processing: {
        label: 'Secure processing and storage',
        detail: 'Derived observations are stored with your patient record for longitudinal comparison and clinician review.'
      },
      clinicianAccess: {
        label: 'Access by my care team',
        detail: 'Verified clinicians involved in your care can review screening observations and add notes.'
      },
      optionalSharing: {
        label: 'Optional research and data sharing',
        detail: 'Allow de-identified data to support service improvement and research. You can change this at any time.'
      },
      withdrawalAcknowledged: {
        label: 'I understand I can withdraw consent',
        detail: 'You can update permissions or request deletion in Privacy & Data Settings. Withdrawal does not affect care already provided.'
      }
    },
    requiredSuffix: ' *',
    optionalSuffix: ' (optional)',
    dataHandlingTitle: 'How data is handled',
    dataHandling: [
      'Raw video and audio are not included in your portal reports.',
      'Only derived observations and task responses are stored.',
      'Access is limited to verified clinicians in your care team.',
      'You can withdraw optional permissions from Privacy & Data Settings.'
    ],
    clinicalNoteTitle: 'A note on clinical use',
    clinicalNoteBody: 'NeuLens is a screening support tool. Observations are exploratory and require professional interpretation.',
    errors: {
      required: 'Please review and accept each required consent item.',
      saveFailed: 'Your consent could not be saved. Please try again, or ask clinic staff for help.'
    }
  },
  shell: {
    navLabel: 'Patient portal navigation',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    closeNav: 'Close navigation',
    openNav: 'Open navigation',
    unreadNotification: 'Unread notification',
    patientFallback: 'Patient',
    careTeam: 'Care team',
    toBeConfirmed: 'To be confirmed',
    logoutDescription:
      'You will need your patient ID and the verification answer to sign in again. Any information you already saved stays in your record.',
    logoutConfirm: 'Sign out',
    logoutCancel: 'Stay signed in',
    shortcuts: {
      dashboard: 'Dashboard',
      brainHealth: 'Brain health',
      assessment: 'Start assessment',
      trends: 'Longitudinal trends',
      healthProfile: 'Health Profile & Context'
    },
    status: {
      inProgress: 'In progress',
      reviewed: 'Reviewed',
      followUpSuggested: 'Follow-up suggested',
      awaitingReview: 'Awaiting review'
    }
  },
  context: {
    overview: {
      eyebrow: 'Screen 34 · Health context',
      title: 'What may be shaping your results',
      description: 'Sleep, activity, wellbeing, and clinical information help your care team interpret screening observations in context. These do not change your score.'
    },
    sleep: {
      eyebrow: 'Screen 35 · Sleep & lifestyle',
      title: 'Sleep, movement, and daily life',
      description: 'Small context updates help your care team interpret the session. Share as much as you like.'
    },
    wellbeing: {
      eyebrow: 'Screen 36 · Mental wellbeing',
      title: 'How have you been feeling?',
      description: 'A short self-report helps put a screening session in context. It is not a mood diagnosis or a validated screening instrument.'
    },
    clinical: {
      eyebrow: 'Screen 37 · Clinical & family history',
      title: 'Clinical information and family history',
      description: 'You control what is shared here. Imported clinical information is labelled with its source and last update date.'
    }
  }
};

const ar: PortalTranslation = {
  portalName: 'بوابة المريض',
  patientPortal: 'بوابة المريض',
  signOut: 'تسجيل الخروج',
  skipToContent: 'انتقل إلى المحتوى',
  notifications: 'الإشعارات',
  notificationsUnread: 'غير مقروء',
  footerLine1: 'طب الأعصاب والصحة المعرفية',
  footerLine2: 'دعم الفحص وليس تشخيصًا. فريق رعايتك يوجّه الخطوات التالية.',
  nav: {
    groups: {
      Home: 'الرئيسية',
      Assessment: 'التقييم',
      Monitoring: 'المتابعة',
      'Health context': 'السياق الصحي',
      Care: 'الرعاية',
      Account: 'الحساب'
    },
    items: {
      '/patient/dashboard': 'لوحة التحكم',
      '/patient/brain-health': 'صحة الدماغ',
      '/patient/timeline': 'الجدول الزمني لصحة الدماغ',
      '/patient/assessment/intro': 'بدء التقييم',
      '/patient/cognitive': 'التقييم المعرفي',
      '/patient/cognitive/library': 'مكتبة المهام',
      '/patient/history': 'السجل',
      '/patient/daily-function': 'استبيان الوظائف اليومية',
      '/patient/documents': 'التقارير والمستندات',
      '/patient/trends': 'الاتجاهات الطولية',
      '/patient/change-detection': 'كشف التغيير',
      '/patient/health-profile': 'الملف الصحي والسياق',
      '/patient/context': 'نظرة عامة على السياق',
      '/patient/context/assessment-conditions': 'ظروف التقييم',
      '/patient/context/sleep': 'النوم ونمط الحياة',
      '/patient/context/wellbeing': 'الرفاهية النفسية',
      '/patient/context/clinical': 'السريري والعائلي',
      '/patient/prevention-plan': 'خطة الوقاية شخصية',
      '/patient/appointments': 'المتابعة والمواعيد',
      '/patient/care-plan': 'خطة رعايتي',
      '/patient/notifications': 'الإشعارات',
      '/patient/profile': 'ملفي',
      '/patient/settings': 'إعدادات الحساب',
      '/patient/privacy': 'الخصوصية والبيانات',
      '/patient/help': 'المساعدة والدعم'
    }
  },
  consent: {
    eyebrow: 'الشاشة 18 · الموافقة والخصوصية',
    title: 'بياناتك، خياراتك',
    description: 'نشرح بالضبط ما يُجمع وكيف يُستخدم. العناصر المطلوبة تحافظ على أمان الفحص وأهميته السريرية؛ المشاركة الاختيارية هي اختيارك.',
    requiredItemsMarked: 'العناصر المطلوبة معلّمة بـ *',
    acceptAndContinue: 'قبول ومتابعة',
    back: 'رجوع',
    items: {
      dataCollection: {
        label: 'إجابات التقييم والملاحظات المستخلصة',
        detail: 'إجابات المهام وتوقيتها والملاحظات المستخلصة من كل جلسة فحص.'
      },
      cameraMic: {
        label: 'استخدام الكاميرا والميكروفون',
        detail: 'تساعد الكاميرا في أنشطة حركة العين والوجه، ويساعد الميكروفون في أنشطة الصوت. تتم المعالجة أثناء الجلسة.'
      },
      processing: {
        label: 'المعالجة والتخزين الآمنان',
        detail: 'تُخزَّن الملاحظات المستخلصة مع سجلك الطبي للمقارنة على المدى الطويل ومراجعة الطبيب.'
      },
      clinicianAccess: {
        label: 'وصول فريق رعايتي إلى النتائج',
        detail: 'يمكن للأطباء الموثّقين المشاركين في رعايتك مراجعة ملاحظات الفحص وإضافة ملاحظاتهم.'
      },
      optionalSharing: {
        label: 'المشاركة في البحث ومشاركة البيانات (اختياري)',
        detail: 'السماح بمشاركة بيانات مجهولة الهوية لدعم تحسين الخدمة والبحث. يمكنك تغيير ذلك في أي وقت.'
      },
      withdrawalAcknowledged: {
        label: 'أفهم أنه يمكنني سحب موافقتي',
        detail: 'يمكنك تحديث الأذونات أو طلب الحذف من إعدادات الخصوصية والبيانات. ولا يؤثر سحب الموافقة على الرعاية التي تلقّيتها بالفعل.'
      }
    },
    requiredSuffix: ' *',
    optionalSuffix: ' (اختياري)',
    dataHandlingTitle: 'كيف تُعالَج البيانات',
    dataHandling: [
      'لا تُضمَّن التسجيلات الصوتية والمرئية الخام في تقارير بوابتك.',
      'تُخزَّن الملاحظات المستخلصة وإجابات المهام فقط.',
      'يقتصر الوصول على الأطباء الموثّقين في فريق رعايتك.',
      'يمكنك سحب الأذونات الاختيارية من إعدادات الخصوصية والبيانات.'
    ],
    clinicalNoteTitle: 'ملاحظة حول الاستخدام السريري',
    clinicalNoteBody: 'نيولنز أداة لدعم الفحص. الملاحظات استكشافية وتتطلب تفسيرًا مهنيًا من مختص.',
    errors: {
      required: 'يرجى مراجعة كل عنصر مطلوب من الموافقة والموافقة عليه.',
      saveFailed: 'تعذّر حفظ موافقتك. يرجى المحاولة مرة أخرى أو طلب المساعدة من موظفي العيادة.'
    }
  },
  shell: {
    navLabel: 'تنقّل بوابة المريض',
    expandSidebar: 'توسيع الشريط الجانبي',
    collapseSidebar: 'طيّ الشريط الجانبي',
    closeNav: 'إغلاق التنقّل',
    openNav: 'فتح التنقّل',
    unreadNotification: 'إشعار غير مقروء',
    patientFallback: 'مريض',
    careTeam: 'فريق الرعاية',
    toBeConfirmed: 'سيُحدَّد لاحقًا',
    logoutDescription:
      'ستحتاج إلى رقم المريض وإجابة التحقّق لتسجيل الدخول مرة أخرى. أي معلومات حفظتها تبقى في سجلك.',
    logoutConfirm: 'تسجيل الخروج',
    logoutCancel: 'البقاء مسجّلًا',
    shortcuts: {
      dashboard: 'لوحة التحكّم',
      brainHealth: 'صحّة الدماغ',
      assessment: 'بدء التقييم',
      trends: 'الاتجاهات الطولية',
      healthProfile: 'الملف الصحي والسياق'
    },
    status: {
      inProgress: 'قيد التنفيذ',
      reviewed: 'تمّت المراجعة',
      followUpSuggested: 'تُقترح متابعة',
      awaitingReview: 'بانتظار المراجعة'
    }
  },
  context: {
    overview: {
      eyebrow: 'الشاشة 34 · السياق الصحي',
      title: 'ما قد يؤثر على نتائجك',
      description: 'النوم والنشاط والرفاهية والمعلومات السريرية تساعد فريق رعايتك على تفسير ملاحظات الفحص في السياق. هذه لا تغيّر درجتك.'
    },
    sleep: {
      eyebrow: 'الشاشة 35 · النوم ونمط الحياة',
      title: 'النوم والحركة والحياة اليومية',
      description: 'التحديثات الصغيرة للسياق تساعد فريق رعايتك على تفسير الجلسة. شارك بقدر ما تشاء.'
    },
    wellbeing: {
      eyebrow: 'الشاشة 36 · الرفاهية النفسية',
      title: 'كيف شعرت مؤخرًا؟',
      description: 'تقرير ذاتي قصير يضع جلسة الفحص في سياقها. ليس تشخيصًا للمزاج ولا أداة فحص مُتحقق منها.'
    },
    clinical: {
      eyebrow: 'الشاشة 37 · السريري والتاريخ العائلي',
      title: 'المعلومات السريرية والتاريخ العائلي',
      description: 'أنت تتحكم في ما تشاركه هنا. المعلومات السريرية المستوردة مُوسومة بمصدرها وتاريخ آخر تحديث.'
    }
  }
};

const ta: PortalTranslation = {
  ...en,
  portalName: 'நோயாளி தளம்',
  patientPortal: 'நோயாளி தளம்',
  signOut: 'வெளியேறு',
  skipToContent: 'உள்ளடக்கத்திற்கு செல்',
  notifications: 'அறிவிப்புகள்',
  notificationsUnread: 'படிக்காதவை',
  footerLine1: 'நரம்பியல் & மூளை நலம்',
  footerLine2: 'ஸ்கிரீனிங் உதவி மட்டுமே, மருத்துவ நோய் கண்டறிதல் அல்ல.',
  nav: {
    groups: {
      Home: 'முகப்பு',
      'Senior Care': 'முதியோர் நலம்',
      Assessment: 'பரிசோதனை',
      Monitoring: 'கண்காணிப்பு',
      'Health context': 'உடல்நல விவரம்',
      Care: 'பராமரிப்பு',
      Account: 'கணக்கு'
    },
    items: {
      '/patient/dashboard': 'முகப்பு பலகை',
      '/patient/brain-health': 'மூளை நலம்',
      '/patient/timeline': 'நல காலக்கோடு',
      '/patient/asha-companion': 'ஆஷா & பராமரிப்பாளர்',
      '/patient/abha-health': 'ஆயுஷ்மான் பாரத் (ABHA)',
      '/patient/geriatric-vitals': 'மாத்திரைகள் & பிபி',
      '/patient/emergency-sos': 'அவசர உதவி (14416 / 108)',
      '/patient/assessment/intro': 'பரிசோதனையைத் தொடங்கு',
      '/patient/cognitive': 'அறிவாற்றல் ஆய்வு',
      '/patient/cognitive/library': 'பயிற்சி நூலகம்',
      '/patient/history': 'வரலாறு',
      '/patient/daily-function': 'தினசரி வினாடி வினா',
      '/patient/documents': 'அறிக்கைகள் & ஆவணங்கள்',
      '/patient/trends': 'நீண்டகால போக்குகள்',
      '/patient/change-detection': 'மாற்றங்கள் கண்டறிதல்',
      '/patient/health-profile': 'உடல்நல சுயவிவரம்',
      '/patient/context': 'விவரங்கள் கண்ணோட்டம்',
      '/patient/context/assessment-conditions': 'பரிசோதனை சூழல்',
      '/patient/context/sleep': 'தூக்கம் & வாழ்க்கை முறை',
      '/patient/context/wellbeing': 'மன நலம்',
      '/patient/context/clinical': 'மருத்துவ & குடும்ப வரலாறு',
      '/patient/prevention-plan': 'தடுப்பு திட்டம்',
      '/patient/appointments': 'மருத்துவ சந்திப்புகள்',
      '/patient/care-plan': 'பராமரிப்பு திட்டம்',
      '/patient/notifications': 'அறிவிப்புகள்',
      '/patient/profile': 'சுயவிவரம்',
      '/patient/settings': 'அமைப்புகள்',
      '/patient/privacy': 'தனியுரிமை & தரவு',
      '/patient/help': 'உதவி'
    }
  },
  shell: {
    ...en.shell,
    navLabel: 'முதன்மை வழிசெலுத்தல்',
    closeNav: 'வழிசெலுத்தலை மூடு',
    openNav: 'வழிசெலுத்தலைத் திற',
    patientFallback: 'நோயாளி',
    careTeam: 'பராமரிப்புக் குழு',
    toBeConfirmed: 'உறுதிப்படுத்தப்பட வேண்டும்',
    logoutDescription: 'உங்கள் அமர்வை முடிக்க விரும்புகிறீர்களா?',
    logoutConfirm: 'வெளியேறு',
    logoutCancel: 'ரத்து செய்',
    status: {
      inProgress: 'நடைபெறுகிறது',
      reviewed: 'மதிப்பாய்வு செய்யப்பட்டது',
      followUpSuggested: 'மருத்துவர் ஆலோசனை பரிந்துரைக்கப்படுகிறது',
      awaitingReview: 'மதிப்பாய்வுக்காக காத்திருக்கிறது'
    }
  }
};

const hi: PortalTranslation = {
  ...en,
  portalName: 'रोगी पोर्टल',
  patientPortal: 'रोगी पोर्टल',
  signOut: 'लॉग आउट',
  skipToContent: 'सामग्री पर जाएं',
  notifications: 'सूचनाएं',
  notificationsUnread: 'अपठित',
  footerLine1: 'न्यूरोलॉजी और मस्तिष्क स्वास्थ्य',
  footerLine2: 'केवल स्क्रीनिंग सहायता, कोई अंतिम निदान नहीं।',
  nav: {
    groups: {
      Home: 'होम',
      'Senior Care': 'वरिष्ठ देखभाल',
      Assessment: 'मूल्यांकन',
      Monitoring: 'निगरानी',
      'Health context': 'स्वास्थ्य संदर्भ',
      Care: 'देखभाल',
      Account: 'खाता'
    },
    items: {
      '/patient/dashboard': 'डैशबोर्ड',
      '/patient/brain-health': 'मस्तिष्क स्वास्थ्य',
      '/patient/timeline': 'स्वास्थ्य टाइमलाइन',
      '/patient/asha-companion': 'आशा व देखभालकर्ता',
      '/patient/abha-health': 'आयुष्मान भारत (ABHA)',
      '/patient/geriatric-vitals': 'दवाएं और वाइटल्स',
      '/patient/emergency-sos': 'आपातकालीन मदद (14416 / 108)',
      '/patient/assessment/intro': 'मूल्यांकन शुरू करें',
      '/patient/cognitive': 'संज्ञानात्मक जांच',
      '/patient/cognitive/library': 'टास्क लाइब्रेरी',
      '/patient/history': 'इतिहास',
      '/patient/daily-function': 'दैनिक कार्य प्रश्नावली',
      '/patient/documents': 'रिपोर्ट व दस्तावेज',
      '/patient/trends': 'दीर्घकालिक रुझान',
      '/patient/change-detection': 'बदलाव की पहचान',
      '/patient/health-profile': 'स्वास्थ्य प्रोफ़ाइल',
      '/patient/context': 'संदर्भ अवलोकन',
      '/patient/context/assessment-conditions': 'जांच की स्थिति',
      '/patient/context/sleep': 'नींद व जीवनशैली',
      '/patient/context/wellbeing': 'मानसिक स्वास्थ्य',
      '/patient/context/clinical': 'चिकित्सीय इतिहास',
      '/patient/prevention-plan': 'रोकथाम योजना',
      '/patient/appointments': 'अपॉइंटमेंट्स',
      '/patient/care-plan': 'मेरी देखभाल योजना',
      '/patient/notifications': 'सूचनाएं',
      '/patient/profile': 'मेरी प्रोफ़ाइल',
      '/patient/settings': 'खाता सेटिंग्स',
      '/patient/privacy': 'गोपनीयता व डेटा',
      '/patient/help': 'सहायता'
    }
  },
  shell: {
    ...en.shell,
    navLabel: 'मुख्य नेविगेशन',
    closeNav: 'नेविगेशन बंद करें',
    openNav: 'नेविगेशन खोलें',
    patientFallback: 'रोगी',
    careTeam: 'देखभाल टीम',
    toBeConfirmed: 'पुष्टि की जानी बाकी',
    logoutDescription: 'क्या आप लॉग आउट करना चाहते हैं?',
    logoutConfirm: 'लॉग आउट',
    logoutCancel: 'रद्द करें',
    status: {
      inProgress: 'प्रगति पर है',
      reviewed: 'समीक्षा पूरी हुई',
      followUpSuggested: 'फॉलो-अप का सुझाव',
      awaitingReview: 'समीक्षा की प्रतीक्षा है'
    }
  }
};

const te: PortalTranslation = {
  ...en,
  portalName: 'రోగి పోర్టల్',
  patientPortal: 'రోగి పోర్టల్',
  signOut: 'లాగ్ అవుట్',
  skipToContent: 'కంటెంట్‌కు వెళ్లండి',
  notifications: 'నోటిఫికేషన్లు',
  notificationsUnread: 'చదవనివి',
  footerLine1: 'న్యూరాలజీ & బ్రెయిన్ హెల్త్',
  footerLine2: 'కేవలం స్క్రీనింగ్ సహాయం మాత్రమే, తుది రోగ నిర్ధారణ కాదు.',
  nav: {
    groups: {
      Home: 'హోమ్',
      'Senior Care': 'సీనియర్ కేర్',
      Assessment: 'అసెస్మెంట్',
      Monitoring: 'పర్యవేక్షణ',
      'Health context': 'ఆరోగ్య వివరాలు',
      Care: 'సంరక్షణ',
      Account: 'ఖాతా'
    },
    items: {
      '/patient/dashboard': 'డ్యాష్‌బోర్డ్',
      '/patient/brain-health': 'మెదడు ఆరోగ్యం',
      '/patient/timeline': 'ఆరోగ్య టైమ్‌లైన్',
      '/patient/asha-companion': 'ఆశా & సంరక్షకుల సహాయం',
      '/patient/abha-health': 'ఆయుష్మాన్ భారత్ (ABHA)',
      '/patient/geriatric-vitals': 'మందులు & బీపీ',
      '/patient/emergency-sos': 'అత్యవసర సహాయం (14416 / 108)',
      '/patient/assessment/intro': 'పరీక్ష ప్రారంభించండి',
      '/patient/cognitive': 'అభిజ్ఞా పరీక్ష',
      '/patient/cognitive/library': 'టాస్క్ లైబ్రరీ',
      '/patient/history': 'చరిత్ర',
      '/patient/daily-function': 'రోజువారీ విధుల ప్రశ్నాపత్రం',
      '/patient/documents': 'నివేదికలు & పత్రాలు',
      '/patient/trends': 'దీర్ఘకాలిక ధోరణులు',
      '/patient/change-detection': 'మార్పుల గుర్తింపు',
      '/patient/health-profile': 'ఆరోగ్య ప్రొఫైల్',
      '/patient/context': 'సందర్భ అవలోకనం',
      '/patient/context/assessment-conditions': 'పరీక్ష పరిస్థితులు',
      '/patient/context/sleep': 'నిద్ర & జీవనశైలి',
      '/patient/context/wellbeing': 'మానసిక ఆరోగ్యం',
      '/patient/context/clinical': 'వైద్య చరిత్ర',
      '/patient/prevention-plan': 'నివారణ ప్రణాళిక',
      '/patient/appointments': 'అపాయింట్‌మెంట్లు',
      '/patient/care-plan': 'సంరక్షణ ప్రణాళిక',
      '/patient/notifications': 'నోటిఫికేషన్లు',
      '/patient/profile': 'నా ప్రొఫైల్',
      '/patient/settings': 'ఖాతా సెట్టింగ్‌లు',
      '/patient/privacy': 'గోప్యత & డేటా',
      '/patient/help': 'సహాయం'
    }
  },
  shell: {
    ...en.shell,
    navLabel: 'ప్రధాన నావిగేషన్',
    closeNav: 'నావిగేషన్ మూసివేయి',
    openNav: 'నావిగేషన్ తెరవండి',
    patientFallback: 'రోగి',
    careTeam: 'సంరక్షణ బృందం',
    toBeConfirmed: 'నిర్ధారించబడాలి',
    logoutDescription: 'మీరు లాగ్ అవుట్ చేయాలనుకుంటున్నారా?',
    logoutConfirm: 'లాగ్ అవుట్',
    logoutCancel: 'రద్దు చేయండి',
    status: {
      inProgress: 'పురోగతిలో ఉంది',
      reviewed: 'సమీక్షించబడింది',
      followUpSuggested: 'ఫాలో-అప్ సిఫార్సు చేయబడింది',
      awaitingReview: 'సమీక్ష కోసం వేచి ఉంది'
    }
  }
};

const ml: PortalTranslation = {
  ...en,
  portalName: 'രോഗി പോർട്ടൽ',
  patientPortal: 'രോഗി പോർട്ടൽ',
  signOut: 'ലോഗ് ഔട്ട്',
  skipToContent: 'ഉള്ളടക്കത്തിലേക്ക് പോകുക',
  notifications: 'അറിയിപ്പുകൾ',
  notificationsUnread: 'വായിക്കാത്തവ',
  footerLine1: 'ന്യൂറോളജി & മസ്തിഷ്ക ആരോഗ്യം',
  footerLine2: 'സ്ക്രീനിംഗ് സഹായം മാത്രം, അന്തിമ രോഗനിർണ്ണയമല്ല.',
  nav: {
    groups: {
      Home: 'ഹോം',
      'Senior Care': 'മുതിർന്നവരുടെ പരിചരണം',
      Assessment: 'പരിശോധന',
      Monitoring: 'നിരീക്ഷണം',
      'Health context': 'ആരോഗ്യ വിവരങ്ങൾ',
      Care: 'പരിചരണം',
      Account: 'അക്കൗണ്ട്'
    },
    items: {
      '/patient/dashboard': 'ഡാഷ്‌ബോർഡ്',
      '/patient/brain-health': 'തലച്ചോറിന്റെ ആരോഗ്യം',
      '/patient/timeline': 'ആരോഗ്യ ടൈംലൈൻ',
      '/patient/asha-companion': 'ആശ & പരിചരണ സഹായം',
      '/patient/abha-health': 'ആയുഷ്മാൻ ഭാരത് (ABHA)',
      '/patient/geriatric-vitals': 'മരുന്നുകളും ബിപിയും',
      '/patient/emergency-sos': 'അടിയന്തര സഹായം (14416 / 108)',
      '/patient/assessment/intro': 'പരിശോധന ആരംഭിക്കുക',
      '/patient/cognitive': 'വൈജ്ഞാനിക പരിശോധന',
      '/patient/cognitive/library': 'ടാസ്ക് ലൈബ്രറി',
      '/patient/history': 'ചരിത്രം',
      '/patient/daily-function': 'ദൈനംദിന ചോദ്യാവലി',
      '/patient/documents': 'റിപ്പോർട്ടുകൾ & രേഖകൾ',
      '/patient/trends': 'ദീർഘകാല മാറ്റങ്ങൾ',
      '/patient/change-detection': 'മാറ്റങ്ങൾ കണ്ടെത്തൽ',
      '/patient/health-profile': 'ആരോഗ്യ പ്രൊഫൈൽ',
      '/patient/context': 'വിവരങ്ങളുടെ അവലോകനം',
      '/patient/context/assessment-conditions': 'പരിശോധനാ സാഹചര്യം',
      '/patient/context/sleep': 'ഉറക്കവും ജീവിതശൈലിയും',
      '/patient/context/wellbeing': 'മാനസികാരോഗ്യം',
      '/patient/context/clinical': 'ചികിത്സാ ചരിത്രം',
      '/patient/prevention-plan': 'പ്രതിരോധ പദ്ധതി',
      '/patient/appointments': 'അപ്പോയിന്റ്മെന്റുകൾ',
      '/patient/care-plan': 'പരിചരണ പദ്ധതി',
      '/patient/notifications': 'അറിയിപ്പുകൾ',
      '/patient/profile': 'എന്റെ പ്രൊഫൈൽ',
      '/patient/settings': 'ക്രമീകരണങ്ങൾ',
      '/patient/privacy': 'സ്വകാര്യത & ഡാറ്റ',
      '/patient/help': 'സഹായം'
    }
  },
  shell: {
    ...en.shell,
    navLabel: 'പ്രധാന നാവിഗേഷൻ',
    closeNav: 'നാവിഗേഷൻ അടയ്ക്കുക',
    openNav: 'നാവിഗേഷൻ തുറക്കുക',
    patientFallback: 'രോഗി',
    careTeam: 'പരിചരണ സംഘം',
    toBeConfirmed: 'സ്ഥിരീകരിക്കേണ്ടതുണ്ട്',
    logoutDescription: 'ലോഗ് ഔട്ട് ചെയ്യാൻ താൽപ്പര്യമുണ്ടോ?',
    logoutConfirm: 'ലോഗ് ഔട്ട്',
    logoutCancel: 'റദ്ദാക്കുക',
    status: {
      inProgress: 'പുരോഗമിക്കുന്നു',
      reviewed: 'പരിശോധിച്ചു',
      followUpSuggested: 'തുടർചികിത്സ നിർദ്ദേശിച്ചു',
      awaitingReview: 'പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു'
    }
  }
};

const kn: PortalTranslation = {
  ...en,
  portalName: 'ರೋಗಿ ಪೋರ್ಟಲ್',
  patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
  signOut: 'ಸೈನ್ ಔಟ್',
  skipToContent: 'ವಿಷಯಕ್ಕೆ ತೆರಳಿ',
  notifications: 'ಸೂಚನೆಗಳು',
  notificationsUnread: 'ಓದದಿರುವುದು',
  footerLine1: 'ನರಶಾಸ್ತ್ರ ಮತ್ತು ಮೆದುಳಿನ ಆರೋಗ್ಯ',
  footerLine2: 'ಸ್ಕ್ರೀನಿಂಗ್ ಸಹಾಯ ಮಾತ್ರ, ಅಂತಿಮ ರೋಗನಿರ್ಣಯವಲ್ಲ.',
  nav: {
    groups: {
      Home: 'ಮುಖಪುಟ',
      'Senior Care': 'ಹಿರಿಯ ನಾಗರಿಕರ ಆರೈಕೆ',
      Assessment: 'ಮೌಲ್ಯಮಾಪನ',
      Monitoring: 'ಮೇಲ್ವಿಚಾರಣೆ',
      'Health context': 'ಆರೋಗ್ಯ ಮಾಹಿತಿ',
      Care: 'ಆರೈಕೆ',
      Account: 'ಖಾತೆ'
    },
    items: {
      '/patient/dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      '/patient/brain-health': 'ಮೆದುಳಿನ ಆರೋಗ್ಯ',
      '/patient/timeline': 'ಆರೋಗ್ಯ ಕಾಲಾವಧಿ',
      '/patient/asha-companion': 'ಆಶಾ ಮತ್ತು ಆರೈಕೆದಾರರ ನೆರವು',
      '/patient/abha-health': 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ (ABHA)',
      '/patient/geriatric-vitals': 'ಮಾತ್ರೆಗಳು ಮತ್ತು ಬಿಪಿ',
      '/patient/emergency-sos': 'ತುರ್ತು ಸಹಾಯ (14416 / 108)',
      '/patient/assessment/intro': 'ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ',
      '/patient/cognitive': 'ಜ್ಞಾನಗ್ರಹಣ ಪರೀಕ್ಷೆ',
      '/patient/cognitive/library': 'ಕಾರ್ಯ ಲೈಬ್ರರಿ',
      '/patient/history': 'ಇತಿಹಾಸ',
      '/patient/daily-function': 'ದೈನಂದಿನ ಕಾರ್ಯ ಪ್ರಶ್ನಾವಳಿ',
      '/patient/documents': 'ವರದಿಗಳು ಮತ್ತು ದಾಖಲೆಗಳು',
      '/patient/trends': 'ದೀರ್ಘಕಾಲೀನ ಪ್ರವೃತ್ತಿಗಳು',
      '/patient/change-detection': 'ಬದಲಾವಣೆಗಳ ಗುರುತಿಸುವಿಕೆ',
      '/patient/health-profile': 'ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್',
      '/patient/context': 'ಮಾಹಿತಿ ಅವಲೋಕನ',
      '/patient/context/assessment-conditions': 'ಪರೀಕ್ಷಾ ಪರಿಸ್ಥಿತಿ',
      '/patient/context/sleep': 'ನಿದ್ರೆ ಮತ್ತು ಜೀವನಶೈಲಿ',
      '/patient/context/wellbeing': 'ಮಾನಸಿಕ ಯೋಗಕ್ಷೇಮ',
      '/patient/context/clinical': 'ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ',
      '/patient/prevention-plan': 'ತಡೆಗಟ್ಟುವಿಕೆ ಯೋಜನೆ',
      '/patient/appointments': 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
      '/patient/care-plan': 'ಆರೈಕೆ ಯೋಜನೆ',
      '/patient/notifications': 'ಸೂಚನೆಗಳು',
      '/patient/profile': 'ನನ್ನ ಪ್ರೊಫೈಲ್',
      '/patient/settings': 'ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      '/patient/privacy': 'ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ',
      '/patient/help': 'ಸಹಾಯ'
    }
  },
  shell: {
    ...en.shell,
    navLabel: 'ಮುಖ್ಯ ನ್ಯಾವಿಗೇಷನ್',
    closeNav: 'ನ್ಯಾವಿಗೇಷನ್ ಮುಚ್ಚಿ',
    openNav: 'ನ್ಯಾವಿಗೇಷನ್ ತೆರೆಯಿರಿ',
    patientFallback: 'ರೋಗಿ',
    careTeam: 'ಆರೈಕೆ ತಂಡ',
    toBeConfirmed: 'ದೃಢೀಕರಿಸಬೇಕಿದೆ',
    logoutDescription: 'ನೀವು ಸೈನ್ ಔಟ್ ಮಾಡಲು ಬಯಸುವಿರಾ?',
    logoutConfirm: 'ಸೈನ್ ಔಟ್',
    logoutCancel: 'ರದ್ದುಮಾಡಿ',
    status: {
      inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
      reviewed: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
      followUpSuggested: 'ಮುಂದಿನ ತಪಾಸಣೆ ಸಲಹೆ ನೀಡಲಾಗಿದೆ',
      awaitingReview: 'ಪರಿಶೀಲನೆಗೆ ಕಾಯಲಾಗುತ್ತಿದೆ'
    }
  }
};

const translations: Record<SupportedLanguage, PortalTranslation> = {
  en,
  ar,
  ta,
  hi,
  te,
  ml,
  kn
};

export function getPortalTranslation(lang: SupportedLanguage): PortalTranslation {
  return translations[lang] || translations.en;
}
