/**
 * Multilingual Indian voice command grammar.
 *
 * Maps a spoken utterance (English, Tamil, Hindi) to a portal route or a
 * conversational action. All languages are matched simultaneously, so a patient can
 * say "brain health", "மூளை நலம்", or "मस्तिष्क स्वास्थ्य" regardless of UI language.
 */

export type VoiceAction =
  | 'stop'
  | 'repeat'
  | 'language-en'
  | 'language-ta'
  | 'language-hi'
  | 'capabilities'
  | 'summary'
  | 'appointments'
  | 'care-plan'
  | 'greeting';

export type VoiceCommand =
  | { kind: 'navigate'; route: string }
  | { kind: 'action'; action: VoiceAction };

interface PhraseSet {
  phrases: string[];
}

const ROUTES: Array<PhraseSet & { route: string }> = [
  {
    route: '/patient/dashboard',
    phrases: ['dashboard', 'home page', 'go home', 'main page', 'டாஷ்போர்டு', 'முகப்பு பக்கம்', 'முதல் பக்கம்', 'डैशबोर्ड', 'मुख्य पृष्ठ', 'होम पेज']
  },
  {
    route: '/patient/brain-health',
    phrases: ['brain health', 'my brain health', 'brain score', 'my brain score', 'மூளை நலம்', 'என் மூளை நலம்', 'மூளை மதிப்பீடு', 'மस्तिष्क स्वास्थ्य', 'ब्रेन स्कोर', 'दिमाग का स्वास्थ्य']
  },
  {
    route: '/patient/timeline',
    phrases: ['timeline', 'my timeline', 'line of time', 'நேரக்கோடு', 'டைம்லைன்', 'காலவரிசை', 'समयरेखा', 'टाइमलाइन']
  },
  {
    route: '/patient/assessment/intro',
    phrases: ['start assessment', 'take assessment', 'begin assessment', 'new assessment', 'start the assessment', 'பரிசோதனையைத் தொடங்கு', 'புதிய பரிசோதனை', 'மதிப்பீடு செய்', 'मूल्यांकन शुरू करें', 'जांच शुरू करें', 'टेस्ट शुरू करें']
  },
  {
    route: '/patient/cognitive',
    phrases: ['cognitive assessment', 'cognitive tests', 'memory tests', 'நினைவாற்றல் சோதனை', 'அறிவாற்றல் பரிசோதனை', 'நினைவக பரிசோதனை', 'संज्ञानात्मक जांच', 'स्मृति परीक्षण', 'मेमोरी टेस्ट']
  },
  {
    route: '/patient/cognitive/library',
    phrases: ['task library', 'library', 'games', 'exercises', 'பயிற்சி நூலகம்', 'விளையாட்டுகள்', 'பயிற்சிகள்', 'कार्य पुस्तकालय', 'अभ्यास', 'खेल', 'गेम्स']
  },
  {
    route: '/patient/history',
    phrases: ['history', 'history page', 'open history', 'my history', 'assessment history', 'past assessments', 'previous tests', 'என் முந்தைய வரலாறு', 'வரலாறு', 'பழைய முடிவுகள்', 'पिछला इतिहास', 'इतिहास', 'पुराने टेस्ट']
  },
  {
    route: '/patient/daily-function',
    phrases: ['daily function', 'daily activities', 'daily questionnaire', 'அன்றாட பணிகள்', 'தினசரி செயல்பாடுகள்', 'दैनिक गतिविधियां', 'रोज़मर्रा के काम']
  },
  {
    route: '/patient/documents',
    phrases: ['documents', 'reports and documents', 'my reports', 'my documents', 'மருத்துவ ஆவணங்கள்', 'அறிக்கைகள்', 'என் கோப்புகள்', 'दस्तावेज़', 'रिपोर्ट', 'मेरी रिपोर्ट्स']
  },
  {
    route: '/patient/trends',
    phrases: ['trends', 'my trends', 'longitudinal trends', 'நீண்டகால போக்குகள்', 'போக்கைக் காட்டு', 'மாறுதல்கள்', 'प्रवृत्तियां', 'ट्रेंड्स', 'लॉन्गीट्यूडिनल ट्रेंड्स']
  },
  {
    route: '/patient/change-detection',
    phrases: ['change detection', 'what changed', 'detect changes', 'மாற்றங்கள் என்ன', 'தனிநபர் மாற்றம்', 'என்ன மாறியது', 'क्या बदलाव हुआ', 'परिवर्तन जांच', 'बदलाव देखें']
  },
  {
    route: '/patient/health-profile',
    phrases: ['health profile', 'health context', 'my health profile', 'சுகாதார விவரம்', 'உடல் நலம் சுயவிவரம்', 'स्वास्थ्य प्रोफ़ाइल', 'हेल्थ प्रोफाइल']
  },
  {
    route: '/patient/context',
    phrases: ['context overview', 'my context', 'சூழல் பார்வை', 'சூழல் சுருக்கம்', 'संदर्भ अवलोकन', 'मेरा संदर्भ']
  },
  {
    route: '/patient/context/assessment-conditions',
    phrases: ['assessment conditions', 'my conditions', 'பரிசோதனை நிலைமைகள்', 'परीक्षण की स्थिति']
  },
  {
    route: '/patient/context/sleep',
    phrases: ['sleep', 'my sleep', 'sleep and lifestyle', 'தூக்கம்', 'தூக்க விவரம்', 'வாழ்க்கை முறை', 'नींद', 'मेरी नींद', 'जीवनशैली']
  },
  {
    route: '/patient/context/wellbeing',
    phrases: ['wellbeing', 'mental wellbeing', 'mental health', 'mood', 'மன நலம்', 'நல்வாழ்வு', 'மனநிலை', 'मानसिक स्वास्थ्य', 'कल्याण', 'मूड']
  },
  {
    route: '/patient/context/clinical',
    phrases: ['clinical history', 'family history', 'clinical and family', 'மருத்துவ வரலாறு', 'குடும்ப வரலாறு', 'चिकित्सा इतिहास', 'पारिवारिक इतिहास']
  },
  {
    route: '/patient/prevention-plan',
    phrases: ['prevention plan', 'my plan', 'personalized plan', 'தடுப்பு திட்டம்', 'என் திட்டம்', 'ரோகத்தாம் யோஜனா', 'रोकथाम योजना', 'मेरी योजना']
  },
  {
    route: '/patient/appointments',
    phrases: ['appointments', 'my appointments', 'consultations', 'மருத்துவ சந்திப்பு', 'சந்திப்புகள்', 'நேர ஒதுக்கீடு', 'अपॉइंटमेंट', 'मुलाकात', 'डॉक्टर से मिलना']
  },
  {
    route: '/patient/care-plan',
    phrases: ['care plan', 'my care plan', 'பராமரிப்பு திட்டம்', 'கவனிப்பு திட்டம்', 'देखभाल योजना', 'केयर प्लान']
  },
  {
    route: '/patient/notifications',
    phrases: ['notifications', 'messages', 'alerts', 'அறிவிப்புகள்', 'செய்திகள்', 'सूचनाएं', 'संदेश']
  },
  {
    route: '/patient/profile',
    phrases: ['my profile', 'profile', 'my details', 'சுயவிவரம்', 'என் விவரங்கள்', 'प्रोफ़ाइल', 'मेरा विवरण']
  },
  {
    route: '/patient/settings',
    phrases: ['settings', 'account settings', 'preferences', 'அமைப்புகள்', 'கணக்கு அமைப்புகள்', 'सेटिंग्स', 'खाता सेटिंग्स']
  },
  {
    route: '/patient/privacy',
    phrases: ['privacy', 'privacy and data', 'my data', 'தனியுரிமை', 'என் தரவு பாதுகாப்பு', 'गोपनीयता', 'डेटा सुरक्षा']
  },
  {
    route: '/patient/help',
    phrases: ['help and support', 'support', 'contact support', 'உதவி', 'ஆதரவு', 'உதவி பெறு', 'मदद', 'सहायता', 'सपोर्ट']
  }
];

const ACTIONS: Array<PhraseSet & { action: VoiceAction }> = [
  {
    action: 'stop',
    phrases: ['stop talking', 'stop speaking', 'be quiet', 'silence', 'enough', 'பேச்சை நிறுத்து', 'நிறுத்து', 'அமைதியாக இரு', 'போதும்', 'बोलना बंद करो', 'रुक जाओ', 'शांत रहो', 'बस']
  },
  {
    action: 'repeat',
    phrases: ['repeat', 'say again', 'again please', 'மீண்டும் சொல்', 'திரும்பக் கூறு', 'மறுபடியும் சொல்', 'फिर से बोलो', 'दोहराएं', 'दोबारा कहें']
  },
  {
    action: 'language-en',
    phrases: ['speak english', 'switch to english', 'in english', 'english please', 'ஆங்கிலம்', 'ஆங்கிலத்தில் பேசு', 'अंग्रेज़ी', 'इंग्लिश में बोलो']
  },
  {
    action: 'language-ta',
    phrases: ['speak tamil', 'switch to tamil', 'in tamil', 'tamil please', 'தமிழ்', 'தமிழில் பேசு', 'தமிழுக்கு மாற்று', 'தமிழ் மொழி']
  },
  {
    action: 'language-hi',
    phrases: ['speak hindi', 'switch to hindi', 'in hindi', 'hindi please', 'हिन्दी', 'हिंदी', 'हिंदी में बात करो', 'हिंदी में बदलो', 'हिंदी भाषा']
  },
  {
    action: 'summary',
    phrases: ['how is my brain', 'how am i doing', 'my summary', 'read my summary', 'brain summary', 'என் நிலைமை எப்படி உள்ளது', 'என் சுருக்கம்', 'மூளை அறிக்கை சுருக்கம்', 'मेरा स्वास्थ्य कैसा है', 'मेरा सारांश', 'ब्रेन समरी']
  },
  {
    action: 'appointments',
    phrases: ['next appointment', 'when is my appointment', 'my next appointment', 'அடுத்த மருத்துவ சந்திப்பு எப்போது', 'என் சந்திப்பு', 'अगला अपॉइंटमेंट कब है', 'मेरी अगली मुलाकात']
  },
  {
    action: 'care-plan',
    phrases: ['my care plan status', 'care plan progress', 'what should i do next', 'அடுத்து நான் என்ன செய்ய வேண்டும்', 'பராமரிப்பு முன்னேற்றம்', 'आगे मुझे क्या करना चाहिए', 'केयर प्लान प्रगति']
  },
  {
    action: 'capabilities',
    phrases: ['what can you do', 'what can i say', 'how do you work', 'உங்களால் என்ன செய்ய முடியும்', 'நான் என்ன பேசலாம்', 'आप क्या कर सकते हैं', 'मैं क्या कह सकता हूँ']
  },
  {
    action: 'greeting',
    phrases: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'வணக்கம்', 'காலை வணக்கம்', 'நலமா', 'नमस्ते', 'प्रणाम', 'शुभ प्रभात', 'नमस्कार']
  }
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scorePhrase(haystack: string, phrase: string): number {
  const needle = normalize(phrase);
  if (!needle) return 0;
  if (!haystack.includes(needle)) return 0;
  const words = needle.split(' ').length;
  return words * 10 + needle.length;
}

/**
 * Wake phrases. Recognition stays on, but nothing is acted on until one of
 * these is heard.
 */
const WAKE_WORDS = [
  'hey neulens',
  'hi neulens',
  'ok neulens',
  'okay neulens',
  'hello neulens',
  'neulens',
  'neu lens',
  'new lens',
  'new lense',
  'nulens',
  'nu lens',
  'neu lenses',
  'assistant',
  'hey assistant',
  // Tamil wake words
  'வணக்கம் நியூலென்ஸ்',
  'ஹே நியூலென்ஸ்',
  'நியூலென்ஸ்',
  'உதவியாளர்',
  // Hindi wake words
  'नमस्ते न्यूलेंस',
  'हे न्यूलेंस',
  'सुनो न्यूलेंस',
  'न्यूलेंस',
  'सहायक'
];

/**
 * Detects the wake word and returns whatever was said after it, so
 * "Hey NeuLens, open my reports" runs the command immediately.
 */
export function extractWakeWord(transcript: string): { wake: boolean; rest: string } {
  const normalized = normalize(transcript);
  if (!normalized) return { wake: false, rest: '' };

  let bestIndex = -1;
  let bestLength = 0;

  for (const word of WAKE_WORDS) {
    const needle = normalize(word);
    const index = normalized.indexOf(needle);
    if (index === -1) continue;
    // Prefer the longest matching wake phrase at the earliest position.
    if (bestIndex === -1 || index < bestIndex || (index === bestIndex && needle.length > bestLength)) {
      bestIndex = index;
      bestLength = needle.length;
    }
  }

  // Fuzzy fallback: browsers often mishear "NeuLens" as a similar word.
  if (bestIndex === -1) {
    const tokens = normalized.split(' ');
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i].length < 4) continue;
      if (editDistance(tokens[i], 'neulens') <= 2) {
        bestIndex = normalized.indexOf(tokens[i]);
        bestLength = tokens[i].length;
        break;
      }
    }
  }

  if (bestIndex === -1) return { wake: false, rest: '' };

  // "neulense" can match "neulens" and leave a stray letter behind; that is
  // an acknowledgement, not a command.
  const rest = normalized.slice(bestIndex + bestLength).trim();
  return { wake: true, rest: rest.length < 2 ? '' : rest };
}

/**
 * True for utterances phrased as a question, so "what does my brain health
 * score mean?" is answered rather than treated as navigation.
 */
export function looksLikeQuestion(transcript: string): boolean {
  const text = transcript.trim();
  if (!text) return false;
  if (/[?؟]$/.test(text)) return true;
  return /^(what|why|how|when|where|who|can you|could you|do i|should i|is my|are my|will i)\b/i.test(text) ||
    /^(لماذا|كيف|ماذا|ما |هل|متى|أين|اين|هل يمكن)/.test(text);
}

/** Small Levenshtein helper used for fuzzy wake-word matching. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const text = normalize(transcript);
  if (!text) return null;

  let best: { score: number; command: VoiceCommand } | null = null;

  for (const entry of ROUTES) {
    for (const phrase of entry.phrases) {
      const score = scorePhrase(text, phrase);
      if (score > 0 && (!best || score > best.score)) {
        best = { score, command: { kind: 'navigate', route: entry.route } };
      }
    }
  }

  for (const entry of ACTIONS) {
    for (const phrase of entry.phrases) {
      // Actions win ties: a patient asking "when is my appointment" wants an
      // answer, not a page.
      const score = scorePhrase(text, phrase) + 1;
      if (score > 0 && (!best || score > best.score)) {
        best = { score, command: { kind: 'action', action: entry.action } };
      }
    }
  }

  return best && best.score >= 10 ? best.command : null;
}
