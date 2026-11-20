import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';
import { appointmentCreateSchema, appointmentUpdateSchema } from '../validation/schemas';
import { auditFromRequest } from '../services/audit';

/**
 * Appointment scheduling is a care-workflow record and lives in PostgreSQL.
 * Patient-facing updates are limited to the patient's own appointments and to
 * the two actions a patient can take (cancel, reschedule).
 */
export class AppointmentController {
  /** GET /api/v1/patient/appointments */
  public static async listForPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const appointments = await HospitalDataStore.listAppointments({ patientId: req.user.id });

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: 'PATIENT',
        action: 'APPOINTMENT_READ',
        resourceType: 'APPOINTMENT',
        resourceId: req.user.id,
        metadata: { count: appointments.length },
      });

      return res.status(200).json({ success: true, appointments });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/v1/patient/appointments/:id */
  public static async updateForPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Patient authorization required' });
      }

      const { id } = req.params;
      const updates = appointmentUpdateSchema.parse(req.body);
      const existing = (await HospitalDataStore.listAppointments({ patientId: req.user.id }))
        .find((appointment) => appointment.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      if (updates.status && !['CANCELLED', 'RESCHEDULED'].includes(updates.status)) {
        return res.status(400).json({ error: 'Patients can cancel or reschedule an appointment only' });
      }

      const appointment = await HospitalDataStore.updateAppointment(id, updates);

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: 'PATIENT',
        action: 'APPOINTMENT_WRITE',
        resourceType: 'APPOINTMENT',
        resourceId: id,
        metadata: { ...updates },
      });

      return res.status(200).json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/doctor/appointments */
  public static async listAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const appointments = await HospitalDataStore.listAppointments();

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'APPOINTMENT_READ',
        resourceType: 'APPOINTMENT',
        resourceId: 'all',
        metadata: { count: appointments.length },
      });

      return res.status(200).json({ success: true, appointments });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/doctor/patients/:id/appointments */
  public static async createForPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const { id } = req.params;
      const data = await HospitalDataStore.getPatientDetail(id);
      if (!data) {
        return res.status(404).json({ error: 'Patient file not found' });
      }

      const validated = appointmentCreateSchema.parse(req.body);
      const clinician = await HospitalDataStore.findUserById(req.user.id);
      const appointment = await HospitalDataStore.createAppointment({
        patientId: data.patient.id,
        assessmentId: validated.assessmentId ?? null,
        title: validated.title,
        type: validated.type,
        date: validated.date,
        time: validated.time,
        location: validated.location,
        communication: validated.communication,
        clinician: clinician?.name || 'Care team',
        createdBy: req.user.id,
      });

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'APPOINTMENT_WRITE',
        resourceType: 'APPOINTMENT',
        resourceId: appointment.id,
        metadata: { patientId: data.patient.id, date: validated.date },
      });

      return res.status(201).json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/v1/doctor/appointments/:id */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'CLINICIAN' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Clinician access required' });
      }

      const { id } = req.params;
      const updates = appointmentUpdateSchema.parse(req.body);
      const appointment = await HospitalDataStore.updateAppointment(id, updates);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      await auditFromRequest(req, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'APPOINTMENT_WRITE',
        resourceType: 'APPOINTMENT',
        resourceId: id,
        metadata: { ...updates },
      });

      return res.status(200).json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }
}
