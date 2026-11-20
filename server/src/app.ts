import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { prisma } from './config/db';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimit';
import { describeJwtSecretProblem, verifyJwtSecret } from './config/jwt';
import { seedDemoAccess } from './services/demoAccess';
import {
  httpLogger,
  requestIp,
  securityEvent,
  setLogger,
  logger,
  type LogEntry,
} from './services/logger';

// Ensure environmental variables are loaded
dotenv.config();

// Structured JSON logger. Every request/response/security event is emitted as
// a single JSON object on stdout, so log aggregators (Datadog, ELK, etc.)
// can ingest it without a parser. Human-readable prefixes only when stdout is
// a TTY (npm run dev).
let jsonLogger = console.info;
setLogger((entry: LogEntry) => {
  const prefix = process.stdout.isTTY && process.env.NODE_ENV !== 'production' ? '[Neulens] ' : '';
  jsonLogger(prefix + JSON.stringify(entry));
});

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');

// Attach a request id and log every completed request. This must run before
// the routers: passing the factory uncalled would swallow the request instead
// of calling next(), leaving unmatched paths hanging.
app.use(httpLogger());

// Behind Render/Fly/nginx the TLS terminator is a proxy hop away.
app.set('trust proxy', 1);

// Explicit CORS allowlist. Unlisted origins receive no CORS headers at all, so
// a browser on another site cannot read authenticated responses. '*' is only
// honoured outside production, where it is useful for local devices.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowAnyOrigin = allowedOrigins.includes('*') && process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin: same-origin server-side render, curl, or health probe.
      if (!origin) return callback(null, true);
      if (allowAnyOrigin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    maxAge: 600
  })
);

// Security headers. CSP is enabled in production only: the Vite dev server
// injects inline scripts/HMR, while the built bundle loads external fonts and
// the MediaPipe wasm/model CDN used for facial landmarks.
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'wasm-unsafe-eval'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            mediaSrc: ["'self'", 'blob:'],
            connectSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://storage.googleapis.com'],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    // Express already disables the header via app.disable('x-powered-by');
    // skipping helmet's remover avoids depending on removeHeader.
    xPoweredBy: false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Coarse per-IP ceiling for every API route. Route-specific limiters (auth,
// voice) remain stricter and are layered underneath this one.
app.use(
  '/api/v1',
  createRateLimiter({
    limit: Number(process.env.API_RATE_LIMIT_MAX ?? 300),
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
    keyPrefix: 'api',
    message: 'Too many requests. Please slow down and try again shortly.',
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

interface ReadinessResult {
  ready: boolean;
  checks: {
    database: 'connected' | 'disconnected' | 'unconfigured';
    migrations: 'applied' | 'pending' | 'unknown';
    configuration: 'ok' | 'incomplete';
  };
  problems: string[];
}

/**
 * Readiness means: the process can reach its database, the schema migrations
 * are applied, and the required secrets are configured. A process that cannot
 * persist patient records must not be reported as healthy.
 */
async function checkReadiness(): Promise<ReadinessResult> {
  const problems: string[] = [];
  const checks: ReadinessResult['checks'] = {
    database: 'unconfigured',
    migrations: 'unknown',
    configuration: 'ok',
  };

  if (!process.env.DATABASE_URL) {
    problems.push('DATABASE_URL is not configured');
  } else {
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'connected';
    } catch {
      checks.database = 'disconnected';
      problems.push('Database is unreachable');
    }
  }

  if (checks.database === 'connected') {
    try {
      const pending = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE finished_at IS NULL
      `;
      const count = Number(pending?.[0]?.count ?? 0);
      checks.migrations = count === 0 ? 'applied' : 'pending';
      if (count > 0) problems.push(`${count} database migration(s) not applied`);
    } catch {
      checks.migrations = 'unknown';
      problems.push('Could not read migration state');
    }
  }

  const jwtProblem = describeJwtSecretProblem();
  if (jwtProblem) {
    checks.configuration = 'incomplete';
    problems.push(jwtProblem);
  }

  return {
    ready: problems.length === 0,
    checks,
    problems,
  };
}

function readinessPayload(result: ReadinessResult) {
  return {
    status: result.ready ? 'ok' : 'unavailable',
    service: 'Neulens Hospital Platform',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
    ...result.checks,
    problems: result.problems,
  };
}

// Liveness: the process is up. Used by orchestrators to decide on restarts.
app.get('/livez', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness: 503 unless the service can actually serve clinical traffic.
// In production the signing secret must be present and long enough. Refuse
// to start (and exit) when it is missing or too short — there is no valid
// fallback, so the only correct behaviour is to fail loudly.
if (process.env.NODE_ENV === 'production') {
  try {
    verifyJwtSecret();
  } catch (err) {
    console.error('[Neulens]: FATAL -', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // Patient records should never cross the network unencrypted. Managed
  // PostgreSQL providers accept TLS via sslmode=require; warn loudly if the
  // connection string does not ask for it rather than failing an existing
  // private-network deployment.
  const databaseUrl = process.env.DATABASE_URL || '';
  if (databaseUrl && !/sslmode=(require|verify-ca|verify-full)/.test(databaseUrl)) {
    console.warn(
      '[Neulens Security Warning]: DATABASE_URL does not request TLS. Add sslmode=require for any hosted database.'
    );
  }
}

async function sendReadiness(_req: express.Request, res: express.Response) {
  try {
    const result = await checkReadiness();
    res.status(result.ready ? 200 : 503).json(readinessPayload(result));
  } catch {
    res.status(503).json({ status: 'unavailable', problems: ['Readiness check failed'] });
  }
}

app.get('/readyz', sendReadiness);
app.get('/health', sendReadiness);

// Main V1 API Routes entry
app.use('/api/v1', apiRouter);

// Serve static frontend build if present (Unified single-service deployment)
const possibleDistPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(__dirname, './client/dist')
];
const resolvedDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (resolvedDistPath) {
  console.log(`[Neulens]: Serving static frontend bundle from ${resolvedDistPath}`);
  app.use(express.static(resolvedDistPath, { dotfiles: 'deny' }));

  // SPA fallback for client-side navigation
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(resolvedDistPath, 'index.html'));
  });
}

// Centralized error routing
app.use(errorHandler); // logs errors via jsonLogger

// Global route catch-all for unhandled endpoints
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint path not found' });
});

// Start listening if not in test suite environment
if (process.env.NODE_ENV !== 'test') {
  // Adds fictional, verified jury accounts. Off unless explicitly opted in:
  // - local / non-production default on (convenient jury testing)
  // - production default off unless DEMO_ACCESS_ENABLED=true
  seedDemoAccess();

  app.listen(PORT, HOST, async () => {
    console.log(`[NeuLens Server]: Running on http://${HOST}:${PORT} | Supervised by Google Antigravity Agent`);
    if (process.env.DATABASE_URL) {
      try {
        await prisma.$connect();
        console.log('[Neulens Database]: PostgreSQL connection established successfully.');
      } catch (dbErr) {
        console.error(
          '[Neulens Database Warning]: Could not connect to PostgreSQL database.',
          dbErr instanceof Error ? dbErr.message : dbErr
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[Neulens Security Warning]: DATABASE_URL is not set in production. Persistent patient records will not be saved.'
      );
    }
  });
}

export default app;
