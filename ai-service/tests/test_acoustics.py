"""Acoustic pipeline tests.

The audio is synthesised locally (two tone bursts separated by a pause), so the
suite needs no network, model weights or recorded patient material. Expected
values are ranges, not exact numbers: Praat's estimators depend on the clip.
"""

from __future__ import annotations

import io
import math
import struct
import time
import wave

import jwt
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import acoustics

SECRET = "test-secret-at-least-32-characters-long"


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setenv("SUPABASE_AUDIENCE", "authenticated")
    from app.config import get_settings

    get_settings.cache_clear()
    yield TestClient(app)
    get_settings.cache_clear()


def _token() -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": "user-1",
            "aud": "authenticated",
            "iat": now - 10,
            "exp": now + 3600,
            "app_metadata": {"role": "PATIENT"},
        },
        SECRET,
        algorithm="HS256",
    )


def _tone(duration: float, amplitude: float, frequency: float, sr: int = 16_000) -> list[float]:
    if amplitude == 0:
        return [0.0] * int(duration * sr)
    return [
        amplitude
        * (
            math.sin(2 * math.pi * frequency * index / sr)
            + 0.4 * math.sin(4 * math.pi * frequency * index / sr)
        )
        for index in range(int(duration * sr))
    ]


def make_clip(sr: int = 16_000) -> bytes:
    samples: list[float] = []
    samples += _tone(0.2, 0.0, 0)
    samples += _tone(1.2, 0.35, 140)
    samples += _tone(0.5, 0.0, 0)
    samples += _tone(1.1, 0.30, 160)
    samples += _tone(0.3, 0.0, 0)

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sr)
        handle.writeframes(
            b"".join(struct.pack("<h", int(max(-1.0, min(1.0, value)) * 32767)) for value in samples)
        )
    return buffer.getvalue()


@pytest.fixture(scope="module")
def clip(tmp_path_factory: pytest.TempPathFactory) -> str:
    path = tmp_path_factory.mktemp("audio") / "speech.wav"
    path.write_bytes(make_clip())
    return str(path)


@pytest.fixture()
def energy_segmenter(monkeypatch: pytest.MonkeyPatch) -> None:
    """Measure the synthetic clips with the energy segmenter.

    The clips are tone bursts, not speech, and Silero VAD is a speech
    classifier: it correctly reports almost no speech in them. These tests
    assert timing values, so they pin the segmenter to keep the numbers stable
    whether or not the model is installed.
    """

    monkeypatch.setattr(acoustics, "_silero_segments", lambda *args, **kwargs: None)


def test_measures_timing_pitch_and_quality(clip: str, energy_segmenter: None) -> None:
    metrics = acoustics.analyze_audio(clip, content_type="audio/wav")

    assert metrics["duration_seconds"] == pytest.approx(3.3, abs=0.2)
    assert metrics["speech_duration_seconds"] == pytest.approx(2.3, abs=0.3)
    assert metrics["pause_count"] == 1
    assert metrics["pause_durations_ms"][0] == pytest.approx(500, abs=150)
    assert metrics["pitch_mean_hz"] == pytest.approx(150, abs=15)
    assert 60 < metrics["intensity_mean_db"] < 100
    assert metrics["quality"]["level"] in {"good", "fair"}
    assert metrics["quality"]["comparable"] is True
    assert metrics["vad"] == "energy"
    # Pure tones have no amplitude perturbation to speak of.
    assert metrics["jitter_percent"] is not None
    assert metrics["shimmer_percent"] is not None


def test_word_errors_compare_transcript_with_target() -> None:
    errors, accuracy = acoustics._word_errors(
        "cognitive markers and visual path tracings",
        "Cognitive markers and visual path tracings measure baseline motor coordination.",
    )
    assert errors == 4
    assert accuracy == pytest.approx(60.0)


def test_degenerate_clip_is_low_quality() -> None:
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as handle:
        samples = _tone(0.6, 0.0, 0)
        with wave.open(handle.name, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(16_000)
            wav.writeframes(b"".join(struct.pack("<h", int(value * 32767)) for value in samples))
    metrics = acoustics.analyze_audio(handle.name, content_type="audio/wav")
    assert metrics["quality"]["comparable"] is False
    assert "LITTLE_SPEECH" in metrics["quality"]["reasons"]


def test_endpoint_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/voice/acoustics",
        files={"file": ("speech.wav", make_clip(), "audio/wav")},
    )
    assert response.status_code == 401


def test_endpoint_returns_voice_envelope(client: TestClient, energy_segmenter: None) -> None:
    response = client.post(
        "/v1/ai/voice/acoustics",
        files={"file": ("speech.wav", make_clip(), "audio/wav")},
        data={
            "transcript": "cognitive markers and visual path tracings",
            "target_text": "Cognitive markers and visual path tracings measure baseline motor coordination.",
            "response_latency_ms": "1450",
        },
        headers={"Authorization": f"Bearer {_token()}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pipeline"] == "voice"
    assert body["model_inference"] is False
    assert body["metrics"]["response_latency_ms"] == 1450
    assert body["metrics"]["speech_accuracy_percent"] == pytest.approx(60.0)
    assert body["metrics"]["pause_count"] == 1
    assert body["metrics"]["quality"]["comparable"] is True
    # Six spoken words in ~2.3 s of speech.
    assert body["metrics"]["word_count"] == 6
    assert 100 < body["metrics"]["speech_rate_words_per_minute"] < 220


@pytest.mark.skipif(
    acoustics.available_vad() != "silero", reason="silero-vad is not installed"
)
def test_silero_vad_runs_and_rejects_non_speech(clip: str) -> None:
    """Silero is wired in and only counts speech as speech."""

    metrics = acoustics.analyze_audio(clip, content_type="audio/wav")

    assert metrics["vad"] == "silero"
    # Two-tone audio is not speech, so it is reported as largely non-speech and
    # the clip is marked non-comparable rather than measured.
    assert metrics["speech_duration_seconds"] < 1.5
    assert metrics["quality"]["comparable"] is False


@pytest.mark.skipif(
    acoustics.available_vad() != "silero", reason="silero-vad is not installed"
)
def test_speech_threshold_is_passed_to_silero(clip: str, monkeypatch: pytest.MonkeyPatch) -> None:
    """The configured threshold reaches the model instead of being ignored."""

    import silero_vad

    seen: dict[str, object] = {}
    original = silero_vad.get_speech_timestamps

    def spy(audio, model, **kwargs):
        seen.update(kwargs)
        return original(audio, model, **kwargs)

    monkeypatch.setattr(silero_vad, "get_speech_timestamps", spy)

    metrics = acoustics.analyze_audio(clip, content_type="audio/wav", speech_threshold=0.35)

    assert seen["threshold"] == 0.35
    assert metrics["vad"] == "silero"
    assert metrics["vad_threshold"] == 0.35


def test_out_of_range_threshold_is_clamped(clip: str) -> None:
    metrics = acoustics.analyze_audio(clip, content_type="audio/wav", speech_threshold=500)
    assert metrics["vad_threshold"] <= 0.95


def test_energy_segmenter_reports_no_threshold(clip: str, energy_segmenter: None) -> None:
    metrics = acoustics.analyze_audio(clip, content_type="audio/wav")
    assert metrics["vad"] == "energy"
    assert metrics["vad_threshold"] is None


def test_energy_segmenter_is_used_when_model_is_unavailable(
    clip: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(acoustics, "_silero_model", lambda: None)

    metrics = acoustics.analyze_audio(clip, content_type="audio/wav")

    assert metrics["vad"] == "energy"
    assert metrics["speech_duration_seconds"] == pytest.approx(2.3, abs=0.3)
    assert metrics["quality"]["comparable"] is True


@pytest.mark.skipif(
    acoustics.available_vad() != "silero", reason="silero-vad is not installed"
)
def test_endpoint_uses_configured_speech_threshold(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.config import get_settings

    monkeypatch.setenv("VAD_SPEECH_THRESHOLD", "0.35")
    get_settings.cache_clear()

    response = client.post(
        "/v1/ai/voice/acoustics",
        files={"file": ("speech.wav", make_clip(), "audio/wav")},
        headers={"Authorization": f"Bearer {_token()}"},
    )
    get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json()["metrics"]["vad_threshold"] == 0.35


def test_endpoint_accepts_internal_service_key(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import get_settings

    monkeypatch.setenv("INTERNAL_API_KEY", "shared-internal-key")
    get_settings.cache_clear()

    response = client.post(
        "/v1/ai/voice/acoustics",
        files={"file": ("speech.wav", make_clip(), "audio/wav")},
        headers={"X-Internal-Key": "shared-internal-key"},
    )
    assert response.status_code == 200
    get_settings.cache_clear()

