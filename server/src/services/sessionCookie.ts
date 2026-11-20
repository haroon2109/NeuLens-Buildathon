/**
 * Session cookie handling.
 *
 * Session tokens are delivered in an HttpOnly cookie so browser JavaScript
 * cannot read them. That removes the previous bearer token from localStorage,
 * where any XSS or a shared machine could lift a clinician's 30-day session.
 *
 * A `Authorization: Bearer` header is still accepted for non-browser clients
 * (curl, integration scripts); the browser no longer stores or sends one.
 */
import { Request, Response } from 'express';

export const SESSION_COOKIE_NAME = 'cv_session';

export const SESSION_MAX_AGE_MS = {
  patient: 24 * 60 * 60 * 1000,
  clinician: 12 * 60 * 60 * 1000,
  remembered: 30 * 24 * 60 * 60 * 1000,
  rememberedLegacy: 7 * 24 * 60 * 60 * 1000,
};

function baseCookieOptions() {
  return {
    httpOnly: true,
    // Render and similar hosts terminate TLS in front of the app.
    secure: process.env.NODE_ENV === 'production',
    // Lax keeps the cookie off cross-site subresource requests and cross-site
    // POSTs, which is the CSRF protection for cookie-based sessions.
    sameSite: 'lax' as const,
    path: '/',
  };
}

/**
 * Sets the session cookie. Omit `maxAgeMs` for a per-tab session cookie, which
 * mirrors the previous "remember me off" behaviour.
 */
export function setSessionCookie(res: Response, token: string, maxAgeMs?: number): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    ...(maxAgeMs && maxAgeMs > 0 ? { maxAge: maxAgeMs } : {}),
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, baseCookieOptions());
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

/** Cookie first, then the header kept for programmatic clients. */
export function readSessionToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header) {
    const [scheme, value] = header.split(' ');
    if (scheme === 'Bearer' && value && value.trim()) {
      return value.trim();
    }
  }
  return readCookie(req, SESSION_COOKIE_NAME);
}
