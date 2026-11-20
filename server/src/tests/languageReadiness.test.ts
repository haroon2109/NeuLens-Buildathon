import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getParticipantLanguageReadiness,
  languageSubmissionGate,
  resolveLanguageReadiness
} from '../services/assessmentLanguageReadiness';

/**
 * The readiness registry used to be documentation with no runtime effect: the
 * language screen offered every language and the battery ran in English anyway.
 * These tests pin the enforcement: a language whose task wording has not been
 * reviewed cannot be submitted silently.
 */
describe('Language readiness is enforced, not just documented', () => {
  it('resolves codes, tags and display names to one registry entry', () => {
    assert.strictEqual(resolveLanguageReadiness('en')?.language, 'English');
    assert.strictEqual(resolveLanguageReadiness('ar')?.language, 'Arabic');
    assert.strictEqual(resolveLanguageReadiness('ar-AE')?.language, 'Arabic');
    assert.strictEqual(resolveLanguageReadiness('Arabic')?.language, 'Arabic');
    assert.strictEqual(resolveLanguageReadiness('tlh'), null);
    assert.strictEqual(resolveLanguageReadiness(undefined), null);
  });

  it('admits the source language without an acknowledgement', () => {
    const gate = languageSubmissionGate('en', false);
    assert.strictEqual(gate.allowed, true);
    assert.strictEqual(gate.acknowledgementRequired, false);
    assert.strictEqual(gate.taskAdministrationReady, true);
    assert.deepStrictEqual(gate.pendingStages, []);
  });

  it('refuses a language whose task stages are incomplete', () => {
    const gate = languageSubmissionGate('ar', false);
    assert.strictEqual(gate.allowed, false);
    assert.strictEqual(gate.acknowledgementRequired, true);
    assert.strictEqual(gate.taskAdministrationReady, false);
    // Arabic wording exists; back-translation, pretesting and clinical review do not.
    const keys = gate.pendingStages.map((stage) => stage.key);
    assert.ok(!keys.includes('stimulus_translation'), 'Arabic stimulus wording is translated');
    assert.ok(keys.includes('back_translation'));
    assert.ok(keys.includes('local_clinical_review'));
  });

  it('allows a not-ready language once the participant acknowledged the limits', () => {
    const gate = languageSubmissionGate('ar', true);
    assert.strictEqual(gate.allowed, true);
    assert.strictEqual(gate.acknowledgementRequired, true);
  });

  it('treats an unknown language as not administrable', () => {
    const gate = languageSubmissionGate('zz', true);
    assert.strictEqual(gate.taskAdministrationReady, false);
    assert.strictEqual(gate.readiness, null);
    assert.deepStrictEqual(gate.pendingStages, []);
    // Acknowledged-but-unknown is still rejected upstream by the controller's
    // readiness check; the gate reports that no registry entry backs it.
    assert.strictEqual(gate.language, 'zz');
  });

  it('publishes a participant view without internal sign-off bookkeeping', () => {
    const view = getParticipantLanguageReadiness();
    assert.ok(view.languages.length >= 2);
    assert.ok(!('signOffs' in view));

    const english = view.languages.find((item) => item.id === 'en');
    const arabic = view.languages.find((item) => item.id === 'ar');

    assert.strictEqual(english?.taskAdministrationReady, true);
    assert.strictEqual(english?.dir, 'ltr');
    assert.match(english?.participantNotice || '', /reviewed/i);

    assert.strictEqual(arabic?.taskAdministrationReady, false);
    assert.strictEqual(arabic?.dir, 'rtl');
    assert.match(arabic?.participantNotice || '', /still being reviewed/i);
    assert.ok((arabic?.pendingStages.length || 0) > 0);
  });
});
