import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEMO_PATIENT, seedDemoAccess } from '../services/demoAccess';
import { HospitalDataStore } from '../models/dataStore';
import { computePlatformInsights } from '../services/platformInsights';
import { isDemoAssessment } from '../services/demoRecords';

/**
 * The jury demo ships fictional sign-in accounts. No screening history is
 * seeded for them: a made-up record is indistinguishable from a real one once
 * it is in the store, so the portals must only ever show measured sessions.
 */
describe('Fictional demo accounts never enter clinical aggregates', () => {
  seedDemoAccess();

  it('hides the demo patient from a clinical patient directory by default', async () => {
    const clinical = await HospitalDataStore.listPatients('', 'ALL');
    assert.ok(
      !clinical.some((patient) => patient.patientId === DEMO_PATIENT.patientId),
      'the fictional patient must not appear in a clinical directory'
    );

    const demoWorkspace = await HospitalDataStore.listPatients('', 'ALL', { includeDemo: true });
    assert.ok(
      demoWorkspace.some((patient) => patient.patientId === DEMO_PATIENT.patientId),
      'the demo workspace still needs its fictional patient'
    );
  });

  it('seeds no assessments, scores or sensor measurements for the demo accounts', async () => {
    const clinical = await HospitalDataStore.getDoctorDashboardStats();
    const demoWorkspace = await HospitalDataStore.getDoctorDashboardStats({ includeDemo: true });

    assert.strictEqual(clinical.totalPatients, 0);
    assert.strictEqual(clinical.completedAssessments, 0);
    assert.strictEqual(clinical.pendingReviews, 0);
    assert.deepStrictEqual(clinical.recentAssessments, []);
    assert.deepStrictEqual(clinical.changeReviewQueue, []);

    assert.strictEqual(demoWorkspace.completedAssessments, 0);
    assert.deepStrictEqual(demoWorkspace.recentAssessments, []);
  });

  it('keeps platform insights empty when only demo data exists', async () => {
    const insights = await computePlatformInsights();

    assert.strictEqual(insights.population.patients, 0);
    assert.strictEqual(insights.population.completedAssessments, 0);
    assert.strictEqual(insights.safetyGates.comparabilityRate, null);
    assert.strictEqual(insights.measurementProperties.repeatSessionPairs, 0);
    assert.strictEqual(insights.measurementProperties.icc21, null);
    assert.deepStrictEqual(insights.fairnessMeasurement.byLanguage, []);
  });

  it('recognises demo records by their marker as well as by owner', () => {
    assert.strictEqual(isDemoAssessment({ userId: 'someone', taskResponses: { mode: 'DEMO' } }), true);
    assert.strictEqual(isDemoAssessment({ userId: 'someone', taskResponses: { mode: 'COGNITIVE' } }), false);
    assert.strictEqual(isDemoAssessment(null), false);
  });
});
