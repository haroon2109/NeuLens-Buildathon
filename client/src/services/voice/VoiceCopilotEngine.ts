import { create } from 'zustand';
import { useLanguageStore } from '../language/LanguageManager';
import { getPortalTranslation } from '../language/portalTranslations';
import { usePatientPortalStore } from '../../store/patientPortalStore';
import { useAuthStore } from '../../store/authStore';
import { patientPortalApi } from '../patientPortalApi';
import { SpeechRecognitionService } from './SpeechRecognitionService';
import { TextToSpeechService } from './TextToSpeechService';
import { useVoiceAssistantStore } from './VoiceInstructionEngine';
import { getVoiceAssistantCopy, VoiceAssistantCopy } from './voiceAssistantCopy';
import { extractWakeWord, looksLikeQuestion, parseVoiceCommand } from './voiceCommands';
import { streamAssistant, AssistantTurn } from './assistantChatApi';
import { SupportedLanguage } from '../language/types';

export type CopilotStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceCopilotState {
  isOpen: boolean;
  isActive: boolean;
  status: CopilotStatus;
  liveTranscript: string;
  messages: CopilotMessage[];
  error: string;
  lastReply: string;
  isAwake: boolean;
  backgroundEnabled: boolean;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  start: () => void;
  stop: () => void;
  setBackgroundEnabled: (enabled: boolean) => void;
  restoreBackgroundPreference: () => void;
  /** Stops recognition without forgetting the patient's hands-free choice. */
  suspendListening: () => void;
  submitText: (text: string, options?: { viaVoice?: boolean }) => Promise<void>;
  clear: () => void;
  registerNavigator: (navigate: (path: string) => void) => void;
}

let navigateTo: ((path: string) => void) | null = null;
let messageSeq = 0;
/** Invalidates in-flight speech when the patient interrupts or stops. */
let speechToken = 0;

/** How long the assistant keeps accepting commands after hearing its name. */
const AWAKE_WINDOW_MS = 12000;
let awakeUntil = 0;

const BACKGROUND_KEY = 'neulens_voice_background';

const nextId = () => `msg-${Date.now()}-${++messageSeq}`;

function currentLang(): SupportedLanguage {
  return useLanguageStore.getState().currentLanguage;
}

function copyFor(language: SupportedLanguage): VoiceAssistantCopy {
  return getVoiceAssistantCopy(language);
}

function formatDate(value: string, language: SupportedLanguage): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

let awakeTimer: ReturnType<typeof setTimeout> | null = null;

export const useVoiceCopilotStore = create<VoiceCopilotState>((set, get) => {
  /** Opens (and keeps extending) the window in which commands need no wake word. */
  const armAwakeWindow = () => {
    awakeUntil = Date.now() + AWAKE_WINDOW_MS;
    if (awakeTimer) clearTimeout(awakeTimer);
    awakeTimer = setTimeout(() => {
      awakeUntil = 0;
      if (useVoiceCopilotStore.getState().isActive) {
        set({ isAwake: false });
      }
    }, AWAKE_WINDOW_MS);
    set({ isAwake: true });
  };

  const pushAssistant = (text: string) => {
    set((state) => ({
      messages: [...state.messages, { id: nextId(), role: 'assistant', text }],
      lastReply: text
    }));
  };

  const pushUser = (text: string) => {
    set((state) => ({
      messages: [...state.messages, { id: nextId(), role: 'user', text }]
    }));
  };

  /** Speaks a reply while the microphone is paused, so the assistant never hears itself. */
  const say = async (text: string) => {
    if (!text) return;
    const recognitionWasActive = get().isActive;
    SpeechRecognitionService.stopListening();
    set({ status: 'speaking' });
    try {
      await useVoiceAssistantStore.getState().speak(text);
    } finally {
      if (recognitionWasActive && get().isActive) {
        listen();
      } else {
        set({ status: 'idle' });
      }
    }
  };

  const respond = async (text: string) => {
    pushAssistant(text);
    await say(text);
  };

  const buildSummary = async (): Promise<string> => {
    const copy = copyFor(currentLang());
    const language = currentLang();
    const parts: string[] = [];

    try {
      const overview = await patientPortalApi.getOverview();
      const score = overview.brainHealth?.profileScore;
      if (typeof score === 'number') {
        parts.push(`${copy.summaryBrain} ${Math.round(score)}.`);
      }
    } catch {
      // Offline or unauthenticated: fall through to locally cached care data.
    }

    const { appointments, notifications, carePlan } = usePatientPortalStore.getState();
    const upcoming = appointments.find((item) => item.status === 'UPCOMING') || appointments[0];
    if (upcoming) {
      parts.push(copy.nextAppointment(upcoming.title, formatDate(upcoming.date, language), upcoming.time));
    }

    const unread = notifications.filter((item) => !item.read).length;
    if (unread > 0) {
      parts.push(
        language === 'ar' ? `لديك ${unread} ${copy.summaryNotifications}.` : `You have ${unread} ${copy.summaryNotifications}.`
      );
    }

    if (!parts.length) {
      parts.push(carePlan.steps.length ? copy.carePlanNoReview(carePlan.progress) : copy.summaryNothing);
    }

    return copy.summary(parts);
  };

  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([
      promise.catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
    ]);

  /** Compact, language-neutral facts about the patient's own record. */
  const gatherFacts = async (utterance: string, waitMs = 2500): Promise<string> => {
    const facts: string[] = [];
    const { appointments, carePlan, notifications } = usePatientPortalStore.getState();

    const upcoming = appointments.find((item) => item.status === 'UPCOMING');
    if (upcoming) {
      facts.push(`next appointment: ${upcoming.title} on ${upcoming.date} at ${upcoming.time}`);
    }

    if (carePlan.steps.length) {
      facts.push(`care plan ${carePlan.progress}% complete, ${carePlan.steps.length} steps`);
    }

    const unread = notifications.filter((item) => !item.read).length;
    if (unread > 0) facts.push(`${unread} unread notifications`);

    // Only pay for the overview request when the question is about results.
    if (/brain|score|result|memory|assessment|دماغ|نتيج|ذاكرة|تقييم/i.test(utterance)) {
      const overview = await withTimeout(patientPortalApi.getOverview(), waitMs);
      const score = overview?.brainHealth?.profileScore;
      if (typeof score === 'number') {
        facts.push(`brain health profile score ${Math.round(score)} out of 100`);
      }
      const lastAssessment = overview?.assessments?.[0];
      if (lastAssessment) {
        facts.push(`last assessment on ${lastAssessment.date}`);
      }
    }

    return facts.join('; ');
  };

  const modelQuestion = async (utterance: string, language: SupportedLanguage) => {
    const pt = getPortalTranslation(language);
    const route = typeof window !== 'undefined' ? window.location.pathname : '';
    const pageTitle = (pt.nav.items as Record<string, string>)[route] || '';
    const history: AssistantTurn[] = get()
      .messages.filter((message) => message.text !== utterance)
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.text }));

    return {
      message: utterance,
      language: (language === 'ta' ? 'ta' : language === 'hi' ? 'hi' : language === 'ar' ? 'ar' : 'en') as 'en' | 'ta' | 'hi' | 'ar',
      // Keep the facts lookup short so the first spoken sentence is not
      // delayed by the overview request.
      context: { page: route, pageTitle, summary: await gatherFacts(utterance, 1200) },
      history
    };
  };

  /**
   * Streams the answer into the transcript and speaks it sentence by sentence,
   * so audio starts as soon as the first sentence arrives.
   */
  const streamModelReply = async (
    utterance: string,
    language: SupportedLanguage,
    fallbackText: string
  ): Promise<void> => {
    const id = nextId();
    set((state) => ({
      messages: [...state.messages, { id, role: 'assistant', text: '' }],
      status: 'thinking'
    }));

    const patchBubble = (text: string) =>
      set((state) => ({
        messages: state.messages.map((message) => (message.id === id ? { ...message, text } : message))
      }));

    const question = await modelQuestion(utterance, language);

    const token = speechToken;
    const queue: string[] = [];
    let pending = '';
    let full = '';
    let finished = false;

    const enqueue = (text: string) => {
      const trimmed = text.trim();
      if (trimmed) queue.push(trimmed);
    };

    const drain = (flush: boolean) => {
      let boundary = pending.search(/[.!?؟۔\n]/);
      while (boundary >= 0) {
        enqueue(pending.slice(0, boundary + 1));
        pending = pending.slice(boundary + 1);
        boundary = pending.search(/[.!?؟۔\n]/);
      }
      if (pending.length > 160) {
        const cut = pending.lastIndexOf(' ', 160);
        const at = cut > 60 ? cut : 160;
        enqueue(pending.slice(0, at));
        pending = pending.slice(at);
      }
      if (flush && pending.trim()) {
        enqueue(pending);
        pending = '';
      }
    };

    const speaker = (async () => {
      SpeechRecognitionService.stopListening();
      if (token === speechToken) set({ status: 'speaking' });

      for (;;) {
        if (token !== speechToken) return;
        if (queue.length) {
          await useVoiceAssistantStore.getState().speak(queue.shift() as string);
          continue;
        }
        if (finished) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (token !== speechToken) return;
      if (get().isActive) {
        listen();
      } else {
        set({ status: 'idle' });
      }
    })();

    try {
      const reply = await streamAssistant(question, (delta) => {
        full += delta;
        pending += delta;
        patchBubble(full);
        drain(false);
      });

      if (reply === null) {
        patchBubble(fallbackText);
        enqueue(fallbackText);
        finished = true;
      } else {
        finished = true;
        drain(true);
        if (full.trim()) set({ lastReply: full.trim() });
      }
    } catch {
      finished = true;
      drain(true);
      if (!full.trim()) {
        patchBubble(fallbackText);
        enqueue(fallbackText);
      }
    }

    await speaker;
  };

  const listen = () => {
    const language = currentLang();
    const copy = copyFor(language);

    const started = SpeechRecognitionService.startListening(
      language,
      (transcript, isFinal) => {
        if (!isFinal) {
          set({ liveTranscript: transcript });
          return;
        }
        set({ liveTranscript: '' });
        if (transcript.trim()) {
          get().submitText(transcript.trim(), { viaVoice: true });
        }
      },
      (err) => {
        if (err?.error === 'not-allowed' || err?.error === 'service-not-allowed') {
          try {
            localStorage.setItem(BACKGROUND_KEY, '0');
          } catch {
            // Ignore storage failures.
          }
          set({ isActive: false, status: 'idle', error: copy.micDenied, backgroundEnabled: false });
        }
      }
    );

    if (!started) {
      try {
        localStorage.setItem(BACKGROUND_KEY, '0');
      } catch {
        // Ignore storage failures.
      }
      set({ isActive: false, status: 'idle', error: copy.unsupported, backgroundEnabled: false });
      return;
    }

    set({ isActive: true, status: 'listening', error: '' });
  };

  const disableBackground = () => {
    try {
      localStorage.setItem(BACKGROUND_KEY, '0');
    } catch {
      // Storage can be unavailable in private mode; the session still works.
    }
    speechToken += 1;
    SpeechRecognitionService.stopListening();
    TextToSpeechService.stop();
    awakeUntil = 0;
    if (awakeTimer) clearTimeout(awakeTimer);
    set({ isActive: false, status: 'idle', isAwake: false, liveTranscript: '', backgroundEnabled: false });
  };

  return {
    isOpen: false,
    isActive: false,
    status: 'idle',
    liveTranscript: '',
    messages: [],
    error: '',
    lastReply: '',
    isAwake: false,
    backgroundEnabled: false,

    setOpen: (open) => {
      if (open) armAwakeWindow();
      set({ isOpen: open });
    },
    toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

    registerNavigator: (navigate) => {
      navigateTo = navigate;
    },

    start: () => {
      get().setBackgroundEnabled(true);
    },

    stop: () => {
      disableBackground();
    },

    /**
     * The single source of truth for listening. When enabled the assistant
     * keeps listening across page navigation, waiting for its wake word.
     */
    setBackgroundEnabled: (enabled) => {
      if (!enabled) {
        disableBackground();
        return;
      }
      try {
        localStorage.setItem(BACKGROUND_KEY, '1');
      } catch {
        // Ignore storage failures.
      }
      set({ backgroundEnabled: true });
      listen();
    },

    suspendListening: () => {
      speechToken += 1;
      SpeechRecognitionService.stopListening();
      TextToSpeechService.stop();
      awakeUntil = 0;
      if (awakeTimer) clearTimeout(awakeTimer);
      set({ isActive: false, status: 'idle', isAwake: false, liveTranscript: '' });
    },

    /** Restores the patient's last choice on portal load. */
    restoreBackgroundPreference: () => {
      let stored = '0';
      try {
        stored = localStorage.getItem(BACKGROUND_KEY) || '0';
      } catch {
        stored = '0';
      }
      if (stored === '1' && SpeechRecognitionService.isSupported()) {
        get().setBackgroundEnabled(true);
      }
    },

    clear: () => set({ messages: [], liveTranscript: '', lastReply: '' }),

    submitText: async (text: string, options?: { viaVoice?: boolean }) => {
      const spoken = text.trim();
      if (!spoken) return;

      let utterance = spoken;
      const copy0 = copyFor(currentLang());

      if (options?.viaVoice) {
        // Wake-word gate: background speech is ignored until the assistant is
        // called by name. After that, a follow-up window keeps the
        // conversation flowing without repeating the name.
        const { wake, rest } = extractWakeWord(spoken);
        // While the panel is open the patient is in a conversation, so any
        // utterance is handled without repeating the wake word.
        const panelOpen = get().isOpen;
        const withinAwakeWindow = Date.now() < awakeUntil || panelOpen;

        if (!wake && !withinAwakeWindow) {
          set({ status: get().isActive ? 'listening' : 'idle', liveTranscript: '' });
          return;
        }

        // Hearing its name surfaces the transcript and reply, even if the
        // patient was on another page with the panel closed.
        if (wake && !get().isOpen) {
          set({ isOpen: true });
        }

        if (panelOpen) {
          armAwakeWindow();
        }

        armAwakeWindow();

        if (wake && !rest) {
          const name = useAuthStore.getState().user?.name?.split(' ')[0] || '';
          await respond(copy0.wakePrompt(name));
          return;
        }

        utterance = wake ? rest : spoken;
      }

      // Barge-in: a new command interrupts whatever the assistant is saying,
      // including a streamed answer that is still being read out.
      speechToken += 1;
      if (TextToSpeechService.isSpeaking()) {
        useVoiceAssistantStore.getState().stopSpeaking();
      }

      pushUser(utterance);
      set({ status: 'thinking', error: '', liveTranscript: '' });

      const language = currentLang();
      const copy = copyFor(language);
      const command = parseVoiceCommand(utterance);
      const question = looksLikeQuestion(utterance);

      // Portal commands stay deterministic. Everything else — and any
      // question that merely mentions a page — goes to the language model.
      if (!command || (question && command.kind === 'navigate')) {
        await streamModelReply(utterance, language, copy.modelUnavailable);
        return;
      }

      if (command.kind === 'navigate') {
        const label = getPortalTranslation(language).nav.items[command.route] || copy.panelTitle;
        navigateTo?.(command.route);
        await respond(copy.openingPage(label));
        return;
      }

      switch (command.action) {
        case 'stop':
          speechToken += 1;
          useVoiceAssistantStore.getState().stopSpeaking();
          set({ status: get().isActive ? 'listening' : 'idle' });
          return;

        case 'repeat': {
          const last = get().lastReply || copy.emptyState;
          await say(last);
          return;
        }

        case 'language-en':
        case 'language-ta':
        case 'language-hi':
        case 'language-ar': {
          let target: SupportedLanguage = 'en';
          if (command.action === 'language-ta') target = 'ta';
          else if (command.action === 'language-hi') target = 'hi';
          else if (command.action === 'language-ar') target = 'ar';
          useLanguageStore.getState().setLanguage(target);
          // Recognition and speech both follow the new language; the
          // utterance is answered in that language.
          await respond(copyFor(target).languageSwitched);
          return;
        }

        case 'greeting': {
          const name = useAuthStore.getState().user?.name?.split(' ')[0] || '';
          await respond(copy.greeting(name));
          return;
        }

        case 'capabilities':
          await respond(copy.capabilities);
          return;

        case 'summary':
          await respond(await buildSummary());
          return;

        case 'appointments': {
          const { appointments } = usePatientPortalStore.getState();
          const upcoming = appointments.find((item) => item.status === 'UPCOMING');
          if (!upcoming) {
            await respond(copy.noAppointments);
            return;
          }
          await respond(
            copy.nextAppointment(upcoming.title, formatDate(upcoming.date, language), upcoming.time)
          );
          return;
        }

        case 'care-plan': {
          const { carePlan } = usePatientPortalStore.getState();
          if (carePlan.nextReview) {
            await respond(copy.carePlanStatus(carePlan.progress, formatDate(carePlan.nextReview, language)));
          } else {
            await respond(copy.carePlanNoReview(carePlan.progress));
          }
          return;
        }
      }
    }
  };
});
