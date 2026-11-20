"""Supabase JWT verification and role guards.

The browser sends the access token it received from Supabase Auth in the
``Authorization: Bearer <token>`` header. This module verifies that token
against the project's JWKS (RS256) or, in development, the shared HS256
secret. Roles are read from the token's app/user metadata — never trusted from
the request body.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Any, Literal

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings

Role = Literal["PATIENT", "CLINICIAN", "INSTITUTION", "ADMIN"]

_bearer = HTTPBearer(auto_error=False)


class InvalidToken(HTTPException):
    def __init__(self, detail: str = "Invalid or expired session token.") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


@dataclass(frozen=True)
class Principal:
    user_id: str
    role: Role
    claims: dict[str, Any]

    @property
    def is_clinician(self) -> bool:
        return self.role in ("CLINICIAN", "INSTITUTION", "ADMIN")


def _role_from_claims(claims: dict[str, Any]) -> Role:
    for container in ("app_metadata", "user_metadata"):
        raw = claims.get(container)
        if isinstance(raw, dict):
            candidate = str(raw.get("role", "")).upper()
            if candidate in ("PATIENT", "CLINICIAN", "INSTITUTION", "ADMIN"):
                return candidate  # type: ignore[return-value]
    raw_top = str(claims.get("role", "")).upper()
    if raw_top in ("PATIENT", "CLINICIAN", "INSTITUTION", "ADMIN"):
        return raw_top  # type: ignore[return-value]
    return "PATIENT"


def _signing_key(token: str, settings: Settings) -> Any:
    """Return the verification key for this token.

    Supabase access tokens are RS256 and verified through JWKS. The HS256 path
    exists so tests and local development work without a network round-trip.
    """

    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg", "RS256")

    if algorithm == "HS256":
        if not settings.supabase_jwt_secret:
            raise InvalidToken("Session tokens are not configured for this service.")
        return settings.supabase_jwt_secret

    if not settings.jwks_url:
        raise InvalidToken("Session verification is not configured for this service.")

    jwks_client = jwt.PyJWKClient(settings.jwks_url, cache_keys=True)
    return jwks_client.get_signing_key_from_jwt(token).key


def decode_access_token(token: str, settings: Settings | None = None) -> Principal:
    settings = settings or get_settings()
    try:
        key = _signing_key(token, settings)
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256", "HS256"],
            audience=settings.supabase_audience,
            options={"verify_aud": bool(settings.supabase_audience)},
        )
    except jwt.PyJWTError as exc:  # pragma: no cover - message shape only
        raise InvalidToken() from exc

    subject = claims.get("sub")
    if not subject:
        raise InvalidToken("Session token is missing a subject.")

    return Principal(user_id=str(subject), role=_role_from_claims(claims), claims=claims)


def current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> Principal:
    if credentials is None or not credentials.credentials:
        raise InvalidToken("Sign in to use this endpoint.")
    return decode_access_token(credentials.credentials, settings)


def principal_or_internal(
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> Principal:
    """Allow a verified session token, or the shared key used by our own API.

    The Express backend owns the platform's patient and clinician sessions, so it
    forwards uploaded audio server-to-server. That key never reaches a browser.
    """

    if settings.internal_api_key and x_internal_key:
        if secrets.compare_digest(x_internal_key, settings.internal_api_key):
            return Principal(user_id="internal-api", role="ADMIN", claims={"service": True})
        raise InvalidToken("Invalid internal API key.")

    if credentials is None or not credentials.credentials:
        raise InvalidToken("Sign in to use this endpoint.")
    return decode_access_token(credentials.credentials, settings)


def require_clinician(principal: Principal = Depends(current_principal)) -> Principal:
    if not principal.is_clinician:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action is restricted to clinicians.",
        )
    return principal


def require_self_or_clinician(patient_id: str, principal: Principal) -> None:
    """Guard patient-scoped resources: own record, or a clinician."""

    if principal.user_id != patient_id and not principal.is_clinician:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this patient's records.",
        )
