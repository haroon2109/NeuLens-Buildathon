import type { DoctorAssessment, PatientChangeSummary } from './useDoctorPatient';
import type { ClinicalNote, ReferralRecord, DoctorAppointmentRecord, ChangeAcknowledgement } from '../../../store/doctorPortalStore';

export interface DoctorReportPatient {
  name: string;
  patientId: string;
  age: number;
  gender?: string | null;
  dob?: string | null;
  email?: string | null;
  phone?: string | null;
}

export type DoctorReportAssessment = DoctorAssessment;

export type DoctorReportChangeSummary = PatientChangeSummary;

export type DoctorReportNote = ClinicalNote;
export type DoctorReportReferral = ReferralRecord;
export type DoctorReportAppointment = DoctorAppointmentRecord;
export type DoctorReportChangeAcknowledgement = ChangeAcknowledgement;

export interface ReportCenterPatient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  risk?: string | null;
}

export interface ClinicalReportCardProps {
  patient: DoctorReportPatient;
  assessments: DoctorReportAssessment[];
  changeSummary: DoctorReportChangeSummary | null;
  changeAcknowledgements: DoctorReportChangeAcknowledgement[];
  notes: DoctorReportNote[];
  referrals: DoctorReportReferral[];
  appointments: DoctorReportAppointment[];
  onPrint: () => void;
}
