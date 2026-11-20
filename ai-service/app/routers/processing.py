"""Assessment processing endpoints.

All routes require a verified Supabase session token. Patient data is never
returned from another patient's record, and clinicians are the only role that
can request cross-patient longitudinal summaries.
"""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ..auth import Principal, current_principal, principal_or_internal, require_clinician
from ..config import Settings, get_settings
from ..schemas import (
    AnalysisEnvelope,
    Capability,
    CognitiveAnalysisRequest,
    ExplanationRequest,
    ExplanationResponse,
    FacialAnalysisRequest,
    FacialBehaviourRequest,
    LongitudinalAnalysisRequest,
    OcularAnalysisRequest,
    VoiceAnalysisRequest,
)
from ..services import acoustics, explanation, features, scoring

router = APIRouter(prefix="/v1/ai", tags=["ai"])

CLINICAL_NOTE = (
    "Exploratory observation only. Not a diagnosis, disease probability or "
    "validated change measure; a qualified clinician interprets it."
)


@router.get("/capabilities", response_model=list[Capability])
def capabilities(
    _: Principal = Depends(current_principal),
    settings: Settings = Depends(get_settings),
) -> list[Capability]:
    return [
        Capability(
            pipeline="voice",
            available=True,
            detail="Pitch, jitter, shimmer, pauses, intensity and speech rate from a recorded clip.",
        ),
        Capability(pipeline="ocular", available=True, detail="Saccades, fixation stability, blink rate."),
        Capability(
            pipeline="explanation",
            available=True,
            detail=(
                "Plain-language draft from deterministic metrics via a local "
                "Ollama model, with a template fallback; clinician review required."
            ),
        ),
        Capability(
            pipeline="facial",
            available=True,
            detail="Bilateral symmetry, micro-tremor and behavioural observations (head/facial movement, response timing, tracking quality).",
        ),
        Capability(pipeline="cognitive", available=True, detail="Exploratory domain scores from task responses."),
        Capability(pipeline="longitudinal", available=True, detail="Within-person observed range and review prompts."),
        Capability(
            pipeline="model_inference",
            available=settings.enable_model_inference,
            detail="Trained model inference is disabled until validated weights are configured.",
        ),
    ]


@router.post("/voice/analyze", response_model=AnalysisEnvelope)
def analyze_voice(
    payload: VoiceAnalysisRequest,
    _: Principal = Depends(current_principal),
    settings: Settings = Depends(get_settings),
) -> AnalysisEnvelope:
    if not payload.amplitudes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No audio frames supplied.")

    metrics = features.voice_features(
        amplitudes=payload.amplitudes,
        frame_ms=payload.frame_ms,
        pitches_hz=payload.pitches_hz,
        syllable_count=payload.syllable_count,
    )
    observations = [
        f"{metrics['pause_count']} pause(s) longer than 250 ms were observed.",
        f"Speech rate estimate: {metrics['speech_rate'] or 'not computable'}.",
        CLINICAL_NOTE,
    ]
    return AnalysisEnvelope(
        pipeline="voice",
        model_inference=False,
        metrics=metrics,
        observations=observations,
    )


MAX_AUDIO_BYTES = 15 * 1024 * 1024


@router.post("/voice/acoustics", response_model=AnalysisEnvelope)
def analyze_voice_acoustics(
    file: UploadFile = File(...),
    transcript: str | None = Form(default=None),
    target_text: str | None = Form(default=None),
    response_latency_ms: int | None = Form(default=None, ge=0, le=600_000),
    syllable_count: int | None = Form(default=None, ge=0, le=100_000),
    language: str | None = Form(default=None),
    _: Principal = Depends(principal_or_internal),
    settings: Settings = Depends(get_settings),
) -> AnalysisEnvelope:
    """Measure acoustic properties of one uploaded speech clip.

    Accepts the browser's MediaRecorder output (WebM/Opus) or a WAV upload.
    Compressed input is decoded with ffmpeg; timings come from a VAD pass,
    pitch/jitter/shimmer/intensity from Praat, and the syllable rate from an
    approximate energy-peak count.
    """

    suffix = Path(file.filename or "clip.webm").suffix or ".webm"
    handles = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        size = 0
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_AUDIO_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Audio clip exceeds the 15 MB limit.",
                )
            handles.write(chunk)
        handles.close()

        metrics = acoustics.analyze_audio(
            handles.name,
            content_type=file.content_type,
            transcript=transcript,
            target_text=target_text,
            response_latency_ms=response_latency_ms,
            syllable_count=syllable_count,
            speech_threshold=settings.vad_speech_threshold,
        )
    except acoustics.AudioUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except acoustics.AudioRejected as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    finally:
        handles.close()
        Path(handles.name).unlink(missing_ok=True)

    quality = metrics.get("quality") or {}
    observations = [
        f"{metrics['speech_duration_seconds']} s of speech in a {metrics['duration_seconds']} s clip.",
        f"{metrics['pause_count']} pause(s) of at least 250 ms.",
        f"Recording quality: {quality.get('level', 'unknown')}.",
        CLINICAL_NOTE,
    ]

    return AnalysisEnvelope(
        pipeline="voice",
        model_inference=False,
        metrics={**metrics, "language": language},
        observations=observations,
    )


@router.post("/ocular/analyze", response_model=AnalysisEnvelope)
def analyze_ocular(payload: OcularAnalysisRequest, _: Principal = Depends(current_principal)) -> AnalysisEnvelope:
    if len(payload.gaze) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least two gaze samples are required.")

    metrics = features.ocular_features(
        gaze=[point.model_dump() for point in payload.gaze],
        ear=payload.ear,
    )
    observations = [
        f"{metrics['saccade_count']} saccadic movement(s) detected.",
        f"Fixation stability: {metrics['fixation_score']}.",
        CLINICAL_NOTE,
    ]
    return AnalysisEnvelope(pipeline="ocular", metrics=metrics, observations=observations)


@router.post("/facial/analyze", response_model=AnalysisEnvelope)
def analyze_facial(payload: FacialAnalysisRequest, _: Principal = Depends(current_principal)) -> AnalysisEnvelope:
    if not payload.frames:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No facial frames supplied.")

    metrics = features.facial_features([frame.model_dump() for frame in payload.frames])
    observations = [
        f"Bilateral symmetry score: {metrics['symmetry']}.",
        CLINICAL_NOTE,
    ]
    return AnalysisEnvelope(pipeline="facial", metrics=metrics, observations=observations)


@router.post("/facial/behaviour", response_model=AnalysisEnvelope)
def analyze_facial_behaviour(
    payload: FacialBehaviourRequest,
    _: Principal = Depends(current_principal),
) -> AnalysisEnvelope:
    """Behavioural observations from a facial-activity frame stream.

    Head movement, facial movement, movement consistency, response timing and
    tracking quality. Deliberately not an emotion classifier.
    """

    if not payload.frames:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No behavioural frames supplied.",
        )

    metrics = features.behavioural_features(
        [frame.model_dump() for frame in payload.frames],
        response_latencies_ms=payload.response_latencies_ms,
        prompts_completed=payload.prompts_completed,
    )
    quality = metrics.get("quality") or {}
    observations = [
        f"Face was visible in {metrics['face_presence_ratio'] * 100:.0f}% of frames.",
        f"{metrics['task']['prompts_completed']} facial prompt(s) completed.",
        f"Camera tracking quality: {quality.get('level', 'unknown')}.",
        CLINICAL_NOTE,
    ]

    return AnalysisEnvelope(
        pipeline="facial",
        model_inference=False,
        metrics=metrics,
        observations=observations,
    )


@router.post("/cognitive/analyze", response_model=AnalysisEnvelope)
def analyze_cognitive(payload: CognitiveAnalysisRequest, _: Principal = Depends(current_principal)) -> AnalysisEnvelope:
    if not payload.tasks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No task responses supplied.")

    metrics = scoring.cognitive_profile(payload.tasks)
    observations = [
        f"{metrics['domains_available']} of 4 exploratory domains were computable from this session.",
        "Missing tasks are left empty rather than scored as zero.",
        CLINICAL_NOTE,
    ]
    return AnalysisEnvelope(pipeline="cognitive", metrics=metrics, observations=observations)


@router.post("/explanation", response_model=ExplanationResponse)
def explain_results(
    payload: ExplanationRequest,
    _: Principal = Depends(require_clinician),
    settings: Settings = Depends(get_settings),
) -> ExplanationResponse:
    """Draft a plain-language explanation from deterministic metrics only.

    Clinician-only: the draft is reviewed before anything reaches a patient.
    The model may rephrase the supplied numbers but cannot add values, labels,
    diagnoses or risk statements. On any guardrail failure the deterministic
    template is returned instead.
    """

    result = explanation.generate_explanation(
        explanation.ExplanationRequestData(
            audience=payload.audience,
            metrics=dict(payload.metrics),
            session_count=payload.session_count,
            quality=payload.quality,
        ),
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        gemini_api_key=settings.gemini_api_key,
        gemini_model=settings.gemini_model,
        timeout=settings.ollama_timeout_seconds,
    )
    return ExplanationResponse(**result)


@router.post("/longitudinal/analyze", response_model=AnalysisEnvelope)
def analyze_longitudinal(
    payload: LongitudinalAnalysisRequest,
    principal: Principal = Depends(current_principal),
) -> AnalysisEnvelope:
    """Within-person comparison.

    The service cannot prove that a posted history belongs to the caller, so
    only clinicians may request a comparison. Patients read their stored
    status through Row Level Security instead of computing it here.
    """
    if not principal.is_clinician:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Longitudinal comparison is restricted to clinicians.",
        )

    summary = scoring.longitudinal_summary([record.model_dump() for record in payload.history])
    observations = list(summary.pop("notes", []))
    observations.append(CLINICAL_NOTE)
    return AnalysisEnvelope(
        pipeline="longitudinal",
        metrics=summary,
        observations=observations,
    )
