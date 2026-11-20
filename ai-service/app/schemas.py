"""Request and response models for the AI service."""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class GazePoint(BaseModel):
    x: float = Field(ge=-1.0, le=2.0)
    y: float = Field(ge=-1.0, le=2.0)
    t: float = Field(ge=0, description="Milliseconds since capture started")


class FacialFrame(BaseModel):
    smile_left: float = Field(default=0.0, ge=0, le=1)
    smile_right: float = Field(default=0.0, ge=0, le=1)
    jaw_open: float = Field(default=0.0, ge=0, le=1)
    brow_up: float = Field(default=0.0, ge=0, le=1)

    # Behavioural observation fields (optional; defaults keep older payloads valid).
    t: float = Field(default=0.0, ge=0, description="Milliseconds since capture started")
    yaw: float = Field(default=0.0, ge=-180, le=180)
    pitch: float = Field(default=0.0, ge=-180, le=180)
    roll: float = Field(default=0.0, ge=-180, le=180)
    face_present: bool = True
    stability: float = Field(default=100.0, ge=0, le=100)
    interocular_px: float = Field(default=0.0, ge=0)
    blink_intensity: float = Field(default=0.0, ge=0, le=100)


class FacialBehaviourRequest(BaseModel):
    """Frames from a facial-expression activity, in capture order."""

    frames: list[FacialFrame] = Field(default_factory=list, max_length=600_000)
    response_latencies_ms: list[float] = Field(default_factory=list, max_length=10_000)
    prompts_completed: int | None = Field(default=None, ge=0)


class VoiceAnalysisRequest(BaseModel):
    amplitudes: list[float] = Field(default_factory=list, max_length=600_000)
    frame_ms: int = Field(default=20, ge=5, le=1000)
    pitches_hz: list[float] | None = None
    syllable_count: int | None = Field(default=None, ge=0)
    language: str | None = None


class OcularAnalysisRequest(BaseModel):
    gaze: list[GazePoint] = Field(default_factory=list, max_length=600_000)
    ear: list[float] | None = None


class FacialAnalysisRequest(BaseModel):
    frames: list[FacialFrame] = Field(default_factory=list, max_length=600_000)


class CognitiveAnalysisRequest(BaseModel):
    """Raw task responses keyed by task name.

    Example::

        {
          "cortex_match": {"matched_pairs": 6, "total_pairs": 8, "mismatches": 1},
          "focus_orbit": {"reaction_time": 310, "saccade_count": 24},
          "path_mapper": {"completion_seconds": 41.5, "sequencing_errors": 2}
        }
    """

    tasks: dict[str, dict[str, Any]] = Field(default_factory=dict)


class LongitudinalRecord(BaseModel):
    overall_score: float | None = None
    performed_at: str | None = None
    quality: dict[str, Any] = Field(default_factory=dict)
    functional_changes: list[str] = Field(default_factory=list)
    context_changes: list[str] = Field(default_factory=list)


class LongitudinalAnalysisRequest(BaseModel):
    history: list[LongitudinalRecord] = Field(default_factory=list)


class AnalysisEnvelope(BaseModel):
    """Every analysis response shares this envelope.

    ``model_inference`` states plainly whether a trained model contributed. When
    it is false the numbers are deterministic signal features only.
    """

    pipeline: Literal["voice", "ocular", "facial", "cognitive", "longitudinal"]
    model_inference: bool = False
    metrics: dict[str, Any]
    observations: list[str] = Field(default_factory=list)


class Capability(BaseModel):
    pipeline: str
    available: bool
    detail: str


class ExplanationMetric(str, Enum):
    """Metrics that may appear in a plain-language explanation.

    The enum is the privacy boundary: arbitrary labels or free text cannot be
    sent to the model, so identifiers and transcripts have no route into the
    prompt.
    """

    memory_accuracy = "memory_accuracy"
    attention_response_time_ms = "attention_response_time_ms"
    visuospatial_completion_seconds = "visuospatial_completion_seconds"
    executive_errors = "executive_errors"
    composite_score = "composite_score"
    speech_rate_syllables_per_minute = "speech_rate_syllables_per_minute"
    pause_count = "pause_count"
    pitch_jitter_percent = "pitch_jitter_percent"
    shimmer_percent = "shimmer_percent"
    gaze_fixation_score = "gaze_fixation_score"
    tracking_quality_score = "tracking_quality_score"


class ExplanationRequest(BaseModel):
    """Deterministic observations for a constrained explanation.

    ``metrics`` is a closed set of numeric keys supplied by the scoring layer.
    Do not add free-text fields here; names, IDs, transcripts and clinician
    notes must never reach the language model. Extra fields are rejected rather
    than silently dropped.
    """

    model_config = ConfigDict(extra="forbid")

    audience: Literal["patient", "clinician"] = "patient"
    metrics: dict[ExplanationMetric, float] = Field(min_length=1, max_length=11)
    session_count: int = Field(default=1, ge=0, le=100)
    quality: Literal["good", "limited", "insufficient"] = "good"


class ExplanationResponse(BaseModel):
    text: str
    provider: Literal["ollama", "deterministic"]
    model: str | None = None
    review_required: bool = True
    guardrail: str
    note: str
