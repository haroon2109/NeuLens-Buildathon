import { Request } from 'express';
import { prisma } from '../config/db';

export type AuditAction =
  | 'PATIENT_LOGIN'
  | 'PATIENT_LOGIN_FAILED'
  | 'PATIENT_REGISTER'
  | 'CLINICIAN_LOGIN'
  | 'CLINICIAN_LOGIN_FAILED'
  | 'PATIENT_READ'
  | 'PATIENT_DIRECTORY_READ'
  | 'ASSESSMENT_SUBMIT'
  | 'ASSESSMENT_READ'
  | 'ASSESSMENT_EXPORT'
  | 'ASSESSMENT_REVIEW_WRITE'
  | 'CARE_PLAN_WRITE'
  | 'REFERRAL_READ'
  | 'REFERRAL_WRITE'
  | 'APPOINTMENT_READ'
  | 'APPOINTMENT_WRITE'
  | 'CONSENT_READ'
  | 'CONSENT_RECORDED'
  | 'CONSENT_WITHDRAWN'
  | 'COGNITIVE_TASKS_READ'
  | 'COGNITIVE_PLAN_GENERATED'
  | 'COGNITIVE_PLAN_REVIEWED'
  | 'COGNITIVE_SESSION_SUBMITTED'
  | 'COGNITIVE_SESSION_READ'
  | 'EXTERNAL_INSTRUMENT_READ'
  | 'EXTERNAL_INSTRUMENT_WRITE';

export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  success?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Client address as seen by Express (respecting a configured proxy). */
export function requestIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

export function requestUserAgent(req: Request): string | null {
  const agent = req.headers['user-agent'];
  return typeof agent === 'string' ? agent.slice(0, 512) : null;
}

/**
 * Records a PHI access or workflow event.
 *
 * Auditing must never be silently skipped in production: a failed write is
 * logged as an error so monitoring can alert on it. The request itself is not
 * aborted, because failing closed on the audit table would take the clinical
 * workflow down with it.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        success: entry.success ?? true,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: (entry.metadata ?? undefined) as any,
      },
    });
  } catch (error) {
    console.error(
      '[AuditLog]: failed to persist audit event',
      entry.action,
      entry.resourceType,
      error instanceof Error ? error.message : error
    );
  }
}

export function auditFromRequest(
  req: Request,
  entry: Omit<AuditEntry, 'ipAddress' | 'userAgent'>
): Promise<void> {
  return recordAudit({
    ...entry,
    ipAddress: requestIp(req),
    userAgent: requestUserAgent(req),
  });
}
