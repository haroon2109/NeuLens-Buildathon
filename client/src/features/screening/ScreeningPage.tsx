import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScreeningStore, ScreeningStep } from '../../store/screeningStore';
import { useFaceTrackingStore } from '../../store/faceTrackingStore';
import { useFaceLandmarker } from '../../hooks/useFaceLandmarker';
import { useOcularSession } from './ocular/useOcularSession';
import { OcularCalibrationOverlay } from './ocular/OcularCalibrationOverlay';
import { useBehaviouralSession, behaviourReasonText } from './facial/useBehaviouralSession';
import { qualityReasonText } from './ocular/signalQuality';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Timer as TimerIcon, 
  Trophy, 
  Volume2, 
  Mic, 
  Sparkles, 
  Smile, 
  Video, 
  Heart, 
  Flame, 
  Sparkle,
  CheckCircle,
  HelpCircle,
  Play,
  Activity,
  Cpu,
  Loader2,
  Brain,
  Languages
} from 'lucide-react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { useScreeningCopy } from './screeningCopy';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { SpeechRecognitionService } from '../../services/voice/SpeechRecognitionService';
import { createAcousticCapture, type AcousticCapture, type BrowserAcousticSummary } from '../../services/voice/acousticCapture';
import { gnaniVoiceApi } from '../../services/voice/gnaniVoiceApi';
import { queryClient } from '../../lib/queryClient';
import { patientOverviewQueryKey } from '../patient/portal/usePatientOverview';
import { VoiceAssistantAvatar } from '../../components/voice/VoiceAssistantAvatar';
import { SpokenInstructionBanner } from '../../components/voice/SpokenInstructionBanner';
import { ElderlyLanguageSelector } from '../../components/voice/ElderlyLanguageSelector';
import { LanguageSelectorModal } from '../../components/voice/LanguageSelectorModal';
import { SensorCheckStage } from '../../components/voice/SensorCheckStage';
import { ResultVoiceExplainer } from '../../components/voice/ResultVoiceExplainer';
import { patientApi } from '../../services/portalApi';
import { useAuthStore } from '../../store/authStore';
import { AssessmentUnavailableState, PermissionDeniedState } from '../../components/systemStates';
import { ElderCareMascot } from '../../components/ElderCareMascot';
import { BrainHealthPathway } from '../../components/BrainHealthPathway';
import { PianoSequenceTask } from './PianoSequenceTask';
import { AdaptivePracticeGames } from './AdaptivePracticeGames';

export interface ScreeningPageProps {
  patientMode?: boolean;
  targetPatientId?: string;
}

export const ScreeningPage: React.FC<ScreeningPageProps> = ({ patientMode = false, targetPatientId }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentStep, setStep, saveResponse, scores, calculateFinalScores, resetSession } = useScreeningStore();
  const { currentLanguage, getTranslation } = useLanguageStore();
  const t = getTranslation();
  // Wording for the activities themselves, in the participant's language.
  const copy = useScreeningCopy();
  const qualityLevelLabel = (level: 'good' | 'fair' | 'poor') =>
    level === 'good' ? copy.sensor.levelGood : level === 'fair' ? copy.sensor.levelFair : copy.sensor.levelPoor;
  const { 
    speak, 
    stopSpeaking,
    repeatInstruction, 
    provideSimplerExplanation, 
    triggerContextCue, 
    startVoiceControl, 
    stopVoiceControl 
  } = useVoiceAssistantStore();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Microphone and audio tracking refs
  const micStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micCanvasRef = useRef<HTMLCanvasElement>(null);
  const micTimer = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const acousticCaptureRef = useRef<AcousticCapture | null>(null);

  // Invoke the MediaPipe and webcam hook
  useFaceLandmarker(videoRef, canvasRef);

  const { cameraStatus, cameraPermission, errorMessage, metrics } = useFaceTrackingStore();
  const isGameStep = currentStep.startsWith('game');
  // Browsers without media APIs (or in-app webviews) cannot run the sensor activities.
  const mediaUnsupported = typeof navigator !== 'undefined' && !navigator.mediaDevices;

  // Local Timers and Scores
  const [gameTimer, setGameTimer] = useState(30.0);
  const [gameScore, setGameScore] = useState(0);
  const [game1Finished, setGame1Finished] = useState(false);
  // Calibration runs first, then the timed target-following activity.
  const [ocularPhase, setOcularPhase] = useState<'calibration' | 'activity'>('calibration');
  const [functionalResponses, setFunctionalResponses] = useState<Record<string, number>>({});
  const [accessibilityResponses, setAccessibilityResponses] = useState<Record<string, number>>({});
  const [contextFactorResponses, setContextFactorResponses] = useState<Record<string, number>>({});
  const [externalContextConsent, setExternalContextConsent] = useState(false);
  const timerRef = useRef<any | null>(null);

  // AI Analysis sequence states
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<any>(null);
  const analysisStatements = [
    'Analyzing Eye Movement...',
    'Analyzing Speech...',
    'Analyzing Facial Dynamics...',
    'Combining Biomarkers...',
    'Generating safety profile...'
  ];

  const submitAssessment = useCallback(async () => {
    const state = useScreeningStore.getState();
    const compScore = state.scores.compositeScore;

    // A session that did not produce a complete, interpretable score is not
    // submitted. The previous behaviour fell back to 84 and labelled the result
    // LOW risk; that presented a comfortable number for a battery that was not
    // actually completed.
    if (typeof compScore !== 'number' || !Number.isFinite(compScore)) {
      setIsSavingAssessment(false);
      // Name the activities that produced nothing, so the participant knows what
      // to retry instead of being told vaguely that something was incomplete.
      const activityLabels: Record<string, string> = {
        game1: 'moving circle',
        game2: 'card matching',
        game3: 'spoken repeat',
        game4: 'facial movement',
        game5: 'connecting numbers',
        pianoSequence: 'sequence memory',
        game6: 'sequence memory'
      };
      const missing = Object.entries(activityLabels)
        .filter(([key]) => typeof state.rawResponses[key]?.score !== 'number')
        .map(([, label]) => label);
      const uniqueMissing = Array.from(new Set(missing));
      setSubmissionError(
        `No score can be calculated because these activities produced no measurement: ${
          uniqueMissing.length ? uniqueMissing.join(', ') : 'the full battery'
        }. Nothing has been submitted. A missed activity is recorded as not measured rather than filled in, so the assessment has to be repeated to be interpretable.`
      );
      return;
    }

    setIsSavingAssessment(true);
    setSubmissionError(null);
    try {
      const metrics = state.biometricMetrics;
      const pauseCount = metrics?.speech.pauseCount;
      const smileIntensity = metrics?.face.smileIntensity;
      const result = await patientApi.submitAssessmentComplete({
        patientId: targetPatientId,
        // Administration language and whether the participant was told what is
        // unverified in that language. The server re-checks readiness itself and
        // refuses an unacknowledged non-ready language with a 422.
        language: state.languagePreference?.language || currentLanguage,
        languageAcknowledged: state.languagePreference?.acknowledged === true,
        // No score is sent: the server derives it from taskResponses. A client
        // that claims a score gets a 400, which is the point.
        // Unrecorded measurements are sent as null; the server never invents them.
        reactionTime: metrics?.eye.reactionTimes[0] ?? null,
        blinkRate: metrics?.eye.blinkCount ?? null,
        fixationScore: metrics?.eye.fixationStability ?? null,
        speechRate: metrics?.speech.speechRate ?? null,
        // Derived from the recorded pause count; no floor, because a floor would
        // report a minimum "acceptable" value that was never measured.
        pauseScore: pauseCount != null ? Math.max(0, Math.min(100, 100 - pauseCount * 10)) : null,
        jitter: metrics?.speech.jitter ?? null,
        shimmer: metrics?.speech.shimmer ?? null,
        symmetry: metrics?.face.stability ?? null,
        tremorScore: smileIntensity != null ? 100 - smileIntensity : null,
        taskResponses: state.rawResponses,
        recommendation: 'Hospital cognitive screening completed. Attending physician review pending.'
      });

      setCompletionResult(result);

      // A new assessment changes the portal overview and every clinician view of it.
      void queryClient.invalidateQueries({ queryKey: patientOverviewQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'patient'] });

      const isPatientPortal = patientMode || window.location.pathname.includes('/patient');
      if (isPatientPortal) {
        // Signed-in patients continue inside the portal; guest assessments see the ID slip.
        navigate(user?.role === 'PATIENT' ? '/patient/assessment/submitted' : '/patient/assessment/complete');
      } else {
        setStep('results');
      }
    } catch (error) {
      console.error('[ScreeningPage]: Failed to save assessment:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Unable to save this assessment. Please retry.');
    } finally {
      setIsSavingAssessment(false);
    }
  }, [currentLanguage, navigate, patientMode, setStep, targetPatientId, user?.role]);

  // Stop/Start global timer
  const startTimer = (limit = 30.0) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameTimer(limit);
    timerRef.current = setInterval(() => {
      setGameTimer((prev) => {
        if (prev <= 0.05) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeOut = () => {
    if (currentStep === 'game1') handleNextGame1(true);
    else if (currentStep === 'game2') handleNextGame2(true);
    else if (currentStep === 'game3') handleNextGame3(true);
    else if (currentStep === 'game4') handleNextGame4(true);
    else if (currentStep === 'game5') handleNextGame5(true);
  };

  // Step-based spoken guidance & voice listener management
  useEffect(() => {
    stopTimer();

    if (currentStep === 'intro') {
      speak(t.intro.spokenIntro);
    } else if (currentStep === 'game1') {
      speak(t.game1.spokenIntro);
      startVoiceControl();
    } else if (currentStep === 'game2') {
      speak(t.game2.spokenIntro);
      startVoiceControl();
    } else if (currentStep === 'game3') {
      speak(t.game3.spokenIntro);
      stopVoiceControl(); // Voice recognition paused to not interfere with audio recording
    } else if (currentStep === 'game4') {
      speak(t.game4.spokenIntro);
      startVoiceControl();
    } else if (currentStep === 'game5') {
      speak(t.game5.spokenIntro);
      startVoiceControl();
    } else if (currentStep === 'functional-assessment') {
      stopVoiceControl();
    } else if (currentStep === 'submitting') {
      speak(t.submitting.spokenSubmitting);
      stopVoiceControl();
    }

    return () => {
      stopTimer();
      stopSpeaking();
    };
  }, [currentStep, currentLanguage]);

  // Context-aware dynamic guidance reacting to live sensor metrics
  useEffect(() => {
    if (currentStep === 'game1' && !game1Finished) {
      if (metrics.headPose && (Math.abs(metrics.headPose.yaw) > 25 || Math.abs(metrics.headPose.pitch) > 22)) {
        triggerContextCue('face_not_centered');
      } else if (metrics.stability < 30 || metrics.gaze === 'Unknown') {
        triggerContextCue('look_at_screen');
      }
    }
  }, [currentStep, metrics.headPose?.yaw, metrics.headPose?.pitch, metrics.stability, metrics.gaze, game1Finished]);

  // AI Analysis timer trigger & database persistence
  useEffect(() => {
    if (currentStep === 'submitting') {
      setAnalysisStep(0);
      setSubmissionError(null);
      let step = 0;
      const analysisInterval = setInterval(() => {
        step += 1;
        setAnalysisStep(Math.min(step, analysisStatements.length - 1));
        if (step >= analysisStatements.length) {
          clearInterval(analysisInterval);
          calculateFinalScores();
          void submitAssessment();
        }
      }, 1200); // 1.2s per stage (6.0s total)
      return () => clearInterval(analysisInterval);
    }
  }, [currentStep, calculateFinalScores, submitAssessment]);

  // -------------------------------------------------------------
  // GAME 1: Focus Orbit (Moving Dot)
  // -------------------------------------------------------------
  const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
  const [dotClicks, setDotClicks] = useState(0);
  const [dotReactionTimes, setDotReactionTimes] = useState<number[]>([]);
  const lastDotMoveTime = useRef<number>(Date.now());

  // Eye tracking fixation state
  const [focusProgress, setFocusProgress] = useState(0);
  const [game1ScoreDetails, setGame1ScoreDetails] = useState<{
    avgReaction: number;
    // Null when no camera was active: fixation was not measured, so it is not
    // averaged into the activity score.
    fixationStability: number | null;
    trackingAccuracy: number;
    score: number;
  } | null>(null);

  // Session-level eye measurements for the activity (gaze, fixations, blinks, quality).
  const { liveQuality, getSummary } = useOcularSession({
    videoRef,
    active: currentStep === 'game1' && ocularPhase === 'activity' && !game1Finished,
  });

  const initGame1 = () => {
    setDotClicks(0);
    setDotReactionTimes([]);
    setFocusProgress(0);
    setGame1Finished(false);
    setGame1ScoreDetails(null);
    setDotPos({ x: 25 + Math.random() * 50, y: 25 + Math.random() * 50 });
    lastDotMoveTime.current = Date.now();
    // The 30s timer starts only after calibration, so setup time is not counted.
    setOcularPhase('calibration');
    stopTimer();
  };

  const handleCalibrationComplete = () => {
    setOcularPhase('activity');
    startTimer(30.0);
  };

  const handleTargetLocked = () => {
    const elapsed = Date.now() - lastDotMoveTime.current;
    const newTimes = [...dotReactionTimes, elapsed];
    setDotReactionTimes(newTimes);

    const nextClicks = dotClicks + 1;
    setDotClicks(nextClicks);

    if (nextClicks >= 5) {
      stopTimer();
      speak(t.contextual.taskCompleted);
      const avgReaction = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      // Accuracy is derived only from the recorded reaction times. The old formula
      // floored it at 70, so a slow performance was reported as a normal one.
      const trackingAccuracy = Math.max(0, Math.min(100, Math.round(100 - (avgReaction - 350) / 12)));
      // Fixation needs a camera. Without one there is no eye measurement at all,
      // so it stays null rather than being replaced by a zero (which would drag
      // the score down) or a placeholder (which would invent it).
      const fixationStability = cameraStatus === 'active' ? Math.round(metrics.stability) : null;
      const finalG1Score = fixationStability === null
        ? trackingAccuracy
        : Math.round((trackingAccuracy + fixationStability) / 2);

      saveResponse('game1', {
        score: finalG1Score,
        reactionTimes: newTimes,
        fixationStability,
        trackingAccuracy,
        ocularSummary: getSummary(),
      });

      setGame1ScoreDetails({
        avgReaction: Math.round(avgReaction),
        fixationStability,
        trackingAccuracy,
        score: finalG1Score
      });
      setGame1Finished(true);
    } else {
      setDotPos({
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70
      });
      lastDotMoveTime.current = Date.now();
      setFocusProgress(0);
    }
  };

  const handleDotClick = () => {
    handleTargetLocked();
  };

  // Real-time gaze check loop for target dotPos
  useEffect(() => {
    if (currentStep !== 'game1' || game1Finished || !metrics.screenGaze) return;

    const gaze = metrics.screenGaze;
    const dx = gaze.x - dotPos.x;
    const dy = gaze.y - dotPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If estimated screen gaze is within 22% distance of target dot
    const TARGET_RADIUS = 22;
    if (distance < TARGET_RADIUS) {
      setFocusProgress((prev) => {
        const next = prev + 8; // charging rate
        if (next >= 100) {
          handleTargetLocked();
          return 0;
        }
        return next;
      });
    } else {
      setFocusProgress((prev) => Math.max(0, prev - 4)); // discharge focus
    }
  }, [metrics.screenGaze, currentStep, dotPos, game1Finished]);

  /**
   * Leaving an activity before it produced a measurement records no score.
   * The old fallbacks (50 on timeout, 80 on skip) wrote a plausible normal value
   * for an activity the participant never actually completed.
   */
  const handleNextGame1 = (isTimeout = false) => {
    stopTimer();
    saveResponse('game1', {
      score: null,
      notMeasured: isTimeout ? 'TIME_LIMIT' : 'SKIPPED',
      reactionTimes: dotReactionTimes,
      ocularSummary: getSummary(),
    });
    setStep('game2');
  };

  // -------------------------------------------------------------
  // GAME 2: Cortex Match (Memory Match - Culturally Adapted)
  // -------------------------------------------------------------
  // Culturally familiar Indian symbols: Diya (🪔), Mango (🥭), Peacock (🦚), Lotus (🪷)
  // Universally recognized regardless of education/literacy level.
  const memoryIcons = ['🪔', '🥭', '🦚', '🪷'];
  interface Card {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [mismatches, setMismatches] = useState(0);

  const initGame2 = () => {
    const deck = [...memoryIcons, ...memoryIcons]
      .map((icon, idx) => ({ id: idx, icon, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelectedCards([]);
    setMismatches(0);
    startTimer(30.0);
  };

  const handleCardClick = (id: number) => {
    if (selectedCards.length >= 2 || cards[id].isMatched || cards[id].isFlipped) return;

    const updatedCards = [...cards];
    updatedCards[id].isFlipped = true;
    setCards(updatedCards);

    const nextSelection = [...selectedCards, id];
    setSelectedCards(nextSelection);

    if (nextSelection.length === 2) {
      const [firstIdx, secondIdx] = nextSelection;
      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        setTimeout(() => {
          const matchedDeck = cards.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return { ...c, isMatched: true };
            }
            return c;
          });
          setCards(matchedDeck);
          setSelectedCards([]);

          if (matchedDeck.every(c => c.isMatched)) {
            stopTimer();
            speak(t.contextual.taskCompleted);
            const score = Math.max(0, Math.min(100, 100 - mismatches * 8));
            saveResponse('game2', { score, mismatches });
            setStep('game3');
          }
        }, 600);
      } else {
        setMismatches(prev => {
          const next = prev + 1;
          if (next === 4) {
            triggerContextCue('takeYourTime');
          }
          return next;
        });
        setTimeout(() => {
          const closedDeck = cards.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          setCards(closedDeck);
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const handleNextGame2 = (isTimeout = false) => {
    stopTimer();
    saveResponse('game2', {
      score: null,
      notMeasured: isTimeout ? 'TIME_LIMIT' : 'SKIPPED',
      mismatches,
    });
    setStep('game3');
  };

  // -------------------------------------------------------------
  // GAME 3: Vocal Echo (Repeat Sentence)
  // -------------------------------------------------------------
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [permissionNoticeDismissed, setPermissionNoticeDismissed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<string[]>([]);
  const [voiceComplete, setVoiceComplete] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzingArabic, setIsAnalyzingArabic] = useState(false);

  // Live mic timer & audio parameters
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioParams, setAudioParams] = useState<{
    speechRate: number | null; // words per minute, only with a transcript
    syllableRate: number | null;
    pitch: number | null;
    jitter: number | null;
    shimmer: number | null;
    pauseCount: number;
    duration: number;
    responseLatencyMs: number | null;
    speechAccuracy: number | null;
  } | null>(null);
  const [voiceQuality, setVoiceQuality] = useState<{ level: 'good' | 'fair' | 'poor'; summary: string } | null>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const voiceSummaryRef = useRef<Record<string, unknown> | null>(null);
  // When the prompt appeared, so response latency covers thinking time too.
  const promptShownAtRef = useRef<number | null>(null);

  const getTargetSentence = () => {
    switch (currentLanguage) {
      case 'ta':
        // Culturally adapted Indian everyday scenario (Banyan tree & lotus pond)
        return 'காலை வெயில் ஆலமரத்தின் மீதும் தாமரைக் குளத்தின் மீதும் பிரகாசிக்கிறது.';
      case 'hi':
        // Culturally adapted Indian everyday scenario (Morning market, fresh mangoes and flowers)
        return 'सुबह की खिली धूप में हम बाज़ार से ताज़े आम और सुंदर फूल लाए।';
      case 'te':
        return 'ఉదయపు ఎండ మర్రిచెట్టు మరియు కమలం చెరువుపై ప్రకాశిస్తోంది.';
      case 'ml':
        return 'രാവിലെത്തെ വെയിൽ ആൽമരത്തിലും താമരക്കുളത്തിലും തിളങ്ങുന്നു.';
      case 'kn':
        return 'ಬೆಳಗಿನ ಬಿಸಿಲು ಆಲದ ಮರ ಮತ್ತು ಕಮಲದ ಕೊಳದ ಮೇಲೆ ಹೊಳೆಯುತ್ತದೆ.';
      default:
        // Everyday Indian English phrasing avoiding alienating clinical jargon
        return 'The morning sun shines warm over the banyan tree and the garden pond.';
    }
  };

  const initGame3 = () => {
    setIsRecording(false);
    setVoiceLogs([]);
    setVoiceComplete(false);
    setRecordedTranscript('');
    setIsTranscribing(false);
    setRecordDuration(0);
    setAudioParams(null);
    setVoiceQuality(null);
    setIsAnalyzingVoice(false);
    voiceSummaryRef.current = null;
    promptShownAtRef.current = Date.now();
    startTimer(35.0); // 35s limit
  };

  const startWaveformAnimation = (analyser: AnalyserNode) => {
    const canvas = micCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return; // stops animation loop when mic stops
      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      // Glowing purple-blue visual gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#af52de');
      gradient.addColorStop(1, '#007aff');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  /**
   * Send the clip for transcription and acoustic analysis.
   *
   * Transcription is optional: when it is unavailable the acoustic features
   * are still measured, only task-specific word accuracy is left empty.
   */
  const finalizeSpeechAnalysis = async (
    blob: Blob,
    browserSummary: BrowserAcousticSummary | null,
    responseLatencyMs: number | null
  ) => {
    setIsTranscribing(true);
    setIsAnalyzingVoice(true);
    setVoiceLogs(prev => [
      ...prev,
      `[Acoustic Service]: Analysing ${(blob.size / 1024).toFixed(1)} KB clip...`
    ]);

    let transcript = '';
    try {
      const stt = await SpeechRecognitionService.transcribeClip(blob, currentLanguage);
      if (stt.success && stt.transcript) {
        transcript = stt.transcript;
        setRecordedTranscript(transcript);
        setVoiceLogs(prev => [...prev, `[Google AI Speech (Chirp 2 / Gemini)]: Transcript received: "${transcript}"`]);
      } else {
        setVoiceLogs(prev => [...prev, '[Google AI Speech]: No transcript available; word accuracy is left empty.']);
      }
    } catch (err: any) {
      setVoiceLogs(prev => [...prev, `[Google AI Speech]: Unavailable (${err?.message || 'offline'}).`]);
    }

    const analysis = await gnaniVoiceApi.analyzeAcoustics(blob, {
      transcript: transcript || undefined,
      targetText: getTargetSentence(),
      responseLatencyMs: responseLatencyMs ?? undefined,
      language: currentLanguage
    });

    setIsTranscribing(false);
    setIsAnalyzingVoice(false);

    if (!analysis) {
      setVoiceLogs(prev => [
        ...prev,
        '[Acoustic Service]: Server analysis unavailable; browser measurements are being used.'
      ]);
      return;
    }

    const m = analysis.metrics;
    setAudioParams({
      speechRate: m.speech_rate_words_per_minute,
      syllableRate: m.speech_rate_syllables_per_minute ?? browserSummary?.speechRate ?? null,
      pitch: m.pitch_mean_hz ?? browserSummary?.pitchMeanHz ?? null,
      jitter: m.jitter_percent,
      shimmer: m.shimmer_percent,
      pauseCount: m.pause_count,
      duration: m.duration_seconds,
      responseLatencyMs: m.response_latency_ms ?? responseLatencyMs,
      speechAccuracy: m.speech_accuracy_percent
    });
    setVoiceQuality({ level: m.quality.level, summary: m.quality.summary });
    voiceSummaryRef.current = { source: 'server', ...m };
    setVoiceLogs(prev => [
      ...prev,
      `[Acoustic Service]: VAD ${m.vad}; speech ${m.speech_duration_seconds}s; pitch ${m.pitch_mean_hz ?? '—'} Hz; jitter ${m.jitter_percent ?? '—'}%; shimmer ${m.shimmer_percent ?? '—'}%.`
    ]);
  };

  const handleRecordToggle = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.current = stream;

        // Setup Web Audio Analyser
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        // 2048 samples (~43 ms at 48 kHz) is enough for autocorrelation pitch
        // and still fine for the waveform drawing loop.
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        acousticCaptureRef.current = createAcousticCapture(analyser, audioContext.sampleRate);

        // Start Recording
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorder.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
        };
        recorder.start(250); // Slice chunks every 250ms

        setIsRecording(true);
        setRecordDuration(0);
        setAudioParams(null);
        setVoiceComplete(false);
        setRecordedTranscript('');
        setIsTranscribing(false);
        setVoiceLogs([
          '[Microphone]: Permission granted. Capturing raw audio stream...',
          '[Web Audio]: Initializing real-time AnalyserNode...',
          '[Audio Engine]: Processing voice activity features...'
        ]);

        const startTime = Date.now();
        micTimer.current = setInterval(() => {
          setRecordDuration(Number(((Date.now() - startTime) / 1000).toFixed(1)));
        }, 100);

        startWaveformAnimation(analyser);

      } catch (err: any) {
        console.error("Microphone access denied:", err);
        // Shown as a screen state rather than a browser alert so it stays visible
        // alongside the activity and can be retried.
        setMicPermissionDenied(true);
        setPermissionNoticeDismissed(false);
      }
    } else {
      // Stop duration timer
      if (micTimer.current) {
        clearInterval(micTimer.current);
        micTimer.current = null;
      }

      // Stop MediaRecorder
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }

      // Stop stream tracks
      if (micStream.current) {
        micStream.current.getTracks().forEach(track => track.stop());
        micStream.current = null;
      }

      // Close AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      
      analyserRef.current = null;

      const capture = acousticCaptureRef.current;
      const recordingStartedAt = capture?.startedAtEpochMs ?? Date.now();
      const browserSummary: BrowserAcousticSummary | null = capture ? capture.stop() : null;
      acousticCaptureRef.current = null;

      setIsRecording(false);

      if (recordDuration >= 1.0) {
        const recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const responseLatencyMs =
          browserSummary?.speechOnsetMs != null && promptShownAtRef.current != null
            ? Math.max(0, Math.round(recordingStartedAt + browserSummary.speechOnsetMs - promptShownAtRef.current))
            : null;

        // Browser measurements appear immediately; the server pass below
        // replaces them with Praat/librosa values when it is available.
        setAudioParams({
          speechRate: null,
          syllableRate: browserSummary?.speechRate ?? null,
          pitch: browserSummary?.pitchMeanHz ?? null,
          jitter: null,
          shimmer: null,
          pauseCount: browserSummary?.pauseCount ?? 0,
          duration: browserSummary?.durationSeconds ?? recordDuration,
          responseLatencyMs,
          speechAccuracy: null
        });
        setVoiceQuality(
          browserSummary
            ? { level: browserSummary.quality, summary: 'Measured in the browser; server analysis refines these values.' }
            : null
        );
        voiceSummaryRef.current = browserSummary
          ? { source: 'browser', responseLatencyMs, ...browserSummary }
          : { source: 'browser', responseLatencyMs };
        setVoiceLogs(prev => [
          ...prev,
          `[Voice Analyzer]: Recording completed (${recordDuration}s)`,
          '[Web Audio]: Timing, intensity and pitch captured at the edge.'
        ]);
        setVoiceComplete(true);
        speak(t.contextual.taskCompleted);

        if (recordedBlob.size > 0) {
          void finalizeSpeechAnalysis(recordedBlob, browserSummary, responseLatencyMs);
        }
      } else {
        speak(t.contextual.speakLouder);
        setVoiceLogs([
          '[Audio Engine]: Recording was too short. Please speak for at least 1 second.'
        ]);
      }
    }
  };

  const handleNextGame3 = (isTimeout = false) => {
    stopTimer();
    // The previous value (60 on timeout, 88 otherwise) was unrelated to what the
    // participant said. The only defensible score is the server-measured word
    // accuracy of the recording; with no recording there is no score.
    const score = audioParams?.speechAccuracy ?? null;
    
    // Store locally in response store (preserving acoustic metrics while saving transcript)
    saveResponse('game3', {
      score,
      notMeasured: score === null
        ? (micPermissionDenied ? 'MICROPHONE_UNAVAILABLE' : isTimeout ? 'TIME_LIMIT' : 'NO_RECORDING')
        : undefined,
      transcript: recordedTranscript,
      logs: voiceLogs,
      speechRate: audioParams?.speechRate,
      speechRateSyllablesPerMinute: audioParams?.syllableRate,
      pitch: audioParams?.pitch,
      jitter: audioParams?.jitter,
      shimmer: audioParams?.shimmer,
      pauseCount: audioParams?.pauseCount ?? 0,
      duration: audioParams?.duration ?? recordDuration,
      responseLatencyMs: audioParams?.responseLatencyMs ?? null,
      speechAccuracy: audioParams?.speechAccuracy ?? null,
      voiceQuality,
      voiceSummary: voiceSummaryRef.current
    });
    setStep('game4');
  };

  // Arabic transcript analysis (research-stage model inference)
  const analyzeArabicArabicTranscript = async () => {
    if (isAnalyzingArabic) return;
    setIsAnalyzingArabic(true);
    try {
      const result = await patientApi.analyzeArabic(recordedTranscript, 'ARABERT');
      // Handle result UI – show disclaimer that output is exploratory
      console.log('Arabic LLM result:', result);
      // You could additionally display result.sentiment, result.keyPhrases, etc.
    } catch (err) {
      console.error('Arabic analysis error:', err);
    } finally {
      setIsAnalyzingArabic(false);
    }
  };

  // -------------------------------------------------------------
  // GAME 4: Mimic Sync (Facial Task)
  // -------------------------------------------------------------
  const facialPrompts = copy.game4.expressions;
  const [facialIdx, setFacialIdx] = useState(0);
  const [isTrackingFace, setIsTrackingFace] = useState(false);

  // Task-related response timing for the behavioural summary.
  const expressionPromptAtRef = useRef<number | null>(null);
  const expressionAnsweredRef = useRef(false);
  const expressionLatenciesRef = useRef<number[]>([]);
  const { liveQuality: facialQuality, getSummary: getBehaviourSummary } = useBehaviouralSession({
    active: currentStep === 'game4' && isTrackingFace,
  });

  const currentPromptKey = facialPrompts[facialIdx]?.key;
  let currentGestureValue = 0;
  if (currentPromptKey === 'smile') {
    currentGestureValue = metrics.smile;
  } else if (currentPromptKey === 'relax') {
    const activeSum = metrics.smile + metrics.blinkIntensity + metrics.jawMovement + metrics.eyebrows;
    currentGestureValue = Math.max(0, Math.min(100, Math.round(100 - activeSum / 3)));
  } else if (currentPromptKey === 'blink') {
    currentGestureValue = metrics.blinkIntensity;
  } else if (currentPromptKey === 'mouth') {
    currentGestureValue = metrics.jawMovement;
  }

  const initGame4 = () => {
    setFacialIdx(0);
    setIsTrackingFace(true);
    expressionPromptAtRef.current = Date.now();
    expressionAnsweredRef.current = false;
    expressionLatenciesRef.current = [];
    startTimer(35.0); // 35s total limit
  };

  const handleNextGesture = () => {
    const nextIdx = facialIdx + 1;
    if (nextIdx < facialPrompts.length) {
      setFacialIdx(nextIdx);
      expressionPromptAtRef.current = Date.now();
      expressionAnsweredRef.current = false;
      speak(facialPrompts[nextIdx].prompt);
    } else {
      stopTimer();
      speak(t.contextual.taskCompleted);
      saveResponse('game4', {
        score: Math.round(metrics.stability),
        smileIntensity: Math.round(metrics.smile),
        jawOpening: Math.round(metrics.jawMovement),
        eyebrowsRaising: Math.round(metrics.eyebrows),
        stability: Math.round(metrics.stability),
        headPose: metrics.headPose,
        behaviourSummary: getBehaviourSummary(expressionLatenciesRef.current)
      });
      setStep('game5');
    }
  };

  // Auto-advance loop on successful gesture hold
  useEffect(() => {
    if (currentStep !== 'game4') return;

    const threshold = currentPromptKey === 'relax' ? 85 : 65;
    if (currentGestureValue >= threshold) {
      if (!expressionAnsweredRef.current && expressionPromptAtRef.current != null) {
        expressionAnsweredRef.current = true;
        expressionLatenciesRef.current.push(
          Math.max(0, Date.now() - expressionPromptAtRef.current)
        );
      }
      const timer = setTimeout(() => {
        handleNextGesture();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentGestureValue, currentStep, currentPromptKey, facialIdx]);

  const handleNextGame4 = (isTimeout = false) => {
    stopTimer();
    // 85/60 were invented constants: the activity either produced recorded facial
    // movement or it did not. Not producing a measurement means no score.
    saveResponse('game4', {
      score: null,
      notMeasured: isTimeout
        ? 'TIME_LIMIT'
        : cameraStatus === 'active' ? 'SKIPPED' : 'CAMERA_UNAVAILABLE',
      smileIntensity: Math.round(metrics.smile),
      jawOpening: Math.round(metrics.jawMovement),
      eyebrowsRaising: Math.round(metrics.eyebrows),
      stability: Math.round(metrics.stability),
      headPose: metrics.headPose,
      behaviourSummary: getBehaviourSummary(expressionLatenciesRef.current)
    });
    setStep('game5');
  };

  // -------------------------------------------------------------
  // GAME 5: Path Mapper (Trail Making Test)
  // -------------------------------------------------------------
  interface Node {
    id: number;
    x: number;
    y: number;
    isMatched: boolean;
  }
  const [nodes, setNodes] = useState<Node[]>([]);
  const [expectedNode, setExpectedNode] = useState(1);
  const [trailErrors, setTrailErrors] = useState(0);

  const initGame5 = () => {
    const points = [
      { id: 1, x: 20, y: 30 },
      { id: 2, x: 70, y: 20 },
      { id: 3, x: 80, y: 70 },
      { id: 4, x: 30, y: 80 },
      { id: 5, x: 50, y: 50 },
      { id: 6, x: 15, y: 60 }
    ].sort(() => Math.random() - 0.5);
    
    setNodes(points.map(p => ({ ...p, isMatched: false })));
    setExpectedNode(1);
    setTrailErrors(0);
    startTimer(30.0);
  };

  const handleNodeClick = (node: Node) => {
    if (node.isMatched) return;

    if (node.id === expectedNode) {
      const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, isMatched: true } : n);
      setNodes(updatedNodes);
      
      const nextExpected = expectedNode + 1;
      setExpectedNode(nextExpected);

      if (nextExpected > 6) {
        stopTimer();
        speak(t.contextual.taskCompleted);
        const score = Math.max(0, Math.min(100, 100 - trailErrors * 12));
        saveResponse('game5', { score, errors: trailErrors });
        setStep('submitting');
      }
    } else {
      // A wrong selection is an error, not the end of the activity. Keep the
      // user in the trail-making task and let the timer (or completion) decide
      // when to move on.
      setTrailErrors(prev => prev + 1);
      triggerContextCue('inactivity_repeat');
      const flashEl = document.getElementById('game-trail-box');
      if (flashEl) {
        flashEl.classList.add('border-health-red', 'bg-red-950', 'bg-opacity-10');
        setTimeout(() => {
          flashEl.classList.remove('border-health-red', 'bg-red-950', 'bg-opacity-10');
        }, 200);
      }
    }
  };

  const handleNextGame5 = (isTimeout = false) => {
    stopTimer();
    saveResponse('game5', {
      score: null,
      notMeasured: isTimeout ? 'TIME_LIMIT' : 'SKIPPED',
      errors: trailErrors,
    });
    setStep('submitting');
  };

  // Keyboard equivalent for the trail-making activity: pressing the number of the
  // next circle does the same thing as tapping it, so the activity does not demand
  // fine pointing accuracy. Announced in the live region above.
  useEffect(() => {
    if (currentStep !== 'game5') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!/^[1-6]$/.test(event.key)) return;
      const node = nodes.find((item) => item.id === Number(event.key));
      if (!node || node.isMatched) return;
      event.preventDefault();
      handleNodeClick(node);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentStep, nodes, expectedNode]);

  const completeFunctionalCheckIn = (skipped = false) => {
    if (!skipped) {
      saveResponse('functionalCheckIn', {
        completedAt: new Date().toISOString(),
        activities: functionalResponses,
        contextFactors: contextFactorResponses,
        assessmentContext: {
          language: currentLanguage,
          ageYears: user?.age ?? null,
          educationYears: user?.educationYears ?? null,
          taskVersion: 'neulens-mvp-0.1',
          accessibility: accessibilityResponses
        }
      });
    } else {
      saveResponse('functionalCheckIn', {
        skipped: true,
        completedAt: new Date().toISOString()
      });
    }
    saveResponse('externalContextConsent', {
      granted: !skipped && externalContextConsent,
      recordedAt: new Date().toISOString()
    });
    setStep('game1');
  };

  // Trigger setup on step loading
  useEffect(() => {
    if (currentStep === 'game1') initGame1();
    else if (currentStep === 'game2') initGame2();
    else if (currentStep === 'game3') initGame3();
    else if (currentStep === 'game4') initGame4();
    else if (currentStep === 'game5') initGame5();
  }, [currentStep]);

  // Animated wireframe components for Neural Net loader
  const inputYCoords = [15, 38, 62, 85];
  const hiddenYCoords = [8, 28, 50, 72, 92];
  const outputYCoords = [28, 50, 72];

  const getStepIndex = () => {
    switch (currentStep) {
      case 'game1': return 1;
      case 'game2': return 2;
      case 'game3': return 3;
      case 'game4': return 4;
      case 'game5': return 5;
      default: return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Persistent AI Voice Assistant Header Avatar & Controls */}
      {!patientMode && currentStep !== 'language-select' && (
        <VoiceAssistantAvatar
          currentStepIndex={getStepIndex()}
          totalSteps={5}
          onOpenLanguageModal={() => setIsLangModalOpen(true)}
        />
      )}

      {/* Dynamic Header progress tracker for active games */}
      {isGameStep && (
        patientMode ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-extrabold text-slate-800">
                {currentStep === 'game1' && copy.header.activities[0]}
                {currentStep === 'game2' && copy.header.activities[1]}
                {currentStep === 'game3' && copy.header.activities[2]}
                {currentStep === 'game4' && copy.header.activities[3]}
                {currentStep === 'game5' && copy.header.activities[4]}
              </span>
            </div>

            <button
              type="button"
              onClick={() => repeatInstruction()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-medical-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>{copy.header.repeat}</span>
            </button>
          </div>
        ) : (
          <div className="glass-card p-4 flex justify-between items-center bg-health-gray-900 bg-opacity-40">
            <div className="flex items-center gap-3">
              <span className="text-xs text-health-gray-400 font-bold uppercase tracking-wider">
                {currentStep === 'game1' && 'Game 1: Focus Orbit'}
                {currentStep === 'game2' && 'Game 2: Cortex Match'}
                {currentStep === 'game3' && 'Game 3: Vocal Echo'}
                {currentStep === 'game4' && 'Game 4: Mimic Sync'}
                {currentStep === 'game5' && 'Game 5: Path Mapper'}
              </span>
              <div className="h-1.5 w-32 bg-health-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-health-red rounded-full transition-all duration-300"
                  style={{
                    width: 
                      currentStep === 'game1' ? '20%' :
                      currentStep === 'game2' ? '40%' :
                      currentStep === 'game3' ? '60%' :
                      currentStep === 'game4' ? '80%' : '100%'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <TimerIcon className="w-3.5 h-3.5 text-health-red-light animate-pulse" />
              <span className="text-xs font-bold font-display text-slate-800">{gameTimer}s</span>
            </div>
          </div>
        )
      )}

      {mediaUnsupported ? (
        <div className="mb-4">
          <AssessmentUnavailableState
            reason="This browser cannot use the camera or microphone, which the screening activities need. Open this page in a current version of Chrome, Edge, Safari or Firefox on a phone, tablet or computer."
          />
        </div>
      ) : null}

      {/* The battery's activities are announced to screen readers as they change,
          so a participant who cannot see the layout still knows what to do. */}
      <div className="sr-only" role="status" aria-live="polite">
        {currentStep === 'game1' && copy.announcements[0]}
        {currentStep === 'game2' && copy.announcements[1]}
        {currentStep === 'game3' && copy.announcements[2]}
        {currentStep === 'game4' && copy.announcements[3]}
        {currentStep === 'game5' && copy.announcements[4]}
      </div>

      {/* Sensor permission states stay visible next to the activity they block. */}
      {(cameraStatus === 'error' || micPermissionDenied) && !permissionNoticeDismissed && (
        <div className="mb-4">
          <PermissionDeniedState
            kind={cameraStatus === 'error' ? (micPermissionDenied ? 'both' : 'camera') : 'microphone'}
            onRetry={() => {
              if (cameraStatus === 'error') {
                // The camera hook requests access on mount, so a retry reloads the page.
                window.location.reload();
                return;
              }
              setMicPermissionDenied(false);
              void handleRecordToggle();
            }}
            onContinueWithout={() => setPermissionNoticeDismissed(true)}
            continueLabel="Continue and skip this activity"
            compact
          />
        </div>
      )}

      {/* RENDER STEPS */}
      <AnimatePresence mode="wait">
        
        {/* Step 1: Language Selection */}
        {currentStep === 'language-select' && (
          <ElderlyLanguageSelector onConfirm={() => setStep('intro')} />
        )}

        {/* Step 2: Multilingual Intro Portal (Screen 5: Simple Assessment Welcome in Patient Mode) */}
        {currentStep === 'intro' && patientMode ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 space-y-8 text-center shadow-sm max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-medical-600 flex items-center justify-center mx-auto shadow-xs">
              <Brain className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
                {copy.intro.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
                {copy.intro.body}
              </p>
            </div>

            {/* Voice Guidance Control & Explanation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-start gap-3">
              <button
                type="button"
                onClick={() => speak(copy.intro.body)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-medical-600 flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                title="Listen to Instructions"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div className="space-y-0.5">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-800 block">
                  {copy.intro.listenTitle}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">{copy.intro.listenHelp}</p>
              </div>
            </div>

            {/* Sensor Status (Simple & Plain) */}
            {cameraStatus === 'error' && micPermissionDenied && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{copy.intro.cameraNeeded}</span>
              </div>
            )}
            {cameraStatus === 'error' && !micPermissionDenied && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{copy.intro.allowCamera}</span>
              </div>
            )}
            {cameraStatus !== 'error' && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${cameraStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span>
                  {cameraStatus === 'active' ? copy.intro.cameraReady : copy.intro.preparing}
                </span>
              </div>
            )}

            {/* Large Start Assessment Button */}
            <button 
              type="button"
              onClick={() => {
                stopSpeaking();
                if (cameraStatus === 'active') {
                  setStep('functional-assessment');
                } else {
                  setStep('sensor-check');
                }
              }} 
              className="w-full py-4 px-8 bg-medical-600 hover:bg-medical-700 active:scale-[0.99] text-white text-base sm:text-lg font-bold rounded-2xl shadow-md shadow-medical-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{copy.intro.start}</span>
              <Play className="w-5 h-5 fill-white" />
            </button>
          </motion.div>
        ) : currentStep === 'intro' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-card p-6 sm:p-8 space-y-6 text-center"
          >
            <div className="space-y-3">
              <div className="mx-auto w-[132px] sm:w-[156px]">
                <ElderCareMascot pose="welcome" className="h-auto w-full" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">{t.intro.title}</h2>
              <p className="text-xs sm:text-sm text-health-gray-400 max-w-lg mx-auto leading-relaxed">
                {t.intro.subtitle}
              </p>
            </div>

            {/* Spoken Introduction Bubble */}
            <div className="p-4 bg-medical-50/70 rounded-2xl border border-medical-200/80 text-left flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-health-teal shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-bold text-health-teal font-display block">
                  Spoken Welcome Guidance
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{t.intro.spokenIntro}"
                </p>
              </div>
            </div>

            {/* Checklist Cards for Elderly / First-Time Users */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-lg">🛋️</span>
                <h4 className="text-xs font-bold text-slate-900">Posture & Comfort</h4>
                <p className="text-xs text-health-gray-400 leading-normal">{t.intro.checklistComfort}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-lg">📷</span>
                <h4 className="text-xs font-bold text-slate-900">Center Your Face</h4>
                <p className="text-xs text-health-gray-400 leading-normal">{t.intro.checklistPosition}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-lg">🎤</span>
                <h4 className="text-xs font-bold text-slate-900">Clear Voice</h4>
                <p className="text-xs text-health-gray-400 leading-normal">{t.intro.checklistAudio}</p>
              </div>
            </div>

            {/* Privacy and Verification Seals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-health-gray-950 rounded-2xl border border-health-gray-900 flex items-center justify-between text-left">
                <div>
                  <span className="text-xs text-health-gray-500 uppercase block tracking-wider font-semibold">Verification Seal</span>
                  <span className="text-xs font-bold text-health-green">Secure Sandboxed Local Capture</span>
                </div>
                <div className="status-dot-green" />
              </div>

              <div className="p-3.5 bg-health-gray-950 rounded-2xl border border-health-gray-900 flex items-center justify-between text-left">
                <div>
                  <span className="text-xs text-health-gray-500 uppercase block tracking-wider font-semibold">Sensor Status</span>
                  <span className={`text-xs font-bold ${
                    cameraStatus === 'active' ? 'text-health-teal' : cameraStatus === 'error' ? 'text-red-400 font-semibold' : 'text-orange-400 animate-pulse'
                  }`}>
                    {cameraStatus === 'active' ? 'AI Biometric Tracker Ready' : cameraStatus === 'error' ? 'Camera Denied' : 'Calibrating Camera...'}
                  </span>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${
                  cameraStatus === 'active' ? 'bg-health-teal shadow-[0_0_8px_#34C759]' : cameraStatus === 'error' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'
                }`} />
              </div>
            </div>

            <button 
              onClick={() => setStep('sensor-check')} 
              className="btn-primary w-full py-4 text-sm sm:text-base font-bold tracking-wide flex items-center justify-center gap-2 rounded-2xl shadow-healthRing hover:shadow-glass transition-all"
            >
              <span>{t.intro.startScreeningBtn}</span>
              <Play className="w-4 h-4 fill-white" />
            </button>
          </motion.div>
        )}

        {/* Step 3: Sensor Check & Calibration */}
        {currentStep === 'sensor-check' && (
          <SensorCheckStage
            videoRef={videoRef}
            canvasRef={canvasRef}
            onReady={() => setStep('functional-assessment')}
          />
        )}

        {/* Game 1: Focus Orbit */}
        {currentStep === 'game1' && (
          <div className="space-y-4">
            {!patientMode && (
              <SpokenInstructionBanner
                icon="👁️ ➔ 🔴"
                stepNumber={1}
                totalSteps={5}
                taskTitle={t.game1.title}
                heading={t.game1.screenHeading}
                subtitle={t.game1.screenSubtitle}
                whatToDo={t.game1.whatToDo}
                whatNotToDo={t.game1.whatNotToDo}
                whereToLook={t.game1.whereToLook}
                nextTaskPreview={t.game1.nextTaskPreview}
              />
            )}

            <motion.div 
              key="game1" 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={patientMode ? "bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm" : "glass-card p-6 space-y-5"}
            >
            {ocularPhase === 'calibration' && !game1Finished ? (
              <OcularCalibrationOverlay
                patientMode={patientMode}
                onComplete={handleCalibrationComplete}
              />
            ) : game1Finished && game1ScoreDetails ? (
              patientMode ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle className="w-10 h-10 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-900">{copy.game1.completeTitle}</h3>
                    <p className="text-base text-slate-600 mt-1">{copy.game1.completeBody}</p>
                  </div>
                  <div className="pt-4 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setStep('game2')}
                      className="w-full py-4 px-6 bg-medical-600 hover:bg-medical-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md shadow-medical-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
                    >
                      <span>{copy.game1.continueTo2}</span>
                      <Play className="w-5 h-5 fill-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 py-2">
                  <div className="text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-health-teal bg-opacity-10 border border-health-teal border-opacity-20 flex items-center justify-center mx-auto text-health-teal mb-1">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Focus Orbit Complete</h3>
                    <p className="text-xs text-health-gray-500">Diagnostic ocular stability markers captured successfully.</p>
                  </div>

                  {/* Score Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-health-gray-500 uppercase block font-semibold">Latency</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">{game1ScoreDetails.avgReaction} ms</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-health-gray-500 uppercase block font-semibold">Stability</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">
                        {game1ScoreDetails.fixationStability === null
                          ? copy.game1.notMeasured
                          : `${game1ScoreDetails.fixationStability}%`}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-health-gray-500 uppercase block font-semibold">Accuracy</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">{game1ScoreDetails.trackingAccuracy}%</span>
                    </div>
                  </div>

                  {/* Overall Score Badge */}
                  <div className="p-4 bg-health-blue bg-opacity-5 border border-health-blue border-opacity-15 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-health-blue-light uppercase font-bold tracking-wider block font-display">Biometric Score</span>
                      <span className="text-xs text-health-gray-400 mt-0.5 block leading-normal">
                        Stable gaze alignment and reaction index.
                      </span>
                    </div>
                    <div className="text-xl font-bold font-display text-health-blue-light">
                      {game1ScoreDetails.score}%
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('game2')}
                    className="btn-primary w-full py-3.5 text-xs font-bold tracking-wide flex items-center justify-center gap-2"
                  >
                    Proceed to Cortex Match
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="space-y-1 text-center">
                  <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">
                    {copy.game1.title}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">{copy.game1.body}</p>
                </div>

                <div className={`relative w-full h-80 rounded-2xl overflow-hidden cursor-crosshair ${patientMode ? 'bg-slate-50 border border-slate-200' : 'bg-health-gray-950 border border-health-gray-850'}`}>
                  
                  {/* Glowing Target Dot */}
                  <button
                    type="button"
                    onClick={handleDotClick}
                    className="absolute w-14 h-14 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-75 hover:scale-105"
                    style={{ left: `${dotPos.x}%`, top: `${dotPos.y}%` }}
                  >
                    {/* Focus Progress Charging Ring */}
                    <svg className="w-14 h-14 absolute rotate-[-90deg]">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        stroke={patientMode ? "rgba(14, 116, 144, 0.15)" : "rgba(255, 255, 255, 0.08)"}
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        stroke="#0284c7"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 22}
                        strokeDashoffset={(2 * Math.PI * 22) * (1 - focusProgress / 100)}
                        className="transition-all duration-75"
                      />
                    </svg>
                    
                    {/* Inner Target Core */}
                    <div className="w-8 h-8 bg-gradient-to-tr from-medical-600 to-blue-500 rounded-full shadow-md flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full opacity-90 animate-ping" />
                    </div>
                  </button>

                  {/* Real-time Eye Gaze Target Cursor */}
                  {metrics.screenGaze && (
                    <div 
                      className="absolute w-8 h-8 border border-health-blue-light border-opacity-60 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(100,210,255,0.3)] flex items-center justify-center"
                      style={{ left: `${metrics.screenGaze.x}%`, top: `${metrics.screenGaze.y}%` }}
                    >
                      <div className="w-2.5 h-2.5 bg-health-blue-light bg-opacity-40 rounded-full animate-pulse" />
                    </div>
                  )}

                  <div className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full z-10 ${patientMode ? 'bg-white border border-slate-200 text-slate-700 shadow-xs' : 'bg-health-gray-900 border border-health-gray-800 text-health-gray-400'}`}>
                    {copy.game1.targets}: <bdi dir="ltr">{dotClicks} / 5</bdi>
                  </div>

                  {/* Signal-quality feedback: a poor recording is surfaced, never silently scored */}
                  <div className="absolute top-4 right-4 z-10 max-w-[58%] text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                        liveQuality.level === 'good'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : liveQuality.level === 'fair'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          liveQuality.level === 'good'
                            ? 'bg-emerald-500'
                            : liveQuality.level === 'fair'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                      />
                      {copy.game1.camera}: {qualityLevelLabel(liveQuality.level)}
                    </span>
                    {liveQuality.level !== 'good' && liveQuality.reasons[0] && (
                      <p dir="auto" className={`mt-1 text-xs leading-snug ${patientMode ? 'text-slate-500' : 'text-health-gray-400'}`}>
                        {qualityReasonText(liveQuality.reasons[0], currentLanguage)}
                      </p>
                    )}
                  </div>
                </div>

                {!patientMode && (
                  <div className="flex gap-4">
                    <button onClick={() => handleNextGame1(false)} className="btn-glass flex-1 text-xs py-2.5">
                      Skip Game
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
          </div>
        )}

        {/* Game 2: Cortex Match */}
        {currentStep === 'game2' && (
          <div className="space-y-4">
            {!patientMode && (
              <SpokenInstructionBanner
                icon="🧠 ➔ 🃏"
                stepNumber={2}
                totalSteps={5}
                taskTitle={t.game2.title}
                heading={t.game2.screenHeading}
                subtitle={t.game2.screenSubtitle}
                whatToDo={t.game2.whatToDo}
                whatNotToDo={t.game2.whatNotToDo}
                whereToLook={t.game2.whereToLook}
                nextTaskPreview={t.game2.nextTaskPreview}
              />
            )}

            <motion.div 
              key="game2" 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={patientMode ? "bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm" : "glass-card p-6 space-y-4"}
            >
              <div className="space-y-1 text-center">
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">{copy.game2.title}</h3>
                <p className="text-sm text-slate-500">{copy.game2.body}</p>
              </div>

              <div className="grid grid-cols-4 gap-4 py-4 max-w-md mx-auto">
                {cards.map((card, idx) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleCardClick(idx)}
                    className={`h-24 rounded-2xl border-2 text-3xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      card.isFlipped || card.isMatched
                        ? 'bg-blue-50 border-medical-500 text-medical-700 shadow-sm'
                        : patientMode
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-400'
                        : 'bg-health-gray-900 border-health-gray-800 text-transparent hover:border-health-gray-700'
                    }`}
                  >
                    {(card.isFlipped || card.isMatched) ? card.icon : '❓'}
                  </button>
                ))}
              </div>

              {!patientMode && (
                <button onClick={() => handleNextGame2(false)} className="btn-glass w-full text-xs py-2.5">
                  Skip to Game 3
                </button>
              )}
            </motion.div>
          </div>
        )}

        {/* Game 3: Vocal Echo */}
        {currentStep === 'game3' && (
          patientMode ? (
            <motion.div 
              key="game3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="space-y-1 text-center">
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">
                  {copy.game3.title}
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{copy.game3.body}</p>
              </div>

              {/* Sentence Display Card */}
              <div className="p-6 bg-blue-50/60 border border-blue-200 rounded-2xl text-center space-y-4">
                <button
                  type="button"
                  onClick={() => speak(getTargetSentence())}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-medical-700 hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{copy.game3.hear}</span>
                </button>
                
                <p className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed max-w-lg mx-auto">
                  &ldquo;{getTargetSentence()}&rdquo;
                </p>
              </div>

              {/* Hidden canvas for mic FFT under the hood */}
              <canvas ref={micCanvasRef} className="hidden" />

              {/* Large Microphone Action Button */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <button
                  type="button"
                  onClick={handleRecordToggle}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isRecording 
                      ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-100'
                      : voiceComplete
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-medical-600 hover:bg-medical-700 text-white ring-8 ring-blue-50 shadow-medical-600/20'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>
                <span className="text-sm font-bold text-slate-700">
                  {isRecording
                    ? `${copy.game3.recording} (${recordDuration}s)`
                    : voiceComplete
                      ? copy.game3.recorded
                      : copy.game3.tapToSpeak}
                </span>
              </div>

              {/* Transcript if available */}
              {recordedTranscript && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1 max-w-md mx-auto">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{copy.game3.recordedWords}</span>
                  <p className="text-sm font-medium text-slate-800 italic">"{recordedTranscript}"</p>
                </div>
              )}

              {/* Continue Button once voice is recorded */}
              {voiceComplete && (
                <div className="pt-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    disabled={isAnalyzingVoice}
                    onClick={() => handleNextGame3(false)}
                    className="w-full py-4 px-6 bg-medical-600 hover:bg-medical-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-60 disabled:cursor-wait"
                  >
                    <span>{isAnalyzingVoice ? copy.game3.analysing : copy.game3.continueTo4}</span>
                    <Play className="w-5 h-5 fill-white" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="game3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 font-display">Vocal Echo</h3>
                <p className="text-xs text-health-gray-500">Press record and repeat the clinical sentence aloud</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <span className="text-xs text-health-purple-light font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Read Out Loud:
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed italic max-w-md mx-auto">
                  &ldquo;{getTargetSentence()}&rdquo;
                </p>
              </div>

              <div className="h-28 bg-health-gray-950 border border-health-gray-850 rounded-2xl flex items-center justify-center gap-1.5 p-4 relative overflow-hidden">
                {isRecording ? (
                  <>
                    <canvas ref={micCanvasRef} className="absolute inset-0 w-full h-full opacity-80" />
                    <div className="absolute top-3 right-3 text-xs font-bold font-mono bg-health-red bg-opacity-20 text-health-red border border-health-red border-opacity-35 px-2 py-0.5 rounded animate-pulse z-10">
                      REC {recordDuration}s
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-health-gray-655 flex items-center gap-1.5">
                    <Mic className="w-4 h-4" /> Wait-State (Speech track offline)
                  </div>
                )}
              </div>

              {/* Live Gnani Prisma STT Transcript Card */}
              {(isTranscribing || recordedTranscript) && (
                <div className="p-4 bg-sky-50/80 border border-sky-200/90 rounded-2xl space-y-2 animate-fadeIn text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      Google AI Speech-to-Text (Chirp 2 / Gemini Audio)
                    </span>
                    {isTranscribing && (
                      <span className="text-xs font-medium text-sky-600 animate-pulse">
                        Transcribing via REST API...
                      </span>
                    )}
                  </div>
                  {recordedTranscript ? (
                    <p className="text-sm font-medium text-slate-800 italic">
                      "{recordedTranscript}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Processing speech-to-text...
                    </p>
                  )}
                </div>
              )}

              {audioParams && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                    <div className="flex flex-col">
                      <span className="text-xs text-health-gray-500 font-semibold uppercase">Speech Rate</span>
                      <span className="font-bold text-slate-800 mt-0.5">
                        {audioParams.speechRate ?? audioParams.syllableRate ?? '—'}{' '}
                        <span className="font-normal text-health-gray-500">
                          {audioParams.speechRate != null ? 'wpm' : 'syll/min'}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-health-gray-500 font-semibold uppercase">Vocal Pitch</span>
                      <span className="font-bold text-slate-800 mt-0.5">{audioParams.pitch ?? '—'} Hz</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-health-gray-500 font-semibold uppercase">Jitter</span>
                      <span className="font-bold text-slate-800 mt-0.5">{audioParams.jitter ?? '—'}%</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-xs text-health-gray-500 font-semibold uppercase">Shimmer</span>
                      <span className="font-bold text-slate-800 mt-0.5">{audioParams.shimmer ?? '—'}%</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-xs text-health-gray-500 font-semibold uppercase">Pauses</span>
                      <span className="font-bold text-slate-800 mt-0.5">{audioParams.pauseCount}</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-xs text-health-gray-500 font-semibold uppercase">Response</span>
                      <span className="font-bold text-slate-800 mt-0.5">
                        {audioParams.responseLatencyMs != null
                          ? `${(audioParams.responseLatencyMs / 1000).toFixed(1)} s`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {voiceQuality && (
                    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          voiceQuality.level === 'good'
                            ? 'bg-emerald-500'
                            : voiceQuality.level === 'fair'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                      />
                      <p className="text-xs leading-snug text-health-gray-500">
                        <span className="font-bold uppercase tracking-wide text-slate-700">
                          Recording: {voiceQuality.level}
                        </span>{' '}
                        {voiceQuality.summary}
                        {audioParams.speechAccuracy != null && ` Word accuracy: ${audioParams.speechAccuracy}%.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleRecordToggle}
                  className={`flex-1 btn-glass text-xs py-3.5 ${
                    isRecording 
                      ? 'border-health-red text-health-red font-bold animate-pulse'
                      : 'hover:bg-health-gray-800'
                  }`}
                >
                  {isRecording ? 'Stop Recording' : 'Start Voice Capture'}
                </button>

                <button
                  type="button"
                  disabled={!voiceComplete || isAnalyzingVoice}
                  onClick={() => handleNextGame3(false)}
                  className="flex-1 btn-primary text-xs py-3.5 disabled:opacity-50"
                >
                  {isAnalyzingVoice ? 'Analysing voice…' : 'Proceed to Game 4'}
                </button>
              </div>
            </motion.div>
          )
        )}

        {/* Game 4: Mimic Sync */}
        {currentStep === 'game4' && cameraStatus !== 'active' && (
          <motion.div
            key="game4-unavailable"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4 text-center"
          >
            <h3 className="text-xl font-black font-display text-slate-900">{copy.game4.unavailableTitle}</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{copy.game4.unavailableBody}</p>
            <button
              type="button"
              onClick={() => handleNextGame4(false)}
              className="w-full max-w-xs mx-auto py-3 px-6 bg-medical-600 hover:bg-medical-700 text-white font-bold rounded-2xl"
            >
              {copy.game4.continueWithout}
            </button>
          </motion.div>
        )}

        {currentStep === 'game4' && cameraStatus === 'active' && (
          patientMode ? (
            <motion.div 
              key="game4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-center"
            >
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">{copy.game4.title}</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{copy.game4.body}</p>
              </div>

              {/* Spoken Instruction button */}
              <div>
                <button
                  type="button"
                  onClick={() => speak(facialPrompts[facialIdx].prompt)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-medical-700 hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{copy.game4.hear}</span>
                </button>
              </div>

              {/* Target Prompt Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-medical-600 block">
                  {copy.game4.expressionOf(facialIdx + 1, facialPrompts.length)}
                </span>
                <p className="text-2xl font-bold text-slate-900">
                  {facialPrompts[facialIdx].label}
                </p>
                <p className="text-xs text-slate-500">
                  {facialPrompts[facialIdx].prompt}
                </p>
              </div>

              {/* Clean camera preview without wireframe vector overlay */}
              <div className="relative w-72 sm:w-80 h-56 mx-auto bg-slate-100 border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center">
                {cameraStatus === 'active' ? (
                  <>
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                ) : cameraStatus === 'error' ? (
                  <div className="p-4 text-center text-xs text-red-500">{copy.game4.unavailableTitle}</div>
                ) : (
                  <div className="text-xs text-slate-400 animate-pulse">{copy.game4.cameraStarting}</div>
                )}
              </div>

              {/* Clean Action Button */}
              <div className="max-w-sm mx-auto pt-2">
                <button
                  type="button"
                  onClick={handleNextGesture}
                  className="w-full py-4 px-6 bg-medical-600 hover:bg-medical-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md shadow-medical-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
                >
                  <span>{facialIdx < facialPrompts.length - 1 ? copy.game4.next : copy.game4.continueTo5}</span>
                  <Play className="w-5 h-5 fill-white" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="game4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Mimic Sync</h3>
                <p className="text-xs text-health-gray-500">Perform the prompted facial tasks inside the tracking vector frame</p>
              </div>

              <div className="relative w-full h-64 bg-health-gray-950 border border-health-gray-850 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Behavioural tracking quality: a poor recording must be visible, not silently scored */}
                <div className="absolute top-3 right-3 z-10 max-w-[60%] text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                      facialQuality.level === 'good'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : facialQuality.level === 'fair'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        facialQuality.level === 'good'
                          ? 'bg-emerald-400'
                          : facialQuality.level === 'fair'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                      }`}
                    />
                    Camera: {facialQuality.level}
                  </span>
                  {facialQuality.level !== 'good' && facialQuality.reasons[0] && (
                    <p className="mt-1 text-xs leading-snug text-health-gray-400">
                      {behaviourReasonText(facialQuality.reasons[0], currentLanguage)}
                    </p>
                  )}
                </div>

                {cameraStatus === 'active' ? (
                  <>
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                  </>
                ) : cameraStatus === 'error' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-xs text-red-405 bg-red-950 bg-opacity-10">
                    <span className="font-bold mb-1">Camera Denied</span>
                    <span>{errorMessage}</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-health-gray-500 animate-pulse">
                    Initializing camera feed...
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-48 h-48 text-health-orange text-opacity-15 animate-pulse-slow" viewBox="0 0 100 100">
                    <path 
                      d="M 50 15 C 30 15 25 35 25 55 C 25 75 35 85 50 85 C 65 85 75 75 75 55 C 75 35 70 15 50 15 Z" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="0.8" 
                      strokeDasharray="2,2"
                    />
                    <path d="M 33 35 Q 40 32 45 35" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M 55 35 Q 60 32 67 35" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="39" cy="42" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="61" cy="42" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M 50 40 L 50 58 L 46 62 L 54 62 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                    <path d="M 38 72 Q 50 78 62 72 Q 50 74 38 72 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>

                <div className="z-10 text-center space-y-2 bg-health-gray-950 bg-opacity-70 backdrop-blur-md px-5 py-3 rounded-2xl border border-health-gray-800 pointer-events-none min-w-[180px]">
                  <div className="w-10 h-10 rounded-full bg-health-orange bg-opacity-10 border border-health-orange border-opacity-20 flex items-center justify-center mx-auto text-health-orange animate-bounce">
                    <Smile className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-health-orange font-bold uppercase tracking-wider block font-display">Prompt {facialIdx + 1} of 4</span>
                  <p className="text-sm font-bold text-white font-display">{facialPrompts[facialIdx].label}</p>
                  
                  {/* Live Percentage Progress Bar */}
                  <div className="space-y-1 pt-1.5 border-t border-health-gray-850 border-dashed mt-1.5">
                    <div className="h-1.5 w-full bg-health-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-health-orange to-orange-400 transition-all duration-150 rounded-full"
                        style={{ width: `${currentGestureValue}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-health-orange-light block font-mono">{currentGestureValue}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handleNextGesture} 
                  className="flex-1 btn-primary py-3 text-xs font-semibold bg-health-orange hover:bg-orange-550 border border-transparent shadow-[0_0_12px_rgba(249,115,22,0.25)] flex items-center justify-center gap-1.5"
                >
                  Auto-Detecting Mimic... (Skip)
                </button>
                <button 
                  type="button" 
                  onClick={() => handleNextGame4(false)} 
                  className="btn-glass text-xs"
                >
                  Skip Game
                </button>
              </div>
            </motion.div>
          )
        )}

        {/* Game 5: Path Mapper */}
        {currentStep === 'game5' && (
          patientMode ? (
            <motion.div 
              key="game5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-center"
            >
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">{copy.game5.title}</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{copy.game5.body}</p>
              </div>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => speak(copy.game5.hearText)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-medical-700 hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{copy.game5.hear}</span>
                </button>

                <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                  {copy.game5.nextNumber}: <span className="text-medical-600 text-sm font-black">{expectedNode}</span>
                </div>
              </div>

              <div 
                id="game-trail-box" 
                className="relative w-full h-80 bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden transition-colors duration-200"
              >
                {nodes.map((node) => {
                  const isCurrentTarget = node.id === expectedNode;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => handleNodeClick(node)}
                      className={`absolute w-14 h-14 rounded-full border-2 font-black text-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        node.isMatched
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-md'
                          : isCurrentTarget
                          ? 'bg-medical-600 border-medical-700 text-white shadow-lg ring-4 ring-medical-200 scale-105'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-medical-400 shadow-sm'
                      }`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      {node.isMatched ? <CheckCircle className="w-7 h-7 stroke-[2.5]" /> : node.id}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="game5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Path Mapper (Trail Making)</h3>
                <p className="text-xs text-health-gray-500">Connect the numbered nodes in strict chronological order (1 to 6)</p>
              </div>

              <div 
                id="game-trail-box" 
                className="relative w-full h-80 bg-health-gray-950 border border-health-gray-850 rounded-2xl overflow-hidden transition-colors duration-200"
              >
                <div className="absolute top-4 left-4 text-xs font-bold bg-health-gray-900 border border-health-gray-800 text-health-gray-400 px-3 py-1.5 rounded-full z-10">
                  Next Target: Node {expectedNode}
                </div>

                {nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleNodeClick(node)}
                    className={`absolute w-12 h-12 rounded-full border-2 font-bold font-display text-sm flex items-center justify-center transition-all duration-200 ${
                      node.isMatched
                        ? 'bg-health-green bg-opacity-20 border-health-green text-health-green-light shadow-[0_0_10px_#34C759]'
                        : 'bg-health-gray-900 border-health-gray-700 text-health-gray-300 hover:border-health-gray-500'
                    }`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    {node.id}
                  </button>
                ))}
              </div>

              <button onClick={() => handleNextGame5(false)} className="btn-glass w-full text-xs py-2.5">
                Skip & Finish
              </button>
            </motion.div>
          )
        )}

        {/* AI Analysis Screen (Sequential Loader + Animated Neural Network) */}
        {currentStep === 'functional-assessment' && (
          <motion.div
            key="functional-assessment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900">
                {t.functionCheckIn.title}
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                {t.functionCheckIn.subtitle}
              </p>
              <p className="text-xs text-amber-800 max-w-2xl mx-auto">
                {t.functionCheckIn.interpretationNotice}
              </p>
              <p className="text-base font-bold text-slate-800 pt-2">
                {t.functionCheckIn.prompt}
              </p>
            </div>

            <div className="space-y-4">
              {([
                ['appointments', t.functionCheckIn.activities.appointments],
                ['medication', t.functionCheckIn.activities.medication],
                ['finances', t.functionCheckIn.activities.finances],
                ['household', t.functionCheckIn.activities.household]
              ] as const).map(([id, label]) => (
                <fieldset key={id} className="rounded-2xl border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-bold text-slate-800">{label}</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {([
                      [0, t.functionCheckIn.answers.same],
                      [1, t.functionCheckIn.answers.harder],
                      [2, t.functionCheckIn.answers.help]
                    ] as const).map(([value, answer]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={functionalResponses[id] === value}
                        onClick={() => setFunctionalResponses(current => ({ ...current, [id]: value }))}
                        className={`min-h-12 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                          functionalResponses[id] === value
                            ? 'bg-medical-50 border-medical-500 text-medical-800 ring-2 ring-medical-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <section className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{t.functionCheckIn.contextPrompt}</h3>
              {([
                ['sleep', t.functionCheckIn.contextFactors.sleep],
                ['activity', t.functionCheckIn.contextFactors.activity],
                ['moodStress', t.functionCheckIn.contextFactors.moodStress]
              ] as const).map(([id, label]) => (
                <fieldset key={id} className="rounded-2xl border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-semibold text-slate-800">{label}</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {([
                      [0, t.functionCheckIn.contextAnswers.usual],
                      [1, t.functionCheckIn.contextAnswers.somewhatWorse],
                      [2, t.functionCheckIn.contextAnswers.substantiallyWorse]
                    ] as const).map(([value, answer]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={contextFactorResponses[id] === value}
                        onClick={() => setContextFactorResponses(current => ({ ...current, [id]: value }))}
                        className={`min-h-12 px-3 py-2 rounded-xl border text-sm font-semibold ${
                          contextFactorResponses[id] === value
                            ? 'bg-medical-50 border-medical-500 text-medical-800 ring-2 ring-medical-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </section>

            <section className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{t.functionCheckIn.accessibilityPrompt}</h3>
              {([
                ['vision', t.functionCheckIn.accessibility.vision],
                ['hearing', t.functionCheckIn.accessibility.hearing],
                ['motor', t.functionCheckIn.accessibility.motor],
                ['digitalFamiliarity', t.functionCheckIn.accessibility.digitalFamiliarity]
              ] as const).map(([id, label]) => (
                <fieldset key={id} className="rounded-2xl border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-semibold text-slate-800">{label}</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {([
                      [0, t.functionCheckIn.accessibilityAnswers.noDifficulty],
                      [1, t.functionCheckIn.accessibilityAnswers.someDifficulty],
                      [2, t.functionCheckIn.accessibilityAnswers.needSupport]
                    ] as const).map(([value, answer]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={accessibilityResponses[id] === value}
                        onClick={() => setAccessibilityResponses(current => ({ ...current, [id]: value }))}
                        className={`min-h-12 px-3 py-2 rounded-xl border text-sm font-semibold ${
                          accessibilityResponses[id] === value
                            ? 'bg-medical-50 border-medical-500 text-medical-800 ring-2 ring-medical-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </section>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={externalContextConsent}
                onChange={(event) => setExternalContextConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-medical-600 focus:ring-medical-500"
              />
              <span>{t.functionCheckIn.externalConsent}</span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => completeFunctionalCheckIn(true)}
                className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                {t.functionCheckIn.skipBtn}
              </button>
              <button
                type="button"
                onClick={() => completeFunctionalCheckIn()}
                disabled={
                  Object.keys(functionalResponses).length !== 4 ||
                  Object.keys(contextFactorResponses).length !== 3 ||
                  Object.keys(accessibilityResponses).length !== 4
                }
                className="px-6 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-sm"
              >
                {t.functionCheckIn.continueBtn}
              </button>
            </div>
          </motion.div>
        )}

        {/* Piano Sequence: fixed-observation clinical sequencing task */}
        {currentStep === 'piano-sequence' && (
          <motion.div key="piano-sequence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <PianoSequenceTask
              patientMode={patientMode}
              speak={speak}
              language={currentLanguage}
              onComplete={(result: any) => {
                saveResponse('pianoSequence', result);
                // Clinical fixed-observation activity complete -> proceed to analysis/submission
                setStep('submitting');
              }}
            />
          </motion.div>
        )}

        {/* Adaptive Practice: non-clinical, difficulty adapts; never scored/compared clinically */}
        {currentStep === 'adaptive-practice' && (
          <motion.div key="adaptive-practice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <AdaptivePracticeGames
              onSavePractice={(session: any) => {
                // Stored as practice-only data; explicitly excluded from clinical scoring/baseline/change comparison.
                saveResponse('adaptivePractice', {
                  ...session,
                  savedAt: new Date().toISOString(),
                });
              }}
              onClose={() => setStep('intro')}
            />
          </motion.div>
        )}

        {/* AI Analysis Screen (Sequential Loader + Animated Neural Network) */}
        {currentStep === 'submitting' && (
          patientMode ? (
            <motion.div 
              key="submitting"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-5 shadow-sm max-w-lg mx-auto py-14"
            >
              <div className="mx-auto w-[140px]">
                <ElderCareMascot pose={submissionError ? 'support' : 'guide'} className="h-auto w-full" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black font-display text-slate-900">
                  {submissionError ? copy.saving.errorTitle : copy.saving.savingTitle}
                </h3>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {submissionError ? (
                    <>
                      <p>{copy.saving.errorBody}</p>
                      <details className="mt-2 text-start">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-500">
                          {copy.saving.errorDetailLabel}
                        </summary>
                        <p className="mt-1 text-xs text-slate-500" dir="ltr">{submissionError}</p>
                      </details>
                    </>
                  ) : (
                    <p>{copy.saving.savingBody}</p>
                  )}
                </div>
              </div>
              {submissionError && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void submitAssessment()}
                    disabled={isSavingAssessment}
                    className="px-5 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white text-sm font-bold"
                  >
                    {copy.saving.retry}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/patient/dashboard')}
                    className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
                  >
                    ← Return to Dashboard
                  </button>
                </div>
              )}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <span className={`w-2 h-2 rounded-full ${submissionError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{submissionError ? copy.saving.waiting : copy.saving.secure}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="submitting"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-card p-8 text-center space-y-6 py-12 relative overflow-hidden"
            >
              {/* Ambient glows */}
              <div className="absolute inset-0 bg-card-glow opacity-25 pointer-events-none" />

              {/* Neural Net Node graph */}
              <div className="relative py-4 select-none">
                <svg className="w-72 h-44 text-health-blue text-opacity-20 mx-auto" viewBox="0 0 200 100">
                  {/* Connector links */}
                  {inputYCoords.map((iy) => 
                    hiddenYCoords.map((hy) => (
                      <line 
                        key={`l-${iy}-${hy}`} 
                        x1="30" y1={iy} x2="100" y2={hy} 
                        stroke="currentColor" 
                        strokeWidth="0.4" 
                        className="animate-pulse"
                      />
                    ))
                  )}
                  {hiddenYCoords.map((hy) => 
                    outputYCoords.map((oy) => (
                      <line 
                        key={`l-${hy}-${oy}`} 
                        x1="100" y1={hy} x2="170" y2={oy} 
                        stroke="currentColor" 
                        strokeWidth="0.4" 
                      />
                    ))
                  )}

                  {/* Node Points circles */}
                  {inputYCoords.map((iy, idx) => (
                    <circle 
                      key={`in-${idx}`} cx="30" cy={iy} r="2.5" fill="#007AFF" 
                      className="animate-ping" 
                      style={{ animationDuration: '2.5s', animationDelay: `${idx * 0.2}s` }} 
                    />
                  ))}
                  {hiddenYCoords.map((hy, idx) => (
                    <circle key={`hn-${idx}`} cx="100" cy={hy} r="2.5" fill="#AF52DE" className="animate-pulse" />
                  ))}
                  {outputYCoords.map((oy, idx) => (
                    <circle key={`on-${idx}`} cx="170" cy={oy} r="3" fill="#FF2D55" className="animate-pulse" />
                  ))}
                </svg>

                {/* Centered analysis tracking status badge */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-health-gray-900 border border-health-gray-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-health-purple animate-spin" />
                  <span className="text-xs font-bold text-white font-display uppercase tracking-wider">AI Pipeline</span>
                </div>
              </div>

              {/* Analysis Text updates */}
              <div className="space-y-2 z-10 relative">
                <h3 className="text-lg font-bold text-slate-900 font-display">Processing Neurocognitive Metrics</h3>
                
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={analysisStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-health-purple-light font-bold tracking-wide h-6"
                  >
                    {analysisStatements[analysisStep]}
                  </motion.p>
                </AnimatePresence>

                <p className="text-xs text-health-gray-500 max-w-xs mx-auto">
                  Validating response parameters against demographic baseline curves...
                </p>
                {submissionError && (
                  <div role="alert" className="space-y-3">
                    <p className="text-sm font-semibold text-rose-700">{submissionError}</p>
                    <button
                      type="button"
                      onClick={() => void submitAssessment()}
                      disabled={isSavingAssessment}
                      className="px-5 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white text-xs font-bold"
                    >
                      Retry saving assessment
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        )}

        {/* Results Screen & Completion Reward Badge */}
        {currentStep === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 space-y-6"
          >
            {/* Reward Badge Render */}
            <div className="text-center space-y-4">
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-health-red via-health-orange to-health-purple opacity-20 blur-xl animate-pulse-slow" />
                
                <svg className="w-full h-full text-health-orange animate-pulse" viewBox="0 0 100 100">
                  <polygon 
                    points="50,5 90,25 90,75 50,95 10,75 10,25" 
                    fill="rgba(44, 44, 46, 0.4)" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                    className="backdrop-blur-md"
                  />
                  <polygon 
                    points="50,15 80,32 80,68 50,85 20,68 20,32" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    strokeDasharray="3,3"
                  />
                </svg>
                
                <div className="absolute text-center space-y-1">
                  <Trophy className="w-10 h-10 text-health-orange mx-auto drop-shadow-[0_0_8px_rgba(255,149,0,0.5)]" />
                  <span className="text-xs font-bold text-health-orange-light uppercase tracking-widest block font-display">
                    Neuro-Explorer
                  </span>
                </div>
              </div>

              <div className="mx-auto w-[150px] -mt-2">
                <ElderCareMascot pose="celebrate" className="h-auto w-full" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-display text-slate-900">Assessment Complete</h3>
                <p className="text-xs text-slate-500 font-medium">Thank you for completing the guided activities.</p>
              </div>
            </div>

            {/* Domain Score Breakdown */}
            <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-health-gray-850">
              <div className="p-3 bg-health-gray-950 rounded-xl border border-health-gray-900">
                <span className="text-xs text-health-gray-500 uppercase font-semibold block">Memory Recall</span>
                <span className="text-base font-bold text-white">{scores.memoryScore}%</span>
              </div>
              <div className="p-3 bg-health-gray-950 rounded-xl border border-health-gray-900">
                <span className="text-xs text-health-gray-500 uppercase font-semibold block">Reaction Attention</span>
                <span className="text-base font-bold text-white">{scores.attentionScore}%</span>
              </div>
              <div className="p-3 bg-health-gray-950 rounded-xl border border-health-gray-900">
                <span className="text-xs text-health-gray-500 uppercase font-semibold block">Visuospatial</span>
                <span className="text-base font-bold text-white">{scores.visuospatialScore}%</span>
              </div>
              <div className="p-3 bg-health-gray-950 rounded-xl border border-health-gray-900">
                <span className="text-xs text-health-gray-500 uppercase font-semibold block">Composite Index</span>
                <span className="text-base font-bold text-health-red-light font-display">{scores.compositeScore}%</span>
              </div>
            </div>

            {completionResult?.platform?.pathway && (
              <BrainHealthPathway
                pathway={completionResult.platform.pathway}
                personalizedPrevention={completionResult.platform.personalizedPrevention}
                compact
              />
            )}

            <button 
              onClick={() => {
                resetSession();
                if (targetPatientId) {
                  navigate(`/doctor/patients/${targetPatientId}`);
                } else {
                  navigate('/doctor/patients');
                }
              }} 
              className="btn-primary w-full py-4 font-bold"
            >
              {targetPatientId ? 'Return to Patient File' : 'Return to Patients Directory'}
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Hidden camera and canvas elements for computer vision telemetry during patient assessment */}
      {patientMode && currentStep !== 'game4' && (
        <div className="hidden" aria-hidden="true">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Floating Webcam Preview for active assessment games (Doctor/Staff Mode only) */}
      {!patientMode && isGameStep && currentStep !== 'game4' && (
        <div className="fixed bottom-6 right-6 z-40 w-44 h-32 bg-health-gray-900 bg-opacity-[0.85] border border-health-gray-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-end">
          <div className="absolute inset-0 flex items-center justify-center bg-health-gray-950">
            {cameraStatus === 'active' ? (
              <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]" playsInline muted />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              </>
            ) : (
              <div className="p-3 text-center text-xs text-health-gray-500 leading-tight">
                {cameraStatus === 'error' ? 'Camera access denied' : 'Initializing Camera...'}
              </div>
            )}
          </div>
          <div className="z-10 bg-health-gray-950 bg-opacity-75 backdrop-blur-md px-2.5 py-1 flex items-center justify-between border-t border-health-gray-850">
            <span className="text-[12px] font-bold text-health-gray-400 uppercase tracking-wider font-display">
              {cameraStatus === 'active' ? 'Sensor Feed' : 'Pending'}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[12px] text-health-gray-400 font-mono">EAR: {metrics.ear.toFixed(2)}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${
                cameraStatus === 'active' ? 'bg-health-teal shadow-[0_0_6px_#34C759]' : 'bg-amber-500'
              }`} />
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
export default ScreeningPage;
