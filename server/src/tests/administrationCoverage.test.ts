import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scoreBatterySession } from '../services/sessionScoring';
import { buildClinicalDocumentation } from '../services/workflow/clinicalDocumentationEngine';

/**
 * The battery used to award a score to activities that never produced a
 * measurement: 85 when a facial task was "skipped", 80 when the dot task was,
 * 88 for a voice recording that was never compared to anything. A participant
 * without a camera therefore received a normal-looking composite computed partly
 * from constants. These tests pin the replacement: no measurement, no score, and
 * a recorded reason a clinician can read.
 */
const recordedSession = {
  game1: { score: 82, reactionTimes: [400, 420, 390, 410, 405] },
  game2: { score: 91, mismatches: 1 },
  game3: { score: 94, transcript: 'the quick brown fox' },
  game4: { score: 78, stability: 78 },
  game5: { score: 88, errors: 1 },
  pianoSequence: { score: 76 }
};

describe('A session records what it measured, not what it could have measured', () => {
  it('scores a fully administered session', () => {
    const battery = scoreBatterySession(recordedSession);
    assert.strictEqual(battery.complete, true);
    assert.strictEqual(typeof battery.composite, 'number');
    assert.deepStrictEqual(battery.coverage.notMeasured, []);
    assert.deepStrictEqual(battery.coverage.unmeasuredDomains, []);
    assert.strictEqual(battery.coverage.measured.length, 6);
  });

  it('leaves the attention domain unmeasured when the camera activity had no score', () => {
    const battery = scoreBatterySession({
      ...recordedSession,
      game4: { score: null, notMeasured: 'CAMERA_UNAVAILABLE', stability: null }
    });

    assert.strictEqual(battery.taskScores.game4, null);
    assert.strictEqual(battery.domains.attention, null);
    // Attention feeds the composite, so the whole session is not interpretable.
    assert.strictEqual(battery.composite, null);
    assert.deepStrictEqual(battery.coverage.unmeasuredDomains, ['attention']);
    assert.deepStrictEqual(battery.coverage.notMeasured, [
      { task: 'game4', reason: 'CAMERA_UNAVAILABLE' }
    ]);
  });

  it('does not treat an unknown absence reason as a measurement', () => {
    const battery = scoreBatterySession({
      ...recordedSession,
      game5: { score: null, notMeasured: 'SOMETHING_ELSE' }
    });
    assert.strictEqual(battery.taskScores.game5, null);
    // Unrecognised reasons are not echoed as if they were meaningful codes.
    assert.deepStrictEqual(battery.coverage.notMeasured, [
      { task: 'game5', reason: 'NOT_RECORDED' }
    ]);
  });

  it('reports every activity of a fully skipped battery as not measured', () => {
    const battery = scoreBatterySession({
      game1: { score: null, notMeasured: 'SKIPPED' },
      game2: { score: null, notMeasured: 'TIME_LIMIT' },
      game3: { score: null, notMeasured: 'MICROPHONE_UNAVAILABLE' },
      game4: { score: null, notMeasured: 'CAMERA_UNAVAILABLE' },
      game5: { score: null, notMeasured: 'SKIPPED' },
      pianoSequence: { score: null, notMeasured: 'TIME_LIMIT' }
    });

    assert.strictEqual(battery.composite, null);
    assert.deepStrictEqual(battery.coverage.measured, []);
    assert.strictEqual(battery.coverage.notMeasured.length, 6);
    assert.deepStrictEqual(battery.coverage.unmeasuredDomains, [
      'memory',
      'attention',
      'visuospatial',
      'executive'
    ]);
  });

  it('tells the clinician which domains are missing and why', () => {
    const doc = buildClinicalDocumentation({
      assessment: { overallScore: 84, createdAt: new Date().toISOString() },
      taskResponses: {
        ...recordedSession,
        administration: {
          measured: ['game1', 'game2', 'game3', 'game5', 'pianoSequence'],
          notMeasured: [{ task: 'game4', reason: 'CAMERA_UNAVAILABLE' }],
          unmeasuredDomains: ['attention']
        }
      },
      baseline: null,
      history: [],
      longitudinal: {
        status: 'INSUFFICIENT_DATA',
        cognitiveChange: null,
        outsideBaseline: null,
        comparableAssessments: 0,
        reviewReasons: []
      },
      safety: { sessionQuality: 'FAIR', urgentFlags: [] },
      contextInputs: [],
      preventionSignals: []
    } as never);

    const limitations = doc.evidence.limitations.join('\n');
    assert.match(limitations, /Domains not measured in this session: attention \(no camera\)/);
    assert.match(limitations, /No score was substituted for a missing domain/);
    assert.ok(
      doc.evidence.sources.some((source) => source.includes('administration')),
      'the coverage record is cited as a source'
    );
  });
});
