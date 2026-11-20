import React, { useState, useEffect, useRef } from 'react';
import { useFaceTrackingStore } from '../../store/faceTrackingStore';
import { useVoiceAssistantStore } from '../../services/voice/VoiceInstructionEngine';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { useScreeningCopy } from '../../features/screening/screeningCopy';
import { Camera, Mic, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SensorCheckStageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onReady: () => void;
}

export const SensorCheckStage: React.FC<SensorCheckStageProps> = ({ videoRef, canvasRef, onReady }) => {
  const { cameraStatus, errorMessage, metrics } = useFaceTrackingStore();
  const { speak, stopSpeaking } = useVoiceAssistantStore();
  const { getTranslation } = useLanguageStore();
  const t = getTranslation();
  const copy = useScreeningCopy();

  const [micTested, setMicTested] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micStreamActive, setMicStreamActive] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasAnnouncedReady = useRef<boolean>(false);

  // Spoken instructions on mount (cleanly stopped on unmount)
  useEffect(() => {
    speak(t.sensorCheck.spokenCheck);
    return () => {
      stopSpeaking();
    };
  }, []);

  // Initialize Audio input test
  useEffect(() => {
    let isMounted = true;

    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setMicStreamActive(true);

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!analyserRef.current || !isMounted) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average audio level
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setMicLevel(level);

          // If patient speaks (audio level > 18)
          if (level > 18) {
            setMicTested(true);
          }

          animFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (e) {
        console.warn('Microphone permission check warning:', e);
      }
    };

    initMic();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Compute calibration readiness
  const isCameraReady = cameraStatus === 'active' && metrics.stability > 50;
  const isAllReady = isCameraReady && (micTested || micLevel > 15);

  useEffect(() => {
    if (isAllReady) {
      setCalibrationProgress(100);
      if (!hasAnnouncedReady.current) {
        hasAnnouncedReady.current = true;
        const timer = setTimeout(() => {
          speak(t.sensorCheck.spokenReady);
        }, 600);
        return () => clearTimeout(timer);
      }
    } else if (isCameraReady || micTested) {
      setCalibrationProgress(60);
    } else {
      setCalibrationProgress(20);
    }
  }, [isAllReady, isCameraReady, micTested]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass-card p-6 sm:p-8 space-y-6 max-w-4xl mx-auto"
    >
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-display text-white">
          {t.sensorCheck.title}
        </h2>
        <p className="text-xs sm:text-sm text-health-gray-400 max-w-md mx-auto">
          {t.sensorCheck.spokenCheck}
        </p>
      </div>

      {/* Grid: Camera Preview (Left) & Microphone Gauge (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Camera Live Preview Card */}
        <div className="p-4 bg-health-gray-950 rounded-2xl border border-white border-opacity-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-health-blue-light" />
              {t.sensorCheck.cameraTitle}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                isCameraReady
                  ? 'bg-health-teal bg-opacity-20 border-health-teal text-health-teal'
                  : 'bg-orange-500 bg-opacity-20 border-orange-500 text-orange-400'
              }`}
            >
              {isCameraReady ? copy.sensor.aligned : copy.sensor.alignFace}
            </span>
          </div>

          {/* Camera Frame */}
          <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden border border-health-gray-800 flex items-center justify-center">
            {cameraStatus === 'active' ? (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
              </>
            ) : cameraStatus === 'error' ? (
              <div className="p-4 text-center text-xs text-red-400 flex flex-col items-center gap-1">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <span>{errorMessage || 'Camera access needed'}</span>
              </div>
            ) : (
              <div className="text-xs text-health-gray-500 animate-pulse flex items-center gap-2">
                <Camera className="w-4 h-4 animate-spin" />
                <span>{copy.sensor.initializingCamera}</span>
              </div>
            )}

            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-36 h-48 rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                  isCameraReady
                    ? 'border-health-teal shadow-[0_0_15px_#34C759]'
                    : 'border-health-blue-light border-opacity-60 animate-pulse'
                }`}
              />
            </div>
          </div>

          <p className="text-xs text-health-gray-400 text-center">
            {isCameraReady ? t.sensorCheck.cameraAligned : t.sensorCheck.cameraNeedAdjustment}
          </p>
        </div>

        {/* Microphone Audio Test Card */}
        <div className="p-4 bg-health-gray-950 rounded-2xl border border-white border-opacity-10 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-health-purple-light" />
                {t.sensorCheck.micTitle}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  micTested
                    ? 'bg-health-teal bg-opacity-20 border-health-teal text-health-teal'
                    : 'bg-orange-500 bg-opacity-20 border-orange-500 text-orange-400'
                }`}
              >
                {micTested ? copy.sensor.detected : copy.sensor.speakToTest}
              </span>
            </div>

            <p className="text-xs text-health-gray-400">
              {t.sensorCheck.micDesc}
            </p>

            {/* Animated Audio Volume Visualizer Meter */}
            <div className="space-y-2 p-4 bg-health-gray-900 rounded-xl border border-health-gray-800">
              <div className="flex justify-between text-xs font-semibold text-health-gray-400">
                <span>{copy.sensor.micLevel}</span>
                <span className="font-mono text-health-teal">{micLevel}%</span>
              </div>

              <div className="h-4 bg-health-gray-950 rounded-full overflow-hidden p-0.5 border border-health-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-health-blue via-health-teal to-health-green rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(4, micLevel)}%` }}
                />
              </div>

              <div className="text-center pt-2 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-health-gray-200">
                  {micTested ? (
                    <span className="text-health-teal flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.sensorCheck.micTestSuccess}
                    </span>
                  ) : (
                    <span className="text-health-blue-light animate-pulse flex items-center justify-center gap-1.5">
                      <Volume2 className="w-4 h-4" />
                      {t.sensorCheck.micPrompt}
                    </span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => speak(t.sensorCheck.spokenCheck)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  {copy.sensor.testVoice}
                </button>
              </div>
            </div>
          </div>

          {/* Overall Sensor Calibration Progress */}
          <div className="space-y-1.5 pt-2 border-t border-health-gray-850">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-health-gray-400">
              <span>{copy.sensor.calibrationProgress}</span>
              <span>{calibrationProgress}%</span>
            </div>
            <div className="h-2 bg-health-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-health-teal transition-all duration-300 rounded-full"
                style={{ width: `${calibrationProgress}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Action Button: Proceed to Task 1 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onReady();
          }}
          className="btn-primary w-full py-4 text-base font-bold tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-healthRing"
        >
          <span>{t.sensorCheck.continueBtn}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
