/**
 * Patient assistant skills.
 *
 * Progressive disclosure: the always-on part of the prompt only carries the
 * identity, hard safety rules and a one-line catalogue of skills. A skill's
 * full guidance is appended only when the patient's question (or the page they
 * are on) makes it relevant, so unrelated turns stay small.
 *
 * Adding a capability means adding one entry here, not growing the base prompt.
 */

export interface AssistantSkill {
  id: string;
  /** One line, always visible in the system prompt. Keep it short. */
  description: string;
  /** Lower-case tokens that make this skill relevant. */
  keywords: string[];
  /** Page titles / routes that make this skill relevant. */
  pages?: string[];
  /** Revealed only when the skill is selected. */
  body: string;
}

export const ASSISTANT_SKILLS: AssistantSkill[] = [
  {
    id: 'portal-navigation',
    description: 'Where things live in the portal and how to open a page.',
    keywords: [
      'open', 'navigate', 'menu', 'screen', 'section', 'tab', 'button', 'click',
      'how do i', 'take me', 'go to', 'show me', 'get to', 'where can i',
      'page', 'where', 'find', 'help',
      'صفحة', 'افتح', 'أين', 'اين', 'انتقل', 'القائمة', 'زر', 'ساعدني'
    ],
    body: [
      'Portal map (open a page only when it helps the patient act):',
      '- Dashboard: today\'s overview, next steps and recent changes.',
      '- Cognitive hub: the assessments and check-ins available now.',
      '- Assessment: guided tasks taken in short sittings.',
      '- Brain health profile / Health profile: what the record holds.',
      '- History, Trends, Timeline: past results and how they compare.',
      '- Change detection: notable shifts between visits.',
      '- Daily function: everyday activities and independence.',
      '- Prevention plan: habits and follow-ups agreed with the care team.',
      '- Appointments and Care plan: visits, who to contact, what happens next.',
      '- Notifications and Documents: messages and reports to review.',
      '- Privacy, Settings, Help: consent, language, accessibility, support.',
      'If the patient wants a page, name it and offer to open it rather than describing every option.'
    ].join('\n')
  },
  {
    id: 'scores-and-reports',
    description: 'What a score, trend or reported change means in general terms.',
    keywords: [
      'score', 'result', 'results', 'mean', 'meaning', 'number', 'percent', 'trend',
      'change', 'changed', 'worse', 'better', 'memory', 'brain', 'test', 'report', 'decline',
      'درجة', 'نتيجة', 'نتائج', 'معنى', 'تغيير', 'ذاكرة', 'دماغ', 'تقييم', 'تقرير'
    ],
    pages: ['trends', 'history', 'change', 'report', 'score', 'assessment', 'brain'],
    body: [
      'Explaining results:',
      '- Say plainly what the number or chart shows, then stop. Do not score it as good, bad, normal or abnormal.',
      '- Never interpret the meaning for this person, estimate risk, or compare them with other patients.',
      '- A change can come from sleep, mood, medication, hearing, language or the test setting, so a shift alone is not a diagnosis.',
      '- Point to the clinician or care team for interpretation, and offer the relevant page (Trends, History, Change detection).',
      '- If they ask whether they have dementia or will develop it, say only a clinician can assess that.'
    ].join('\n')
  },
  {
    id: 'appointments-and-care',
    description: 'Appointments, care plan, reminders and contacting the care team.',
    keywords: [
      'appointment', 'appointments', 'visit', 'book', 'reschedule', 'cancel', 'reminder',
      'care plan', 'doctor', 'clinician', 'nurse', 'contact', 'call', 'message', 'when',
      'موعد', 'مواعيد', 'زيارة', 'طبيب', 'ممرض', 'خطة الرعاية', 'تواصل', 'اتصال', 'تذكير'
    ],
    pages: ['appointment', 'care', 'notification', 'message'],
    body: [
      'Appointments and care:',
      '- Read out only the appointments, contacts and next steps present in the facts. Say you cannot see one if it is absent.',
      '- Never create, move or cancel an appointment; point to the Appointments page or the care team instead.',
      '- For anything clinical, route to the named clinician or care team and offer the Care plan page.'
    ].join('\n')
  },
  {
    id: 'privacy-and-data',
    description: 'Consent, who can see the record, sharing and accessibility settings.',
    keywords: [
      'privacy', 'consent', 'permission', 'share', 'shared', 'who can see', 'data', 'delete',
      'access', 'family', 'carer', 'caregiver', 'language', 'arabic', 'english', 'accessibility',
      'voice', 'microphone', 'mic', 'sound', 'text size',
      'خصوصية', 'موافقة', 'مشاركة', 'بيانات', 'عائلة', 'لغة', 'عربي', 'ميكروفون', 'صوت', 'إعدادات'
    ],
    pages: ['privacy', 'settings', 'help'],
    body: [
      'Privacy and settings:',
      '- The patient decides what is shared and with whom; family access needs their consent.',
      '- Consent can be reviewed or withdrawn on the Privacy page, and withdrawing stops further sharing.',
      '- Language, text size, contrast and the voice assistant are changed on the Settings page.',
      '- The microphone is only used when the patient turns it on, and voice answers can be switched off.',
      '- Never promise deletion or a change of access yourself; direct them to Privacy or their care team.'
    ].join('\n')
  },
  {
    id: 'daily-life',
    description: 'Everyday function, prevention habits and general wellbeing.',
    keywords: [
      'sleep', 'exercise', 'walk', 'diet', 'food', 'eat', 'memory tips', 'forget', 'routine',
      'daily', 'activity', 'mood', 'lonely', 'tired', 'stress', 'habit', 'prevention',
      'نوم', 'رياضة', 'مشي', 'طعام', 'نسيان', 'روتين', 'مزاج', 'وحدة', 'تعب', 'وقاية'
    ],
    pages: ['daily', 'prevention', 'function'],
    body: [
      'Everyday life and prevention:',
      '- Offer general, widely accepted habits: steady sleep, movement, social contact, hearing checks, managing blood pressure, keeping routines and notes.',
      '- Keep it to one or two suggestions the patient can act on today.',
      '- Do not prescribe supplements, diets or exercises for a condition; the care team tailors those.',
      '- If they mention feeling low, withdrawn or unsafe, acknowledge it kindly and point to their clinician or local support.'
    ].join('\n')
  }
];

const MAX_SKILLS = 2;

/** Minimum score before a skill is worth attaching to the prompt. */
const MIN_SCORE = 2;

/** Normalises text for cheap lexical matching (no extra model call). */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ');
}

function scoreSkill(skill: AssistantSkill, haystack: string, page: string): number {
  let score = 0;
  for (const keyword of skill.keywords) {
    if (haystack.includes(keyword)) score += keyword.includes(' ') ? 2 : 1;
  }
  // A route match is a strong signal and works for every UI language.
  if (skill.pages?.some((pageHint) => page.includes(pageHint))) score += 2;
  return score;
}

/**
 * Progressive disclosure step: decide which skill bodies are worth the tokens
 * for this turn. Returns at most {@link MAX_SKILLS} skills, most relevant first.
 * `page` should be the route path (language-independent); `pageTitle` is a
 * fallback for older clients that only send a title.
 */
export function selectSkills(message: string, page = '', pageTitle = ''): AssistantSkill[] {
  const haystack = normalise(`${message} ${page} ${pageTitle}`);
  const route = normalise(`${page} ${pageTitle}`);

  const ranked = ASSISTANT_SKILLS.map((skill, index) => ({
    skill,
    index,
    score: scoreSkill(skill, haystack, route)
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  if (!ranked.length) return [];

  // The catalogue itself is the fallback, so a single weak signal is only
  // worth attaching when it is the strongest one available.
  const aboveThreshold = ranked.filter((entry) => entry.score >= MIN_SCORE);
  const best = ranked[0].score;
  const selected = aboveThreshold.length
    ? aboveThreshold
    : ranked.filter((entry) => entry.score === best);

  // Portal navigation is the catch-all; prefer a topical skill when both fire.
  const topical = selected.filter((entry) => entry.skill.id !== 'portal-navigation');
  const finalList = topical.length
    ? topical
    : selected.filter((entry) => entry.skill.id === 'portal-navigation');

  return finalList.slice(0, MAX_SKILLS).map((entry) => entry.skill);
}

/** The one-line catalogue that is always present in the prompt. */
export function skillCatalogue(): string {
  return ASSISTANT_SKILLS.map((skill) => `- ${skill.id}: ${skill.description}`).join('\n');
}

/** Full guidance for the selected skills only. */
export function skillBodies(skills: AssistantSkill[]): string {
  return skills.map((skill) => skill.body).join('\n\n');
}
