import { describe, it } from 'node:test';
import assert from 'node:assert';
import { icc21, MIN_REPEAT_PAIRS_FOR_ICC } from '../services/reliability';

/**
 * The platform reports no reliability coefficient unless repeated administrations
 * actually exist. These tests pin the arithmetic and, just as importantly, the
 * refusals: too few pairs and zero-variance samples must not produce a number.
 */
describe('Test–retest reliability (ICC 2,1)', () => {
  it('computes the coefficient for a worked example', () => {
    const estimate = icc21([
      { first: 10, second: 12 },
      { first: 20, second: 22 },
      { first: 30, second: 28 },
      { first: 40, second: 42 }
    ]);

    assert.ok(estimate);
    // MSR 322, MSC 2, MSE 2 → (322 - 2) / (322 + 2 + 0) = 320 / 324
    assert.strictEqual(estimate.value, 0.9877);
    assert.strictEqual(estimate.pairs, 4);
    assert.strictEqual(estimate.provisional, true);
  });

  it('refuses to estimate from fewer than the minimum repeat pairs', () => {
    assert.strictEqual(MIN_REPEAT_PAIRS_FOR_ICC, 3);
    assert.strictEqual(icc21([{ first: 10, second: 12 }, { first: 20, second: 22 }]), null);
    assert.strictEqual(icc21([]), null);
  });

  it('returns no coefficient when every participant scored the same in both sessions', () => {
    assert.strictEqual(
      icc21([
        { first: 50, second: 50 },
        { first: 50, second: 50 },
        { first: 50, second: 50 }
      ]),
      null
    );
  });

  it('penalises a systematic offset between administrations', () => {
    const estimate = icc21([
      { first: 40, second: 50 },
      { first: 40, second: 50 },
      { first: 40, second: 50 }
    ]);

    assert.ok(estimate);
    assert.strictEqual(estimate.value, 0);
  });

  it('reports poor agreement as a negative coefficient', () => {
    const estimate = icc21([
      { first: 10, second: 90 },
      { first: 90, second: 10 },
      { first: 20, second: 80 }
    ]);

    assert.ok(estimate);
    assert.ok(estimate.value < 0, `expected poor agreement, got ${estimate.value}`);
  });

  it('ignores non-finite entries instead of computing with them', () => {
    assert.strictEqual(
      icc21([
        { first: 10, second: Number.NaN },
        { first: 20, second: 22 },
        { first: 30, second: 28 }
      ]),
      null
    );
  });
});
