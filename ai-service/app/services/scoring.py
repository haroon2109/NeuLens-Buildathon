"""Exploratory scoring and longitudinal comparison.

Nothing computed here is a diagnosis, a disease probability or a validated
reliable-change statistic. The output is an observation set for clinician
review, with explicit quality gating: a session whose recording quality is
below threshold is reported as insufficient data rather than as a decline.
"""

from __future__ import annotations

import statistics
from typing import Any, Literal, Sequence

ChangeStatus = Literal["INSUFFICIENT_DATA", "NO_CHANGE", "REVIEW"]
ReviewReason = Literal["OUTSIDE_OBSERVED_BASELINE", "FUNCTIONAL_CHANGE", "CONTEXT_CHANGE"]

MIN_COMPARABLE_SESSIONS = 3


def _score(value: float | None) -> float | None:
    if value is None:
        return None
    return round(max(0.0, min(100.0, float(value))), 2)


def cognitive_profile(tasks: dict[str, Any]) -> dict[str, float | None]:
    """Map the five task responses onto exploratory domain scores.

    Each task contributes an explicit, documented input. Missing tasks produce
    ``None`` for that domain instead of zero, so a partial session is not read
    as poor performance.
    """

    memory = None
    if "matched_pairs" in tasks.get("cortex_match", {}):
        task = tasks["cortex_match"]
        total = task.get("total_pairs") or 8
        memory = _score((task.get("matched_pairs", 0) / total) * 100 - task.get("mismatches", 0) * 2)

    attention = None
    if "saccade_count" in tasks.get("focus_orbit", {}) or "reaction_time" in tasks.get("focus_orbit", {}):
        task = tasks["focus_orbit"]
        reaction = task.get("reaction_time")
        attention = _score(100 - min(reaction or 0, 800) / 8) if reaction is not None else None

    visuospatial = None
    trail = tasks.get("path_mapper", {})
    if trail.get("completion_seconds") is not None:
        visuospatial = _score(100 - min(float(trail["completion_seconds"]), 120) * 0.6)

    executive = None
    if trail.get("sequencing_errors") is not None or trail.get("completion_seconds") is not None:
        errors = float(trail.get("sequencing_errors", 0))
        executive = _score(100 - errors * 8)

    domains = [value for value in (memory, attention, visuospatial, executive) if value is not None]
    composite = _score(statistics.fmean(domains)) if domains else None

    return {
        "memory": memory,
        "attention": attention,
        "visuospatial": visuospatial,
        "executive": executive,
        "composite": composite,
        "domains_available": len(domains),
    }


def _comparable(record: dict[str, Any]) -> bool:
    quality = record.get("quality") or {}
    return quality.get("comparable", True) is not False


def _score_of(record: dict[str, Any]) -> float | None:
    value = record.get("overall_score", record.get("overallScore"))
    return float(value) if value is not None else None


def longitudinal_summary(history: Sequence[dict[str, Any]]) -> dict[str, Any]:
    """Compare the latest session with a within-person observed range.

    ``history`` is ordered oldest → newest. Only comparable sessions count.
    """

    ordered = [record for record in history if _score_of(record) is not None]
    comparable = [record for record in ordered if _comparable(record)]

    if not comparable:
        return {
            "status": "INSUFFICIENT_DATA",
            "comparables": 0,
            "latest": None,
            "previous": None,
            "change": None,
            "baseline_range": None,
            "outside_baseline": False,
            "review_reasons": [],
            "notes": ["No comparable session is available yet."],
        }

    latest = comparable[-1]
    latest_score = _score_of(latest)  # type: ignore[arg-type]
    previous = comparable[-2] if len(comparable) > 1 else None
    previous_score = _score_of(previous) if previous else None

    if len(comparable) < MIN_COMPARABLE_SESSIONS:
        return {
            "status": "INSUFFICIENT_DATA",
            "comparables": len(comparable),
            "latest": latest_score,
            "previous": previous_score,
            "change": round(latest_score - previous_score, 2) if previous_score is not None else None,
            "baseline_range": None,
            "outside_baseline": False,
            "review_reasons": [],
            "notes": [
                f"{len(comparable)} comparable session(s) recorded; "
                f"{MIN_COMPARABLE_SESSIONS} are needed before a range is described."
            ],
        }

    reference = comparable[:-1]
    scores = [_score_of(record) for record in reference]
    scores = [score for score in scores if score is not None]
    minimum = round(min(scores), 2)
    maximum = round(max(scores), 2)
    outside = latest_score < minimum or latest_score > maximum

    reasons: list[ReviewReason] = []
    if outside:
        reasons.append("OUTSIDE_OBSERVED_BASELINE")

    functional = latest.get("functional_changes") or []
    if functional:
        reasons.append("FUNCTIONAL_CHANGE")

    context = latest.get("context_changes") or []
    if context:
        reasons.append("CONTEXT_CHANGE")

    change = round(latest_score - previous_score, 2) if previous_score is not None else None

    return {
        "status": "REVIEW" if reasons else "NO_CHANGE",
        "comparables": len(comparable),
        "latest": latest_score,
        "previous": previous_score,
        "change": change,
        "baseline_range": {"minimum": minimum, "maximum": maximum},
        "outside_baseline": outside,
        "review_reasons": reasons,
        "notes": [
            "Observed range is drawn from this person's earlier comparable sessions only.",
            "A review prompt is not a diagnosis or a validated change statistic.",
        ],
    }
