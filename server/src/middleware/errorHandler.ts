import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { LogEntry, LogLevel } from '../services/logger';
import { logger, requestIp } from '../services/logger';

const isProduction = process.env.NODE_ENV === 'production';

type ErrorCtx = {
  name: string;
  message: string;
  status: number;
  stack?: string;
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? (req as any).id ?? '-';
  const ip = requestIp(req);

  // Attach an error id to the response so clients can reference a specific
  // failure when reporting a problem.
  const errorId = (req as any).id ?? requestId;
  res.setHeader('X-Error-Id', errorId);

  if (err instanceof ZodError) {      logger({
        ts: new Date().toISOString(),
        level: 'warn',
        msg: `validation_failed path=${req.originalUrl ?? req.url} ip=${ip} reqId=${requestId}`,
        request: { id: requestId, method: req.method, url: req.originalUrl ?? req.url, ip },
        error: { type: 'ZodError', issueCount: err.issues.length },
      });
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((e) => {
        // `unrecognized_keys` carries its offender separately, so the path alone
        // would be empty and the client could not tell which field to drop.
        if (e.code === 'unrecognized_keys') {
          const keys = (e as unknown as { keys?: string[] }).keys ?? [];
          const field = [...e.path, keys[0] ?? ''].filter(Boolean).join('.');
          return { field, message: e.message };
        }
        return { field: e.path.join('.'), message: e.message };
      }),
    });
  }

  const statusCode = err.status || 500;
  const message = err.message || 'Internal server error';

  const ctx: LogEntry = {
    ts: new Date().toISOString(),
    level: statusCode >= 500 ? 'error' : 'warn',
    msg: `unhandled_error status=${statusCode} path=${req.originalUrl ?? req.url} ip=${ip} reqId=${requestId}`,
    request: { id: requestId, method: req.method, url: req.originalUrl ?? req.url, ip },
    error: {
      name: err.name,
      message: message,
      status: statusCode,
    },
  };
  if (!isProduction) {
    ctx['stack'] = err.stack;
  }
  logger(ctx);
  


  // Never echo internal failure details (driver messages, paths, stack hints)
  // to clients in production. 4xx messages are intentional and safe to return.
  const isServerError = statusCode >= 500;
  const clientMessage = isProduction && isServerError ? 'Internal server error' : message;

  res.status(statusCode).json({
    error: clientMessage,
    ...(isProduction && { errorId: errorId }),
  });
};