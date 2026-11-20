import { LanguageTranslation } from '../types';

/**
 * Modern Standard Arabic (ar-AE) portal translation.
 *
 * Status: translated for on-screen use and awaiting independent back-translation,
 * cognitive pretesting and clinical review with Arabic-speaking participants
 * before any validated-assessment claim is made.
 *
 * Task wording is Arabic for the verbal recall sentence and the sequencing-task
 * instructions, so a participant is never assessed in a language they did not
 * choose. Remaining untranslated task copy is listed in the readiness registry
 * (`server/src/services/assessmentLanguageReadiness.ts`).
 */
export const arTranslation: LanguageTranslation = {
  languageName: 'Arabic',
  nativeName: 'العربية',
  welcome: {
    greeting: 'مرحبًا بك',
    spokenWelcome:
      'مرحبًا! أنا مساعد نيولنز. سنبدأ الآن فحصًا عصبيًا. سأرشدك خطوة بخطوة خلال العملية بأكملها.',
    chooseLanguageSpoken: 'يرجى اختيار لغتك المفضلة لبدء الفحص.',
    chooseLanguageTitle: 'اختر لغتك المفضلة',
    chooseLanguageSubtitle: 'سيستخدم المساعد الصوتي والتعليمات المعروضة على الشاشة اللغة التي تختارها.',
    startAssessmentBtn: 'ابدأ الفحص'
  },
  intro: {
    title: 'فحص عصبي موجّه ذاتيًا',
    subtitle: 'فحص تفاعلي لطيف من خمس خطوات، مصمم لجميع الفئات العمرية.',
    spokenIntro:
      'يرجى الجلوس بشكل مريح والتوجه نحو الشاشة. سأرشدك بتعليمات مسموعة. إذا احتجت إلى تكرار أي شيء، اضغط زر مكبر الصوت أو قل «أعد».',
    consentNotice: 'تُستخدم الكاميرا والميكروفون فقط للتحليل المعرفي المحلي في الوقت الفعلي.',
    audioPrivacyNotice: 'البيانات محمية وتُقيَّم فقط لأغراض الفحص الصحي.',
    startScreeningBtn: 'ابدأ فحص الأجهزة والمعايرة',
    checklistComfort: 'اجلس منتصبًا على كرسي مريح مع إضاءة جيدة.',
    checklistPosition: 'أبقِ وجهك في منتصف الشاشة.',
    checklistAudio: 'تحدث بوضوح في الميكروفون عندما يُطلب منك ذلك.'
  },
  sensorCheck: {
    title: 'التحقق من الكاميرا والميكروفون',
    spokenCheck:
      'أولًا، لنتحقق من الكاميرا والميكروفون. انظر مباشرة إلى الكاميرا، وقل «مرحبًا نيولنز» عندما يُطلب منك ذلك.',
    cameraTitle: 'فحص موضع الكاميرا',
    cameraDesc: 'تأكد من ظهور وجهك بالكامل وبشكل ثابت.',
    cameraAligned: 'الوجه في الموضع الصحيح والتتبع يعمل.',
    cameraNeedAdjustment: 'يرجى محاذاة وجهك داخل إطار التوجيه.',
    micTitle: 'فحص حساسية الميكروفون',
    micDesc: 'قل «مرحبًا نيولنز» أو أي كلمة لاختبار مستوى صوتك.',
    micPrompt: 'قل «مرحبًا نيولنز» في الميكروفون...',
    micTestSuccess: 'تم اكتشاف إشارة صوتية واضحة من الميكروفون.',
    micNeedSpeak: 'في انتظار الصوت...',
    calibrationSuccess: 'تمت معايرة المستشعرات. جاهز للفحص.',
    spokenReady: 'ممتاز! الكاميرا والميكروفون يعملان بشكل جيد. لنبدأ المهمة الأولى.',
    continueBtn: 'انتقل إلى المهمة الأولى'
  },
  game1: {
    title: 'مدار التركيز',
    spokenIntro:
      'الآن سنجرّب حركة عينيك. يرجى متابعة النقطة المتحركة على الشاشة بعينيك مع إبقاء رأسك ثابتًا.',
    spokenGuidance: 'ثبّت نظرك على النقطة وهي تتحرك عبر الشاشة.',
    screenHeading: 'تابع النقطة المتحركة',
    screenSubtitle: 'تابع النقطة بعينيك. أبقِ رأسك مستقيمًا وثابتًا.',
    screenIcon: '👁️ ➔ 🔴',
    whatToDo: 'تابع النقطة المضيئة بعينيك حتى تمتلئ باللون.',
    whatNotToDo: 'لا تدر رأسك. حرّك عينيك فقط.',
    whereToLook: 'مباشرة إلى النقطة المتحركة على شاشتك.',
    simplerExplanation: 'راقب النقطة الحمراء. أبقِ رأسك ثابتًا وانظر إليها مباشرة.',
    nextTaskPreview: 'التالي: مطابقة الذاكرة'
  },
  game2: {
    title: 'مطابقة الذاكرة',
    spokenIntro: 'التالي مهمة ذاكرة. اضغط البطاقات لقلبها والعثور على الرموز الطبية المتطابقة.',
    spokenGuidance: 'تذكّر مكان كل رمز وطابق جميع الأزواج المتطابقة.',
    screenHeading: 'اعثر على البطاقات المتطابقة',
    screenSubtitle: 'المس بطاقة لكشف رمزها، ثم المس البطاقة المطابقة لها.',
    screenIcon: '🧠 ➔ 🃏',
    whatToDo: 'اقلِب البطاقات اثنتين تلو الأخرى للعثور على الأزواج المتطابقة.',
    whatNotToDo: 'لا تتعجل. خذ وقتك لتذكّر البطاقات.',
    whereToLook: 'انظر عبر شبكة البطاقات على الشاشة.',
    simplerExplanation: 'اضغط بطاقة، ثم اضغط بطاقة أخرى لمعرفة ما إذا كانتا متطابقتين.',
    nextTaskPreview: 'التالي: مهمة الصوت'
  },
  game3: {
    title: 'الصدى الصوتي',
    spokenIntro:
      'الآن سنحلل كلامك. اضغط زر التسجيل واقرأ الجملة المعروضة على الشاشة بصوت عالٍ.',
    spokenGuidance: 'اضغط تسجيل، وتحدث بوضوح في الميكروفون، ثم توقف عند الانتهاء.',
    screenHeading: 'اقرأ الجملة بصوت عالٍ',
    screenSubtitle: 'اضغط تسجيل وقل الجملة المظللة بوضوح في الميكروفون.',
    screenIcon: '🎤 ➔ 🗣️',
    whatToDo: 'اضغط «بدء التسجيل» واقرأ الجملة بسرعتك الطبيعية.',
    whatNotToDo: 'لا تهمس ولا تتعجل في الكلمات.',
    whereToLook: 'اقرأ الجملة المظللة المعروضة في وسط الشاشة.',
    simplerExplanation: 'اضغط زر التسجيل واقرأ الكلمات بصوت عالٍ. تحدث بوضوح.',
    nextTaskPreview: 'التالي: تتبع تعابير الوجه'
  },
  game4: {
    title: 'محاكاة التعابير',
    spokenIntro:
      'الآن سنجرّب حركات وجهك. اتبع المطالبات على الشاشة: ابتسم، استرخِ، ارمش، وافتح فمك.',
    spokenGuidance: 'انظر مباشرة إلى الكاميرا وأدِّ كل تعبير وجهي بشكل طبيعي.',
    screenHeading: 'اتبع مطالبات الوجه',
    screenSubtitle: 'اتبع كل مطالبة: ابتسم، استرخِ، ارمش، وافتح فمك بلطف.',
    screenIcon: '👤 ➔ 🙂',
    whatToDo: 'احتفظ بكل تعبير وجهي حتى يكتمل شريط التقدم.',
    whatNotToDo: 'لا تبتعد عن الكاميرا.',
    whereToLook: 'انظر مباشرة إلى عدسة الكاميرا.',
    simplerExplanation: 'اصنع الوجه المعروض على الشاشة حتى يمتلئ الشريط الأخضر.',
    nextTaskPreview: 'التالي: مهمة ربط المسار'
  },
  game5: {
    title: 'راسم المسار',
    spokenIntro: 'هذه مهمة ربط بصري. اضغط الأرقام بالترتيب من 1 إلى 6.',
    spokenGuidance: 'اضغط الرقم 1، ثم الرقم 2، وتابع بالتسلسل حتى الرقم 6.',
    screenHeading: 'اربط الأرقام من 1 إلى 6',
    screenSubtitle: 'اضغط الرقم 1 أولًا، ثم 2 و3 و4 و5 و6 بالتسلسل.',
    screenIcon: '🔢 ➔ 1️⃣2️⃣3️⃣',
    whatToDo: 'المس كل دائرة مرقّمة بالترتيب الرقمي المتسلسل.',
    whatNotToDo: 'لا تتخطَّ الأرقام.',
    whereToLook: 'ابحث عبر الشاشة للعثور على الرقم التالي.',
    simplerExplanation: 'ابحث عن الرقم 1 واضغط عليه. ثم ابحث عن الرقم 2 واضغط عليه.',
    nextTaskPreview: 'التالي: التحليل والنتائج'
  },
  functionCheckIn: {
    title: 'متابعة الأنشطة اليومية',
    subtitle: 'يساعد هذا فريق رعايتك على فهم أنشطتك اليومية. وهو ليس تشخيصًا.',
    interpretationNotice:
      'لم يتم التحقق من النسخ اللغوية والمهام محليًا. النتائج استكشافية وينبغي تفسيرها مع فريق رعايتك.',
    prompt: 'بالمقارنة مع قدرتك المعتادة، كيف تسير هذه الأنشطة؟',
    activities: {
      appointments: 'تذكّر المواعيد',
      medication: 'إدارة الأدوية',
      finances: 'التعامل مع المال أو الفواتير',
      household: 'تحضير وجبة بسيطة أو أداء أعمال المنزل'
    },
    answers: {
      same: 'كما هو تقريبًا',
      harder: 'أصعب',
      help: 'أحتاج إلى مزيد من المساعدة'
    },
    accessibilityPrompt: 'لتفسير هذا الفحص، يرجى تحديد ما إذا واجهت صعوبة في:',
    accessibility: {
      vision: 'رؤية الشاشة',
      hearing: 'سماع التعليمات',
      motor: 'اللمس أو الحركة على الشاشة',
      digitalFamiliarity: 'استخدام شاشة اللمس أو جهاز رقمي'
    },
    accessibilityAnswers: {
      noDifficulty: 'دون صعوبة',
      someDifficulty: 'بعض الصعوبة',
      needSupport: 'احتاج إلى مساعدة'
    },
    contextPrompt: 'بالمقارنة مع أسبوعك المعتاد، كيف كان حال هذه الأمور مؤخرًا؟',
    contextFactors: {
      sleep: 'جودة أو مدة النوم',
      activity: 'النشاط البدني',
      moodStress: 'المزاج أو التوتر'
    },
    contextAnswers: {
      usual: 'كما هو معتاد',
      somewhatWorse: 'أسوأ إلى حد ما',
      substantiallyWorse: 'أسوأ بكثير'
    },
    externalConsent:
      'أوافق على أن تسترجع العيادة المعلومات ذات الصلة من سجلها الصحي المتصل (FHIR) لهذا الفحص ومراجعة الطبيب. هذا اختياري.',
    continueBtn: 'تابع إلى الإنهاء',
    skipBtn: 'تخطَّ هذه الأسئلة'
  },
  submitting: {
    title: 'جارٍ معالجة القياسات',
    spokenSubmitting:
      'شكرًا لك! اكتملت جميع المهام. يجري الآن تحليل القياسات البصرية والصوتية والمعرفية.',
    subtitle: 'جارٍ حساب مؤشر الأداء المعرفي عبر المجالات...'
  },
  results: {
    completedHeader: 'اكتمل الفحص',
    spokenComplete: 'اكتمل فحصك. اسمح لي أن أوضح لك النتائج.',
    disclaimerText: 'نتيجة الفحص ليست تشخيصًا طبيًا',
    disclaimerNotice:
      'تنبيه: يقيس هذا الفحص مؤشرات معرفية ووظيفية للكشف المبكر. وهو ليس تشخيصًا سريريًا للخرف أو الزهايمر أو أي حالة عصبية. يتطلب التشخيص الرسمي استشارة طبية.',
    lowRiskExplanation:
      'لم يُظهر هذا الفحص تغيرًا خارج النطاق المسجل لك سابقًا. وهذا لا ينفي وجود حالة صحية.',
    moderateRiskExplanation:
      'اختلفت بعض الملاحظات عن جلساتك السابقة. قد يحدث ذلك لأسباب عديدة، وهو دعوة لمراجعة سريرية وليس تشخيصًا.',
    highRiskExplanation:
      'اختلفت عدة ملاحظات عن جلساتك السابقة. يرجى ترتيب مراجعة مع طبيب مؤهل. هذا ليس تشخيصًا.',
    nextStepsNormal:
      'واصل النشاط البدني والذهني المنتظم. أعد الفحص حسب توجيه فريق رعايتك.',
    nextStepsFollowup: 'يمكنك تنزيل ملخصك ومشاركته مباشرة مع مقدم الرعاية الصحية.'
  },
  contextual: {
    faceNotCentered: 'يرجى الاقتراب قليلًا من الكاميرا وإبقاء رأسك مستقيمًا.',
    lookAtScreen: 'يرجى النظر نحو الشاشة.',
    speakLouder: 'لم أسمعك بوضوح. يرجى التحدث بصوت أعلى قليلًا.',
    takeYourTime: 'خذ وقتك. لا داعي للاستعجال.',
    simplerHelp: 'دعني أشرح ببساطة: اتبع ما هو مظلل على شاشتك.',
    taskCompleted: 'أحسنت! ننتقل إلى المهمة التالية.',
    goodJob: 'عمل رائع!'
  },
  assistant: {
    name: 'نيولنز',
    speakingStatus: 'يتحدث...',
    listeningStatus: 'يستمع...',
    calmStatus: 'جاهز للمساعدة',
    repeatBtn: 'أعد التعليمات',
    helpBtn: 'مساعدة / دليل مبسط',
    volumeBtn: 'مستوى الصوت',
    languageBtn: 'تغيير اللغة',
    stepOf: 'الخطوة'
  }
};
