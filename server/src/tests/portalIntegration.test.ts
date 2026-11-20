import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HospitalDataStore, generatePatientIdentifier } from '../models/dataStore';
import type { AssessmentRecord } from '../models/dataStore';
import { PatientController } from '../controllers/patient.controller';
import { DoctorController } from '../controllers/doctor.controller';
import { summarizePatientChanges } from '../services/changeMonitor';
import { doctorCarePlanSchema, patientSubmitAssessmentSchema } from '../validation/schemas';
import { extractFhirContext } from '../services/fhirContext';

const createAssessment = (
  id: string,
  date: string,
  overallScore: number,
  activities?: Record<string, number>
): AssessmentRecord => ({
  id,
  userId: 'change-monitor-patient',
  date: new Date(date),
  overallScore,
  reviewState: 'NOT_REVIEWED',
  status: 'COMPLETED',
  reviewStatus: 'PENDING_REVIEW',
  taskResponses: activities
    ? {
        functionalCheckIn: {
          completedAt: date,
          activities,
          contextFactors: { sleep: 0, activity: 0, moodStress: 0 },
          assessmentContext: {
            language: 'en',
            ageYears: 70,
            educationYears: 12,
            taskVersion: 'neulens-mvp-0.1',
            accessibility: { vision: 0, hearing: 0, motor: 0, digitalFamiliarity: 0 }
          }
        }
      }
    : {}
});

describe('Neulens Dual-Portal Integration Tests (Patient & Doctor)', () => {
  describe('Functional check-in validation', () => {
    it('accepts completed check-ins and rejects out-of-range responses', () => {
      const base = {
        taskResponses: {
          functionalCheckIn: {
            completedAt: '2026-03-01T00:00:00.000Z',
            contextFactors: { sleep: 0, activity: 0, moodStress: 0 },
            assessmentContext: {
              language: 'en',
              ageYears: 70,
              educationYears: 12,
              taskVersion: 'neulens-mvp-0.1',
              accessibility: { vision: 0, hearing: 0, motor: 0, digitalFamiliarity: 0 }
            },
            activities: {
              appointments: 0,
              medication: 1,
              finances: 0,
              household: 2
            }
          },
          externalContextConsent: { granted: false, recordedAt: '2026-03-01T00:00:00.000Z' }
        }
      };

      assert.strictEqual(patientSubmitAssessmentSchema.safeParse(base).success, true);
      assert.strictEqual(patientSubmitAssessmentSchema.safeParse({
        ...base,
        taskResponses: {
          functionalCheckIn: {
            ...base.taskResponses.functionalCheckIn,
            activities: { ...base.taskResponses.functionalCheckIn.activities, medication: 3 }
          }
        }
      }).success, false);
      assert.strictEqual(patientSubmitAssessmentSchema.safeParse({
        ...base,
        taskResponses: {
          functionalCheckIn: {
            completedAt: '2026-03-01T00:00:00.000Z',
            activities: { appointments: 0, medication: 1, finances: 0, household: 2 }
          }
        }
      }).success, true);
    });
  });

  describe('Clinician follow-up plan validation', () => {
    it('validates explicit clinician action and optional date', () => {
      assert.strictEqual(doctorCarePlanSchema.safeParse({
        action: 'REPEAT_SCREENING',
        followUpDate: '2026-05-01',
        notes: 'Repeat with usual glasses.'
      }).success, true);
      assert.strictEqual(doctorCarePlanSchema.safeParse({
        action: 'DIAGNOSE',
        followUpDate: 'tomorrow',
        notes: ''
      }).success, false);
    });

    it('persists follow-up plans on the selected assessment record', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Care Plan Patient',
        age: 75,
        dob: '1951',
        pin: '6666',
        gender: 'FEMALE',
        language: 'en',
        educationYears: 12,
        handedness: 'RIGHT'
      });
      const assessment = await HospitalDataStore.submitAssessment(patient.id, {
        overallScore: 78,
        reactionTime: 255,
        blinkRate: 15,
        fixationScore: 86,
        speechRate: 124,
        pauseScore: 82,
        jitter: 0.14,
        shimmer: 1.4,
        symmetry: 92,
        tremorScore: 8,
        taskResponses: {}
      });
      const saved = await HospitalDataStore.saveClinicianCarePlan(assessment.id, {
        action: 'REPEAT_SCREENING',
        followUpDate: '2026-05-01',
        notes: 'Repeat under comparable conditions.',
        savedAt: '2026-04-01T00:00:00.000Z',
        savedBy: 'dr.sharma@cognivision.ai'
      });

      assert.strictEqual(saved?.taskResponses?.clinicianCarePlan?.action, 'REPEAT_SCREENING');
      assert.strictEqual(saved?.taskResponses?.clinicianCarePlan?.followUpDate, '2026-05-01');
    });
  });

  describe('Longitudinal Change Monitor', () => {
    it('does not produce a cue before a comparable history exists', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 80)
      ]);

      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
      assert.deepStrictEqual(summary.reviewReasons, []);
    });

    it('does not treat missing functional check-ins as evidence of no functional change', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-2', '2026-02-01T00:00:00Z', 80),
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 80)
      ]);

      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
    });

    it('flags a decline larger than the patient\'s own measured session-to-session variability', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-4', '2026-04-01T00:00:00Z', 70, {
          appointments: 0, medication: 0, finances: 0, household: 0
        }),
        createAssessment('screen-3', '2026-03-01T00:00:00Z', 76, {
          appointments: 0, medication: 0, finances: 0, household: 0
        }),
        createAssessment('screen-2', '2026-02-01T00:00:00Z', 80, {
          appointments: 0, medication: 0, finances: 0, household: 0
        }),
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 82, {
          appointments: 0, medication: 0, finances: 0, household: 0
        })
      ]);

      // Three repeat pairs (82→80→76→70) give SD of change 2.0, so the reliable
      // change threshold is 1.96 × 2.0 = 3.9 points and a 9.3-point decline is
      // distinguishable from this patient's noise.
      assert.strictEqual(summary.status, 'REVIEW');
      assert.deepStrictEqual(summary.reviewReasons, ['OUTSIDE_RELIABLE_CHANGE']);
      assert.strictEqual(summary.cognitive.change, -6);
      assert.strictEqual(summary.cognitive.declineBeyondReliableChange, true);
      assert.strictEqual(summary.cognitive.reliability.state, 'PROVISIONAL');
      assert.strictEqual(summary.cognitive.reliability.pairs, 3);
      assert.deepStrictEqual(summary.cognitive.baselineRange, { minimum: 76, maximum: 82 });
    });

    it('flags increased daily-function difficulty against the previous check-in', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-2', '2026-02-01T00:00:00Z', 80, {
          appointments: 0,
          medication: 2,
          finances: 0,
          household: 0
        }),
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 81, {
          appointments: 0,
          medication: 1,
          finances: 0,
          household: 0
        })
      ]);

      assert.strictEqual(summary.status, 'REVIEW');
      assert.deepStrictEqual(summary.reviewReasons, ['FUNCTIONAL_CHANGE']);
      assert.deepStrictEqual(summary.function.worsenedActivityIds, ['medication']);
    });

    it('reports no conclusion, not stability, when variability has not been estimated', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-2', '2026-02-01T00:00:00Z', 82, {
          appointments: 0,
          medication: 1,
          finances: 0,
          household: 0
        }),
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 80, {
          appointments: 0,
          medication: 1,
          finances: 0,
          household: 0
        })
      ]);

      // One repeat pair is not enough to know what this score does when nothing
      // has changed, so neither "changed" nor "stable" may be reported.
      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
      assert.strictEqual(summary.cognitive.reliability.state, 'NOT_ESTABLISHED');
      assert.strictEqual(summary.cognitive.reliability.pairs, 1);
      assert.deepStrictEqual(summary.reviewReasons, []);
    });

    it('reports stability once four comparable sessions establish the variability', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-4', '2026-04-01T00:00:00Z', 81, {
          appointments: 0, medication: 1, finances: 0, household: 0
        }),
        createAssessment('screen-3', '2026-03-01T00:00:00Z', 79, {
          appointments: 0, medication: 1, finances: 0, household: 0
        }),
        createAssessment('screen-2', '2026-02-01T00:00:00Z', 82, {
          appointments: 0, medication: 1, finances: 0, household: 0
        }),
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 80, {
          appointments: 0, medication: 1, finances: 0, household: 0
        })
      ]);

      // SD of change across 82→79→81 (2, -2) is 2.8, threshold 5.5; the 0.3-point
      // difference from the reference is well inside the noise.
      assert.strictEqual(summary.cognitive.reliability.state, 'PROVISIONAL');
      assert.strictEqual(summary.cognitive.declineBeyondReliableChange, false);
      assert.strictEqual(summary.status, 'NO_CHANGE');
    });

    it('does not flag a drop that is smaller than the established variability', () => {
      const summary = summarizePatientChanges([
        createAssessment('screen-4', '2026-04-01T00:00:00Z', 74, {
          appointments: 0, medication: 1, finances: 0, household: 0
        }),
        createAssessment('screen-3', '2026-03-01T00:00:00Z', 86, {
          appointments: 0, medication: 1, finances: 0, household: 0
        }),
        createAssessment('screen-2', '2026-02-01T00:00:00Z', 75, {
          appointments: 0, medication: 1, finances: 0, household: 0
        }),
        createAssessment('screen-1', '2026-01-01T00:00:00Z', 88, {
          appointments: 0, medication: 1, finances: 0, household: 0
        })
      ]);

      // This patient swings about 13 points between sessions, so their reliable
      // change threshold is ~26 points and a 9-point drop is within their noise.
      assert.strictEqual(summary.cognitive.reliability.state, 'PROVISIONAL');
      assert.ok((summary.cognitive.reliability.reliableChangeThreshold || 0) > 9);
      assert.strictEqual(summary.cognitive.declineBeyondReliableChange, false);
      assert.deepStrictEqual(summary.reviewReasons, []);
    });

    it('does not compare across language or accessibility changes', () => {
      const current = createAssessment('screen-2', '2026-02-01T00:00:00Z', 60, {
        appointments: 0, medication: 0, finances: 0, household: 0
      });
      current.taskResponses.functionalCheckIn.assessmentContext.language = 'ta';
      const prior = createAssessment('screen-1', '2026-01-01T00:00:00Z', 80, {
        appointments: 0, medication: 0, finances: 0, household: 0
      });

      const summary = summarizePatientChanges([current, prior]);
      assert.strictEqual(summary.cognitive.change, null);
      assert.strictEqual(summary.cognitive.declineBeyondReliableChange, false);
      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
    });

    it('flags sleep, physical activity, or mood/stress changes separately', () => {
      const current = createAssessment('screen-2', '2026-02-01T00:00:00Z', 80, {
        appointments: 0, medication: 0, finances: 0, household: 0
      });
      current.taskResponses.functionalCheckIn.contextFactors.sleep = 2;
      const prior = createAssessment('screen-1', '2026-01-01T00:00:00Z', 80, {
        appointments: 0, medication: 0, finances: 0, household: 0
      });

      const summary = summarizePatientChanges([current, prior]);
      assert.deepStrictEqual(summary.reviewReasons, ['CONTEXT_CHANGE']);
      assert.deepStrictEqual(summary.context.changedFactors, ['sleep']);
    });
  });

  describe('FHIR R4 context extraction', () => {
    it('imports only supported LOINC observations with values and provenance', () => {
      const observations = extractFhirContext({
        resourceType: 'Bundle',
        entry: [{
          resource: {
            resourceType: 'Observation',
            code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
            valueQuantity: { value: 120, unit: 'mmHg' },
            effectiveDateTime: '2026-02-01T00:00:00Z'
          }
        }, {
          resource: {
            resourceType: 'Observation',
            code: { coding: [{ system: 'http://loinc.org', code: '99999-9' }] },
            valueQuantity: { value: 12, unit: 'unknown' }
          }
        }]
      });

      assert.deepStrictEqual(observations, [{
        category: 'metabolic',
        code: '8480-6',
        label: 'Systolic blood pressure',
        value: 120,
        unit: 'mmHg',
        recordedAt: '2026-02-01T00:00:00Z',
        source: 'FHIR R4'
      }]);
    });
  });

  describe('1. Unique Patient Identifier Generation', () => {
    it('generates patient ID starting with CV-2026- with 6 character uppercase alphanumeric suffix', () => {
      const id = generatePatientIdentifier();
      assert.match(id, /^CV-2026-[A-Z2-9]{6}$/);
    });

    it('generates distinct IDs with no immediate collisions', () => {
      const set = new Set<string>();
      for (let i = 0; i < 50; i++) {
        set.add(generatePatientIdentifier());
      }
      assert.strictEqual(set.size, 50);
    });
  });

  describe('2. Patient Registration & Portal Flow', () => {
    it('registers a new patient, saves demographic info, and issues a valid CV-2026- ID', async () => {
      const { user, patientId } = await HospitalDataStore.createPatient({
        name: 'Harold Finch',
        age: 74,
        dob: '1952',
        pin: '9876',
        gender: 'MALE',
        language: 'en',
        educationYears: 16,
        handedness: 'RIGHT'
      });

      assert.ok(patientId.startsWith('CV-2026-'));
      assert.strictEqual(user.patientId, patientId);
      assert.strictEqual(user.name, 'Harold Finch');
      assert.strictEqual(user.role, 'PATIENT');
      assert.strictEqual(user.age, 74);
    });

    it('finds newly registered patient by patient ID', async () => {
      const { patientId } = await HospitalDataStore.createPatient({
        name: 'Find Me Patient',
        age: 70,
        dob: '1956',
        pin: '1111',
        gender: 'FEMALE',
        language: 'en',
        educationYears: 12,
        handedness: 'RIGHT'
      });
      const patient = await HospitalDataStore.findUserByPatientId(patientId);
      assert.ok(patient);
      assert.strictEqual(patient.name, 'Find Me Patient');
      assert.strictEqual(patient.role, 'PATIENT');
    });
  });

  describe('3. Patient Assessment Submission & Privacy Isolation', () => {
    it('submits patient assessment responses and stores metrics for clinical review', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Assessment Patient',
        age: 71,
        dob: '1955',
        pin: '2222',
        gender: 'MALE',
        language: 'en',
        educationYears: 14,
        handedness: 'RIGHT'
      });
      assert.ok(patient);

      const submitted = await HospitalDataStore.submitAssessment(patient.id, {
        overallScore: 86.0,
        reactionTime: 235,
        blinkRate: 13,
        fixationScore: 94,
        speechRate: 140,
        pauseScore: 92,
        jitter: 0.10,
        shimmer: 1.10,
        symmetry: 96.2,
        tremorScore: 5.8,
        taskResponses: {
          task1: { fixations: 94 },
          task2: { memoryMatches: 6 }
        }
      });

      assert.ok(submitted.id);
      assert.strictEqual(submitted.userId, patient.id);
      assert.strictEqual(submitted.overallScore, 86.0);
      assert.strictEqual(submitted.status, 'COMPLETED');
      assert.strictEqual(submitted.reviewStatus, 'PENDING_REVIEW');
    });
  });

  describe('4. Doctor Portal: Dashboard & Patient Management', () => {
    it('computes real dashboard statistics including patient count and pending reviews', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Dashboard Patient',
        age: 72,
        dob: '1954',
        pin: '3333',
        gender: 'FEMALE',
        language: 'en',
        educationYears: 12,
        handedness: 'RIGHT'
      });
      await HospitalDataStore.submitAssessment(patient.id, {
        overallScore: 80,
        reactionTime: 240,
        blinkRate: 14,
        fixationScore: 88,
        speechRate: 130,
        pauseScore: 85,
        jitter: 0.12,
        shimmer: 1.2,
        symmetry: 94,
        tremorScore: 7,
        taskResponses: {}
      });
      const stats = await HospitalDataStore.getDoctorDashboardStats();
      assert.ok(stats.totalPatients >= 1);
      assert.ok(stats.completedAssessments >= 1);
      assert.ok(Array.isArray(stats.recentAssessments));
      assert.ok(stats.recentAssessments.length > 0);
      assert.ok(stats.recentAssessments[0].patientId.startsWith('CV-2026-'));
    });

    it('searches patients by patient ID and returns detailed medical file', async () => {
      const { user: patient, patientId } = await HospitalDataStore.createPatient({
        name: 'Detail Patient',
        age: 73,
        dob: '1953',
        pin: '4444',
        gender: 'FEMALE',
        language: 'en',
        educationYears: 13,
        handedness: 'RIGHT'
      });
      await HospitalDataStore.submitAssessment(patient.id, {
        overallScore: 79,
        reactionTime: 250,
        blinkRate: 15,
        fixationScore: 85,
        speechRate: 125,
        pauseScore: 82,
        jitter: 0.13,
        shimmer: 1.3,
        symmetry: 93,
        tremorScore: 8,
        taskResponses: {}
      });
      const patients = await HospitalDataStore.listPatients(patientId);
      assert.strictEqual(patients.length, 1);
      assert.strictEqual(patients[0].name, 'Detail Patient');
      assert.strictEqual(patients[0].patientId, patientId);

      const file = await HospitalDataStore.getPatientDetail(patientId);
      assert.ok(file);
      assert.strictEqual(file.patient.name, 'Detail Patient');
      assert.ok(file.assessments.length > 0);
    });

    it('allows doctor to review a screening report and save notes', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Review Patient',
        age: 81,
        dob: '1945',
        pin: '5555',
        gender: 'MALE',
        language: 'en',
        educationYears: 12,
        handedness: 'RIGHT'
      });
      const submitted = await HospitalDataStore.submitAssessment(patient.id, {
        overallScore: 58,
        reactionTime: 380,
        blinkRate: 22,
        fixationScore: 62,
        speechRate: 84,
        pauseScore: 54,
        jitter: 0.28,
        shimmer: 3.4,
        symmetry: 82,
        tremorScore: 18,
        taskResponses: {}
      });
      const report = await HospitalDataStore.getScreeningReport(submitted.id);
      assert.ok(report);
      assert.strictEqual(report.patient.name, 'Review Patient');
      // A low score no longer produces a risk tier: the record is simply
      // awaiting review until a clinician reviews it.
      assert.strictEqual(report.assessment.reviewState, 'NOT_REVIEWED');

      const updated = await HospitalDataStore.updateAssessmentReview(
        submitted.id,
        'FOLLOWUP_REQUIRED',
        'Doctor reviewed: Marked acoustic tremor and trail hesitation noted.',
        'Dr. Sarah Sharma'
      );

      assert.ok(updated);
      assert.strictEqual(updated.reviewStatus, 'FOLLOWUP_REQUIRED');
      assert.strictEqual(updated.reviewedBy, 'Dr. Sarah Sharma');
      assert.strictEqual(updated.report?.doctorNotes, 'Doctor reviewed: Marked acoustic tremor and trail hesitation noted.');
    });

    it('exports a disclaimer-bearing JSON record for a clinician and refuses non-clinicians', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Export Patient',
        age: 76,
        dob: '1950',
        pin: '9090',
        gender: 'FEMALE',
        language: 'en',
        educationYears: 12,
        handedness: 'RIGHT'
      });
      const submitted = await HospitalDataStore.submitAssessment(patient.id, {
        overallScore: 74,
        reactionTime: 300,
        blinkRate: 18,
        fixationScore: 78,
        speechRate: 110,
        pauseScore: 70,
        jitter: 0.2,
        shimmer: 2.2,
        symmetry: 88,
        tremorScore: 12,
        taskResponses: {}
      });

      const capture = () => {
        const captured: { status?: number; body?: string; headers: Record<string, string> } = { headers: {} };
        const res: any = {
          setHeader: (key: string, value: string) => { captured.headers[key] = value; },
          status(code: number) { captured.status = code; return res; },
          json(body: unknown) { captured.body = JSON.stringify(body); return res; },
          send(body: string) { captured.body = body; return res; },
        };
        return { captured, res };
      };

      const baseReq = (user: any) => ({
        params: { id: submitted.id },
        user,
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any);

      const clinician = capture();
      await DoctorController.exportAssessment(
        baseReq({ id: 'clinician-export', email: 'clinician@example.org', role: 'CLINICIAN' }),
        clinician.res,
        (err?: unknown) => { throw err instanceof Error ? err : new Error('unexpected error'); }
      );
      assert.strictEqual(clinician.captured.status, 200);
      assert.match(clinician.captured.headers['Content-Disposition'] || '', /neulens-assessment-/);
      const payload = JSON.parse(clinician.captured.body || '{}');
      assert.strictEqual(payload.report.assessment.id, submitted.id);
      assert.strictEqual(payload.report.patient.name, 'Export Patient');
      assert.match(payload.disclaimer, /Not a diagnosis/);

      const patientAttempt = capture();
      await DoctorController.exportAssessment(
        baseReq({ id: patient.id, email: 'patient@example.org', role: 'PATIENT' }),
        patientAttempt.res,
        (err?: unknown) => { throw err instanceof Error ? err : new Error('unexpected error'); }
      );
      assert.strictEqual(patientAttempt.captured.status, 403);
      // Non-clinician is rejected before export; body is a JSON error, not the export payload.
      const denied = JSON.parse(patientAttempt.captured.body || '{}');
      assert.ok(String(denied.error || '').includes('Clinician access required'));
      assert.strictEqual(denied.report, undefined);
    });
  });
});
