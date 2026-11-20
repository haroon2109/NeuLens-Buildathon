"""Signal feature extraction.

These functions work on numbers the browser already computes at the edge
(MediaPipe landmarks, Web Audio FFT amplitudes). They do not need model
weights, so they run deterministically and are unit-testable. Model-backed
inference is a separate, feature-flagged step.

Terminology matters here: outputs are *observations* that a clinician may
review, not diagnostic measurements.
"""

from __future__ import annotations

import math
import statistics
from typing import Iterable, Sequence

BEHAVIOUR_NOTE = (
    "Observable behaviour during a guided facial activity. Not an emotion "
    "classification, diagnosis or cognitive marker."
)

PAUSE_THRESHOLD = 0.02  # normalised amplitude under which a frame is silence
PAUSE_MIN_MS = 250
BLINK_EAR_THRESHOLD = 0.2
BLINK_DEBOUNCE_MS = 200


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def voice_features(
    amplitudes: Sequence[float],
    frame_ms: int,
    pitches_hz: Sequence[float] | None = None,
    syllable_count: int | None = None,
) -> dict[str, float | int | None]:
    """Derive pause cadence, jitter and shimmer from edge-computed frames."""

    if not amplitudes:
        return {
            "duration_seconds": 0.0,
            "pause_count": 0,
            "speech_rate": None,
            "pause_score": None,
            "jitter": None,
            "shimmer": None,
        }

    frames = list(amplitudes)
    pause_frames_needed = math.ceil(PAUSE_MIN_MS / max(frame_ms, 1))

    pauses = 0
    run = 0
    for value in frames:
        if abs(value) < PAUSE_THRESHOLD:
            run += 1
            if run == pause_frames_needed:
                pauses += 1
        else:
            run = 0

    duration_seconds = len(frames) * frame_ms / 1000
    peak = max(abs(value) for value in frames) or 1e-9

    # Shimmer: frame-to-frame amplitude perturbation, relative to mean amplitude.
    mean_amp = statistics.fmean(abs(value) for value in frames) or 1e-9
    diffs = [abs(frames[i] - frames[i - 1]) for i in range(1, len(frames))]
    shimmer = (statistics.fmean(diffs) / mean_amp) * 100 if diffs else 0.0

    jitter: float | None = None
    if pitches_hz:
        voiced = [p for p in pitches_hz if p and p > 0]
        if len(voiced) > 1:
            mean_pitch = statistics.fmean(voiced)
            jitter = (
                statistics.fmean(abs(voiced[i] - voiced[i - 1]) for i in range(1, len(voiced)))
                / mean_pitch
                * 100
            )

    speech_rate = None
    if syllable_count and duration_seconds > 0:
        speech_rate = round((syllable_count / duration_seconds) * 60, 2)

    return {
        "duration_seconds": round(duration_seconds, 2),
        "pause_count": pauses,
        "speech_rate": speech_rate,
        "pause_score": round(_clamp(100 - pauses * 10), 2),
        "jitter": round(jitter, 3) if jitter is not None else None,
        "shimmer": round(shimmer, 3),
        "peak_amplitude": round(peak, 4),
    }


def ocular_features(
    gaze: Sequence[dict[str, float]],
    ear: Sequence[float] | None = None,
    saccade_velocity_threshold: float = 1.0,
) -> dict[str, float | int | None]:
    """Saccade count, fixation stability and blink rate from gaze samples.

    ``gaze`` items are ``{"x": 0..1, "y": 0..1, "t": ms}`` in capture order.
    Velocity is normalised screen widths per second; the default threshold of
    1.0 width/s keeps ordinary drift out of the saccade count while catching
    a genuine glance across the screen.
    """

    if len(gaze) < 2:
        return {
            "sample_count": len(gaze),
            "saccade_count": 0,
            "reaction_time": None,
            "fixation_score": None,
            "blink_rate": None,
            "gaze_dispersion": None,
        }

    saccades = 0
    movement = []
    for previous, current in zip(gaze, gaze[1:]):
        dt = max(current["t"] - previous["t"], 1)
        dx = current["x"] - previous["x"]
        dy = current["y"] - previous["y"]
        velocity = math.hypot(dx, dy) / (dt / 1000)
        movement.append(velocity)
        if velocity >= saccade_velocity_threshold:
            saccades += 1

    moving_frames = [velocity for velocity in movement if velocity > 0.001]
    reaction_time = None
    if moving_frames:
        first_index = next(
            (index for index, velocity in enumerate(movement) if velocity >= saccade_velocity_threshold),
            None,
        )
        if first_index is not None:
            reaction_time = round(gaze[first_index + 1]["t"] - gaze[0]["t"], 2)

    xs = [point["x"] for point in gaze]
    ys = [point["y"] for point in gaze]
    dispersion = math.hypot(statistics.pstdev(xs), statistics.pstdev(ys))
    fixation_score = _clamp(100 - dispersion * 1000)

    blink_rate = None
    if ear:
        values = list(ear)
        total_ms = max(gaze[-1]["t"] - gaze[0]["t"], 1)
        blinks = 0
        last_blink_t = -BLINK_DEBOUNCE_MS - 1
        for index, value in enumerate(values):
            if value < BLINK_EAR_THRESHOLD:
                timestamp = gaze[min(index, len(gaze) - 1)]["t"]
                if timestamp - last_blink_t > BLINK_DEBOUNCE_MS:
                    blinks += 1
                    last_blink_t = timestamp
        blink_rate = round(blinks / (total_ms / 60000), 2)

    return {
        "sample_count": len(gaze),
        "saccade_count": saccades,
        "reaction_time": reaction_time,
        "fixation_score": round(fixation_score, 2),
        "blink_rate": blink_rate,
        "gaze_dispersion": round(dispersion, 4),
    }


def facial_features(frames: Sequence[dict[str, float]]) -> dict[str, float | None]:
    """Bilateral symmetry and micro-tremor from blendshape frames."""

    if not frames:
        return {
            "frame_count": 0,
            "symmetry": None,
            "tremor_score": None,
            "smile_intensity": None,
            "jaw_stability": None,
        }

    asymmetries = []
    smiles = []
    jaws = []
    for frame in frames:
        left = frame.get("smile_left", 0.0)
        right = frame.get("smile_right", 0.0)
        smiles.append((left + right) / 2)
        jaws.append(frame.get("jaw_open", 0.0))
        scale = max(left, right, 1e-6)
        asymmetries.append(abs(left - right) / scale)

    jaw_diffs = [abs(jaws[i] - jaws[i - 1]) for i in range(1, len(jaws))]

    return {
        "frame_count": len(frames),
        "symmetry": round(_clamp(100 - statistics.fmean(asymmetries) * 100), 2),
        "tremor_score": round(statistics.fmean(jaw_diffs) * 100 if jaw_diffs else 0.0, 2),
        "smile_intensity": round(statistics.fmean(smiles) * 100, 2),
        "jaw_stability": round(_clamp(100 - statistics.fmean(jaw_diffs) * 200), 2),
    }


def behavioural_features(
    frames: Sequence[dict[str, float | bool]],
    response_latencies_ms: Sequence[float] | None = None,
    prompts_completed: int | None = None,
) -> dict[str, object]:
    """Observable behaviour during a facial activity.

    Head movement, facial movement, movement consistency, response timing and
    camera tracking quality. This is not emotion recognition and not a marker
    of cognitive status; it describes what the camera could see during a guided
    task.
    """

    latencies = [float(value) for value in (response_latencies_ms or []) if value >= 0]

    if not frames:
        return {
            "sample_count": 0,
            "duration_seconds": 0.0,
            "face_presence_ratio": 0.0,
            "head": {
                "mean_angular_speed_deg_per_sec": None,
                "yaw_sd_deg": None,
                "pitch_sd_deg": None,
                "roll_sd_deg": None,
                "movement_consistency": None,
            },
            "facial": {"mean_change_per_second": None, "expression_variability": None, "blink_count": 0},
            "task": {
                "prompts_completed": prompts_completed or len(latencies),
                "response_times_ms": latencies,
                "mean_response_ms": None,
                "response_variability_ms": None,
            },
            "quality": {
                "score": 0,
                "level": "poor",
                "reasons": ["FACE_NOT_VISIBLE"],
                "comparable": False,
                "summary": "No behavioural samples were supplied.",
            },
            "engagement": "No camera samples were supplied.",
            "note": BEHAVIOUR_NOTE,
        }

    faces = [frame for frame in frames if frame.get("face_present", True)]
    face_presence = len(faces) / len(frames)
    times = [float(frame.get("t", 0.0)) for frame in frames]
    duration = max(times[-1] - times[0], 0.0) / 1000

    speeds: list[float] = []
    facial_changes: list[float] = []
    for previous, current in zip(frames, frames[1:]):
        if not previous.get("face_present", True) or not current.get("face_present", True):
            continue
        dt = (float(current.get("t", 0.0)) - float(previous.get("t", 0.0))) / 1000
        if dt <= 0:
            continue
        angle = math.sqrt(
            (float(current.get("yaw", 0.0)) - float(previous.get("yaw", 0.0))) ** 2
            + (float(current.get("pitch", 0.0)) - float(previous.get("pitch", 0.0))) ** 2
            + (float(current.get("roll", 0.0)) - float(previous.get("roll", 0.0))) ** 2
        )
        speeds.append(angle / dt)
        change = (
            abs(float(current.get("smile_left", 0.0)) - float(previous.get("smile_left", 0.0)))
            + abs(float(current.get("smile_right", 0.0)) - float(previous.get("smile_right", 0.0)))
            + abs(float(current.get("jaw_open", 0.0)) - float(previous.get("jaw_open", 0.0)))
            + abs(float(current.get("brow_up", 0.0)) - float(previous.get("brow_up", 0.0)))
        ) / 4
        facial_changes.append(change / dt)

    speed_mean = statistics.fmean(speeds) if speeds else None
    speed_sd = statistics.pstdev(speeds) if len(speeds) > 1 else None
    movement_consistency = None
    if speed_mean is not None and speed_mean > 0.5 and speed_sd is not None:
        movement_consistency = round(_clamp(100 - (speed_sd / speed_mean) * 100), 2)

    expression = [
        (
            float(frame.get("smile_left", 0.0))
            + float(frame.get("smile_right", 0.0))
            + float(frame.get("jaw_open", 0.0))
            + float(frame.get("brow_up", 0.0))
        )
        / 4
        for frame in faces
    ]

    blinks = 0
    was_blinking = False
    for frame in frames:
        blinking = frame.get("face_present", True) and float(frame.get("blink_intensity", 0.0)) >= 50
        if blinking and not was_blinking:
            blinks += 1
        was_blinking = blinking

    stability_values = [float(frame.get("stability", 100.0)) for frame in faces]
    distance_values = [float(frame.get("interocular_px", 0.0)) for frame in faces if float(frame.get("interocular_px", 0.0)) > 0]
    mean_stability = statistics.fmean(stability_values) if stability_values else 0.0
    mean_distance = statistics.fmean(distance_values) if distance_values else 0.0

    reasons: list[str] = []
    score = face_presence * 60 + (mean_stability / 100) * 20
    if face_presence < 0.6:
        reasons.append("FACE_NOT_VISIBLE")
    if mean_distance and mean_distance < 32:
        reasons.append("TOO_FAR")
    else:
        score += 20
    if mean_stability < 35:
        reasons.append("HEAD_MOVEMENT")
    if mean_stability < 55:
        reasons.append("UNSTABLE_TRACKING")

    rounded_score = round(_clamp(score), 2)
    level = "good" if rounded_score >= 75 else "fair" if rounded_score >= 50 else "poor"
    comparable = face_presence >= 0.6 and rounded_score >= 50

    mean_response = statistics.fmean(latencies) if latencies else None
    response_sd = statistics.pstdev(latencies) if len(latencies) > 1 else None

    return {
        "sample_count": len(frames),
        "duration_seconds": round(duration, 2),
        "face_presence_ratio": round(face_presence, 3),
        "head": {
            "mean_angular_speed_deg_per_sec": None if speed_mean is None else round(speed_mean, 1),
            "yaw_sd_deg": round(statistics.pstdev([float(frame.get("yaw", 0.0)) for frame in faces]), 2) if len(faces) > 1 else None,
            "pitch_sd_deg": round(statistics.pstdev([float(frame.get("pitch", 0.0)) for frame in faces]), 2) if len(faces) > 1 else None,
            "roll_sd_deg": round(statistics.pstdev([float(frame.get("roll", 0.0)) for frame in faces]), 2) if len(faces) > 1 else None,
            "movement_consistency": movement_consistency,
        },
        "facial": {
            "mean_change_per_second": round(statistics.fmean(facial_changes), 3) if facial_changes else None,
            "expression_variability": round(statistics.pstdev(expression), 3) if len(expression) > 1 else None,
            "blink_count": blinks,
        },
        "task": {
            "prompts_completed": prompts_completed if prompts_completed is not None else len(latencies),
            "response_times_ms": [round(value, 1) for value in latencies],
            "mean_response_ms": None if mean_response is None else round(mean_response, 1),
            "response_variability_ms": None if response_sd is None else round(response_sd, 1),
        },
        "quality": {
            "score": rounded_score,
            "level": level,
            "reasons": reasons,
            "comparable": comparable,
            "summary": (
                "Facial tracking quality was good."
                if level == "good"
                else "Facial tracking quality was fair; observations are limited."
                if level == "fair"
                else "Facial tracking quality was too low for usable observations. Please repeat the activity."
            ),
        },
        "engagement": (
            f"Responded to {len(latencies)} facial prompt(s); camera tracking was {level}."
            if comparable and latencies
            else "Engagement could not be described reliably from this recording."
        ),
        "note": BEHAVIOUR_NOTE,
    }


def mean_or_none(values: Iterable[float | None]) -> float | None:
    present = [value for value in values if value is not None]
    return round(statistics.fmean(present), 2) if present else None
