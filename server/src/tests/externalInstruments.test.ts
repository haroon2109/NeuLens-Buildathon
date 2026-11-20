import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  externalInstrumentCatalog,
  findExternalInstrument,
  prepareExternalInstrumentRecord,
  describeExternalHistory,
  summarizeExternalAnchor
} from '../services/externalInstruments';

const NOW = new Date('2026-11-17T12:00:00.000Z');

describe('A validated instrument score is anchored, never manufactured', () => {
  it('lists the recordable instruments with their scale and licence facts', () => {
    const catalog = externalInstrumentCatalog();
    const keys = catalog.instruments.map((instrument) => instrument.key);
    assert.deepStrictEqual(keys, ['MOCA', 'RUDAS', 'AD8', 'MMSE']);
    assert.match(catalog.platformRole, /does not administer/i);

    const rudas = findExternalInstrument('rudas');
    assert.ok(rudas);
    assert.strictEqual(rudas.licence.required, false);
    assert.deepStrictEqual(rudas.scoreRange, { min: 0, max: 30 });
  });

  it('records a free instrument without inventing a licence', () => {
    const prepared = prepareExternalInstrumentRecord(
      {
        instrumentKey: 'RUDAS',
        language: 'ar',
        administeredOn: '2026-11-01',
        administeredBy: 'Dr. Example',
        score: 22,
        licenceConfirmed: false,
        instrumentVersion: 'A-RUDAS'
      },
      NOW
    );

    assert.strictEqual(prepared.ok, true);
    if (prepared.ok) {
      assert.strictEqual(prepared.record.maxScore, 30);
      assert.strictEqual(prepared.record.instrumentVersion, 'A-RUDAS');
      assert.strictEqual(prepared.record.licenceConfirmed, false);
    }
  });

  it('refuses a licensed instrument whose licence is not confirmed', () => {
    const prepared = prepareExternalInstrumentRecord(
      {
        instrumentKey: 'MOCA',
        language: 'en',
        administeredOn: '2026-11-01',
        administeredBy: 'Dr. Example',
        score: 26,
        licenceConfirmed: false
      },
      NOW
    );

    assert.strictEqual(prepared.ok, false);
    if (!prepared.ok) {
      assert.match(prepared.error, /licence/i);
    }
  });

  it('refuses a score outside the instrument range rather than clipping it', () => {
    const tooHigh = prepareExternalInstrumentRecord(
      {
        instrumentKey: 'AD8',
        language: 'en',
        administeredOn: '2026-11-01',
        administeredBy: 'Dr. Example',
        score: 9,
        licenceConfirmed: true
      },
      NOW
    );
    const tooLow = prepareExternalInstrumentRecord(
      {
        instrumentKey: 'MOCA',
        language: 'en',
        administeredOn: '2026-11-01',
        administeredBy: 'Dr. Example',
        score: -1,
        licenceConfirmed: true
      },
      NOW
    );

    assert.strictEqual(tooHigh.ok, false);
    assert.strictEqual(tooLow.ok, false);
  });

  it('refuses an unknown instrument and a future administration date', () => {
    const unknown = prepareExternalInstrumentRecord(
      {
        instrumentKey: 'SLUMS',
        language: 'en',
        administeredOn: '2026-11-01',
        administeredBy: 'Dr. Example',
        score: 20,
        licenceConfirmed: false
      },
      NOW
    );
    const future = prepareExternalInstrumentRecord(
      {
        instrumentKey: 'RUDAS',
        language: 'en',
        administeredOn: '2026-11-18',
        administeredBy: 'Dr. Example',
        score: 24,
        licenceConfirmed: false
      },
      NOW
    );

    assert.strictEqual(unknown.ok, false);
    assert.strictEqual(future.ok, false);
    if (!future.ok) assert.match(future.error, /future/i);
  });

  it('describes the difference between comparable administrations and refuses incomparable ones', () => {
    const history = describeExternalHistory([
      {
        id: '1', patientId: 'p', instrumentKey: 'RUDAS', instrumentVersion: 'A-RUDAS',
        language: 'ar', administeredOn: '2026-09-01', administeredBy: 'A', score: 22,
        maxScore: 30, licenceConfirmed: false
      },
      {
        id: '2', patientId: 'p', instrumentKey: 'RUDAS', instrumentVersion: 'A-RUDAS',
        language: 'ar', administeredOn: '2026-11-01', administeredBy: 'A', score: 20,
        maxScore: 30, licenceConfirmed: false
      },
      {
        id: '3', patientId: 'p', instrumentKey: 'MOCA', instrumentVersion: '8.1',
        language: 'en', administeredOn: '2026-11-10', administeredBy: 'A', score: 24,
        maxScore: 30, licenceConfirmed: true
      }
    ]);

    assert.strictEqual(history[0].deltaComparability, 'FIRST_RECORD');
    assert.strictEqual(history[1].deltaComparability, 'COMPARABLE');
    assert.strictEqual(history[1].deltaFromPrevious, -2);
    // A switch of instrument is not "a change of 4 points": it is a different scale.
    assert.strictEqual(history[2].deltaComparability, 'DIFFERENT_INSTRUMENT');
    assert.strictEqual(history[2].deltaFromPrevious, null);
  });

  it('summarises the anchor as descriptive and never comparable to the platform composite', () => {
    const anchor = summarizeExternalAnchor([
      {
        id: '1', patientId: 'p', instrumentKey: 'RUDAS', instrumentVersion: null,
        language: 'en', administeredOn: '2026-11-01', administeredBy: 'A', score: 24,
        maxScore: 30, licenceConfirmed: false
      }
    ]);

    assert.strictEqual(anchor.comparableToPlatformComposite, false);
    assert.strictEqual(anchor.deltaBasis, 'DESCRIPTIVE_ARITHMETIC_ONLY');
    assert.strictEqual(anchor.totalRecords, 1);
    assert.match(anchor.note, /not comparable to a Neulens composite/i);

    const empty = summarizeExternalAnchor([]);
    assert.strictEqual(empty.latest, null);
    assert.match(empty.note, /not a validated instrument/i);
  });
});
