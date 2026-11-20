import { Request, Response, NextFunction } from 'express';

/**
 * In-memory fixed-window rate limiter.
 *
 * This is a coarse abuse guard for a single API instance. It is deliberately
 * cheap and dependency-free; authentication endpoints have their own sliding
 * window in services/loginThrottle.ts, and the Gnani voice endpoints also
 * enforce a daily paid-key budget.
 *
 * Limits are per client address. When the app runs behind a trusted proxy,
 * `app.set('trust proxy', 1)` makes req.ip resolve to the real client.
 */

interface LimitBucket {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  /** Requests allowed per client per window. */
  limit?: number;
  /** Window length in milliseconds. */
  windowMs?: number;
  /** Prefix so independent limiters do not share a bucket. */
  keyPrefix?: string;
  /** Response message for a rejected request. */
  message?: string;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

const SWEEP_THRESHOLD = 5000;

export function createRateLimiter(options: RateLimitOptions = {}) {
  const limit = positiveInt(String(options.limit ?? process.env.API_RATE_LIMIT_MAX ?? 300), 300);
  const windowMs = positiveInt(
    String(options.windowMs ?? process.env.API_RATE_LIMIT_WINDOW_MS ?? 60_000),
    60_000
  );
  const keyPrefix = options.keyPrefix ?? 'api';
  const message = options.message ?? 'Too many requests. Please slow down and try again shortly.';

  const buckets = new Map<string, LimitBucket>();

  function sweep(now: number) {
    if (buckets.size < SWEEP_THRESHOLD) return;
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetTime) buckets.delete(key);
    }
  }

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    sweep(now);

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetTime) {
      buckets.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (bucket.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
      });
    }

    bucket.count += 1;
    return next();
  };
}
