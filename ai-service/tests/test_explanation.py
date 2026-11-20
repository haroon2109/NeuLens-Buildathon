"""Explanation guardrails: the model may rephrase, never diagnose or invent."""

from __future__ import annotations

from app.schemas import ExplanationMetric
from app.services import explanation


def request_data(**overrides: object) -> explanation.ExplanationRequestData:
    values = {
        "audience": "patient",
        "metrics": {
            ExplanationMetric.memory_accuracy: 82.0,
            ExplanationMetric.attention_response_time_ms: 640.0,
        },
        "session_count": 3,
        "quality": "good",
    }
    values.update(overrides)
    return explanation.ExplanationRequestData(**values)  # type: ignore[arg-type]


def test_fallback_is_deterministic_and_requires_review(monkeypatch) -> None:
    def offline(*args: object, **kwargs: object) -> str:
        raise ConnectionError("ollama is not running")

    monkeypatch.setattr(explanation, "_call_ollama", offline)

    result = explanation.generate_explanation(
        request_data(), base_url="http://localhost:11434", model="qwen2.5:3b"
    )

    assert result["provider"] == "deterministic"
    assert result["review_required"] is True
    assert result["guardrail"] == "model_unavailable"
    assert "82%" in result["text"]
    assert "3" in result["text"]
    assert "not a diagnosis" in result["text"]


def test_diagnostic_language_is_rejected(monkeypatch) -> None:
    monkeypatch.setattr(
        explanation,
        "_call_ollama",
        lambda *args, **kwargs: "The patient likely has dementia.",
    )

    result = explanation.generate_explanation(
        request_data(), base_url="http://localhost:11434", model="qwen2.5:3b"
    )

    assert result["provider"] == "deterministic"
    assert result["guardrail"] == "rejected"
    assert "dementia" not in result["text"].lower()


def test_invented_numbers_are_rejected(monkeypatch) -> None:
    monkeypatch.setattr(
        explanation,
        "_call_ollama",
        lambda *args, **kwargs: "Memory accuracy was 82% and the score changed by 10%.",
    )

    result = explanation.generate_explanation(
        request_data(), base_url="http://localhost:11434", model="qwen2.5:3b"
    )

    assert result["guardrail"] == "rejected"
    assert "10%" not in result["text"]


def test_faithful_output_is_accepted_with_review_note(monkeypatch) -> None:
    monkeypatch.setattr(
        explanation,
        "_call_ollama",
        lambda *args, **kwargs: (
            "Your memory-task accuracy was 82%, and your attention-task response "
            "time was 640 ms across 3 comparable sessions."
        ),
    )

    result = explanation.generate_explanation(
        request_data(), base_url="http://localhost:11434", model="qwen2.5:3b"
    )

    assert result["provider"] == "ollama"
    assert result["guardrail"] == "passed"
    assert result["review_required"] is True
    assert explanation.CLINICIAN_REVIEW_NOTE in result["text"]


def test_insufficient_quality_is_never_described_as_change(monkeypatch) -> None:
    monkeypatch.setattr(
        explanation,
        "_call_ollama",
        lambda *args, **kwargs: (_ for _ in ()).throw(ConnectionError("offline")),
    )

    result = explanation.generate_explanation(
        request_data(quality="insufficient"),
        base_url="http://localhost:11434",
        model="qwen2.5:3b",
    )

    assert "not sufficient for comparison" in result["text"]
    assert "no change is described" in result["text"]
