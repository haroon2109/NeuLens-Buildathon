import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import app from '../app';

function executeRequest(method: string, url: string): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve) => {
    const req = new EventEmitter() as any;
    req.method = method;
    req.url = url;
    req.path = url;
    req.headers = { host: 'localhost' };
    req.socket = { remoteAddress: '127.0.0.1' };
    req.connection = { remoteAddress: '127.0.0.1' };

    const res = new EventEmitter() as any;
    let statusCode = 200;
    const headers: Record<string, string> = {};
    let body = '';

    res.statusCode = 200;
    res.setHeader = (k: string, v: string) => { headers[k.toLowerCase()] = String(v); };
    res.getHeader = (k: string) => headers[k.toLowerCase()];
    res.status = (code: number) => { statusCode = code; res.statusCode = code; return res; };
    res.json = (data: any) => {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(data);
      resolve({ statusCode, body, headers });
      return res;
    };
    res.send = (data: any) => {
      body = typeof data === 'object' ? JSON.stringify(data) : String(data);
      resolve({ statusCode, body, headers });
      return res;
    };
    res.sendFile = (filePath: string) => {
      body = `[StaticFile: ${filePath}]`;
      resolve({ statusCode, body, headers });
      return res;
    };
    res.end = (data: any) => {
      if (data) body = String(data);
      resolve({ statusCode, body, headers });
      return res;
    };

    (app as any).handle(req, res);
  });
}

describe('Neulens Production Deployment Readiness & Health Checks', () => {
  it('reports liveness with 200 on /livez', async () => {
    const res = await executeRequest('GET', '/livez');
    assert.strictEqual(res.statusCode, 200);
    const parsed = JSON.parse(res.body);
    assert.strictEqual(parsed.status, 'ok');
  });

  it('fails readiness when the database is not usable', async () => {
    // The test environment has no reachable PostgreSQL, so /health and /readyz
    // must report unavailable rather than a misleading 200.
    const res = await executeRequest('GET', '/health');
    assert.strictEqual(res.statusCode, 503);
    const parsed = JSON.parse(res.body);
    assert.strictEqual(parsed.status, 'unavailable');
    assert.strictEqual(parsed.service, 'Neulens Hospital Platform');
    assert.notStrictEqual(parsed.database, 'connected');
    assert.ok(Array.isArray(parsed.problems) && parsed.problems.length > 0);
  });

  it('serves SPA fallback for non-API client routes', async () => {
    const res = await executeRequest('GET', '/patient/register');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('index.html') || res.body.includes('StaticFile'));
  });

  it('returns 404 JSON for non-existent API routes', async () => {
    const res = await executeRequest('GET', '/api/v1/non-existent-route-xyz');
    assert.strictEqual(res.statusCode, 404);
    const parsed = JSON.parse(res.body);
    assert.strictEqual(parsed.error, 'Endpoint path not found');
  });
});
