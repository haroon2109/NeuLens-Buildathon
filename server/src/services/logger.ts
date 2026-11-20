import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  reqId?: string;
  request?: {
    id: string;
    method: string;
    url: string;
    ip: string;
    userId?: string;
  };
  response?: {
    statusCode: number;
    contentLength?: string | number;
    elapsedMs?: number;
  };
  // Span / performance tracker coverage.
  span?: {
    label: string;
    durationMs: number;
  };
  [key: string]: unknown;
}

let logger: (entry: LogEntry) => void = console.info;

export { logger };

export function setLogger(fn: (entry: LogEntry) => void): void {
  logger = fn;
}

/**
 * Structured JSON logger for the API server. Every log line is a single JSON
 * object, so log aggregators (Array\@stdin, Datadog, ELK, etc.) can ingest it
 * without a parser. Human-readable prefixes are kept for `npm run dev`.
 */
export function info(msg: string, ctx?: Record<string, unknown>): void {
  logger({ ts: new Date().toISOString(), level: 'info', msg, ...ctx });
}

export function warn(msg: string, ctx?: Record<string, unknown>): void {
  logger({ ts: new Date().toISOString(), level: 'warn', msg, ...ctx });
}

export function error(msg: string, ctx?: Record<string, unknown>): void {
  logger({ ts: new Date().toISOString(), level: 'error', msg, ...ctx });
}

export function debug(msg: string, ctx?: Record<string, unknown>): void {
  logger({ ts: new Date().toISOString(), level: 'debug', msg, ...ctx });
}

/** Add a prefix only when outputting to a TTY (npm run dev), else plain JSON. */
function prefix(msg: string): string {
  if (process.stdout.isTTY) {
    const label = process.env.NODE_ENV === 'production' ? '[neulens] ' : '[Neulens] ';
    return `${label}${msg}`;
  }
  return msg;
}

/** @returns the request's real client address (respects trust proxy / X-Forwarded-For). */
export function requestIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = forwarded.toString().split(',')[0]?.trim();
    if (first) return first;
  }
  return (req.ip || req.connection?.remoteAddress || '-').toString();
}

/** @returns a URL-safe request id for tracing a request through the stack. */
export function requestId(req: Request): string {
  const header = req.headers['x-request-id'] as string | undefined;
  if (header) return header;
  return cryptoRandom();
}

function cryptoRandom(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Short SHA-256 fingerprint for a request URL (rate-limit / audit grouping). */
export function urlFingerprint(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

/**
 * Middleware that creates a unique request id and attaches it to req.id so
 * every downstream log line can carry it. Emits a single structured line at
 * the end of the request with the HTTP status and the total duration.
 */
export function httpLogger(): Handler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = requestId(req);
    const started = process.hrtime.bigint();

    // Attach the id to the response so error handlers can include it.
    res.setHeader('X-Request-Id', id);
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      logger({
        ts: new Date().toISOString(),
        level,
        msg: `method=${req.method} url=${req.originalUrl ?? req.url} ` +
             `ip=${requestIp(req)} ua=${req.headers['user-agent']?.toString() ?? '-'} ` +
             `status=${res.statusCode} reqId=${id} elapsedMs=${Math.round(durationMs)}`,
        reqId: id,
        request: { id, method: req.method, url: req.originalUrl ?? req.url, ip: requestIp(req) },
      });

      const contentLength = res.getHeader('content-length');
      logger({
        ts: new Date().toISOString(),
        level,
        msg: `method=${req.method} url=${req.originalUrl ?? req.url} ` +
             `ip=${requestIp(req)} ua=${req.headers['user-agent']?.toString() ?? '-'} ` +
             `status=${res.statusCode} reqId=${id} elapsedMs=${Math.round(durationMs)}`,
        reqId: id,
        request: { id, method: req.method, url: req.originalUrl ?? req.url, ip: requestIp(req) },
        response: {
          statusCode: res.statusCode,
          contentLength: typeof contentLength === 'string' ? contentLength : undefined,
          elapsedMs: Math.round(durationMs),
        },
      });
    });

    next();
  };
}

export type Handler = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Security-relevant events that belong alongside every request log, not in
 * the application path. Each entry carries the request id so an aggregate can
 * join on it.
 */
export interface SecurityEvent {
  ts: string;
  action: string;
  detail: string;
}

export function securityEvent(event: SecurityEvent): void {
  logger({ level: 'warn', msg: `SECURITY ${event.action}: ${event.detail}`, ...event });
}
/**
 * Record a security event. Logs at `warn` so alerting dashboards pick it up
 * without switching the log level.
 */

