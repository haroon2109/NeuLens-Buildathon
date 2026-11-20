"""Constrained plain-language explanations.

The LLM in this module never calculates or changes an assessment result. It
receives a whitelist of already-computed numeric metrics and may only restate
them in simpler language. Identifiers, transcripts, free text, diagnoses and
risk labels cannot enter the prompt because the request schema accepts metric
keys from a fixed enum, not arbitrary strings.

If the local model is unavailable, times out, or produces text that breaks a
guardrail, the deterministic template is returned instead. The response always
says that clinician review is required.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any, Literal

import httpx

from ..schemas import ExplanationMetric

logger = logging.getLogger(__name__)

CLINICIAN_REVIEW_NOTE = (
    "Draft for clinician review. Not a diagnosis, disease probability or "
    "treatment recommendation."
)

SYSTEM_PROMPT = """You are a constrained explanation assistant for a cognitive screening platform.

Rules you must follow:
1. You may only restate the numeric observations supplied to you. Never invent, estimate or calculate a new value.
2. Never diagnose, predict disease, mention dementia, Alzheimer's, impairment, decline, risk, treatment, medication or a cure.
3. Never say or imply that the person has a condition.
4. Do not add advice beyond recommending that a healthcare professional interpret the results.
5. Use short, plain sentences. No headings, no lists and no numeric values that are not in the input.
6. The output is a draft for a clinician to review before anyone shares it.
"""

BANNED_PATTERNS = (
    r"\bdementia\b",
    r"\balzheimer",
    r"\bdiagnos",
    r"\bprobab",
    r"\bpredict",
    r"\blikely\b",
    r"\bsuspect",
    r"\bimpair",
    r"\bdeclin",
    r"\bdeteriorat",
    r"\bdisease\b",
    r"\bdisorder\b",
    r"\babnormal\b",
    r"\btreat",
    r"\bmedicat",
    r"\bcure\b",
    r"\brisk\b",
)

_NUMBER = re.compile(r"\d+(?:\.\d+)?")
_MAX_OUTPUT_CHARS = 700


# Server-owned labels: clients cannot inject text into the prompt.
METRIC_LABELS: dict[ExplanationMetric, tuple[str, str, int]] = {
    ExplanationMetric.memory_accuracy: ("memory-task accuracy", "%", 0),
    ExplanationMetric.attention_response_time_ms: ("attention-task response time", " ms", 0),
    ExplanationMetric.visuospatial_completion_seconds: ("pattern-completion time", " s", 1),
    ExplanationMetric.executive_errors: ("sequencing errors", "", 0),
    ExplanationMetric.composite_score: ("overall screening score", " out of 100", 1),
    ExplanationMetric.speech_rate_syllables_per_minute: ("speech rate", " syllables per minute", 0),
    ExplanationMetric.pause_count: ("number of pauses", "", 0),
    ExplanationMetric.pitch_jitter_percent: ("pitch variation (jitter)", "%", 2),
    ExplanationMetric.shimmer_percent: ("loudness variation (shimmer)", "%", 2),
    ExplanationMetric.gaze_fixation_score: ("gaze fixation score", " out of 100", 1),
    ExplanationMetric.tracking_quality_score: ("camera tracking quality", " out of 100", 1),
}

Quality = Literal["good", "limited", "insufficient"]


@dataclass(frozen=True)
class ExplanationRequestData:
    """Internal, already validated form of the request."""

    audience: Literal["patient", "clinician"]
    metrics: dict[ExplanationMetric, float]
    session_count: int
    quality: Quality


def _format(value: float, decimals: int) -> str:
    if decimals == 0:
        return str(int(round(value)))
    return f"{value:.{decimals}f}"


def _evidence_lines(request: ExplanationRequestData) -> list[str]:
    lines = []
    for metric, value in request.metrics.items():
        label, unit, decimals = METRIC_LABELS[metric]
        lines.append(f"- {label}: {_format(value, decimals)}{unit}")
    lines.append(f"- comparable sessions recorded: {request.session_count}")
    lines.append(f"- recording quality: {request.quality}")
    return lines


def _quality_sentence(quality: Quality) -> str:
    if quality == "insufficient":
        return (
            "The recording quality for this session was not sufficient for comparison "
            "with earlier sessions, so no change is described."
        )
    if quality == "limited":
        return (
            "The recording quality was limited, so the results should be interpreted "
            "with extra care."
        )
    return ""


def deterministic_explanation(request: ExplanationRequestData) -> str:
    """Template fallback that contains no model-generated text."""

    sentences: list[str] = []
    for metric, value in request.metrics.items():
        label, unit, decimals = METRIC_LABELS[metric]
        sentences.append(f"The {label} recorded was {_format(value, decimals)}{unit}.")

    if request.session_count > 0:
        noun = "session" if request.session_count == 1 else "sessions"
        sentences.append(f"This explanation is based on {request.session_count} comparable {noun}.")

    quality = _quality_sentence(request.quality)
    if quality:
        sentences.append(quality)

    if request.audience == "patient":
        sentences.append(
            "These are observations from the activities completed in this session, "
            "not a diagnosis."
        )
        sentences.append(
            "A healthcare professional should interpret them with you and decide "
            "whether any follow-up is needed."
        )
    else:
        sentences.append(
            "These values are deterministic outputs of the task scoring, not a "
            "clinical interpretation."
        )
        sentences.append(CLINICIAN_REVIEW_NOTE)

    return " ".join(sentences)


def _allowed_numbers(request: ExplanationRequestData) -> set[str]:
    numbers: set[str] = {str(request.session_count)}
    for metric, value in request.metrics.items():
        _, _, decimals = METRIC_LABELS[metric]
        formatted = _format(value, decimals)
        numbers.add(formatted)
        # Allow the unrounded representation too, but nothing invented.
        numbers.add(str(value))
    return numbers


def guardrail_failure(text: str, request: ExplanationRequestData) -> str | None:
    """Return a reason when generated text is unsafe or unfaithful."""

    if not text.strip():
        return "empty output"
    if len(text) > _MAX_OUTPUT_CHARS:
        return "output too long"

    lowered = text.lower()
    for pattern in BANNED_PATTERNS:
        if re.search(pattern, lowered):
            return f"banned term matched: {pattern}"

    allowed = _allowed_numbers(request)
    for token in _NUMBER.findall(text):
        if token not in allowed:
            return f"number not present in the supplied observations: {token}"

    return None


def _call_gemini(prompt: str, *, api_key: str, model: str, timeout: float) -> str:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
                max_output_tokens=180,
            ),
        )
        if response.text and isinstance(response.text, str):
            return response.text.strip()
    except Exception as e:
        logger.debug("Google GenAI native client failed, falling back to HTTP: %s", e)

    response = httpx.post(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "temperature": 0.2,
            "max_tokens": 180,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        },
        timeout=timeout,
    )
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices") or []
    if not choices or "message" not in choices[0]:
        raise ValueError("Gemini response did not contain message")
    content = choices[0]["message"].get("content")
    if not isinstance(content, str):
        raise ValueError("Gemini message content is not a string")
    return content.strip()


def _call_ollama(prompt: str, *, base_url: str, model: str, timeout: float) -> str:
    response = httpx.post(
        f"{base_url.rstrip('/')}/api/chat",
        json={
            "model": model,
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": 180},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        },
        timeout=timeout,
    )
    response.raise_for_status()
    payload = response.json()
    content = (payload.get("message") or {}).get("content")
    if not isinstance(content, str):
        raise ValueError("Ollama response did not contain message.content")
    return content.strip()


def generate_explanation(
    request: ExplanationRequestData,
    *,
    base_url: str = "http://localhost:11434",
    model: str = "qwen2.5:3b",
    gemini_api_key: str | None = None,
    gemini_model: str = "gemini-2.5-flash",
    timeout: float = 20.0,
) -> dict[str, Any]:
    """Generate a draft, falling back to the deterministic template on any doubt."""

    fallback = deterministic_explanation(request)
    prompt = (
        "Rewrite the following observations as a short plain-language explanation "
        f"for a {'patient' if request.audience == 'patient' else 'clinician'}. "
        "Keep every number exactly as supplied.\n\n"
        + "\n".join(_evidence_lines(request))
    )

    provider_name = "google-gemini" if gemini_api_key else "ollama"
    used_model = gemini_model if gemini_api_key else model

    try:
        if gemini_api_key:
            generated = _call_gemini(prompt, api_key=gemini_api_key, model=gemini_model, timeout=timeout)
        else:
            generated = _call_ollama(prompt, base_url=base_url, model=model, timeout=timeout)
    except Exception as exc:  # network, timeout or malformed response
        logger.info("LLM explanation unavailable, using deterministic fallback: %s", exc)
        return {
            "text": fallback,
            "provider": "deterministic",
            "model": None,
            "review_required": True,
            "guardrail": "model_unavailable",
            "note": CLINICIAN_REVIEW_NOTE,
        }

    failure = guardrail_failure(generated, request)
    if failure:
        logger.warning("LLM explanation rejected by guardrail (%s); using fallback", failure)
        return {
            "text": fallback,
            "provider": "deterministic",
            "model": None,
            "review_required": True,
            "guardrail": "rejected",
            "note": CLINICIAN_REVIEW_NOTE,
        }

    return {
        "text": f"{generated}\n\n{CLINICIAN_REVIEW_NOTE}",
        "provider": provider_name,
        "model": used_model,
        "review_required": True,
        "guardrail": "passed",
        "note": CLINICIAN_REVIEW_NOTE,
    }
