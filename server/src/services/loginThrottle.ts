import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Sliding-window attempt limiter for authentication endpoints.
//
// This is the first line of defence against online guessing (per credential
// and per client address).  A counter is only cleared once **every** attempt
// inside the window has aged out, so a single burst cannot reset the
// counter the way a fixed-window limiter lets it do.
//
// Limits
//   Default:        100 attempts / hour  (LOGIN_RATE_LIMIT_MAX / _WINDOW_MS)
//   Per credential: key = `login:${normalizedEmail}`
//   Per client:     key = `login:ip:${address}` (upstream addresses resolved
//                   through req.ip when a trusted proxy is configured)
//
// Important behaviour
//   • The limiter is in-process.  Behind several instances it is per-instance,
//     and it is emptied by a restart.  That is why the persistent per-account
//     lockout counters (User.failedLoginAttempts / lockedUntil) remain the
//     authoritative backstop for long-lived protection.
//   • Production defaults are deliberately generous per IP.  Account-level
//     lockout (5 failed PIN/email in 15 min, 15 min lockout) is enforced in
//     the auth controller, which is the only caller that treats failures as
//     account lockouts, not here.
// ---------------------------------------------------------------------------

interface Attempt {
  ts: number;
}

interface Bucket {
  max: number;
  windowMs: number;
  attempts: Attempt[];
}

const buckets = new Map<string, Bucket>();

const DEFAULT_LIMIT = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 100); // 100
const DEFAULT_WINDOW = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 60 * 60 * 1000); // 1 hour

function getBucket(key: string): Bucket {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { max: DEFAULT_LIMIT, windowMs: DEFAULT_WINDOW, attempts: [] };
    buckets.set(key, bucket);
  }
  return bucket;
}

/** Drop attempts that fell out of the sliding window. */
function prune(now: number) {
  for (const bucket of buckets.values()) {
    while (bucket.attempts.length > 0 && bucket.attempts[0].ts <= now - bucket.windowMs) {
      bucket.attempts.shift();
    }
  }
}

export interface AttemptResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Record one attempt and report whether it is allowed.
 * @returns {allowed} true unless the sliding window is already full
 * @returns {retryAfterSeconds} 0 when allowed; seconds until the window clears
 *   when denied
 */
export function consumeAttempt(key: string, limit: number, windowMs: number): AttemptResult {
  const now = Date.now();

  const bucket = getBucket(key);
  bucket.max = Math.max(1, limit);
  bucket.windowMs = Math.max(1, windowMs);

  // Drop expired attempts *before* measuring the window, so a burst at the
  // boundary cannot refill the bucket.
  while (bucket.attempts.length > 0 && bucket.attempts[0].ts <= now - bucket.windowMs) {
    bucket.attempts.shift();
  }

  if (bucket.attempts.length >= bucket.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.attempts[0].ts + bucket.windowMs - now) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  bucket.attempts.push({ ts: now });
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getAttemptCount(key: string): number {
  prune(Date.now());
  const bucket = buckets.get(key);
  return bucket ? bucket.attempts.length : 0;
}

export function clearAttempts(key: string): void {
  buckets.delete(key);
}

/**
 * Deterministic key for per-credential tracking (never the raw password).
 * Normalizes the credential so `joe@example.com`, `JOE@Example.com`, and
 * `joe  @example.com` hit the same counter.
 */
export function credentialKey(email: string): string {
  return `login:${email.trim().toLowerCase().replace(/\s+/g, '')}`;
}

/**
 * Deterministic key for per-client-address tracking.
 * Uses req.ip when a trusted proxy is configured; falls back to the raw
 * socket address otherwise.
 */
export function addressKey(req: import('express').Request): string {
  const forwardedIps = (req.headers['x-forwarded-for'] as string | undefined)?.split(',').map((h) => h.trim()).filter(Boolean);

  // trust proxy is set in app.ts, so req.ip resolves to the first trusted
  // upstream address (Render / Fly / nginx sit between the client and this
  // server), which is the real client.
  const socketIp = (req.ip || req.connection?.remoteAddress || 'unknown').toString();

  // If X-Forwarded-For is present, the first hop is the originating client.
  if (forwardedIps && forwardedIps.length > 0) {
    return `login:ip:${forwardedIps[0].replace(/[^0-9a-fA-F:.]/g, '')}`;
  }
  return `login:ip:${socketIp.replace(/[^0-9a-fA-F:.]/g, '')}`;
}
