import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import jwt from 'jsonwebtoken';
import app from '../app';
import { getJwtSecret } from '../config/jwt';
import { setSessionCookie, SESSION_COOKIE_NAME } from '../services/sessionCookie';

const PATIENT_TOKEN_PAYLOAD = {
  id: 'test-user-auth',
  email: 'test@example.com',
  role: 'PATIENT' as const,
  patientId: 'CV-TEST-000001'
};

function executeRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {}
): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve) => {
    const req = new EventEmitter() as any;
    req.method = method;
    req.url = url;
    req.path = url;
    req.headers = { host: 'localhost', ...lowercaseKeys(headers) };
    req.socket = { remoteAddress: '127.0.0.1' };
    req.connection = { remoteAddress: '127.0.0.1' };

    const res = new EventEmitter() as any;
    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};
    let body = '';

    res.statusCode = 200;
    res.setHeader = (key: string, value: string) => {
      responseHeaders[key.toLowerCase()] = String(value);
    };
    res.getHeader = (key: string) => responseHeaders[key.toLowerCase()];
    res.status = (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.json = (data: unknown) => {
      body = JSON.stringify(data);
      resolve({ statusCode, body, headers: responseHeaders });
      return res;
    };
    res.send = (data: unknown) => {
      body = typeof data === 'object' ? JSON.stringify(data) : String(data);
      resolve({ statusCode, body, headers: responseHeaders });
      return res;
    };
    res.end = (data: unknown) => {
      if (data) body = String(data);
      resolve({ statusCode, body, headers: responseHeaders });
      return res;
    };

    (app as any).handle(req, res);
  });
}

function lowercaseKeys(headers: Record<string, string>) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

const sessionCookieHeader = (token: string) => ({ cookie: `${SESSION_COOKIE_NAME}=${token}` });

describe('Session authentication', () => {
  it('rejects a protected patient route without a session', async () => {
    const res = await executeRequest('GET', '/api/v1/patient/appointments');
    assert.strictEqual(res.statusCode, 401);
  });

  it('accepts a session supplied as an HttpOnly-style cookie', async () => {
    const token = jwt.sign(PATIENT_TOKEN_PAYLOAD, getJwtSecret(), { expiresIn: '1h' });
    const res = await executeRequest('GET', '/api/v1/patient/appointments', sessionCookieHeader(token));
    assert.notStrictEqual(res.statusCode, 401);
    assert.notStrictEqual(res.statusCode, 403);
  });

  it('still accepts a bearer token for programmatic clients', async () => {
    const token = jwt.sign(PATIENT_TOKEN_PAYLOAD, getJwtSecret(), { expiresIn: '1h' });
    const res = await executeRequest('GET', '/api/v1/patient/appointments', {
      authorization: `Bearer ${token}`
    });
    assert.notStrictEqual(res.statusCode, 401);
    assert.notStrictEqual(res.statusCode, 403);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign(PATIENT_TOKEN_PAYLOAD, 'some-other-secret-that-is-not-ours', {
      expiresIn: '1h'
    });
    const res = await executeRequest('GET', '/api/v1/patient/appointments', sessionCookieHeader(forged));
    assert.strictEqual(res.statusCode, 403);
  });

  it('does not accept a session cookie for a clinician-only route', async () => {
    const token = jwt.sign(PATIENT_TOKEN_PAYLOAD, getJwtSecret(), { expiresIn: '1h' });
    const res = await executeRequest('GET', '/api/v1/doctor/appointments', sessionCookieHeader(token));
    assert.strictEqual(res.statusCode, 403);
  });

  it('sets an HttpOnly, SameSite=Lax session cookie on the response', () => {
    let captured: any = null;
    const fakeRes = {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        captured = { name, value, options };
      }
    };

    setSessionCookie(fakeRes as any, 'token-value', 60_000);

    assert.strictEqual(captured.name, SESSION_COOKIE_NAME);
    assert.strictEqual(captured.options.httpOnly, true);
    assert.strictEqual(captured.options.sameSite, 'lax');
    assert.strictEqual(captured.options.path, '/');
    assert.strictEqual(captured.options.maxAge, 60_000);
  });
});

describe('Voice endpoints require a session', () => {
  const protectedRoutes = ['/api/v1/voice/transcribe', '/api/v1/voice/acoustics', '/api/v1/voice/synthesize'];

  for (const route of protectedRoutes) {
    it(`rejects an unauthenticated POST to ${route}`, async () => {
      const res = await executeRequest('POST', route);
      assert.strictEqual(res.statusCode, 401);
    });
  }

  it('keeps the static voice catalog public', async () => {
    const res = await executeRequest('GET', '/api/v1/voice/voices');
    assert.strictEqual(res.statusCode, 200);
  });
});

describe('CORS allowlist', () => {
  it('returns CORS headers for a configured origin', async () => {
    const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
    const res = await executeRequest('GET', '/livez', { origin: allowed });
    assert.strictEqual(res.headers['access-control-allow-origin'], allowed);
  });

  it('never reflects an unconfigured origin', async () => {
    const res = await executeRequest('GET', '/livez', { origin: 'https://attacker.example' });
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
  });
});

describe('JWT secret resolution', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('refuses to resolve a secret in production when none is configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /JWT_SECRET is not configured/);
  });

  it('refuses a too-short secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short-secret';
    assert.throws(() => getJwtSecret(), /at least 32 characters/);
  });

  it('accepts a long secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(32);
    assert.strictEqual(getJwtSecret(), 'a'.repeat(32));
  });
});
