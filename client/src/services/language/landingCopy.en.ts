import type { LandingCopy } from './landingCopy';

export const en: LandingCopy = {
  nav: [
    { label: 'The challenge', href: '#challenge' },
    { label: 'Our approach', href: '#approach' },
    { label: 'Measurement', href: '#measurement' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'For clinicians', href: '#for-clinicians' },
    { label: 'Research', href: '#research' },
  ],
  header: {
    mainNav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    clinicianPortal: 'Clinician portal',
    patientPortal: 'Patient portal',
    explore: 'Explore How It Works',
    skipToContent: 'Skip to content',
    language: 'Language',
  },
  hero: {
    eyebrow: 'Brain health | Early screening',
    titleLine1: 'Understand Brain Health.',
    titleLine2: 'Identify Changes Earlier.',
    lead:
      'NeuLens brings cognitive, ocular, vocal and facial observations into one structured screening session — supporting personal brain-health baselines and earlier conversations about meaningful change.',
    audience:
      'Built for neurologists, geriatric specialists, hospitals, clinics and clinical research institutions.',
    patientPortal: 'Patient portal',
    explore: 'Explore How It Works',
    disclaimer: 'Developing prototype · Not clinically validated · Clinician-supervised use only',
    sceneTitle: 'An elderly couple reviewing brain-health observations with their clinician',
    illustrationNote: 'Illustrative: an elderly couple consulting their clinician.',
    clinicianSupervised: 'Clinician-supervised',
    fourTypes: 'Four observation types',
    oneSession: 'One guided session',
  },
  tagline: {
    eyebrow: 'Our point of view',
    statement: 'Earlier awareness starts with knowing what change looks like for each person.',
    body:
      'Population averages can describe a group. Personal baselines help a clinician understand what a change means for the individual in front of them.',
  },
  challenge: {
    eyebrow: 'The challenge',
    title: 'Change is often gradual. Care is often later.',
    lead:
      'Cognitive and functional shifts can emerge long before they become obvious in a routine conversation. The challenge is not only noticing them — it is knowing which changes matter for this person.',
    items: [
      {
        number: '01',
        title: 'Signals arrive in fragments',
        detail:
          'Cognition, eye movement, voice and behaviour are usually observed at different times, in different formats, by different people.',
      },
      {
        number: '02',
        title: 'A single score says very little',
        detail:
          'Population averages cannot tell a clinician what is meaningful for an individual whose abilities, language, education and context vary.',
      },
      {
        number: '03',
        title: 'The window narrows quietly',
        detail:
          'When change is recognised late, opportunities for prevention, planning and support are already reduced.',
      },
    ],
    principle: 'A NeuLens design principle',
    principleBody:
      'The useful question is not only how someone compares with a population average — it is what has changed for this person.',
  },
  approach: {
    eyebrow: 'The NeuLens approach',
    title: 'A structured, multimodal view — built around the individual.',
    lead:
      'NeuLens combines four kinds of observation in one calm, clinician-supervised session. The aim is not to replace clinical judgement, but to give it clearer, more consistent information to work with.',
    benefits: [
      {
        title: 'Multimodal by design',
        detail: 'Cognition, gaze, voice and facial behaviour observed in one structured session.',
      },
      {
        title: 'Personal over population',
        detail: 'Comparisons begin with the person’s own baseline, not only a group average.',
      },
      {
        title: 'Clinician in the loop',
        detail:
          'Outputs are review prompts for a qualified professional — never automated diagnoses.',
      },
      {
        title: 'Accessible by default',
        detail:
          'Clear language, spoken guidance and a calm interface designed for older adults.',
      },
    ],
    footnote:
      'Screening support, not diagnosis. NeuLens is a developing prototype and is not clinically validated.',
    sceneTitle: 'A clinician discussing brain-health observations with an older adult',
    illustrationNote: 'Illustrative: a clinician discussing observations in context.',
  },
  measurement: {
    eyebrow: 'Four measurement pillars',
    title: 'More than one signal. A more complete conversation.',
    lead:
      'Each pillar contributes a different kind of observation. Together they form a structured session summary for a qualified clinician to interpret.',
    note:
      'All four pillars currently produce exploratory observations. Their diagnostic or predictive validity has not been established.',
    pillarLabel: 'Pillar',
    footerNote: 'Prototype observation · Not a diagnostic measure',
    pillars: [
      {
        title: 'Cognitive assessment',
        description:
          'Memory, attention, executive function and language, observed through short guided activities.',
        tags: ['Memory', 'Attention', 'Executive function', 'Language'],
        sceneTitle: 'An older adult completing a guided cognitive activity',
      },
      {
        title: 'Ocular observations',
        description:
          'Gaze and eye-movement behaviour captured through the browser camera during structured visual tasks.',
        tags: ['Gaze', 'Fixation stability', 'Saccadic behaviour'],
        sceneTitle: 'Eye-movement observations being captured during a guided task',
      },
      {
        title: 'Vocal & speech',
        description:
          'Speech timing, acoustic characteristics and task word accuracy from short spoken activities.',
        tags: ['Speech rate', 'Prosody', 'Articulation'],
        sceneTitle: 'An older adult completing a guided spoken activity',
      },
      {
        title: 'Facial & behavioural',
        description:
          'Facial movement, bilateral symmetry and task-related behaviour observed during guided activities.',
        tags: ['Facial movement', 'Symmetry', 'Task behaviour'],
        sceneTitle: 'Facial and behavioural observations during a guided activity',
      },
    ],
  },
  how: {
    eyebrow: 'How NeuLens works',
    title: 'From a guided session to a more informed review.',
    lead:
      'The workflow is intentionally simple for the person taking part, and deliberately transparent for the clinician reviewing it.',
    steps: [
      {
        number: '01',
        title: 'Set up & consent',
        detail:
          'A clinician or researcher starts a session, records relevant context with permission, and confirms the person is comfortable to continue.',
      },
      {
        number: '02',
        title: 'Complete guided activities',
        detail:
          'Short cognitive, ocular, vocal and facial activities are delivered with clear spoken instructions and accessibility options.',
      },
      {
        number: '03',
        title: 'Review a structured summary',
        detail:
          'Observations are organised into one session view, with quality and comparability indicators alongside the measurements.',
      },
      {
        number: '04',
        title: 'Interpret in context',
        detail:
          'The clinician considers the summary with history, medications, sensory access and the wider clinical picture.',
      },
    ],
    note:
      'A session does not produce a diagnosis or a standalone risk score. It produces structured observations for professional review.',
  },
  baseline: {
    eyebrow: 'Personal baseline & longitudinal monitoring',
    title: 'The right comparison is the person in front of you.',
    lead:
      'A single screening is a snapshot. NeuLens is designed to compare results over time — within the same person, under comparable conditions — so that change can be described rather than guessed.',
    points: [
      {
        title: 'A personal reference point.',
        body:
          'Results are viewed against the person’s own earlier sessions, not only a population norm.',
      },
      {
        title: 'Comparable conditions.',
        body:
          'Task version, language, education and access conditions are recorded so comparisons are not made across unlike sessions.',
      },
      {
        title: 'Review, not diagnosis.',
        body:
          'A change prompt means “look closer”, not “this is a diagnosis”. The clinician decides what it means.',
      },
    ],
    sceneTitle:
      'An older adult and clinician reviewing a longitudinal brain-health view together',
    flow: [
      { label: 'Personal baseline', note: 'Own prior sessions' },
      { label: 'Comparable follow-up', note: 'Like-for-like conditions' },
      { label: 'Change to review', note: 'A clinical prompt' },
    ],
    flowNote:
      'Illustrative workflow only. No clinical thresholds or accuracy figures are shown.',
    note:
      'Within-person change prompts require three prior comparable screens in the current prototype. The absence of a prompt is not evidence of stability.',
  },
  context: {
    eyebrow: 'Health-context integration',
    title: 'A screening result does not stand alone.',
    lead:
      'NeuLens is designed to keep observations connected to the context that gives them meaning — while leaving interpretation with the clinician.',
    items: [
      {
        title: 'Clinical history & medications',
        detail:
          'Comorbidities, prescriptions and sensory access can all shape what a screening observation means.',
      },
      {
        title: 'Everyday function & lifestyle',
        detail: 'Sleep, activity, mood and daily-function check-ins add context to measured change.',
      },
      {
        title: 'Authorised health records',
        detail:
          'Optional FHIR R4 import of supported observations, only with explicit patient permission and a configured endpoint.',
      },
      {
        title: 'Clinician judgement',
        detail:
          'Context can inform a conversation. It does not establish causation or replace clinical assessment.',
      },
    ],
    footnote:
      'FHIR context import is an optional prototype capability. Live connectivity must be configured and tested for each deployment.',
    sceneTitle: 'A clinician reviewing health context alongside screening observations',
    illustrationNote:
      'Illustrative: screening observations considered with broader health context.',
  },
  oversight: {
    eyebrow: 'Clinical oversight & safety',
    title: 'Designed for professional review. Not self-diagnosis.',
    lead:
      'NeuLens is intended for use by qualified healthcare professionals within a clinical or research setting. It does not diagnose dementia or any neurological disorder.',
    isTitle: 'What NeuLens is',
    isBody:
      'A digital brain-health screening and clinical decision-support platform, combining multimodal observations, personal baselines and structured clinician review.',
    isNotTitle: 'What NeuLens is not',
    isNotBody:
      'A diagnostic device, a validated cognitive test, a standalone risk score, or a substitute for professional medical evaluation, diagnosis or treatment.',
    principles: [
      {
        title: 'Clinician-owned decisions',
        detail: 'The platform surfaces observations. The clinician makes the call.',
      },
      {
        title: 'No public self-screening',
        detail: 'Sessions are conducted in a supervised clinical or research context.',
      },
      {
        title: 'Privacy by design',
        detail:
          'Selected signals are processed on the device; raw media is not recorded or uploaded by default.',
      },
      {
        title: 'Transparent about limits',
        detail: 'Prototype status and comparability conditions are shown alongside results.',
      },
    ],
    sceneTitle: 'A clinician reviewing a structured screening summary with a patient',
    clinicianInLoop: 'Clinician in the loop',
    clinicianInLoopBody:
      'NeuLens is a developing prototype and is not clinically validated. All outputs require professional interpretation.',
  },
  clinicians: {
    eyebrow: 'For healthcare professionals',
    title: 'A clearer starting point for earlier conversations.',
    lead:
      'We are working with neurologists, geriatric specialists, hospitals, clinics and clinical research institutions to put multimodal screening into practice carefully — and to test it honestly.',
    audiences: [
      {
        title: 'Neurologists & geriatric specialists',
        detail: 'Add structured, longitudinal observations to cognitive and functional review.',
      },
      {
        title: 'Hospitals & clinics',
        detail:
          'Explore a browser-based screening workflow that fits existing clinical oversight.',
      },
      {
        title: 'Clinical research institutions',
        detail: 'Collaborate on measurement quality, fairness and validation research.',
      },
    ],
    demoCta: 'Request a Clinical Demo',
    researchCta: 'Discuss research collaboration',
    note: 'Current prototype. No clinical accuracy, adoption or outcome claims are made.',
    sceneTitle: 'A clinical team working together with older adults',
    illustrationNote: 'Illustrative: a clinician-led care team.',
    reviewTag: 'Clinical review',
  },
  research: {
    eyebrow: 'Technology & research approach',
    title: 'Clear about what exists today — and what comes next.',
    lead:
      'We separate prototype capabilities from planned development and research-stage questions. No clinical accuracy figures, hospital adoption numbers or research outcomes are claimed.',
    groups: [
      {
        label: 'Available in the prototype',
        items: [
          'Guided multimodal screening session',
          'Structured session summary for clinician review',
          'Personal baseline and within-person change prompts',
          'Optional authorised FHIR context import',
          'On-device processing of selected signals',
        ],
      },
      {
        label: 'In development',
        items: [
          'Broader language and accessibility coverage',
          'Tighter clinician workflow integration',
          'Quality and fairness reporting',
          'Deployment hardening and site configuration',
        ],
      },
      {
        label: 'Research direction',
        items: [
          'Clinical validation studies',
          'Meaningful-change thresholds',
          'Performance across languages, education and sensory access',
          'Regulatory and evaluation pathway',
        ],
      },
    ],
    principles: [
      {
        title: 'Privacy by design',
        detail: 'Derived measurements, not raw media, by default.',
      },
      {
        title: 'Measurement transparency',
        detail: 'Quality and comparability are shown, not hidden.',
      },
      {
        title: 'Validation before claims',
        detail: 'No performance claim without evidence.',
      },
    ],
    noClaimTitle: 'What we do not claim',
    noClaimBody:
      'Diagnostic accuracy, clinical validation, hospital partnerships, clinical testimonials or completed research outcomes. NeuLens is a developing prototype; its current value is in demonstrating a careful, multimodal screening workflow.',
  },
  faq: {
    eyebrow: 'Frequently asked questions',
    title: 'Common questions, answered plainly.',
    lead:
      'If your question is not covered here, we would be glad to discuss your clinical or research setting directly.',
    askCta: 'Ask us directly',
    items: [
      {
        question: 'Is NeuLens clinically validated?',
        answer:
          'No. NeuLens is a developing prototype and is not clinically validated. It does not diagnose dementia or any neurological disorder, and no clinical accuracy figures are claimed.',
      },
      {
        question: 'Is NeuLens a diagnostic tool?',
        answer:
          'No. NeuLens is a screening and clinical decision-support platform. It produces exploratory observations and review prompts for a qualified healthcare professional, not a diagnosis or treatment recommendation.',
      },
      {
        question: 'What does a session measure?',
        answer:
          'A guided session captures four kinds of observation: cognitive task performance, ocular (gaze and eye-movement) behaviour, vocal and speech characteristics, and facial and task-related behaviour. These are exploratory signals, not validated diagnostic instruments.',
      },
      {
        question: 'Who is NeuLens designed for?',
        answer:
          'NeuLens is designed for neurologists, geriatric specialists, hospitals, clinics and clinical research institutions. Sessions are intended to take place within a clinical or research setting under professional supervision.',
      },
      {
        question: 'Can patients use NeuLens on their own?',
        answer:
          'No. NeuLens does not offer public self-screening or self-diagnosis. The patient portal supports supervised participation in a screening journey, but interpretation and next steps remain with the clinician.',
      },
      {
        question: 'How does longitudinal monitoring work?',
        answer:
          'NeuLens compares results within the same person when task version, language, education and recorded access conditions match. In the current prototype, a change prompt requires three prior comparable screens. A prompt is a cue to review, not a validated change threshold, and the absence of a prompt is not evidence of stability.',
      },
      {
        question: 'How is data handled?',
        answer:
          'Selected video and audio signals are processed locally in the browser and only derived measurements are sent to the backend by default. Raw media is not recorded or uploaded. Optional health-record context is imported read-only, only with explicit permission and server-side configuration for that deployment.',
      },
      {
        question: 'How can my institution get involved?',
        answer:
          'We welcome clinical demonstration and research collaboration enquiries from care teams and research institutions. Request a demo or write to us to discuss your setting, workflow and evaluation questions.',
      },
    ],
  },
  demoForm: {
    title: 'Request a clinical demo',
    intro:
      'Tell us a little about your setting. This prepares an email in your mail app so you can review it before sending.',
    fullName: 'Full name',
    namePlaceholder: 'Dr. Mohamed',
    nameError: 'Please enter your full name.',
    email: 'Professional email',
    emailPlaceholder: 'a.rahman@hospital.org',
    emailError: 'Please enter a valid professional email address.',
    organization: 'Organization / hospital',
    organizationPlaceholder: 'City General Hospital',
    organizationError: 'Please enter your organization or hospital.',
    role: 'Professional role',
    rolePlaceholder: 'Select your role',
    roleError: 'Please select your professional role.',
    roles: [
      { value: 'Neurologist', label: 'Neurologist / geriatric specialist' },
      { value: 'Hospital', label: 'Hospital or clinic professional' },
      { value: 'Research', label: 'Clinical research institution' },
      { value: 'Other', label: 'Other healthcare or research role' },
    ],
    message: 'What would you like to explore?',
    messagePlaceholder:
      'I’d like to understand how NeuLens could fit into our cognitive screening workflow.',
    messageError: 'Please add a short note about your interest.',
    privacy:
      'NeuLens is a developing prototype. A demo is an overview of the current workflow, not access to a clinically validated test.',
    submit: 'Request a Clinical Demo',
    submittedTitle: 'Your email draft is ready.',
    submittedBody:
      'Your email app should open with the enquiry prepared. Nothing is sent until you choose to send it. If your email app did not open, use the button below.',
    openDraft: 'Open the email draft',
    newRequest: 'Start a new request',
    writeTo: 'You can also write to',
    emailSubject: (organization) => `Clinical demo enquiry — ${organization}`,
    emailLabels: {
      name: 'Name',
      email: 'Professional email',
      organization: 'Organization',
      role: 'Role',
      context: 'Context',
      sentFrom: 'Sent from the NeuLens landing page.',
    },
  },
  contact: {
    eyebrow: 'Clinical demonstration & research',
    title: 'Let’s explore the right next step for your team.',
    lead:
      'Request a walkthrough of the current prototype, discuss your workflow, and review its limitations with our team. We are particularly interested in collaborations with clinical and research groups.',
    bullets: [
      'A guided walkthrough of the prototype',
      'A discussion of your screening and review workflow',
      'An honest review of current evidence and limitations',
    ],
    preferEmail: 'Prefer email?',
  },
  footer: {
    tagline: 'Earlier awareness of meaningful change, built for clinical review and follow-up.',
    disclaimer:
      'NeuLens is a developing prototype and is not clinically validated. It does not diagnose dementia or any neurological disorder.',
    platformHeading: 'Platform',
    platformNavLabel: 'Platform links',
    platformLinks: [
      { label: 'The challenge', href: '#challenge' },
      { label: 'Our approach', href: '#approach' },
      { label: 'Measurement pillars', href: '#measurement' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Research approach', href: '#research' },
      { label: 'FAQ', href: '#faq' },
    ],
    clinicianHeading: 'For clinicians',
    clinicalNavLabel: 'Clinical links',
    clinicianLinks: [
      { label: 'Request a clinical demo', href: '#contact' },
      { label: 'Healthcare professionals', href: '#for-clinicians' },
      { label: 'Clinical oversight & safety', href: '#clinical-oversight' },
      { label: 'Clinician portal', href: '/doctor/login' },
      { label: 'Patient portal', href: '/patient' },
    ],
    contactHeading: 'Contact',
    contactLink: 'Clinical demonstration',
    clinicianPortal: 'Clinician portal',
    patientPortal: 'Patient portal',
    contactNote:
      'For healthcare professionals and research institutions. Not for public self-screening.',
    rights: '© 2026 NeuLens. All rights reserved.',
    bottomNote: 'Developing prototype · Not clinically validated · Not a diagnostic tool',
  },
};
