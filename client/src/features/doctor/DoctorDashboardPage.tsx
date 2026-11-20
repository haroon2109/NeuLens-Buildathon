import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  Clock, 
  Search, 
  ChevronRight, 
  FileText, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2, 
  Filter, 
  Sparkles,
  ShieldAlert,
  Stethoscope,
  RefreshCw
} from 'lucide-react';
import { doctorApi, DoctorDashboardStats } from '../../services/portalApi';
import { HealthcareScene } from '../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../components/motion/Reveal';

const functionalActivityLabels: Record<string, string> = {
  appointments: 'remembering appointments',
  medication: 'managing medicines',
  finances: 'handling money or bills',
  household: 'household tasks'
};

export const DoctorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REVIEW_PROMPT' | 'REVIEWED'>('ALL');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await doctorApi.getDashboard();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load doctor dashboard stats:', err);
      setError(err.message || 'Unable to connect to hospital clinical store');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getReviewStateBadge = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'REVIEW_PROMPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Review prompt
          </span>
        );
      case 'NOT_INTERPRETABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-warm text-body border border-line">
            Not interpretable
          </span>
        );
      case 'CLINICIAN_REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Clinician reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Not reviewed
          </span>
        );
    }
  };

  const getReviewBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'FOLLOWUP_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Follow-up Req.
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-warm text-body border border-line">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            Pending Review
          </span>
        );
    }
  };

  const filteredAssessments = (stats?.recentAssessments || []).filter(item => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return item.reviewStatus === 'PENDING_REVIEW';
    if (statusFilter === 'REVIEW_PROMPT') return item.reviewState === 'REVIEW_PROMPT';
    if (statusFilter === 'REVIEWED') return item.reviewStatus === 'REVIEWED';
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* ---------------------------------------------------------------- */}
      {/* TOP CLINICAL HEADER                                              */}
      {/* ---------------------------------------------------------------- */}
      <MotionReveal><div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] items-stretch bg-white p-6 rounded-2xl border border-line shadow-card">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-mint-haze text-forest border 0 flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                Department of Neurology
              </span>
              <span className="text-xs text-muted">| Clinical screening & longitudinal review</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-display">
              Physician Overview Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Review queue, flagged changes, patient intake, and longitudinal brain-health observations for clinician-led follow-up.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-warm hover:bg-slate-200 text-body text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <Link to="/doctor/review-queue" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-forest hover:bg-forest-deep text-white text-xs font-bold shadow-card transition-all">
              <ClipboardCheck className="w-4 h-4" /> Clinical Review Queue
            </Link>
            <Link to="/doctor/change-detection" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-line bg-white hover:bg-warm text-body text-xs font-bold transition-all">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Flagged changes
            </Link>
            <Link to="/doctor/patients" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-line bg-white hover:bg-warm text-body text-xs font-bold transition-all">
              <Users className="w-4 h-4" /> Patient Directory
            </Link>
          </div>
        </div>
        <HealthcareScene kind="doctorDashboard" className="w-full h-full min-h-[180px]" title="Doctor reviewing brain-health reports" />
      </div></MotionReveal>

      {/* ---------------------------------------------------------------- */}
      {/* 4 CORE KPI CARDS                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-line shadow-card hover:border-line-strong transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em]">
              Enrolled Patients
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-ink font-display">
              {stats?.totalPatients ?? '—'}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1 font-medium">
              <span>Unique IDs registered on the platform</span>
            </div>
          </div>
        </div>

        {/* Card 2: Screenings Today */}
        <div className="bg-white p-5 rounded-2xl border border-line shadow-card hover:border-line-strong transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em]">
              Screenings Today
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-ink font-display">
              {stats?.assessmentsToday ?? '—'}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1 font-medium">
              <span>Sessions completed in last 24h</span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed Total */}
        <div className="bg-white p-5 rounded-2xl border border-line shadow-card hover:border-line-strong transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em]">
              Total Assessments
            </span>
            <div className="w-10 h-10 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-ink font-display">
              {stats?.completedAssessments ?? '—'}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1 font-medium">
              <span>Multimodal AI batteries stored</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Review */}
        <div className="bg-white p-5 rounded-2xl border border-line shadow-card hover:border-line-strong transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em]">
              Pending Reviews
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-amber-600 font-display">
              {stats?.pendingReviews ?? '—'}
            </div>
            <div className="text-xs text-amber-700/80 mt-1 flex items-center gap-1 font-medium">
              <span>Awaiting clinician verification</span>
            </div>
          </div>
        </div>

      </div>

      <section className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
        <div className="p-6 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-medical-600" />
              <h2 className="text-lg font-bold text-ink font-display">Longitudinal change cues</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                {stats?.changeReviewCount ?? '—'} to review
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              A score below an observed comparable baseline, newly reported daily-activity difficulty, or worsening context prompts clinician review, not diagnosis.
            </p>
          </div>
          <Link to="/doctor/patients" className="text-xs font-bold text-medical-700 hover:text-medical-900">
            View patient records <ChevronRight className="w-3.5 h-3.5 inline" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted">Loading change comparisons…</div>
        ) : (stats?.changeReviewQueue.length || 0) > 0 ? (
          <ul className="divide-y divide-line">
            {stats?.changeReviewQueue.slice(0, 5).map((cue) => (
              <li key={cue.patientId} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Link
                    to={`/doctor/patients/${cue.patientId}`}
                    className="font-bold text-sm text-ink hover:text-medical-700"
                  >
                    {cue.patientName}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-muted">{cue.patientId}</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {cue.reviewReasons.includes('OUTSIDE_RELIABLE_CHANGE') && (
                      <span className="text-xs font-semibold text-amber-800">
                        Decline beyond this patient's measured session-to-session variability
                      </span>
                    )}
                    {cue.reviewReasons.includes('FUNCTIONAL_CHANGE') && (
                      <span className="text-xs font-semibold text-rose-700">
                        Increased difficulty reported: {cue.worsenedActivityIds.map(id => functionalActivityLabels[id] || id).join(', ')}
                      </span>
                    )}
                    {cue.reviewReasons.includes('CONTEXT_CHANGE') && (
                      <span className="text-xs font-semibold text-sky-800">
                        Sleep, activity, or mood/stress changed; review context
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {cue.cognitiveChange !== null && (
                    <span className={`text-xs font-bold ${cue.cognitiveChange < 0 ? 'text-amber-700' : 'text-muted'}`}>
                      Score change {cue.cognitiveChange > 0 ? '+' : ''}{cue.cognitiveChange} points
                    </span>
                  )}
                  <Link
                    to={`/doctor/patients/${cue.patientId}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-medical-50 text-medical-700 hover:bg-medical-100 text-xs font-bold"
                  >
                    Review change <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-sm text-muted">
            No current comparison cues. Continue periodic screening and daily-activity check-ins to establish a trend.
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* HOSPITAL AI PROTOCOL BANNER                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-medical-900 via-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3 0" />
              Neulens v2.5 Protocol
            </span>
            <span className="text-xs text-slate-300">Biometric & Speech Pipeline Active</span>
          </div>
          <h3 className="text-lg font-bold font-display text-white">
            Hospital Dual-Portal Architecture Active
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Patient portal strictly sanitizes all risk stratifications and diagnostic scores. Doctors retain sole authority to view composite domain scores, review raw eye/voice telemetry, and sign off official reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Gnani Speech: Timbre & Prisma
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            MediaPipe Gaze & Face
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RECENT CLINICAL ASSESSMENTS QUEUE TABLE                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-6 border-b border-line flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink font-display">
              Clinical Assessment Triage Queue
            </h2>
            <p className="text-xs text-muted">
              Select any assessment to inspect recorded responses or sign off on the clinical report.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Filter */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-warm border border-line focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 font-medium"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-warm p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-ink shadow-card font-bold'
                    : 'text-body hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-blue-700 shadow-card font-bold'
                    : 'text-body hover:text-ink'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('REVIEW_PROMPT')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'REVIEW_PROMPT'
                    ? 'bg-white text-amber-700 shadow-card font-bold'
                    : 'text-body hover:text-ink'
                }`}
              >
                Review prompt
              </button>
              <button
                onClick={() => setStatusFilter('REVIEWED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'REVIEWED'
                    ? 'bg-white text-ink shadow-card font-bold'
                    : 'text-body hover:text-ink'
                }`}
              >
                Reviewed
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-muted space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-medical-600" />
            <p className="text-sm font-medium">Loading clinical assessment queue...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center text-muted space-y-2">
            <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-body">No assessments found matching filter</p>
            <p className="text-xs text-muted">Try modifying your search or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm/70 border-b border-line text-xs font-bold text-muted uppercase tracking-[0.12em]">
                  <th className="py-3 px-6">Patient Identifier</th>
                  <th className="py-3 px-6">Patient Name & Age</th>
                  <th className="py-3 px-6">Screening Date</th>
                  <th className="py-3 px-6">Cognitive Score</th>
                  <th className="py-3 px-6">Review state</th>
                  <th className="py-3 px-6">Review Status</th>
                  <th className="py-3 px-6 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {filteredAssessments.map((item) => (
                  <tr key={item.id} className="hover:bg-warm/60 transition-colors group">
                    
                    {/* Patient ID */}
                    <td className="py-4 px-6 font-mono font-bold text-medical-700">
                      <Link 
                        to={`/doctor/patients/${item.patientId}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {item.patientId}
                      </Link>
                    </td>

                    {/* Patient Name */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-ink">{item.patientName}</div>
                      <div className="text-xs text-muted">{item.age} years old</div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-muted font-medium">
                      {new Date(item.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Score */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {item.score === null ? (
                          <span className="text-xs font-semibold text-muted">Not interpretable</span>
                        ) : (
                          <>
                            <span className="font-semibold text-ink text-sm">
                              {Math.round(item.score)}
                            </span>
                            <span className="text-xs text-muted">/ 100</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Administrative review state */}
                    <td className="py-4 px-6">
                      {getReviewStateBadge(item.reviewState)}
                    </td>

                    {/* Review Status */}
                    <td className="py-4 px-6">
                      {getReviewBadge(item.reviewStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/doctor/reports/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-all text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Clinical Report
                      </Link>
                      <Link
                        to={`/doctor/patients/${item.patientId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-muted hover:text-slate-800 hover:bg-warm transition-all text-xs font-semibold"
                      >
                        Patient File
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
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
