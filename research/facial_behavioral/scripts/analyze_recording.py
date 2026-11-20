#!/usr/bin/env python3
"""Analyze a consented/synthetic facial/behavioural recording (research observations only).

Focus areas: face landmark detection, head pose estimation, eye-region tracking proxies,
movement consistency, video quality, and task-related response timing/duration.

- Uses OpenCV for video/quality metrics.
- Uses MediaPipe Face Mesh (if installed) for landmarks, head pose (solvePnP approx),
  and eye-region proxies. Degrades gracefully without MediaPipe.

NOT emotion detection and NOT a cognitive/clinical determinant.
Keep recordings private/consented; store derived summaries per terms.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import pandas as pd
from tqdm import tqdm


# Subset of Face Mesh landmark indices (approx) for pose/eyes
# Nose tip, chin, left eye outer, right eye outer, left mouth, right mouth
POSE_LANDMARKS = [1, 152, 33, 263, 61, 291]
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]


def try_init_face_mesh():
    try:
        import mediapipe as mp  # type: ignore

        fm = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        return fm, mp
    except Exception:
        return None, None


def estimate_head_pose(landmarks, w: int, h: int) -> Optional[Tuple[float, float, float]]:
    try:
        image_points = np.array([
            (landmarks[i].x * w, landmarks[i].y * h) for i in POSE_LANDMARKS
        ], dtype=np.float64)
        model_points = np.array([
            (0.0, 0.0, 0.0),        # nose tip
            (0.0, -330.0, -65.0),    # chin
            (-225.0, 170.0, -135.0), # left eye left corner
            (225.0, 170.0, -135.0),  # right eye right corner
            (-150.0, -150.0, -125.0),# left mouth
            (150.0, -150.0, -125.0), # right mouth
        ], dtype=np.float64)
        focal = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([[focal, 0, center[0]], [0, focal, center[1]], [0, 0, 1]], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))
        ok, rvec, tvec = cv2.solvePnP(model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE)
        if not ok:
            return None
        rmat, _ = cv2.Rodrigues(rvec)
        # rotation matrix to euler angles (pitch, yaw, roll) in degrees
        sy = math.sqrt(rmat[0, 0] * rmat[0, 0] + rmat[1, 0] * rmat[1, 0])
        singular = sy < 1e-6
        if not singular:
            pitch = math.degrees(math.atan2(rmat[2, 1], rmat[2, 2]))
            yaw = math.degrees(math.atan2(-rmat[2, 0], sy))
            roll = math.degrees(math.atan2(rmat[1, 0], rmat[0, 0]))
        else:
            pitch = math.degrees(math.atan2(-rmat[1, 2], rmat[1, 1]))
            yaw = math.degrees(math.atan2(-rmat[2, 0], sy))
            roll = 0.0
        return float(pitch), float(yaw), float(roll)
    except Exception:
        return None


def eye_openness_proxy(landmarks, idxs: List[int], w: int, h: int) -> Optional[float]:
    try:
        pts = np.array([(landmarks[i].x * w, landmarks[i].y * h) for i in idxs], dtype=np.float64)
        # vertical distances / horizontal distance (EAR-like proxy)
        v1 = np.linalg.norm(pts[1] - pts[5])
        v2 = np.linalg.norm(pts[2] - pts[4])
        hz = np.linalg.norm(pts[0] - pts[3])
        if hz < 1e-6:
            return None
        return float((v1 + v2) / (2.0 * hz))
    except Exception:
        return None


def landmark_centroid(landmarks, w: int, h: int) -> Optional[np.ndarray]:
    try:
        pts = np.array([(lm.x * w, lm.y * h) for lm in landmarks], dtype=np.float64)
        return pts.mean(axis=0)
    except Exception:
        return None


def blur_score(gray: np.ndarray) -> float:
    try:
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())
    except Exception:
        return float("nan")


def safe_stats(vals: List[float]) -> Dict[str, Optional[float]]:
    arr = np.array([v for v in vals if v is not None and not (isinstance(v, float) and np.isnan(v))], dtype=np.float64)
    if arr.size == 0:
        return {"mean": None, "std": None, "min": None, "max": None}
    return {"mean": float(arr.mean()), "std": float(arr.std()), "min": float(arr.min()), "max": float(arr.max())}


def main() -> int:
    ap = argparse.ArgumentParser(description="Analyze facial/behavioural recording (research observations)")
    ap.add_argument("--input", required=True, help="Video file path (consented/synthetic)")
    ap.add_argument("--out-dir", default="runs/analysis", help="Output directory for metrics")
    ap.add_argument("--max-frames", type=int, default=0, help="0 = all frames")
    args = ap.parse_args()

    in_path = Path(args.input)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(in_path))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {in_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    duration_sec = (frame_count / fps) if fps > 0 else None

    face_mesh, _mp = try_init_face_mesh()
    rows: List[dict] = []
    prev_centroid = None
    movement_vals: List[float] = []

    idx = 0
    pbar = tqdm(total=(args.max_frames if args.max_frames else frame_count) or None, desc="frames")
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if args.max_frames and idx >= args.max_frames:
            break
        t_sec = (idx / fps) if fps > 0 else None
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(gray.mean())
        blur = blur_score(gray)

        face_detected = False
        pitch = yaw = roll = None
        left_eye_open = right_eye_open = None
        movement = None

        if face_mesh is not None:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = face_mesh.process(rgb)
            if res.multi_face_landmarks:
                lms = res.multi_face_landmarks[0].landmark
                face_detected = True
                pose = estimate_head_pose(lms, width, height)
                if pose:
                    pitch, yaw, roll = pose
                left_eye_open = eye_openness_proxy(lms, LEFT_EYE, width, height)
                right_eye_open = eye_openness_proxy(lms, RIGHT_EYE, width, height)
                c = landmark_centroid(lms, width, height)
                if c is not None and prev_centroid is not None:
                    movement = float(np.linalg.norm(c - prev_centroid))
                    movement_vals.append(movement)
                if c is not None:
                    prev_centroid = c
            else:
                prev_centroid = None

        rows.append({
            "frame": idx,
            "time_sec": round(t_sec, 4) if t_sec is not None else None,
            "face_detected": face_detected,
            "brightness_mean": round(brightness, 3),
            "blur_laplacian_var": round(blur, 3) if not np.isnan(blur) else None,
            "head_pitch_deg": round(pitch, 3) if pitch is not None else None,
            "head_yaw_deg": round(yaw, 3) if yaw is not None else None,
            "head_roll_deg": round(roll, 3) if roll is not None else None,
            "left_eye_openness": round(left_eye_open, 5) if left_eye_open is not None else None,
            "right_eye_openness": round(right_eye_open, 5) if right_eye_open is not None else None,
            "movement_px": round(movement, 4) if movement is not None else None,
        })
        idx += 1
        pbar.update(1)
    pbar.close()
    cap.release()
    if face_mesh is not None:
        face_mesh.close()

    df = pd.DataFrame(rows)
    df.to_csv(out_dir / "frame_metrics.csv", index=False)

    detected = df["face_detected"].sum() if "face_detected" in df else 0
    detection_rate = float(detected / len(df)) if len(df) else None
    mov = [v for v in df.get("movement_px", pd.Series(dtype=float)).tolist() if v is not None and not pd.isna(v)]
    mov_arr = np.array(mov, dtype=np.float64) if mov else np.array([], dtype=np.float64)
    # movement consistency: lower coefficient of variation / std over magnitude indicates steadier movement pattern
    mov_consistency = None
    if mov_arr.size > 1 and mov_arr.mean() > 1e-6:
        mov_consistency = float(1.0 / (1.0 + (mov_arr.std() / mov_arr.mean())))

    summary = {
        "input": str(in_path),
        "video_quality": {"width": width, "height": height, "fps": fps, "frame_count_reported": frame_count, "frames_analyzed": len(df), "duration_sec": round(duration_sec, 4) if duration_sec else None, "brightness": safe_stats(df["brightness_mean"].tolist() if len(df) else []), "blur_laplacian_var": safe_stats(df["blur_laplacian_var"].tolist() if len(df) else [])},
        "landmark_detection": {"mediapipe_face_mesh_used": face_mesh is not None, "detection_rate": detection_rate, "frames_with_face": int(detected)},
        "head_pose_deg": {"pitch": safe_stats(df["head_pitch_deg"].tolist() if len(df) else []), "yaw": safe_stats(df["head_yaw_deg"].tolist() if len(df) else []), "roll": safe_stats(df["head_roll_deg"].tolist() if len(df) else [])},
        "eye_region_tracking_proxy": {"left_eye_openness": safe_stats(df["left_eye_openness"].tolist() if len(df) else []), "right_eye_openness": safe_stats(df["right_eye_openness"].tolist() if len(df) else []), "note": "EAR-like openness proxy from landmarks; quality/tracking signal only"},
        "movement_consistency": {"movement_px": safe_stats(mov), "consistency_index_0_1": mov_consistency, "note": "Derived from frame-to-frame landmark centroid motion; higher index => more consistent magnitude"},
        "timing": {"duration_sec": round(duration_sec, 4) if duration_sec else None, "analysis_window_frames": len(df), "note": "Align with task event timestamps externally for task-related response timing"},
        "disclaimer": "Research observations only. Not emotion detection and not a cognitive/clinical determinant. Use only consented/synthetic recordings per ethics and licence terms.",
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2))

    print(json.dumps({k: summary[k] for k in ["video_quality", "landmark_detection", "movement_consistency", "timing"]}, indent=2))
    print(f"Saved: {out_dir / 'frame_metrics.csv'} and {out_dir / 'summary.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
