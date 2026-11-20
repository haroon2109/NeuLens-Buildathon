import { HospitalDataStore, type UserRecord } from '../../models/dataStore';
import { auditFromRequest } from '../audit';
import type { Request } from 'express';
import { buildContext } from './context';
import { buildAssessmentPlan } from './selector';
import { buildSessionRecord, extractCognitiveSessions } from './scoring';
import {
  DOMAINS,
  DOMAIN_LABELS,
  STANDARDIZED_PROTOCOL,
  TASK_BY_ID,
  TASK_CATALOG,
  VALIDATION_NOTICE
} from './taskCatalog';
import type {
  AssessmentContext,
  AssessmentMode,
  AssessmentPlan,
  CognitiveTaskResultInput
} from './types';

export interface PlanApproval {
  planId: string;
  patientId: string;
  decision: 'APPROVED' | 'CHANGES_REQUESTED';
  note: string;
  reviewedBy: string;
  reviewedAt: string;
}

/**
 * In-memory record of clinician plan decisions. Assessment plans are generated
 * on demand; an approval is only valid for the exact plan it was recorded
 * against, and a regenerated plan starts unapproved again.
 */
const planApprovals = new Map<string, PlanApproval>();

const sessionCache = new Map<string, ReturnType<typeof buildSessionRecord>>();

/** Latest generated plan per patient, so a clinician can review the same plan. */
const latestPlans = new Map<string, AssessmentPlan>();

/** A count the session actually recorded, or null when it was not supplied. */
const toRecordedCount = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
};

const MODES: AssessmentMode[] = ['STANDARDIZED', 'EXPLORATORY'];

export class CognitiveAssessmentService {
  static getLibrary() {
    return {
      validationNotice: VALIDATION_NOTICE,
      standardizedProtocol: STANDARDIZED_PROTOCOL,
      domains: DOMAINS.map((domain) => ({
        id: domain,
        label: DOMAIN_LABELS[domain],
        taskCount: TASK_CATALOG.filter((task) => task.domain === domain).length
      })),
      tasks: TASK_CATALOG
    };
  }

  static async getContext(user: UserRecord) {
    const inputs = await HospitalDataStore.getContextInputs(user.id);
    return buildContext(user, inputs);
  }

  static async createPlan(
    user: UserRecord,
    body: { mode?: string; sessionMinutes?: number; context?: Partial<AssessmentContext> },
    req: Request
  ) {
    const mode = (body.mode || 'EXPLORATORY') as AssessmentMode;
    if (!MODES.includes(mode)) throw new Error('Unknown assessment mode.');

    const inputs = await HospitalDataStore.getContextInputs(user.id);
    const context = buildContext(user, inputs, {
      ...(body.context || {}),
      reportedBy: 'PATIENT'
    });
    context.language = body.context?.language || user.language || 'en';

    const detail = await HospitalDataStore.getPatientDetail(user.id);
    const sessions = extractCognitiveSessions(detail?.assessments || []);

    const plan = buildAssessmentPlan({
      patientId: user.patientId || user.id,
      mode,
      context,
      sessions,
      sessionMinutes: body.sessionMinutes
    });

    latestPlans.set(user.id, plan);

    await auditFromRequest(req, {
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'COGNITIVE_PLAN_GENERATED',
      resourceType: 'ASSESSMENT',
      resourceId: plan.planId,
      metadata: { mode, taskIds: plan.tasks.map((task) => task.taskId) }
    });

    return plan;
  }

  static async submitSession(
    user: UserRecord,
    body: {
      mode?: string;
      planId?: string;
      protocolId?: string;
      protocolVersion?: string;
      plan?: { tasks?: Array<{ taskId: string; form?: string; difficultyLevel?: number }> };
      context?: Partial<AssessmentContext>;
      language?: string;
      startedAt?: string;
      completedAt?: string;
      results?: CognitiveTaskResultInput[];
      interruptions?: number;
      breaksTaken?: number;
    },
    req: Request
  ) {
    const mode = (body.mode || 'EXPLORATORY') as AssessmentMode;
    if (!MODES.includes(mode)) throw new Error('Unknown assessment mode.');
    if (!Array.isArray(body.results) || body.results.length === 0) {
      throw new Error('A session must include at least one captured task result.');
    }

    const planned = Array.isArray(body.plan?.tasks) ? body.plan!.tasks : [];
    for (const task of planned) {
      if (!TASK_BY_ID.has(task.taskId)) throw new Error(`Unknown task in submitted plan: ${task.taskId}`);
    }
    for (const result of body.results) {
      if (!TASK_BY_ID.has(result.taskId)) throw new Error(`Unknown task result: ${result.taskId}`);
    }

    if (mode === 'STANDARDIZED') {
      const plannedIds = planned.map((task) => task.taskId).join('|');
      const protocolIds = STANDARDIZED_PROTOCOL.taskIds.join('|');
      if (plannedIds && plannedIds !== protocolIds) {
        throw new Error('Standardized sessions must follow the fixed protocol; the submitted plan does not match.');
      }
    }

    const inputs = await HospitalDataStore.getContextInputs(user.id);
    const context = buildContext(user, inputs, {
      ...(body.context || {}),
      reportedBy: 'PATIENT'
    });
    context.language = body.language || context.language;

    const startedAt = body.startedAt ? new Date(body.startedAt).toISOString() : new Date().toISOString();
    const completedAt = body.completedAt ? new Date(body.completedAt).toISOString() : new Date().toISOString();
    if (new Date(completedAt) < new Date(startedAt)) {
      throw new Error('Session completion time cannot precede its start time.');
    }
    if (new Date(completedAt).getTime() - new Date(startedAt).getTime() > 4 * 60 * 60 * 1000) {
      throw new Error('Session duration exceeds the four-hour safety limit.');
    }

    const plannedTaskIds = planned.length
      ? planned.map((task) => task.taskId)
      : body.results.map((result) => result.taskId);

    const session = buildSessionRecord({
      sessionId: `cog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mode,
      planId: body.planId || null,
      protocolVersion:
        body.protocolVersion ||
        (mode === 'STANDARDIZED' ? STANDARDIZED_PROTOCOL.version : '1.0.0'),
      startedAt,
      completedAt,
      language: context.language,
      context,
      results: body.results,
      plannedTaskIds
    });

    const completedCount = session.tasks.filter((task) => task.completed).length;
    const cognitiveSummary = {
      mode: session.mode,
      completedAt: session.completedAt,
      taskCount: session.tasks.length,
      completedCount,
      domains: session.domains.map((domain) => ({
        domain: domain.domain,
        label: DOMAIN_LABELS[domain.domain],
        tasks: domain.tasks
      })),
      comparable: session.quality.comparable,
      qualityFlags: session.quality.flags.map((flag) => ({
        label: flag.label,
        severity: flag.severity
      })),
      validationNotice: VALIDATION_NOTICE,
      clinicianReviewRequired: true
    };

    const assessment = await HospitalDataStore.createCognitiveAssessment(user.id, {
      overallScore: session.compositeAccuracy,
      taskResponses: {
        mode: 'COGNITIVE',
        cognitiveSession: session,
        cognitiveSummary,
        assessmentConditions: {
          // Missing counts stay missing: recording 0 would assert "no interruptions"
          // for a session where nobody recorded whether there were any.
          interruptions: toRecordedCount(body.interruptions),
          breaksTaken: toRecordedCount(body.breaksTaken),
          language: context.language,
          device: context.device,
          // Every activity in this mode is played with buttons and keys only.
          // Recording the route is what makes the accessibility claim checkable:
          // no camera, microphone or motion input is used, so a participant
          // without them is administered the same task, not a compromise task.
          sensoryRoute: 'BUTTON_ONLY_NO_SENSORS',
          cameraUsed: false,
          microphoneUsed: false,
          administeredAt: session.completedAt
        }
      }
    });

    sessionCache.set(assessment.id, session);

    await auditFromRequest(req, {
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'COGNITIVE_SESSION_SUBMITTED',
      resourceType: 'ASSESSMENT',
      resourceId: assessment.id,
      metadata: {
        mode: session.mode,
        taskCount: session.tasks.length,
        comparable: session.quality.comparable
      }
    });

    return { assessmentId: assessment.id, session };
  }

  static async getPatientSessions(patientId: string) {
    const detail = await HospitalDataStore.getPatientDetail(patientId);
    if (!detail) return null;
    return extractCognitiveSessions(detail.assessments);
  }

  static getCachedSession(assessmentId: string) {
    return sessionCache.get(assessmentId) || null;
  }

  static recordApproval(
    patientId: string,
    planId: string,
    decision: 'APPROVED' | 'CHANGES_REQUESTED',
    note: string,
    clinician: UserRecord
  ): PlanApproval {
    if (!planId) throw new Error('A plan identifier is required.');
    if (decision !== 'APPROVED' && decision !== 'CHANGES_REQUESTED') {
      throw new Error('Unsupported review decision.');
    }
    const approval: PlanApproval = {
      planId,
      patientId,
      decision,
      note: note.slice(0, 1000),
      reviewedBy: clinician.name,
      reviewedAt: new Date().toISOString()
    };
    planApprovals.set(planId, approval);
    return approval;
  }

  static getApproval(planId: string): PlanApproval | null {
    return planApprovals.get(planId) || null;
  }

  /**
   * Latest plan for a patient, including any clinician decision recorded
   * against that exact plan. Never carries forward approval to a new plan.
   */
  static getLatestPlan(patientUserId: string): AssessmentPlan | null {
    const plan = latestPlans.get(patientUserId);
    if (!plan) return null;
    const approval = planApprovals.get(plan.planId);
    return {
      ...plan,
      clinicianApproval: approval
        ? {
            decision: approval.decision,
            note: approval.note,
            reviewedBy: approval.reviewedBy,
            reviewedAt: approval.reviewedAt
          }
        : null
    };
  }
}

export type { AssessmentPlan };
