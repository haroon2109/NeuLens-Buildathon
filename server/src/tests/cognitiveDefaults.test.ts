import { describe, it } from 'node:test';
import assert from 'node:assert';
import { decideDifficulty } from '../services/cognitive/difficulty';
import type { ExposureMap } from '../services/cognitive/rotation';

const exposureWith = (recent: Array<Record<string, unknown>>): ExposureMap => ({
  'memory.word-list': {
    taskId: 'memory.word-list',
    count: recent.length,
    lastUsedAt: '2026-04-01T00:00:00.000Z',
    lastForm: 'A',
    recent: recent as never
  }
});

describe('A missing measurement is never read as poor performance', () => {
  it('does not lower difficulty when two exposures have no recorded accuracy', () => {
    // The old code did `accuracy ?? 0`, so two unscored exposures looked like 0%
    // and dropped the patient a level — punishing them for a missing value.
    const decision = decideDifficulty(
      'memory.word-list',
      exposureWith([
        { taskId: 'memory.word-list', completed: true, skipped: false, trials: 5, difficultyLevel: 3, accuracy: null },
        { taskId: 'memory.word-list', completed: true, skipped: false, trials: 5, difficultyLevel: 3, accuracy: null }
      ])
    );

    assert.strictEqual(decision.level, 2, 'level is the starting level, not a penalty');
    assert.strictEqual(decision.confident, false);
    assert.doesNotMatch(decision.reason, /Lowered/);
  });

  it('still lowers difficulty for two genuinely poor exposures', () => {
    const decision = decideDifficulty(
      'memory.word-list',
      exposureWith([
        { taskId: 'memory.word-list', completed: true, skipped: false, trials: 5, difficultyLevel: 3, accuracy: 0.2 },
        { taskId: 'memory.word-list', completed: true, skipped: false, trials: 5, difficultyLevel: 3, accuracy: 0.3 }
      ])
    );

    assert.strictEqual(decision.level, 2);
    assert.strictEqual(decision.confident, true);
    assert.match(decision.reason, /Lowered/);
  });
});
