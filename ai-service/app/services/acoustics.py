"""Acoustic analysis of a recorded speech sample.

The browser records a short clip for the repeat-sentence activity and posts it
here. This module decodes the clip, finds speech segments, and measures the
acoustic properties a clinician may want to review:

* speech and pause timing (total duration, speech duration, pauses)
* fundamental frequency (pitch) and its variation
* voice intensity and its variation
* jitter and shimmer (Praat definitions, via praat-parselmouth)
* an approximate syllable rate for speech rate
* task-specific word accuracy when a transcript and target sentence exist

Speech/non-speech detection uses Silero VAD, a speech classifier trained on
recorded speech. It is a runtime dependency, not an option: the energy-based
segmenter below only runs if the model fails to load, and the response records
which one produced the timings in ``vad``. Because Silero decides what counts
as speech, a clip of noise or tones yields little speech and is marked
non-comparable instead of being measured. Every result is an exploratory
observation, not a diagnosis or a validated cognitive marker, and a recording
whose signal quality is too low is marked non-comparable rather than reported
as a poor performance.

Licensing note: librosa is ISC-licensed; praat-parselmouth links Praat, which
is GPLv3. Review the GPL obligations (or isolate this service) before a
commercial distribution. Silero VAD is MIT.
"""

from __future__ import annotations

import math
import shutil
import subprocess
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any, Sequence

TARGET_SAMPLE_RATE = 16_000
PAUSE_MIN_SECONDS = 0.25
MIN_SPEECH_SECONDS = 0.12
MERGE_GAP_SECONDS = 0.20
PITCH_FLOOR_HZ = 60.0
PITCH_CEILING_HZ = 500.0
# Silero's own default. Overridable per deployment via VAD_SPEECH_THRESHOLD.
DEFAULT_SPEECH_THRESHOLD = 0.5
MIN_SPEECH_THRESHOLD = 0.05
MAX_SPEECH_THRESHOLD = 0.95

NOTE = (
    "Measured acoustic properties of a short repeated sentence. "
    "Exploratory observation, not a diagnosis or a validated cognitive marker."
)


class AudioUnavailable(RuntimeError):
    """The audio analysis stack is not installed or cannot decode the clip."""


class AudioRejected(ValueError):
    """The clip is empty, too long, or otherwise unusable."""


def _load_libs() -> tuple[Any, Any]:
    try:
        import librosa  # type: ignore
        import numpy  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on deployment image
        raise AudioUnavailable(
            "Audio analysis requires librosa and numpy. Install ai-service/requirements.txt."
        ) from exc
    return librosa, numpy


@lru_cache(maxsize=1)
def _silero_model() -> Any | None:
    """Load Silero VAD once per process.

    Returns None if the model cannot be loaded, so a broken install degrades to
    the energy segmenter instead of failing the request. The response records
    which one was used in ``vad``.
    """

    try:
        from silero_vad import load_silero_vad  # type: ignore

        return load_silero_vad()
    except Exception:  # pragma: no cover - optional dependency
        return None


def available_vad() -> str:
    return "silero" if _silero_model() is not None else "energy"


def _clamp_threshold(threshold: float) -> float:
    """Keep the threshold inside the range where Silero behaves sensibly."""

    return min(max(float(threshold), MIN_SPEECH_THRESHOLD), MAX_SPEECH_THRESHOLD)


def _ensure_wav(path: Path, content_type: str | None, workdir: Path) -> Path:
    """Return a PCM WAV path, converting compressed input with ffmpeg."""

    suffix = path.suffix.lower()
    if suffix == ".wav" or (content_type or "").lower() in {"audio/wav", "audio/x-wav", "audio/wave"}:
        return path

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise AudioUnavailable(
            "Compressed audio needs ffmpeg to decode. Install ffmpeg or upload a WAV file."
        )

    target = workdir / "decoded.wav"
    result = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(path),
            "-ac",
            "1",
            "-ar",
            str(TARGET_SAMPLE_RATE),
            "-f",
            "wav",
            str(target),
        ],
        capture_output=True,
        timeout=30,
    )
    if result.returncode != 0 or not target.exists():
        message = result.stderr.decode("utf-8", "ignore").strip().splitlines()
        raise AudioRejected(f"Could not decode the audio clip. {message[-1] if message else ''}".strip())
    return target


def _energy_segments(y: Any, sr: int, librosa: Any, numpy: Any) -> list[tuple[float, float]]:
    """Energy-based VAD fallback.

    Frames are speech when their RMS sits clearly above the recording's noise
    floor. Thresholds adapt to the clip, so a quiet microphone is not treated
    as silence.
    """

    frame_length = int(sr * 0.025)
    hop_length = int(sr * 0.010)
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    if rms.size == 0:
        return []

    noise_floor = float(numpy.percentile(rms, 20))
    peak = float(numpy.percentile(rms, 95))
    threshold = max(noise_floor + 0.15 * (peak - noise_floor), peak * 0.08, 1e-4)
    voiced = rms > threshold
    times = librosa.frames_to_time(numpy.arange(rms.size), sr=sr, hop_length=hop_length)

    segments: list[tuple[float, float]] = []
    start: float | None = None
    for is_voiced, t in zip(voiced, times):
        if is_voiced and start is None:
            start = float(t)
        elif not is_voiced and start is not None:
            segments.append((start, float(t)))
            start = None
    if start is not None:
        segments.append((start, float(times[-1]) + hop_length / sr))

    # Merge short gaps, then drop blips.
    merged: list[tuple[float, float]] = []
    for segment in segments:
        if merged and segment[0] - merged[-1][1] < MERGE_GAP_SECONDS:
            merged[-1] = (merged[-1][0], segment[1])
        else:
            merged.append(segment)
    return [(start, end) for start, end in merged if end - start >= MIN_SPEECH_SECONDS]


def _silero_segments(
    y: Any, sr: int, threshold: float = DEFAULT_SPEECH_THRESHOLD
) -> list[tuple[float, float]] | None:
    model = _silero_model()
    if model is None:
        return None
    try:  # pragma: no cover - optional dependency
        import torch  # type: ignore
        from silero_vad import get_speech_timestamps  # type: ignore

        timestamps = get_speech_timestamps(
            torch.from_numpy(y),
            model,
            sampling_rate=sr,
            threshold=_clamp_threshold(threshold),
            min_speech_duration_ms=int(MIN_SPEECH_SECONDS * 1000),
            min_silence_duration_ms=int(MERGE_GAP_SECONDS * 1000),
            return_seconds=False,
        )
        return [(item["start"] / sr, item["end"] / sr) for item in timestamps]
    except Exception:  # pragma: no cover - optional dependency
        return None


def _pause_stats(segments: Sequence[tuple[float, float]]) -> tuple[list[float], float]:
    pauses: list[float] = []
    for (_, previous_end), (start, _) in zip(segments, segments[1:]):
        gap = start - previous_end
        if gap >= PAUSE_MIN_SECONDS:
            pauses.append(round(gap, 3))
    return pauses, round(sum(pauses), 3)


def _praat_features(wav_path: Path) -> dict[str, float | None]:
    """Pitch, intensity, jitter and shimmer from Praat.

    Praat reports jitter and shimmer as fractions; both are returned here as
    percentages, matching how they are usually displayed.
    """

    result: dict[str, float | None] = {
        "pitch_mean_hz": None,
        "pitch_sd_hz": None,
        "pitch_min_hz": None,
        "pitch_max_hz": None,
        "intensity_mean_db": None,
        "intensity_sd_db": None,
        "jitter_percent": None,
        "shimmer_percent": None,
    }

    try:
        import parselmouth  # type: ignore
        from parselmouth.praat import call  # type: ignore

        sound = parselmouth.Sound(str(wav_path))
        pitch = sound.to_pitch(time_step=0.01, pitch_floor=PITCH_FLOOR_HZ, pitch_ceiling=PITCH_CEILING_HZ)
        frequencies = [float(value) for value in pitch.selected_array["frequency"] if value > 0]
        if frequencies:
            mean = sum(frequencies) / len(frequencies)
            variance = sum((value - mean) ** 2 for value in frequencies) / len(frequencies)
            result.update(
                pitch_mean_hz=round(mean, 2),
                pitch_sd_hz=round(math.sqrt(variance), 2),
                pitch_min_hz=round(min(frequencies), 2),
                pitch_max_hz=round(max(frequencies), 2),
            )

        intensity = sound.to_intensity(minimum_pitch=PITCH_FLOOR_HZ)
        # Praat reports -300 dB for silence; keep only measured speech energy.
        values = [
            float(value)
            for value in intensity.values[0]
            if math.isfinite(value) and value > 0
        ]
        if values:
            mean_db = sum(values) / len(values)
            variance_db = sum((value - mean_db) ** 2 for value in values) / len(values)
            result.update(
                intensity_mean_db=round(mean_db, 2),
                intensity_sd_db=round(math.sqrt(variance_db), 2),
            )

        point_process = call(sound, "To PointProcess (periodic, cc)", PITCH_FLOOR_HZ, PITCH_CEILING_HZ)
        try:
            jitter = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
            if math.isfinite(jitter):
                result["jitter_percent"] = round(jitter * 100, 3)
        except Exception:
            pass
        try:
            shimmer = call(
                [sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6
            )
            if math.isfinite(shimmer):
                result["shimmer_percent"] = round(shimmer * 100, 3)
        except Exception:
            pass
    except Exception:
        # Praat is optional at runtime: timing features still work without it.
        return result

    return result


def _syllable_estimate(y: Any, sr: int, segments: Sequence[tuple[float, float]], numpy: Any) -> int | None:
    """Count energy peaks inside voiced regions as an approximate syllable count."""

    if not segments:
        return None

    frame = int(sr * 0.025)
    hop = int(sr * 0.010)
    count = 0
    for start, end in segments:
        chunk = y[int(start * sr): int(end * sr)]
        if chunk.size < frame:
            continue
        frames = 1 + (chunk.size - frame) // hop
        if frames <= 0:
            continue
        rms = numpy.array(
            [
                float(numpy.sqrt(numpy.mean(chunk[i * hop: i * hop + frame] ** 2)))
                for i in range(frames)
            ]
        )
        peak = float(rms.max())
        if peak <= 1e-6:
            continue
        smooth = numpy.convolve(rms, numpy.ones(5) / 5, mode="same")
        threshold = peak * 0.35
        min_gap = int(0.12 * sr / hop)
        last_peak = -min_gap
        for index in range(1, len(smooth) - 1):
            value = smooth[index]
            if value < threshold or value < smooth[index - 1] or value <= smooth[index + 1]:
                continue
            # A syllable nucleus stands out from its neighbouring trough.
            window = smooth[max(0, index - min_gap): index + min_gap + 1]
            if value - float(window.min()) < peak * 0.15:
                continue
            if index - last_peak < min_gap:
                continue
            count += 1
            last_peak = index
    return count or None


def _tokens(text: str) -> list[str]:
    normalised = "".join(char.lower() if char.isalnum() or char.isspace() else " " for char in text)
    return [token for token in normalised.split() if token]


def _word_errors(spoken: str, target: str) -> tuple[int, float]:
    """Word-level edit distance between the transcript and the target sentence."""

    expected = _tokens(target)
    heard = _tokens(spoken)
    if not expected:
        return 0, 0.0

    previous = list(range(len(heard) + 1))
    for i, expected_word in enumerate(expected, start=1):
        current = [i]
        for j, heard_word in enumerate(heard, start=1):
            current.append(
                min(
                    previous[j] + 1,
                    current[j - 1] + 1,
                    previous[j - 1] + (expected_word != heard_word),
                )
            )
        previous = current
    errors = previous[-1]
    accuracy = max(0.0, 1.0 - errors / len(expected)) * 100
    return errors, round(accuracy, 1)


def _quality(
    duration: float,
    speech_duration: float,
    voiced_ratio: float,
    peak: float,
    pitch_mean: float | None,
) -> dict[str, Any]:
    reasons: list[str] = []
    score = 100.0

    if duration < 2.0:
        reasons.append("TOO_SHORT")
        score -= 35
    if speech_duration < 1.2:
        reasons.append("LITTLE_SPEECH")
        score -= 35
    if voiced_ratio < 0.25:
        reasons.append("LOW_VOICED_RATIO")
        score -= 20
    if peak >= 0.995:
        reasons.append("CLIPPING")
        score -= 15
    if pitch_mean is None:
        reasons.append("NO_VOICED_PITCH")
        score -= 25

    score = round(max(0.0, min(100.0, score)))
    level = "good" if score >= 75 else "fair" if score >= 50 else "poor"

    return {
        "score": score,
        "level": level,
        "reasons": reasons,
        "comparable": speech_duration >= 1.2 and voiced_ratio >= 0.25 and score >= 50,
        "summary": (
            "Recording quality was good."
            if level == "good"
            else "Recording quality was fair; interpret with care."
            if level == "fair"
            else "Recording quality was too low for a reliable measurement. Please re-record."
        ),
    }


def analyze_audio(
    path: str | Path,
    *,
    content_type: str | None = None,
    transcript: str | None = None,
    target_text: str | None = None,
    response_latency_ms: int | None = None,
    syllable_count: int | None = None,
    max_seconds: float = 120.0,
    speech_threshold: float = DEFAULT_SPEECH_THRESHOLD,
) -> dict[str, Any]:
    """Measure acoustic properties of one speech clip.

    ``speech_threshold`` is the Silero VAD speech probability above which audio
    counts as speech. It is recorded in the response, because lowering it changes
    what the measurement means.
    """

    librosa, numpy = _load_libs()
    source = Path(path)

    with tempfile.TemporaryDirectory() as workdir_name:
        workdir = Path(workdir_name)
        wav_path = _ensure_wav(source, content_type, workdir)
        y, sr = librosa.load(str(wav_path), sr=TARGET_SAMPLE_RATE, mono=True)
        praat = _praat_features(wav_path)

    if y.size == 0:
        raise AudioRejected("The audio clip is empty.")
    duration = float(len(y)) / float(sr)
    if duration > max_seconds:
        raise AudioRejected(f"The audio clip is longer than {max_seconds:.0f} seconds.")

    threshold = _clamp_threshold(speech_threshold)
    segments = _silero_segments(y, sr, threshold)
    vad = "silero"
    if segments is None:
        segments = _energy_segments(y, sr, librosa, numpy)
        vad = "energy"

    speech_duration = round(sum(end - start for start, end in segments), 3)
    pauses, pause_total = _pause_stats(segments)
    peak = float(numpy.max(numpy.abs(y)))
    voiced_ratio = round(speech_duration / duration, 3) if duration else 0.0

    syllables = syllable_count if syllable_count and syllable_count > 0 else _syllable_estimate(
        y, sr, segments, numpy
    )
    speech_rate = (
        round(syllables / speech_duration * 60, 1) if syllables and speech_duration > 0 else None
    )

    accuracy = None
    errors = None
    if transcript and target_text:
        errors, accuracy = _word_errors(transcript, target_text)

    # Words per minute is only meaningful when a transcript exists; without one
    # the syllable estimate below is reported under its own name.
    words = _tokens(transcript) if transcript else []
    word_rate = round(len(words) / speech_duration * 60, 1) if words and speech_duration > 0 else None

    pitch_mean = praat.get("pitch_mean_hz")
    metrics: dict[str, Any] = {
        "duration_seconds": round(duration, 2),
        "speech_duration_seconds": speech_duration,
        "voiced_ratio": voiced_ratio,
        "speech_segment_count": len(segments),
        "pause_count": len(pauses),
        "pause_durations_ms": [round(value * 1000) for value in pauses],
        "pause_total_seconds": pause_total,
        "mean_pause_ms": round(sum(pauses) / len(pauses) * 1000) if pauses else None,
        "longest_pause_ms": round(max(pauses) * 1000) if pauses else None,
        "syllable_count": syllables,
        "speech_rate_syllables_per_minute": speech_rate,
        "speech_rate_words_per_minute": word_rate,
        "word_count": len(words) if words else None,
        "response_latency_ms": response_latency_ms,
        "peak_amplitude": round(peak, 4),
        "vad": vad,
        # Only meaningful for the Silero path; the energy segmenter has no
        # probability threshold to report.
        "vad_threshold": threshold if vad == "silero" else None,
        "speech_errors": errors,
        "speech_accuracy_percent": accuracy,
        "quality": _quality(duration, speech_duration, voiced_ratio, peak, pitch_mean),
        "note": NOTE,
    }
    metrics.update(praat)
    return metrics
