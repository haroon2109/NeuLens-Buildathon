import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Download, Ear, Globe, Keyboard, Volume2 } from 'lucide-react';
import {
  ACCESSIBLE_CHECKIN_VALIDATION,
  ARABIC_FUNCTIONAL_COPY,
  INDIAN_WORD_DISTRACTORS,
  INDIAN_WORD_LIST,
  type DraftWordItem
} from './draftArabicCheckin';

type Phase = 'intro' | 'word-study' | 'word-recall' | 'functional' | 'complete';
type LanguageMode = 'ta' | 'hi' | 'en';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function speakText(text: string, lang: LanguageMode, onEnd?: () => void) {
  if (!canSpeak()) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.88;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

function speakSequence(texts: string[], lang: LanguageMode, onEnd?: () => void) {
  if (texts.length === 0) {
    onEnd?.();
    return;
  }
  const [first, ...rest] = texts;
  speakText(first, lang, () => {
    window.setTimeout(() => speakSequence(rest, lang, onEnd), 400);
  });
}

const UI_STRINGS = {
  ta: {
    badge: 'இந்திய சூழல் & கல்வி விழிப்புணர்வு சோதனைக் களம்',
    back: 'முந்தைய பக்கம்',
    switchLang: 'மொழி மாற்றம்',
    introTitle: 'எளிமையான அணுகல் பரிசோதனை (தமிழ்)',
    introDesc: 'கேமரா அல்லது மைக்ரோஃபோன் தேவையில்லை. எளிய அன்றாட வார்த்தைகளை நினைவில் வைத்து, அன்றாட பணிகள் குறித்த எளிய கேள்விகளுக்கு பதிலளிக்கவும்.',
    introPoints: [
      'அன்றாட பழக்கப்பட்ட இந்திய பொருட்கள் மற்றும் சொற்கள்',
      'அனைத்து கல்வி மற்றும் எழுத்தறிவு நிலைகளுக்கும் ஏற்ற எளிய வழிகாட்டல்',
      'திரை வாசகர் (Screen Reader), குரல் வாசிப்பு மற்றும் விசைப்பலகை ஆதரவு',
      'தனிநபர் தொடர் கண்காணிப்பு (Longitudinal Monitoring) மற்றும் சுய அடிப்படையுடன் ஒப்பீடு'
    ],
    startButton: 'பரிசோதனையைத் தொடங்கு',
    studyTitle: 'சொல் நினைவாற்றல் பயிற்சி',
    studySub: 'கீழே உள்ள எளிய சொற்களைப் படிக்கவும் அல்லது கேட்கவும். அவசரமில்லை.',
    readAloud: 'குரல் மூலம் கேட்க',
    readAgain: 'மீண்டும் கேட்க',
    readyToChoose: 'நான் தேர்ந்தெடுக்க தயார்',
    recallTitle: 'பட்டியலில் உள்ள சொற்களைத் தேர்ந்தெடுக்கவும்',
    recallSub: 'நீங்கள் பார்த்த அல்லது கேட்ட சொற்களைத் தொடவும். நேரம் கட்டுப்பாடு இல்லை.',
    confirmChoices: 'தேர்வுகளை உறுதிசெய்',
    functionalTitle: 'அன்றாட பணிகள் பற்றிய எளிய வினாக்கள்',
    functionalSub: 'வழக்கமான உங்கள் திறனுடன் ஒப்பிடுகையில் இந்த பணிகள் எவ்வாறு உள்ளன?',
    skip: 'கேள்வியைத் தவிர்க்க',
    next: 'அடுத்த பணி',
    completeTitle: 'பரிசோதனை நிறைவடைந்தது',
    completeDesc: 'உங்கள் பதில்கள் பாதுகாப்பாக பதிவு செய்யப்பட்டுள்ளன. மருத்துவர் உங்கள் தனிப்பட்ட அடிப்படை ஆரோக்கியத்துடன் (Longitudinal Baseline) இதை மதிப்பாய்வு செய்வார்.',
    downloadJson: 'பதிவை பதிவிறக்கு (JSON)',
    returnHome: 'முகப்பு பக்கத்திற்கு திரும்ப'
  },
  hi: {
    badge: 'भारतीय सांस्कृतिक एवं साक्षरता-अनुकूल मूल्यांकन',
    back: 'वापस जाएँ',
    switchLang: 'भाषा बदलें',
    introTitle: 'सुलभ भारतीय संज्ञानात्मक जांच (हिन्दी)',
    introDesc: 'कैमरा या माइक्रोफ़ोन की आवश्यकता नहीं है। परिचित दैनिक वस्तुओं के नामों को याद रखें और दैनिक कार्यों से जुड़े सरल प्रश्नों के उत्तर दें।',
    introPoints: [
      'दैनिक जीवन की जानी-पहचानी भारतीय वस्तुएं और दृश्य',
      'सभी साक्षरता स्तरों के लिए सरल और सुलभ निर्देश',
      'स्क्रीन रीडर, ऑडियो वाचन और कीबोर्ड अनुकूलता',
      'व्यक्तिगत बेसलाइन और समय के साथ स्वास्थ्य में बदलाव (Longitudinal Monitoring)'
    ],
    startButton: 'जांच शुरू करें',
    studyTitle: 'शब्द स्मरण अभ्यास',
    studySub: 'नीचे दिए गए शब्दों को पढ़ें या सुनें। कोई समय सीमा नहीं है।',
    readAloud: 'बोलकर सुनें',
    readAgain: 'पुनः सुनें',
    readyToChoose: 'मैं चुनने के लिए तैयार हूँ',
    recallTitle: 'याद किए गए शब्द चुनें',
    recallSub: 'जो शब्द आपने देखे या सुने हैं उन्हें चुनें। कोई जल्दबाजी नहीं है।',
    confirmChoices: 'विकल्पों की पुष्टि करें',
    functionalTitle: 'दैनिक गतिविधियों की सरल समीक्षा',
    functionalSub: 'अपनी सामान्य क्षमता की तुलना में ये कार्य कैसे चल रहे हैं?',
    skip: 'प्रश्न छोड़ें',
    next: 'अगला चरण',
    completeTitle: 'जांच सफलतापूर्वक पूर्ण हुई',
    completeDesc: 'आपके उत्तर सुरक्षित रूप से दर्ज कर लिए गए हैं। चिकित्सक आपके व्यक्तिगत बेसलाइन रिकॉर्ड के साथ इसकी तुलना करेंगे।',
    downloadJson: 'रिकॉर्ड डाउनलोड करें (JSON)',
    returnHome: 'मुख्य पृष्ठ पर लौटें'
  },
  en: {
    badge: 'Culturally Adapted Indian Assessment · Literacy Inclusive',
    back: 'Back to Portal',
    switchLang: 'Language',
    introTitle: 'Accessible Cognitive Check-in',
    introDesc: 'No camera or microphone required. Review everyday familiar Indian words, followed by simple questions on daily functional activities.',
    introPoints: [
      'Culturally familiar Indian stimuli (Diya, Mango, Banyan Tree, etc.)',
      'Education-aware design adaptable for all literacy and comfort levels',
      'Screen-reader compatible, spoken vernacular audio assistance, large tap targets',
      'Longitudinal tracking against personal baseline anchor (not generic one-size norms)'
    ],
    startButton: 'Start Check-in',
    studyTitle: 'Word Recall Study',
    studySub: 'Read or listen to the words below. There is no time limit.',
    readAloud: 'Listen Aloud',
    readAgain: 'Listen Again',
    readyToChoose: 'I Am Ready to Choose',
    recallTitle: 'Select Words From the List',
    recallSub: 'Tap every word you remember seeing or hearing. Take your time.',
    confirmChoices: 'Confirm Choices',
    functionalTitle: 'Daily Activities Review',
    functionalSub: 'Compared with your usual everyday baseline, how are these going?',
    skip: 'Skip Question',
    next: 'Next',
    completeTitle: 'Check-in Completed',
    completeDesc: 'Your responses have been recorded safely for longitudinal review against your personal baseline by your healthcare professional.',
    downloadJson: 'Download Record (JSON)',
    returnHome: 'Return to Patient Hub'
  }
};

const LargeButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }> = ({
  pressed,
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    className={`min-h-14 w-full rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 ${
      pressed
        ? 'border-blue-700 bg-blue-50 text-blue-900 shadow-sm'
        : 'border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:bg-slate-50'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const AccessibleIndianCheckinPage: React.FC = () => {
  const [lang, setLang] = useState<LanguageMode>('ta');
  const [phase, setPhase] = useState<Phase>('intro');
  const [statusMessage, setStatusMessage] = useState('');
  const [ttsAvailable] = useState(canSpeak());
  const [hasReadWords, setHasReadWords] = useState(false);

  const copy = UI_STRINGS[lang];
  const studyWords = useMemo(() => INDIAN_WORD_LIST, []);
  const recallOptions = useMemo(
    () => shuffle<DraftWordItem>([...INDIAN_WORD_LIST, ...INDIAN_WORD_DISTRACTORS]),
    []
  );
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [wordRecallDone, setWordRecallDone] = useState(false);

  const [functionalIndex, setFunctionalIndex] = useState(0);
  const [functionalResponses, setFunctionalResponses] = useState<Record<string, number | 'skipped'>>({});

  const [record, setRecord] = useState<any | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase, functionalIndex, wordRecallDone, lang]);

  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel();
  }, []);

  const announce = useCallback((message: string) => setStatusMessage(message), []);

  const getWordText = useCallback((item: DraftWordItem) => {
    if (lang === 'ta') return item.ta;
    if (lang === 'hi') return item.hi;
    return item.en;
  }, [lang]);

  const readStudyWords = useCallback(() => {
    setHasReadWords(true);
    const wordsToSpeak = studyWords.map((w) => getWordText(w));
    const introSpeech = lang === 'ta'
      ? 'சொற்கள் வாசிக்கப்படுகின்றன. கவனமாகக் கேளுங்கள்.'
      : lang === 'hi'
      ? 'शब्द बोले जा रहे हैं। कृपया ध्यान से सुनें।'
      : 'Reading the words. Please listen carefully.';
    announce(introSpeech);
    speakSequence([introSpeech, ...wordsToSpeak], lang, () => {
      announce(lang === 'ta' ? 'வாசிப்பு முடிந்தது.' : lang === 'hi' ? 'वाचन पूर्ण हुआ।' : 'Reading finished.');
    });
  }, [announce, getWordText, lang, studyWords]);

  const toggleWord = (id: string) => {
    setSelectedWordIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const confirmRecall = () => {
    setWordRecallDone(true);
    const studiedIds = new Set(studyWords.map((w) => w.id));
    const correct = selectedWordIds.filter((id) => studiedIds.has(id)).length;
    announce(`${correct} of ${studyWords.length} words recalled.`);
  };

  const answerFunctional = (value: number | 'skipped') => {
    const item = ARABIC_FUNCTIONAL_COPY.items[functionalIndex];
    setFunctionalResponses((current) => ({ ...current, [item.id]: value }));
    if (functionalIndex + 1 < ARABIC_FUNCTIONAL_COPY.items.length) {
      setFunctionalIndex((i) => i + 1);
    } else {
      finish({ ...functionalResponses, [item.id]: value });
    }
  };

  const finish = (finalFunctional = functionalResponses) => {
    const studiedIds = new Set(studyWords.map((w) => w.id));
    const recognised = selectedWordIds.filter((id) => studiedIds.has(id));
    const falsePositives = selectedWordIds.filter((id) => !studiedIds.has(id));
    const result = {
      pathway: ACCESSIBLE_CHECKIN_VALIDATION.pathway,
      validation: ACCESSIBLE_CHECKIN_VALIDATION,
      administration: {
        mode: 'ACCESSIBLE_NO_CAMERA_NO_MIC',
        sensoryRoute: ttsAvailable ? 'ON_SCREEN_KEYBOARD_WITH_VERNACULAR_TTS' : 'ON_SCREEN_KEYBOARD',
        cameraUsed: false,
        microphoneUsed: false,
        language: lang,
        bcp47: lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
        supervision: 'GOOGLE_ANTIGRAVITY_AGENT',
        culturalAdaptation: 'INDIAN_VERNACULAR_EVERYDAY_OBJECTS',
        completedAt: new Date().toISOString()
      },
      wordListRecall: {
        taskId: 'memory.word-list',
        studiedWordIds: studyWords.map((w) => w.id),
        selectedWordIds,
        recognisedWordIds: recognised,
        falsePositiveIds: falsePositives,
        recognisedCount: recognised.length,
        studiedCount: studyWords.length,
        scoring: 'EDUCATION_AWARE_RECORDED_COUNTS_LONGITUDINAL'
      },
      functionalCheckIn: {
        items: ARABIC_FUNCTIONAL_COPY.items.map((item) => ({
          id: item.id,
          response: finalFunctional[item.id] ?? 'skipped'
        }))
      },
      longitudinalNotice:
        'Culturally adapted Indian check-in. Results are anchored to the patient’s own personal baseline and Reliable Change Index for longitudinal tracking.'
    };
    setRecord(result);
    setPhase('complete');
  };

  const downloadRecord = () => {
    if (!record) return;
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neulens-indian-checkin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentFunctional = ARABIC_FUNCTIONAL_COPY.items[functionalIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="ltr" lang={lang}>
      <main id="main" className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <div aria-live="polite" aria-atomic="true" className="sr-only">{statusMessage}</div>

        {/* Top Controls: Back, Language Picker, Accessibility badges */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/patient"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            ← {copy.back}
          </Link>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-1">
            <Globe className="ml-2 h-4 w-4 text-slate-500" />
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                lang === 'ta' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                lang === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Accessibility Features summary */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-300">
            <Keyboard className="h-3.5 w-3.5" /> High-contrast Buttons / Keyboard
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-300">
            <Ear className="h-3.5 w-3.5" /> Screen Reader Ready
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-300">
            <Volume2 className="h-3.5 w-3.5" /> Spoken Indian Audio
          </span>
        </div>

        {/* Context Banner */}
        <div className="mb-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/80 p-4 text-emerald-950" role="note">
          <p className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            {copy.badge}
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/90">
            NeuLens culturally adapted sensor-free check-in. Designed for varied literacy backgrounds with familiar Indian everyday objects, spoken vernacular cues, and longitudinal personal baseline tracking.
          </p>
        </div>

        {phase === 'intro' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-slate-900 outline-none sm:text-3xl">
              {copy.introTitle}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-700">
              {copy.introDesc}
            </p>
            <ul className="mt-4 space-y-2 text-base text-slate-800">
              {copy.introPoints.map((pt, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => { setPhase('word-study'); announce(copy.studyTitle); }}
                className="min-h-14 rounded-2xl bg-blue-700 px-8 py-3 text-lg font-bold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                {copy.startButton} →
              </button>
            </div>
          </section>
        )}

        {phase === 'word-study' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-slate-900 outline-none">
              {copy.studyTitle}
            </h1>
            <p className="mt-1 text-base text-slate-600">{copy.studySub}</p>
            
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Word study grid">
              {studyWords.map((word) => (
                <li key={word.id} className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
                  <span className="text-2xl font-bold text-slate-900">{getWordText(word)}</span>
                  {lang !== 'en' && <span className="text-xs text-slate-500 mt-1 font-medium">{word.en}</span>}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={readStudyWords}
                disabled={!ttsAvailable}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                <Volume2 className="h-5 w-5 text-blue-600" /> {hasReadWords ? copy.readAgain : copy.readAloud}
              </button>
              <button
                type="button"
                onClick={() => { setPhase('word-recall'); announce(copy.recallTitle); }}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-blue-700 px-8 py-3 text-lg font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                {copy.readyToChoose} →
              </button>
            </div>
          </section>
        )}

        {phase === 'word-recall' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-slate-900 outline-none">
              {copy.recallTitle}
            </h1>
            <p className="mt-1 text-base text-slate-700">{copy.recallSub}</p>

            {!wordRecallDone ? (
              <>
                <fieldset className="mt-5">
                  <legend className="sr-only">Words selection</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {recallOptions.map((word) => {
                      const pressed = selectedWordIds.includes(word.id);
                      return (
                        <LargeButton key={word.id} pressed={pressed} onClick={() => toggleWord(word.id)}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="text-lg font-bold">{getWordText(word)}</div>
                              {lang !== 'en' && <div className="text-xs text-slate-500">{word.en}</div>}
                            </div>
                            {pressed && <CheckCircle2 className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" />}
                          </div>
                        </LargeButton>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={confirmRecall}
                    className="min-h-14 rounded-2xl bg-blue-700 px-8 py-3 text-lg font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                  >
                    {copy.confirmChoices}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-base text-emerald-950">
                  ✓ {lang === 'ta'
                    ? `உங்கள் தெரிவுகள் பதிவு செய்யப்பட்டன (${selectedWordIds.length} தேர்ந்தெடுக்கப்பட்டன).`
                    : lang === 'hi'
                    ? `आपके विकल्प दर्ज कर लिए गए हैं (${selectedWordIds.length} चयनित)।`
                    : `Your selections have been recorded (${selectedWordIds.length} selected).`}
                </div>
                <button
                  type="button"
                  onClick={() => { setPhase('functional'); announce(copy.functionalTitle); }}
                  className="min-h-14 rounded-2xl bg-blue-700 px-8 py-3 text-lg font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                >
                  {copy.next}: {copy.functionalTitle} →
                </button>
              </div>
            )}
          </section>
        )}

        {phase === 'functional' && currentFunctional && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-slate-900 outline-none">
              {copy.functionalTitle}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-700">{copy.functionalSub}</p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === 'ta' ? `கேள்வி ${functionalIndex + 1} / ${ARABIC_FUNCTIONAL_COPY.items.length}` :
                 lang === 'hi' ? `प्रश्न ${functionalIndex + 1} / ${ARABIC_FUNCTIONAL_COPY.items.length}` :
                 `Question ${functionalIndex + 1} of ${ARABIC_FUNCTIONAL_COPY.items.length}`}
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {lang === 'ta' ? currentFunctional.ta : lang === 'hi' ? currentFunctional.hi : currentFunctional.en}
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5">
              {ARABIC_FUNCTIONAL_COPY.options.map((option) => (
                <LargeButton key={option.value} onClick={() => answerFunctional(option.value)}>
                  {lang === 'ta' ? option.ta : lang === 'hi' ? option.hi : option.en}
                </LargeButton>
              ))}
              <button
                type="button"
                onClick={() => answerFunctional('skipped')}
                className="min-h-14 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                {copy.skip}
              </button>
            </div>
          </section>
        )}

        {phase === 'complete' && record && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-2xl font-bold text-slate-900 outline-none">
              <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" />
              {copy.completeTitle}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {copy.completeDesc}
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <dt className="font-semibold text-slate-600">Language & Cultural Stimuli</dt>
                <dd className="mt-1 font-bold text-slate-900">{lang === 'ta' ? 'தமிழ் (Tamil)' : lang === 'hi' ? 'हिन्दी (Hindi)' : 'English (India)'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <dt className="font-semibold text-slate-600">Cognitive Metric Mode</dt>
                <dd className="mt-1 font-bold text-slate-900">Personal Longitudinal Baseline Anchor</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <dt className="font-semibold text-slate-600">Word Recall Recognition</dt>
                <dd className="mt-1 font-bold text-slate-900">{record.wordListRecall.recognisedCount} of {record.wordListRecall.studiedCount} identified</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <dt className="font-semibold text-slate-600">Activities Completed</dt>
                <dd className="mt-1 font-bold text-slate-900">{record.functionalCheckIn.items.filter((i: any) => i.response !== 'skipped').length} of 4</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadRecord}
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-base font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                <Download className="h-5 w-5" /> {copy.downloadJson}
              </button>
              <Link
                to="/patient"
                className="inline-flex min-h-14 items-center rounded-2xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                {copy.returnHome}
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export { AccessibleIndianCheckinPage as AccessibleArabicCheckinPage };
export default AccessibleIndianCheckinPage;
