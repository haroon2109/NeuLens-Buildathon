import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { importExternalContext } from '../services/fhirContext';

/**
 * These tests stand a minimal FHIR R4 server on loopback and drive the real
 * fetch path, so the claim "we can ingest lab vitals over FHIR" is checked
 * against an HTTP exchange rather than the parser alone. Loopback HTTP is the
 * documented development exception in `getFhirConfig`.
 */
let server: http.Server;
let baseUrl: string;
let observationBundle: unknown;
let requestedPaths: string[] = [];
let failObservations = false;

const patientBundle = {
  resourceType: 'Bundle',
  entry: [{ resource: { resourceType: 'Patient', id: 'fhir-patient-1' } }]
};

const observation = (code: string, value: number, unit: string) => ({
  resource: {
    resourceType: 'Observation',
    code: { coding: [{ system: 'http://loinc.org', code }] },
    valueQuantity: { value, unit },
    effectiveDateTime: '2026-11-01T00:00:00Z'
  }
});

before(async () => {
  server = http.createServer((req, res) => {
    requestedPaths.push(`${req.method} ${req.url}`);
    assert.strictEqual(req.headers.authorization, 'Bearer test-token');
    res.setHeader('Content-Type', 'application/fhir+json');
    if (req.url?.startsWith('/fhir/Patient')) {
      res.end(JSON.stringify(patientBundle));
      return;
    }
    if (req.url?.startsWith('/fhir/Observation')) {
      if (failObservations) {
        res.statusCode = 500;
        res.end(JSON.stringify({ resourceType: 'OperationOutcome' }));
        return;
      }
      res.end(JSON.stringify(observationBundle));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/fhir`;
});

after(() => {
  delete process.env.FHIR_BASE_URL;
  delete process.env.FHIR_BEARER_TOKEN;
  server.close();
});

const configure = () => {
  process.env.FHIR_BASE_URL = baseUrl;
  process.env.FHIR_BEARER_TOKEN = 'test-token';
};

describe('FHIR R4 context import', () => {
  it('sends nothing to an external system when consent was not granted', async () => {
    configure();
    requestedPaths = [];
    const record = await importExternalContext(false, 'CV-2026-TEST01');
    assert.strictEqual(record, null);
    assert.deepStrictEqual(requestedPaths, []);
  });

  it('imports supported blood pressure and glucose values with provenance', async () => {
    configure();
    requestedPaths = [];
    observationBundle = {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'Observation',
            component: [
              {
                code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
                valueQuantity: { value: 138, unit: 'mmHg' }
              },
              {
                code: { coding: [{ system: 'http://loinc.org', code: '8462-4' }] },
                valueQuantity: { value: 84, unit: 'mmHg' }
              }
            ],
            effectiveDateTime: '2026-11-10T00:00:00Z'
          }
        },
        observation('2345-7', 6.1, 'mmol/L'),
        observation('99999-9', 42, 'unsupported')
      ]
    };

    const record = await importExternalContext(true, 'CV-2026-TEST01');

    assert.ok(record);
    assert.strictEqual(record.status, 'IMPORTED');
    assert.ok(record.importedAt);
    assert.deepStrictEqual(
      record.observations.map((entry) => [entry.code, entry.value, entry.unit]),
      [['8480-6', 138, 'mmHg'], ['8462-4', 84, 'mmHg'], ['2345-7', 6.1, 'mmol/L']]
    );
    // The patient is resolved by identifier inside the connected system, and the
    // observation query is bounded to the supported LOINC list.
    assert.match(requestedPaths[0], /\/fhir\/Patient\?identifier=urn%3Aneulens%3Apatient-id%7CCV-2026-TEST01/);
    assert.match(requestedPaths[1], /code=.*8480-6/);
  });

  it('reports no matching data instead of inventing values', async () => {
    configure();
    observationBundle = { resourceType: 'Bundle', entry: [observation('99999-9', 12, 'unknown')] };
    const record = await importExternalContext(true, 'CV-2026-TEST01');
    assert.ok(record);
    assert.strictEqual(record.status, 'NO_MATCHING_DATA');
    assert.strictEqual(record.importedAt, null);
    assert.deepStrictEqual(record.observations, []);
  });

  it('records a failed import without throwing, so the screening still saves', async () => {
    configure();
    failObservations = true;
    const record = await importExternalContext(true, 'CV-2026-TEST01');
    failObservations = false;
    assert.ok(record);
    assert.strictEqual(record.status, 'FAILED');
    assert.strictEqual(record.importedAt, null);
  });

  it('reports an unconfigured deployment rather than pretending to be linked', async () => {
    delete process.env.FHIR_BASE_URL;
    delete process.env.FHIR_BEARER_TOKEN;
    const record = await importExternalContext(true, 'CV-2026-TEST01');
    assert.ok(record);
    assert.strictEqual(record.status, 'NOT_CONFIGURED');
    assert.deepStrictEqual(record.observations, []);
  });
});
