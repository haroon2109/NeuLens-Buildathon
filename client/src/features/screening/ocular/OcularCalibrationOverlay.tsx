import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Loader2, RotateCcw, SkipForward } from 'lucide-react';
import { useFaceTrackingStore } from '../../../store/faceTrackingStore';
import { useScreeningCopy } from '../screeningCopy';
import {
  CALIBRATION_DWELL_MS,
  CALIBRATION_TARGETS,
  fitGazeCalibration,
  type CalibrationSample,
  type GazeCalibration,
  type ScreenPoint,
} from './gazeCalibration';

/**
 * Guided camera calibration.
 *
 * The person looks at five on-screen points in turn. For each point we average
 * the iris ratio over a short dwell and then fit a person-specific mapping.
 * Calibration is optional: if the fit is unreliable the activity can continue
 * with the default mapping, and the session is recorded as uncalibrated.
 */

const SETTLE_MS = 450;
const SAMPLE_MS = 80;
const MIN_STABILITY = 20;

interface Props {
  onComplete: (calibration: GazeCalibration | null) => void;
  patientMode?: boolean;
}

export const OcularCalibrationOverlay: React.FC<Props> = ({ onComplete, patientMode = false }) => {
  const copy = useScreeningCopy();
  const { metrics, cameraStatus, cameraPermission, calibration } = useFaceTrackingStore();
  const [index, setIndex] = useState(0);
  const [isFitting, setIsFitting] = useState(false);
  const [result, setResult] = useState<GazeCalibration | null>(null);
  const [failure, setFailure] = useState<'eyes' | 'fit' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const samplesRef = useRef<CalibrationSample[]>([]);
  const calibratedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const target: ScreenPoint | undefined = CALIBRATION_TARGETS[index];
  const cameraReady = cameraStatus === 'active' && cameraPermission === 'granted';

  // Stored calibration from an earlier run in this session is reusable.
  useEffect(() => {
    if (calibration?.reliable && !calibratedRef.current) {
      calibratedRef.current = true;
      onCompleteRef.current(calibration);
    }
  }, [calibration]);

  useEffect(() => {
    if (!cameraReady || !target || isFitting || calibratedRef.current) return;

    let cancelled = false;
    const collected: { x: number; y: number }[] = [];
    setFailure(null);

    const settle = window.setTimeout(() => {
      const sampler = window.setInterval(() => {
        const { metrics: live } = useFaceTrackingStore.getState();
        if (!live.gazeRatio || live.gaze === 'Unknown' || live.stability < MIN_STABILITY) return;
        collected.push(live.gazeRatio);
      }, SAMPLE_MS);

      const finish = window.setTimeout(() => {
        window.clearInterval(sampler);
        if (cancelled) return;

        if (collected.length < 3) {
          setFailure('eyes');
          return;
        }

        const ratio = {
          x: collected.reduce((sum, value) => sum + value.x, 0) / collected.length,
          y: collected.reduce((sum, value) => sum + value.y, 0) / collected.length,
        };
        samplesRef.current.push({ ratio, screen: target });

        if (index + 1 < CALIBRATION_TARGETS.length) {
          setIndex(index + 1);
          return;
        }

        setIsFitting(true);
        const fitted = fitGazeCalibration(samplesRef.current);
        setResult(fitted);
        if (fitted?.reliable) {
          calibratedRef.current = true;
          useFaceTrackingStore.getState().setCalibration(fitted);
          onCompleteRef.current(fitted);
        } else {
          setFailure('fit');
        }
        setIsFitting(false);
      }, CALIBRATION_DWELL_MS);

      return () => window.clearTimeout(finish);
    }, SETTLE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
    };
  }, [cameraReady, index, attempt, isFitting, target]);

  const retry = useCallback(() => {
    samplesRef.current = [];
    setFailure(null);
    setResult(null);
    setIndex(0);
    setAttempt((value) => value + 1);
  }, []);

  const useEarlierCalibration = useCallback(() => {
    if (result?.reliable) {
      onCompleteRef.current(result);
      return;
    }
    onCompleteRef.current(null);
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <div className="w-10 h-10 rounded-full bg-medical-50 border border-medical-200 text-medical-600 flex items-center justify-center mx-auto mb-2">
          <Eye className="w-5 h-5" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900">{copy.calibration.title}</h3>
        <p className={`text-sm max-w-md mx-auto ${patientMode ? 'text-slate-600' : 'text-slate-500'}`}>
          {copy.calibration.body}
        </p>
      </div>

      {!cameraReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {cameraStatus === 'error' || cameraPermission === 'denied'
            ? copy.calibration.cameraUnavailable
            : copy.calibration.starting}
          <button
            type="button"
            onClick={() => onCompleteRef.current(null)}
            className="mt-3 block w-full rounded-xl border border-amber-300 bg-white py-2 text-xs font-bold text-amber-800"
          >
            {copy.calibration.continueWithout}
          </button>
        </div>
      ) : (
        <div
          className={`relative h-72 w-full overflow-hidden rounded-2xl border ${
            patientMode ? 'border-slate-200 bg-slate-50' : 'border-health-gray-850 bg-health-gray-950'
          }`}
        >
          <div className="absolute inset-x-0 top-4 z-10 text-center">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-xs">
              {copy.calibration.pointOf(Math.min(index + 1, CALIBRATION_TARGETS.length), CALIBRATION_TARGETS.length)}
            </span>
          </div>

          {isFitting ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.calibration.checking}
            </div>
          ) : (
            target && (
              <div
                className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${target.x}%`, top: `${target.y}%` }}
              >
                <span className="absolute h-12 w-12 animate-ping rounded-full bg-medical-400/20" />
                <span className="h-5 w-5 rounded-full bg-medical-600 shadow-md ring-4 ring-white" />
              </div>
            )
          )}

          {metrics.gazeRatio && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-500">
              Eyes detected
            </div>
          )}
        </div>
      )}

      {failure && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p>{failure === 'eyes' ? copy.calibration.failedEyes : copy.calibration.failedFit}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={retry}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white py-2 text-xs font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {copy.calibration.tryAgain}
            </button>
            <button
              type="button"
              onClick={useEarlierCalibration}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white py-2 text-xs font-bold"
            >
              <SkipForward className="h-3.5 w-3.5" /> {copy.calibration.continueAnyway}
            </button>
          </div>
        </div>
      )}

      {!failure && cameraReady && (
        <p className="text-center text-xs text-slate-400">
          {copy.calibration.distance}
        </p>
      )}
    </div>
  );
};
