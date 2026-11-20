import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  FileText,
  Activity,
  User,
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react';
import { doctorApi } from '../../services/portalApi';

interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  language: string;
  educationYears?: number | null;
  handedness?: string | null;
  assessmentsCount: number;
  latestScore: number | null;
  reviewState: string | null;
  latestAssessmentDate: string | null;
  changeStatus: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  cognitiveChange: number | null;
  worsenedActivityCount: number;
}

export const DoctorPatientsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const isSelectingForScreening = searchParams.get('select') === 'true';
  
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  // Administrative review filter. There is no risk-tier filter any more: the
  // product does not classify patients into risk bands.
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'REVIEW_PROMPT' | 'NOT_REVIEWED' | 'NOT_INTERPRETABLE'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async (query = searchQuery, reviewState = reviewFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await doctorApi.getPatients(query, reviewState);
      // The directory endpoint names these fields differently from the table.
      // Map them explicitly so an unscored patient renders as "Pending" rather
      // than a NaN score.
      setPatients(
        (data || []).map((row: any) => ({
          ...row,
          assessmentsCount: row.assessmentCount ?? row.assessmentsCount ?? 0,
          latestScore:
            typeof row.compositeScore === 'number'
              ? row.compositeScore
              : typeof row.latestScore === 'number'
                ? row.latestScore
                : null,
          latestAssessmentDate: row.lastScreeningDate ?? row.latestAssessmentDate ?? null,
          changeStatus: row.changeStatus ?? 'INSUFFICIENT_DATA'
        }))
      );
    } catch (err: any) {
      console.error('Failed to load patient records:', err);
      setError(err.message || 'Unable to load patient directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(searchQuery, reviewFilter);
  }, [reviewFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(searchQuery, reviewFilter);
  };

  const getReviewBadge = (state: string | null) => {
    if (!state) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warm text-muted">
          No Screenings
        </span>
      );
    }
    switch (state.toUpperCase()) {
      case 'REVIEW_PROMPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Review prompt
          </span>
        );
      case 'NOT_INTERPRETABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-warm text-body border border-line">
            Not interpretable
          </span>
        );
      case 'CLINICIAN_REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Clinician reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-medical-700 border border-blue-200">
            Not reviewed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* ---------------------------------------------------------------- */}
      {/* HEADER                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-line shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-medical-50 text-medical-700 border border-medical-200 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Patient Records Registry
            </span>
            <span className="text-xs text-muted">| Hospital Longitudinal Files</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-display">
            Patient Medical Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Search enrolled patients by unique ID or name, review demographic baselines, and inspect full assessment histories.
          </p>
        </div>

        <div className="text-right sm:self-center">
          <span className="text-xs text-muted font-semibold block uppercase tracking-[0.12em]">
            Total Patients
          </span>
          <span className="text-2xl font-semibold text-ink font-display">
            {patients.length} Registered
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SELECTION FOR SCREENING BANNER                                   */}
      {/* ---------------------------------------------------------------- */}
      {isSelectingForScreening && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-medical-800 shadow-card">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-medical-600 shrink-0" />
            <span className="font-semibold">
              Please select a patient from the directory below to administer their screening battery.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              searchParams.delete('select');
              setSearchParams(searchParams);
            }}
            className="text-muted hover:text-body font-bold px-2 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* SEARCH & FILTER CONTROLS                                         */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-2xl border border-line shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient ID (e.g. CV-2026-...) or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2.5 rounded-2xl text-xs bg-warm border border-line focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 font-medium"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold transition-all shadow-card"
          >
            Search
          </button>
        </form>

        {/* Review-state tabs */}
        <div className="flex items-center gap-1 bg-warm p-1.5 rounded-2xl text-xs font-semibold self-stretch md:self-auto justify-center">
          <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] px-2 hidden sm:inline">
            Review state:
          </span>
          {(['ALL', 'REVIEW_PROMPT', 'NOT_REVIEWED', 'NOT_INTERPRETABLE'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setReviewFilter(r)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                reviewFilter === r
                  ? 'bg-white text-ink shadow-card font-bold'
                  : 'text-body hover:text-ink'
              }`}
            >
              {r === 'ALL' ? 'All patients' : r === 'REVIEW_PROMPT' ? 'Review prompt' : r === 'NOT_REVIEWED' ? 'Not reviewed' : 'Not interpretable'}
            </button>
          ))}
        </div>

      </div>

      {/* ---------------------------------------------------------------- */}
      {/* PATIENT LIST TABLE                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted space-y-3">
            <div className="w-8 h-8 border-3 border-medical-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Querying Patient Records...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-16 text-center text-muted space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-base font-bold text-slate-800">No Patient Records Found</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No patients match the search identifier "{searchQuery}" under the selected risk criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm/70 border-b border-line text-xs font-bold text-muted uppercase tracking-[0.12em]">
                  <th className="py-3.5 px-6">Patient Identifier</th>
                  <th className="py-3.5 px-6">Demographics</th>
                  <th className="py-3.5 px-6">Clinical Baseline</th>
                  <th className="py-3.5 px-6">Assessments</th>
                  <th className="py-3.5 px-6">Latest Score</th>
                  <th className="py-3.5 px-6">Change Monitor</th>
                  <th className="py-3.5 px-6">Review state</th>
                  <th className="py-3.5 px-6 text-right">Medical Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-warm/60 transition-colors group">
                    
                    {/* Patient ID */}
                    <td className="py-4 px-6 font-mono font-bold text-medical-700">
                      <Link 
                        to={`/doctor/patients/${p.patientId}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-medical-500"></span>
                        {p.patientId}
                      </Link>
                    </td>

                    {/* Patient Name & Age */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-ink text-sm">{p.name}</div>
                      <div className="text-xs text-muted">
                        {p.age} yrs • {p.gender} • Lang: {p.language.toUpperCase()}
                      </div>
                    </td>

                    {/* Clinical Baseline */}
                    <td className="py-4 px-6 text-body">
                      <div>Hand: <span className="font-semibold text-slate-800">{p.handedness || 'Not recorded'}</span></div>
                      <div className="text-xs text-muted">Education: {p.educationYears ? `${p.educationYears} yrs` : 'Not recorded'}</div>
                    </td>

                    {/* Assessments count */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-warm font-bold text-body">
                        <Activity className="w-3 h-3 text-medical-600" />
                        {p.assessmentsCount} {p.assessmentsCount === 1 ? 'Screening' : 'Screenings'}
                      </div>
                      {p.latestAssessmentDate && (
                        <div className="text-xs text-muted mt-1">
                          Last: {new Date(p.latestAssessmentDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Latest Score */}
                    <td className="py-4 px-6">
                      {p.latestScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-ink text-sm">
                            {Math.round(p.latestScore)}
                          </span>
                          <span className="text-xs text-muted">/ 100</span>
                        </div>
                      ) : (
                        <span className="text-muted font-medium">Pending</span>
                      )}
                    </td>

                    {/* Within-person change cue */}
                    <td className="py-4 px-6">
                      {p.changeStatus === 'REVIEW' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Review cue
                          </span>
                          {p.worsenedActivityCount > 0 && (
                            <div className="text-xs text-muted">
                              Daily-function change reported
                            </div>
                          )}
                        </div>
                      ) : p.changeStatus === 'NO_CHANGE' ? (
                        <span className="text-xs font-medium text-muted">No current cue</span>
                      ) : (
                        <span className="text-xs font-medium text-muted">More comparisons needed</span>
                      )}
                    </td>

                    {/* Administrative review state */}
                    <td className="py-4 px-6">
                      {getReviewBadge(p.reviewState)}
                    </td>

                    {/* Action Links */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/doctor/patients/${p.patientId}/screen`}
                          title={`Start Screening Battery for ${p.name}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-medical-700 text-xs font-bold transition-all shadow-2xs"
                        >
                          <Play className="w-3 h-3 fill-medical-700" />
                          <span className="hidden xl:inline">Screen</span>
                        </Link>
                        
                        <Link
                          to={`/doctor/patients/${p.patientId}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-warm hover:bg-slate-200 text-body text-xs font-bold transition-all"
                        >
                          <span>Open File</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
