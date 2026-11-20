import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Brain, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { doctorApi } from '../../services/portalApi';
import { ScreeningPage } from '../screening/ScreeningPage';

export const DoctorPatientScreenPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPatient = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await doctorApi.getPatientProfile(id);
        if (data?.patient) {
          setPatient(data.patient);
        } else {
          setError('Patient record could not be found.');
        }
      } catch (err: any) {
        console.error('Failed to load patient for screening:', err);
        setError(err.message || 'Unable to load patient record.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-medical-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Preparing Clinical Screening Battery...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4 bg-white p-8 rounded-2xl border border-line">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-ink">Patient Not Found</h2>
        <p className="text-xs text-muted">{error || 'Please select a valid patient to administer an assessment.'}</p>
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-2 px-4 py-2 bg-warm hover:bg-slate-200 text-body rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Patient Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* ---------------------------------------------------------------- */}
      {/* CLINICAL BANNER (Identifies the target patient)                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-2xl border border-line shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <Link
            to={`/doctor/patients/${patient.patientId}`}
            className="w-9 h-9 rounded-xl bg-warm hover:bg-slate-200 text-body flex items-center justify-center transition-all shrink-0"
            title="Cancel & Return to Patient Profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-medical-700 bg-medical-50 border border-medical-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Active Screening Administration
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display font-bold text-base text-ink">
                {patient.name}
              </span>
              <span className="font-mono text-xs font-bold text-medical-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {patient.patientId}
              </span>
              <span className="text-xs text-muted">
                • {patient.age} yrs • {patient.gender}
              </span>
            </div>
          </div>
        </div>

        <Link
          to={`/doctor/patients/${patient.patientId}`}
          className="text-xs font-bold text-muted hover:text-slate-800 transition-colors self-start sm:self-auto"
        >
          Cancel & Return to File
        </Link>

      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SCREENING BATTERY EMBED                                          */}
      {/* ---------------------------------------------------------------- */}
      <ScreeningPage 
        patientMode={false} 
        targetPatientId={patient.patientId} 
      />

    </div>
  );
};
