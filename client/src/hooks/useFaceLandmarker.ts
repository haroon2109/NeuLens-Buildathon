import { useEffect, useRef } from 'react';
// Type-only import: the MediaPipe runtime and its WASM are loaded on the facial
// assessment screen, not in the entry bundle of every route.
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { useFaceTrackingStore } from '../store/faceTrackingStore';
import { useScreeningStore } from '../store/screeningStore';
import { applyGazeCalibration } from '../features/screening/ocular/gazeCalibration';

const BLINK_THRESHOLD = 0.20;
const BLINK_COOLDOWN = 200; // ms

export function useFaceLandmarker(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
) {
  const { setPermission, setStatus, updateMetrics } = useFaceTrackingStore();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isDestroyedRef = useRef<boolean>(false);

  // Blink state machine
  const wasClosedRef = useRef<boolean>(false);
  const lastBlinkTimeRef = useRef<number>(0);
  const blinkCountRef = useRef<number>(0);

  // Fixation state
  const prevGazeRef = useRef<string>('Center');
  const prevLeftIrisRef = useRef<{ x: number; y: number } | null>(null);
  const fixationStartRef = useRef<number>(Date.now());

  // Head pose and stability history
  const headPoseHistoryRef = useRef<Array<{ yaw: number; pitch: number; roll: number }>>([]);

  // Eye movement trail (last 20 coordinates)
  const leftIrisHistoryRef = useRef<Array<{ x: number; y: number }>>([]);
  const rightIrisHistoryRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    isDestroyedRef.current = false;
    let localStream: MediaStream | null = null;

    const initialize = async () => {
      try {
        setStatus('starting');
        setPermission('prompt');

        // Request camera permission & active front camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        if (isDestroyedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = stream;
        activeStreamRef.current = stream;
        setPermission('granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to load to play
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
            }
          };
        }

        // Initialize MediaPipe Face Landmarker. The module is imported here so
        // the WASM download only happens when a camera task actually starts.
        const { FilesetResolver, FaceLandmarker: FaceLandmarkerTask } = await import(
          '@mediapipe/tasks-vision'
        );

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );

        const landmarker = await FaceLandmarkerTask.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          outputFaceBlendshapes: true,
          numFaces: 1
        });

        faceLandmarkerRef.current = landmarker;
        setStatus('active');

        // Start processing loop
        startPredictionLoop();

      } catch (err: any) {
        console.error("Failed to initialize Face Landmarker:", err);
        if (isDestroyedRef.current) return;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermission('denied');
          setStatus('error', 'Camera permission denied. Please allow camera access in browser settings.');
        } else {
          setStatus('error', err.message || 'Failed to initialize webcam.');
        }
      }
    };

    initialize();

    return () => {
      isDestroyedRef.current = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  // Re-bind stream whenever currentStep or video element changes
  const { currentStep } = useScreeningStore();
  useEffect(() => {
    if (activeStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = activeStreamRef.current;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => console.warn("Video play error on transition:", e));
        }
      };
    }
  }, [currentStep, videoRef.current]);

  const startPredictionLoop = () => {
    let lastVideoTime = -1;

    const processFrame = () => {
      if (isDestroyedRef.current || !faceLandmarkerRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Adjust canvas size to match video resolution
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const currentTimeMs = performance.now();
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;

            // Run detection
            const results = faceLandmarkerRef.current.detectForVideo(video, currentTimeMs);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const blendshapes = results.faceBlendshapes?.[0]?.categories || [];

              // Calculate Metrics
              const metrics = calculateMetrics(landmarks, blendshapes, video.videoWidth);
              updateMetrics(metrics);

              // Render Overlays
              drawOverlay(ctx, landmarks);
            } else {
              // No face detected, stability drops to 0, confidence etc.
              updateMetrics({
                faceDetected: false,
                gaze: 'Unknown',
                stability: 0
              });
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  const calculateMetrics = (landmarks: any[], blendshapes: any[], videoWidth: number) => {
    // 3D Distance helper
    const dist = (p1: any, p2: any) => 
      Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);

    // Left and Right Iris centers
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];

    // Left/Right eye corners
    const leftInner = landmarks[362];
    const leftOuter = landmarks[263];
    const rightInner = landmarks[133];
    const rightOuter = landmarks[33];

    // Left/Right eye top/bottom
    const leftTop = landmarks[386];
    const leftBottom = landmarks[374];
    const rightTop = landmarks[159];
    const rightBottom = landmarks[145];

    // 1. EAR Calculation
    const leftEAR = (dist(landmarks[385], landmarks[380]) + dist(landmarks[386], landmarks[374])) / (2 * dist(leftInner, leftOuter));
    const rightEAR = (dist(landmarks[159], landmarks[153]) + dist(landmarks[158], landmarks[145])) / (2 * dist(rightOuter, rightInner));
    const ear = (leftEAR + rightEAR) / 2;

    // 2. Blink state machine
    const now = Date.now();
    let updatedBlinkCount = blinkCountRef.current;
    
    // Map blendshape triggers if available, fallback to EAR
    const blendshapeMap = blendshapes.reduce((acc: any, curr: any) => {
      acc[curr.categoryName] = curr.score;
      return acc;
    }, {});

    const isBlinkingLeft = blendshapeMap['eyeBlinkLeft'] !== undefined ? blendshapeMap['eyeBlinkLeft'] > 0.5 : leftEAR < BLINK_THRESHOLD;
    const isBlinkingRight = blendshapeMap['eyeBlinkRight'] !== undefined ? blendshapeMap['eyeBlinkRight'] > 0.5 : rightEAR < BLINK_THRESHOLD;
    const blinkIntensity = Math.round(( (blendshapeMap['eyeBlinkLeft'] || (1 - leftEAR * 3)) + (blendshapeMap['eyeBlinkRight'] || (1 - rightEAR * 3)) ) / 2 * 100);

    if ((isBlinkingLeft || isBlinkingRight) && ear < 0.22) {
      if (!wasClosedRef.current && (now - lastBlinkTimeRef.current) > BLINK_COOLDOWN) {
        wasClosedRef.current = true;
        blinkCountRef.current += 1;
        updatedBlinkCount = blinkCountRef.current;
        lastBlinkTimeRef.current = now;
      }
    } else if (ear > 0.24 && !isBlinkingLeft && !isBlinkingRight) {
      wasClosedRef.current = false;
    }

    // 3. Gaze Estimation
    let gaze: 'Center' | 'Left' | 'Right' | 'Up' | 'Down' | 'Unknown' = 'Center';
    let screenGaze: { x: number; y: number } | null = null;
    let gazeRatio: { x: number; y: number } | null = null;
    if (leftIris && rightIris) {
      const ratioL = (leftIris.x - leftInner.x) / (leftOuter.x - leftInner.x);
      const ratioR = (rightIris.x - rightOuter.x) / (rightInner.x - rightOuter.x);
      const gazeX = (ratioL + ratioR) / 2;

      const ratioY_L = (leftIris.y - leftTop.y) / (leftBottom.y - leftTop.y);
      const ratioY_R = (rightIris.y - rightTop.y) / (rightBottom.y - rightTop.y);
      const gazeY = (ratioY_L + ratioY_R) / 2;

      // Threshold definitions (mirror/camera mapping coordinates)
      if (gazeX < 0.44) {
        gaze = 'Right'; // Patient's left / camera right
      } else if (gazeX > 0.56) {
        gaze = 'Left';  // Patient's right / camera left
      } else if (gazeY < 0.42) {
        gaze = 'Up';
      } else if (gazeY > 0.58) {
        gaze = 'Down';
      }

      // Map the raw iris ratio to screen percentages. With a completed
      // calibration this is a person-specific affine fit; otherwise it falls
      // back to the fixed mapping and is reported as uncalibrated.
      gazeRatio = { x: gazeX, y: gazeY };
      screenGaze = applyGazeCalibration(useFaceTrackingStore.getState().calibration, gazeRatio);
    }

    // Interocular pixel distance: a rough proxy for how far the person sits.
    const interocularPx = leftOuter && rightOuter
      ? Math.round(Math.hypot(leftOuter.x - rightOuter.x, leftOuter.y - rightOuter.y) * (videoWidth || 640))
      : 0;

    // 4. Fixation Duration
    let fixationDuration = 0;
    if (leftIris) {
      const irisCurrent = { x: leftIris.x, y: leftIris.y };
      const prevIris = prevLeftIrisRef.current;

      if (prevIris && gaze === prevGazeRef.current && dist(irisCurrent, prevIris) < 0.015) {
        fixationDuration = Number(((now - fixationStartRef.current) / 1000).toFixed(1));
      } else {
        fixationStartRef.current = now;
        prevLeftIrisRef.current = irisCurrent;
        prevGazeRef.current = gaze;
      }
    }

    // 5. Head Pose Approximation
    const nose = landmarks[4];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    
    let yaw = 0, pitch = 0, roll = 0;
    if (nose && leftOuter && rightOuter && forehead && chin) {
      // Roll: Angle of facial axis relative to eyes
      const dy = leftOuter.y - rightOuter.y;
      const dx = leftOuter.x - rightOuter.x;
      roll = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));

      // Yaw: Nose center offset
      const eyeCenter = {
        x: (leftOuter.x + rightOuter.x) / 2,
        y: (leftOuter.y + rightOuter.y) / 2
      };
      const eyeDist = dist(leftOuter, rightOuter);
      yaw = Math.round(((nose.x - eyeCenter.x) / eyeDist) * -90);

      // Pitch: Nose height ratio
      const faceHeight = dist(forehead, chin);
      const noseProj = (nose.y - forehead.y) / (chin.y - forehead.y);
      pitch = Math.round((noseProj - 0.45) * -90);
    }

    // 6. Facial Stability
    headPoseHistoryRef.current.push({ yaw, pitch, roll });
    if (headPoseHistoryRef.current.length > 15) {
      headPoseHistoryRef.current.shift();
    }
    
    let stability = 100;
    if (headPoseHistoryRef.current.length > 5) {
      // Compute standard deviation of rotation angles
      const yaws = headPoseHistoryRef.current.map(h => h.yaw);
      const pitches = headPoseHistoryRef.current.map(h => h.pitch);
      const meanYaw = yaws.reduce((s, x) => s + x, 0) / yaws.length;
      const meanPitch = pitches.reduce((s, x) => s + x, 0) / pitches.length;
      const varYaw = yaws.reduce((s, x) => s + (x - meanYaw) ** 2, 0) / yaws.length;
      const varPitch = pitches.reduce((s, x) => s + (x - meanPitch) ** 2, 0) / pitches.length;
      const stdDev = Math.sqrt(varYaw + varPitch);
      stability = Math.max(0, Math.min(100, Math.round(100 - (stdDev * 8))));
    }

    // 7. Expressions
    let smile = 0;
    let jawMovement = 0;
    let eyebrows = 0;

    if (blendshapes.length > 0) {
      smile = Math.round(((blendshapeMap['mouthSmileLeft'] || 0) + (blendshapeMap['mouthSmileRight'] || 0)) / 2 * 100);
      jawMovement = Math.round((blendshapeMap['jawOpen'] || 0) * 100);
      eyebrows = Math.round(((blendshapeMap['browOuterUpLeft'] || 0) + (blendshapeMap['browOuterUpRight'] || 0) + (blendshapeMap['browInnerUp'] || 0)) / 3 * 100);
    } else {
      // Fallback geometric ratios
      const mouthWidth = dist(landmarks[61], landmarks[291]);
      const faceWidth = dist(landmarks[234], landmarks[454]);
      smile = Math.min(100, Math.max(0, Math.round(((mouthWidth / faceWidth) - 0.32) * 400)));

      const lipHeight = dist(landmarks[13], landmarks[14]);
      const eyeDist = dist(leftOuter, rightOuter);
      jawMovement = Math.min(100, Math.max(0, Math.round((lipHeight / eyeDist) * 180)));

      const browDistL = dist(landmarks[70], landmarks[159]);
      eyebrows = Math.min(100, Math.max(0, Math.round(((browDistL / eyeDist) - 0.42) * 250)));
    }

    // Capture iris coordinates
    const leftIrisCoords = leftIris ? { x: leftIris.x, y: leftIris.y } : null;
    const rightIrisCoords = rightIris ? { x: rightIris.x, y: rightIris.y } : null;

    // Track iris coordinates in history for movement trail
    if (leftIrisCoords) {
      leftIrisHistoryRef.current.push(leftIrisCoords);
      if (leftIrisHistoryRef.current.length > 20) leftIrisHistoryRef.current.shift();
    }
    if (rightIrisCoords) {
      rightIrisHistoryRef.current.push(rightIrisCoords);
      if (rightIrisHistoryRef.current.length > 20) rightIrisHistoryRef.current.shift();
    }

    return {
      faceDetected: true,
      leftIris: leftIrisCoords,
      rightIris: rightIrisCoords,
      blinkCount: updatedBlinkCount,
      ear: Number(ear.toFixed(3)),
      gaze,
      fixationDuration,
      smile,
      jawMovement,
      eyebrows,
      headPose: { yaw, pitch, roll },
      blinkIntensity: Math.min(100, Math.max(0, blinkIntensity)),
      stability,
      screenGaze,
      gazeRatio,
      interocularPx
    };
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw Constellation mesh dots
    ctx.fillStyle = 'rgba(0, 122, 255, 0.45)';
    landmarks.forEach((l) => {
      ctx.beginPath();
      ctx.arc(l.x * width, l.y * height, 1.2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Drawing Path helper
    const drawPath = (indices: number[], color: string, lineWidth: number = 1.5, close: boolean = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      indices.forEach((idx, i) => {
        const l = landmarks[idx];
        if (l) {
          const x = l.x * width;
          const y = l.y * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      if (close) ctx.closePath();
      ctx.stroke();
    };

    // Index mappings for features
    const oval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
    const leftEye = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263];
    const rightEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 246, 161, 160, 159, 158, 157, 173, 33];
    const leftEyebrow = [70, 63, 105, 66, 107];
    const rightEyebrow = [300, 293, 334, 296, 336];
    const lipsOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 95, 88, 61];
    const noseBridge = [168, 6, 197, 195, 5, 4];
    const noseBottom = [98, 97, 2, 327, 326];

    // Draw main contour paths
    drawPath(oval, 'rgba(100, 210, 255, 0.2)', 1.2);
    drawPath(leftEye, 'rgba(100, 210, 255, 0.45)', 1.5);
    drawPath(rightEye, 'rgba(100, 210, 255, 0.45)', 1.5);
    drawPath(leftEyebrow, 'rgba(100, 210, 255, 0.35)', 1.5);
    drawPath(rightEyebrow, 'rgba(100, 210, 255, 0.35)', 1.5);
    drawPath(lipsOuter, 'rgba(255, 45, 85, 0.35)', 1.5);
    drawPath(noseBridge, 'rgba(100, 210, 255, 0.25)', 1.5);
    drawPath(noseBottom, 'rgba(100, 210, 255, 0.25)', 1.5);

    // Draw Bounding Box around landmarks
    const xs = landmarks.map(pt => pt.x);
    const ys = landmarks.map(pt => pt.y);
    const minX = Math.min(...xs) * width;
    const maxX = Math.max(...xs) * width;
    const minY = Math.min(...ys) * height;
    const maxY = Math.max(...ys) * height;

    const boxPadding = 10;
    const x = Math.max(0, minX - boxPadding);
    const y = Math.max(0, minY - boxPadding);
    const w = Math.min(width - x, (maxX - minX) + 2 * boxPadding);
    const h = Math.min(height - y, (maxY - minY) + 2 * boxPadding);

    ctx.strokeStyle = 'rgba(0, 122, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Draw Corner Brackets on bounding box
    const bracketLen = 15;
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 2.5;

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(x, y + bracketLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketLen, y);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(x + w - bracketLen, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + bracketLen);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(x, y + h - bracketLen);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + bracketLen, y + h);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(x + w - bracketLen, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - bracketLen);
    ctx.stroke();

    // Draw Irises
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    if (leftIris) {
      ctx.fillStyle = '#64D2FF';
      ctx.beginPath();
      ctx.arc(leftIris.x * width, leftIris.y * height, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (rightIris) {
      ctx.fillStyle = '#64D2FF';
      ctx.beginPath();
      ctx.arc(rightIris.x * width, rightIris.y * height, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw Eye Movement Trail (fading line)
    const drawTrail = (trail: Array<{ x: number; y: number }>) => {
      if (trail.length < 2) return;
      for (let i = 1; i < trail.length; i++) {
        const p1 = trail[i - 1];
        const p2 = trail[i];
        const opacity = i / trail.length;
        ctx.strokeStyle = `rgba(100, 210, 255, ${opacity * 0.7})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    };
    drawTrail(leftIrisHistoryRef.current);
    drawTrail(rightIrisHistoryRef.current);
  };
}
