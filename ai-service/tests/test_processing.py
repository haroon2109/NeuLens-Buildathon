"""Unit tests for the deterministic signal-processing layer."""

from __future__ import annotations

from app.services import features, scoring


def test_voice_features_detects_long_pauses_and_rate() -> None:
    # 20 ms frames: 1 s of speech, 1 s silence, 1 s speech.
    speech = [0.2] * 50
    silence = [0.0] * 50
    amplitudes = speech + silence + speech

    metrics = features.voice_features(amplitudes, frame_ms=20, syllable_count=12)

    assert metrics["pause_count"] == 1
    assert metrics["duration_seconds"] == 3.0
    assert metrics["speech_rate"] == 240.0  # 12 syllables in 3 s
    assert metrics["pause_score"] == 90.0
    assert metrics["shimmer"] is not None


def test_voice_features_reports_jitter_from_pitch_series() -> None:
    metrics = features.voice_features(
        amplitudes=[0.3] * 20,
        frame_ms=20,
        pitches_hz=[120.0, 120.0, 120.0, 120.0],
    )
    assert metrics["jitter"] == 0.0


def test_voice_features_handles_empty_input_without_inventing_values() -> None:
    metrics = features.voice_features([], frame_ms=20)
    assert metrics["speech_rate"] is None
    assert metrics["jitter"] is None
    assert metrics["pause_count"] == 0


def test_ocular_features_counts_saccades_and_fixation() -> None:
    still = [{"x": 0.5, "y": 0.5, "t": i * 20.0} for i in range(10)]
    jump = [{"x": 0.9, "y": 0.5, "t": 220.0}]
    gaze = still + jump + [{"x": 0.9, "y": 0.5, "t": 240.0}]

    metrics = features.ocular_features(gaze)

    assert metrics["saccade_count"] >= 1
    assert metrics["reaction_time"] is not None
    assert 0 <= metrics["fixation_score"] <= 100


def test_ocular_blink_rate_from_ear_series() -> None:
    gaze = [{"x": 0.5, "y": 0.5, "t": i * 100.0} for i in range(20)]
    ear = [0.3] * 20
    ear[5] = 0.1
    ear[6] = 0.1

    metrics = features.ocular_features(gaze, ear=ear)

    assert metrics["blink_rate"] is not None
    assert metrics["blink_rate"] > 0


def test_facial_symmetry_and_tremor() -> None:
    frames = [
        {"smile_left": 0.8, "smile_right": 0.8, "jaw_open": 0.2},
        {"smile_left": 0.8, "smile_right": 0.78, "jaw_open": 0.22},
    ]
    metrics = features.facial_features(frames)

    assert metrics["symmetry"] is not None
    assert metrics["symmetry"] > 90
    assert metrics["tremor_score"] is not None


def test_behavioural_features_measure_head_and_facial_movement() -> None:
    frames = []
    for index in range(20):
        frames.append(
            {
                "t": index * 100.0,
                "face_present": True,
                "yaw": index * 2.0,
                "pitch": 0.0,
                "roll": 0.0,
                "smile_left": 0.2 + (index % 5) * 0.1,
                "smile_right": 0.2 + (index % 5) * 0.1,
                "jaw_open": 0.1,
                "brow_up": 0.05,
                "stability": 82,
                "interocular_px": 90,
                "blink_intensity": 60 if index in (5, 12) else 0,
            }
        )

    metrics = features.behavioural_features(frames, response_latencies_ms=[900, 1200], prompts_completed=2)

    assert metrics["sample_count"] == 20
    assert metrics["head"]["mean_angular_speed_deg_per_sec"] is not None
    assert metrics["head"]["mean_angular_speed_deg_per_sec"] > 0
    assert 0 <= metrics["head"]["movement_consistency"] <= 100
    assert metrics["facial"]["mean_change_per_second"] is not None
    assert metrics["facial"]["blink_count"] == 2
    assert metrics["task"]["mean_response_ms"] == 1050
    assert metrics["quality"]["comparable"] is True
    assert metrics["quality"]["level"] in {"good", "fair"}


def test_behavioural_features_reject_a_mostly_hidden_face() -> None:
    frames = [
        {"t": index * 100.0, "face_present": index == 0, "stability": 0 if index else 90}
        for index in range(10)
    ]

    metrics = features.behavioural_features(frames)

    assert metrics["face_presence_ratio"] == 0.1
    assert metrics["quality"]["comparable"] is False
    assert "FACE_NOT_VISIBLE" in metrics["quality"]["reasons"]
    assert metrics["task"]["mean_response_ms"] is None


def test_cognitive_profile_leaves_missing_domains_empty() -> None:
    metrics = scoring.cognitive_profile({"cortex_match": {"matched_pairs": 6, "total_pairs": 8, "mismatches": 1}})

    assert metrics["memory"] is not None
    assert metrics["attention"] is None
    assert metrics["composite"] is not None
    assert metrics["domains_available"] == 1


def test_longitudinal_requires_three_comparables() -> None:
    summary = scoring.longitudinal_summary(
        [
            {"overall_score": 80, "quality": {"comparable": True}},
            {"overall_score": 82, "quality": {"comparable": True}},
        ]
    )

    assert summary["status"] == "INSUFFICIENT_DATA"
    assert summary["baseline_range"] is None
    assert summary["review_reasons"] == []


def test_longitudinal_flags_review_outside_observed_range() -> None:
    summary = scoring.longitudinal_summary(
        [
            {"overall_score": 78, "quality": {"comparable": True}},
            {"overall_score": 80, "quality": {"comparable": True}},
            {"overall_score": 79, "quality": {"comparable": True}},
            {"overall_score": 68, "quality": {"comparable": True}, "functional_changes": ["cooking"]},
        ]
    )

    assert summary["status"] == "REVIEW"
    assert summary["outside_baseline"] is True
    assert "OUTSIDE_OBSERVED_BASELINE" in summary["review_reasons"]
    assert "FUNCTIONAL_CHANGE" in summary["review_reasons"]
    assert summary["baseline_range"] == {"minimum": 78.0, "maximum": 80.0}


def test_longitudinal_ignores_non_comparable_latest_session() -> None:
    summary = scoring.longitudinal_summary(
        [
            {"overall_score": 78, "quality": {"comparable": True}},
            {"overall_score": 80, "quality": {"comparable": True}},
            {"overall_score": 79, "quality": {"comparable": True}},
            {"overall_score": 40, "quality": {"comparable": False}},
        ]
    )

    # The poor-quality session must not be read as a decline.
    assert summary["status"] == "NO_CHANGE"
    assert summary["outside_baseline"] is False
    assert summary["latest"] == 79.0
