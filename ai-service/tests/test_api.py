"""API-level tests: auth enforcement, role guards and response shape.

Tokens are signed locally with the development HS256 secret so the suite never
touches a real Supabase project or the network.
"""

from __future__ import annotations

import time

import jwt
import pytest
from fastapi.testclient import TestClient

from app.auth import decode_access_token
from app.config import Settings
from app.main import app

SECRET = "test-secret-at-least-32-characters-long"


def make_token(role: str = "PATIENT", sub: str = "user-1", expired: bool = False) -> str:
    now = int(time.time())
    claims = {
        "sub": sub,
        "aud": "authenticated",
        "iat": now - 10,
        "exp": now - 5 if expired else now + 3600,
        "app_metadata": {"role": role},
    }
    return jwt.encode(claims, SECRET, algorithm="HS256")


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setenv("SUPABASE_AUDIENCE", "authenticated")
    from app.config import get_settings

    get_settings.cache_clear()
    yield TestClient(app)
    get_settings.cache_clear()


def auth(role: str = "PATIENT", sub: str = "user-1") -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(role, sub)}"}


def test_health_is_public(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    # Secrets are never echoed back.
    assert "service_role" not in response.text.lower()


def test_voice_requires_a_token(client: TestClient) -> None:
    response = client.post("/v1/ai/voice/analyze", json={"amplitudes": [0.2]})
    assert response.status_code == 401


def test_expired_token_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/voice/analyze",
        json={"amplitudes": [0.2] * 10},
        headers={"Authorization": f"Bearer {make_token(expired=True)}"},
    )
    assert response.status_code == 401


def test_voice_analysis_returns_features(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/voice/analyze",
        json={"amplitudes": [0.2] * 50 + [0.0] * 50, "frame_ms": 20, "syllable_count": 8},
        headers=auth(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pipeline"] == "voice"
    assert body["model_inference"] is False
    assert body["metrics"]["pause_count"] == 1


def test_ocular_analysis_requires_two_samples(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/ocular/analyze",
        json={"gaze": [{"x": 0.5, "y": 0.5, "t": 0}]},
        headers=auth(),
    )
    assert response.status_code == 422


def test_cognitive_analysis_shape(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/cognitive/analyze",
        json={"tasks": {"cortex_match": {"matched_pairs": 7, "total_pairs": 8, "mismatches": 0}}},
        headers=auth(),
    )
    assert response.status_code == 200
    assert response.json()["metrics"]["domains_available"] == 1


def test_facial_behaviour_endpoint_returns_observation_envelope(client: TestClient) -> None:
    frames = [
        {
            "t": index * 100.0,
            "face_present": True,
            "yaw": index,
            "smile_left": 0.2,
            "smile_right": 0.2,
            "stability": 85,
            "interocular_px": 90,
        }
        for index in range(10)
    ]
    response = client.post(
        "/v1/ai/facial/behaviour",
        json={"frames": frames, "response_latencies_ms": [800], "prompts_completed": 1},
        headers=auth(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pipeline"] == "facial"
    assert body["model_inference"] is False
    assert body["metrics"]["task"]["mean_response_ms"] == 800
    assert "emotion" not in " ".join(body["observations"]).lower()


def test_patients_cannot_request_longitudinal_comparison(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/longitudinal/analyze",
        json={"history": [{"overall_score": 80}]},
        headers=auth("PATIENT"),
    )
    assert response.status_code == 403


def test_clinicians_can_request_longitudinal_comparison(client: TestClient) -> None:
    history = [{"overall_score": score, "quality": {"comparable": True}} for score in (78, 80, 79)]
    response = client.post(
        "/v1/ai/longitudinal/analyze",
        json={"history": history},
        headers=auth("CLINICIAN"),
    )
    assert response.status_code == 200
    assert response.json()["metrics"]["status"] in {"NO_CHANGE", "REVIEW"}


def test_explanation_is_restricted_to_clinicians(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/explanation",
        json={"metrics": {"memory_accuracy": 82}, "session_count": 3},
        headers=auth("PATIENT"),
    )
    assert response.status_code == 403


def test_explanation_rejects_identifiers_and_free_text(client: TestClient) -> None:
    response = client.post(
        "/v1/ai/explanation",
        json={
            "metrics": {"memory_accuracy": 82},
            "session_count": 3,
            "patient_name": "Asha",
            "transcript": "my name is Asha",
        },
        headers=auth("CLINICIAN"),
    )
    assert response.status_code == 422


def test_explanation_falls_back_when_model_is_offline(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.services import explanation

    def offline(*args: object, **kwargs: object) -> str:
        raise ConnectionError("offline")

    monkeypatch.setattr(explanation, "_call_ollama", offline)

    response = client.post(
        "/v1/ai/explanation",
        json={"metrics": {"memory_accuracy": 82}, "session_count": 3},
        headers=auth("CLINICIAN"),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "deterministic"
    assert body["review_required"] is True
    assert "82%" in body["text"]


def test_role_is_read_from_token_not_body() -> None:
    settings = Settings(supabase_jwt_secret=SECRET, supabase_audience="authenticated")
    principal = decode_access_token(make_token("CLINICIAN", "doc-9"), settings)
    assert principal.role == "CLINICIAN"
    assert principal.is_clinician is True

    patient = decode_access_token(make_token("PATIENT", "p-1"), settings)
    assert patient.is_clinician is False
