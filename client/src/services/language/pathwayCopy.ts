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

export const getPathwayCopy = (language: SupportedLanguage): PathwayCopy =>
  language === 'ar' ? ar : en;
