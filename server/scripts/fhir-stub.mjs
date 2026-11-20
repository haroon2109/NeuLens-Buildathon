#!/usr/bin/env node
/**
 * Local read-only FHIR R4 stand-in, for demonstrating the import path without a
 * live health information exchange.
 *
 * This is NOT a Malaffi connector. It answers the two FHIR searches Neulens
 * performs (Patient by identifier, then Observation by subject + LOINC code) with
 * fixed sample data, so the import can be shown end to end on loopback where the
 * HTTPS requirement is relaxed for development.
 *
 *   node scripts/fhir-stub.mjs                 # http://127.0.0.1:8090/fhir
 *   FHIR_BASE_URL=http://127.0.0.1:8090/fhir \
 *   FHIR_BEARER_TOKEN=dev-token \
 *   FHIR_IDENTIFIER_SYSTEM=urn:neulens:patient-id npm run dev
 *
 * Any identifier resolves to the same sample patient; every observation is dated
 * within the last few weeks.
 */
import http from 'node:http';

const PORT = Number(process.env.FHIR_STUB_PORT || 8090);
const TOKEN = process.env.FHIR_STUB_TOKEN || 'dev-token';
const SAMPLE_PATIENT_ID = 'stub-patient-1';

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

const observation = (code, label, value, unit, days) => ({
  resource: {
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code, display: label }],
      text: label
    },
    valueQuantity: { value, unit, system: 'http://unitsofmeasure.org' },
    effectiveDateTime: daysAgo(days)
  }
});

const observations = [
  observation('8480-6', 'Systolic blood pressure', 138, 'mmHg', 12),
  observation('8462-4', 'Diastolic blood pressure', 84, 'mmHg', 12),
  observation('2345-7', 'Glucose', 6.1, 'mmol/L', 12),
  observation('2093-3', 'Total cholesterol', 5.4, 'mmol/L', 40),
  observation('29463-7', 'Body weight', 78, 'kg', 3),
  observation('41950-7', 'Daily step count', 3200, 'steps', 1),
  observation('93832-4', 'Sleep duration', 5.5, 'h', 1),
  observation('55758-7', 'PHQ-2 score', 2, '{score}', 9)
];

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/fhir+json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  console.log(`${req.method} ${url.pathname}${url.search}`);

  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    return send(res, 401, { resourceType: 'OperationOutcome' });
  }

  if (url.pathname.endsWith('/Patient')) {
    return send(res, 200, {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{ resource: { resourceType: 'Patient', id: SAMPLE_PATIENT_ID } }]
    });
  }

  if (url.pathname.endsWith('/Observation')) {
    return send(res, 200, {
      resourceType: 'Bundle',
      type: 'searchset',
      total: observations.length,
      entry: observations
    });
  }

  send(res, 404, { resourceType: 'OperationOutcome' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`FHIR R4 stub on http://127.0.0.1:${PORT}/fhir (bearer token: ${TOKEN})`);
});
