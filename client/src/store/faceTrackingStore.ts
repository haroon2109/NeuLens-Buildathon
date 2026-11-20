import { create } from 'zustand';
import type { GazeCalibration, GazeRatio } from '../features/screening/ocular/gazeCalibration';

export interface FaceTrackingMetrics {
  /** True only while the current frame contains a detected face. */
  faceDetected: boolean;
  leftIris: { x: number; y: number } | null;
  rightIris: { x: number; y: number } | null;
  blinkCount: number;
  ear: number; // Eye Aspect Ratio
  gaze: 'Center' | 'Left' | 'Right' | 'Up' | 'Down' | 'Unknown';
  fixationDuration: number; // in seconds
  smile: number; // percentage 0-100
  jawMovement: number; // percentage 0-100
  eyebrows: number; // percentage 0-100
  headPose: { yaw: number; pitch: number; roll: number };
  blinkIntensity: number; // percentage 0-100
  stability: number; // percentage 0-100
  screenGaze: { x: number; y: number } | null;
  /** Raw iris ratio from MediaPipe, before calibration. */
  gazeRatio: GazeRatio | null;
  /** Pixel distance between the outer eye corners — a distance proxy. */
  interocularPx: number;
}

interface FaceTrackingState {
  cameraPermission: 'prompt' | 'granted' | 'denied';
  cameraStatus: 'off' | 'starting' | 'active' | 'error';
  errorMessage: string;
  metrics: FaceTrackingMetrics;
  calibration: GazeCalibration | null;
  
  setPermission: (permission: 'prompt' | 'granted' | 'denied') => void;
  setStatus: (status: 'off' | 'starting' | 'active' | 'error', error?: string) => void;
  updateMetrics: (metrics: Partial<FaceTrackingMetrics>) => void;
  setCalibration: (calibration: GazeCalibration | null) => void;
  resetTracking: () => void;
}

const initialMetrics: FaceTrackingMetrics = {
  faceDetected: false,
  leftIris: null,
  rightIris: null,
  blinkCount: 0,
  ear: 0.3,
  gaze: 'Unknown',
  fixationDuration: 0,
  smile: 0,
  jawMovement: 0,
  eyebrows: 0,
  headPose: { yaw: 0, pitch: 0, roll: 0 },
  blinkIntensity: 0,
  stability: 100,
  screenGaze: null,
  gazeRatio: null,
  interocularPx: 0,
};

export const useFaceTrackingStore = create<FaceTrackingState>((set) => ({
  cameraPermission: 'prompt',
  cameraStatus: 'off',
  errorMessage: '',
  metrics: initialMetrics,
  calibration: null,

  setPermission: (permission) => set({ cameraPermission: permission }),
  
  setStatus: (status, error = '') => set({ cameraStatus: status, errorMessage: error }),
  
  updateMetrics: (newMetrics) => set((state) => ({
    metrics: { ...state.metrics, ...newMetrics }
  })),

  setCalibration: (calibration) => set({ calibration }),

  resetTracking: () => set({
    metrics: initialMetrics,
    cameraStatus: 'off',
    errorMessage: '',
    calibration: null,
  }),
}));
