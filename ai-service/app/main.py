"""Neulens AI service.

Runs the signal-processing and assessment endpoints that sit between the React
client and PostgreSQL. Model API keys and the Supabase service-role key live
only in this process's environment.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import processing

settings = get_settings()
logging.basicConfig(level=settings.log_level.upper())

app = FastAPI(
    title="Neulens AI Service",
    version="1.0.0",
    description=(
        "Signal processing and assessment APIs for Neulens. Endpoints require a "
        "Supabase access token. Outputs are exploratory observations, not diagnoses."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(processing.router)


@app.get("/health", tags=["ops"])
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "supabase_auth_configured": bool(settings.jwks_url or settings.supabase_jwt_secret),
        "model_inference": settings.enable_model_inference,
    }
