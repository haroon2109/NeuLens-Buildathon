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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Review prompt
          </span>
        );
      case 'NOT_INTERPRETABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warm text-body border border-line">
            Not interpretable
          </span>
        );
      case 'CLINICIAN_REVIEWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mint text-forest border border-forest/20 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-forest"></span>
            Clinician reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warm text-sage-deep border border-line">
            Not reviewed
          </span>
        );
    }
  };

  const getReviewBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'FOLLOWUP_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Follow-up Req.
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-mint text-forest border border-forest/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
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
      <MotionReveal>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-stretch bg-gradient-to-br from-white via-white to-mint/20 p-6 sm:p-7 rounded-[24px] border border-line shadow-card">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-mint text-forest border border-forest/20 flex items-center gap-1.5 shadow-xs">
                  <Stethoscope className="w-3.5 h-3.5 text-forest" />
                  Department of Neurology
                </span>
                <span className="text-xs text-muted">Clinical screening &amp; longitudinal review</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-display tracking-[-0.035em]">
                Physician Overview Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-body mt-1 leading-relaxed">
                Review queue, flagged changes, patient intake, and longitudinal brain-health observations for clinician-led follow-up.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-white hover:bg-warm text-body text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <Link to="/doctor/review-queue" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest hover:bg-forest-deep text-white text-xs font-semibold shadow-pill transition-all hover:shadow-pill-hover hover:-translate-y-0.5">
                <ClipboardCheck className="w-4 h-4" /> Clinical Review Queue
              </Link>
              <Link to="/doctor/change-detection" className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs font-semibold transition-all shadow-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Flagged changes
              </Link>
              <Link to="/doctor/patients" className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-white hover:bg-warm text-body text-xs font-semibold transition-all shadow-xs">
                <Users className="w-4 h-4" /> Patient Directory
              </Link>
            </div>
          </div>
          <HealthcareScene kind="doctorDashboard" className="w-full h-full min-h-[190px] drop-shadow-xs" title="Doctor reviewing brain-health reports" />
        </div>
      </MotionReveal>

      {/* ---------------------------------------------------------------- */}
      {/* 4 CORE KPI CARDS                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Patients */}
        <div className="bg-white p-5 rounded-[20px] border border-line shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-sage-deep uppercase tracking-[0.12em]">
              Enrolled Patients
            </span>
            <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-ink font-display tracking-tight">
              {stats?.totalPatients ?? '—'}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1 font-medium">
              <span>Unique IDs registered on the platform</span>
            </div>
          </div>
        </div>

        {/* Card 2: Screenings Today */}
        <div className="bg-white p-5 rounded-[20px] border border-line shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-sage-deep uppercase tracking-[0.12em]">
              Screenings Today
            </span>
            <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-ink font-display tracking-tight">
              {stats?.assessmentsToday ?? '—'}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1 font-medium">
              <span>Sessions completed in last 24h</span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed Total */}
        <div className="bg-white p-5 rounded-[20px] border border-line shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-sage-deep uppercase tracking-[0.12em]">
              Total Assessments
            </span>
            <div className="w-10 h-10 rounded-xl bg-sage-deep/15 text-forest flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-ink font-display tracking-tight">
              {stats?.completedAssessments ?? '—'}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1 font-medium">
              <span>Multimodal AI batteries stored</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Review */}
        <div className="bg-white p-5 rounded-[20px] border border-line shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-sage-deep uppercase tracking-[0.12em]">
              Pending Reviews
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-amber-700 font-display tracking-tight">
              {stats?.pendingReviews ?? '—'}
            </div>
            <div className="text-xs text-amber-800/80 mt-1 flex items-center gap-1 font-medium">
              <span>Awaiting clinician verification</span>
            </div>
          </div>
        </div>

      </div>

      <section className="bg-white rounded-[24px] border border-line shadow-card overflow-hidden">
        <div className="p-6 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-forest" />
              <h2 className="text-lg font-semibold text-ink font-display tracking-[-0.02em]">Longitudinal change cues</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                {stats?.changeReviewCount ?? '—'} to review
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              A score below an observed comparable baseline, newly reported daily-activity difficulty, or worsening context prompts clinician review, not diagnosis.
            </p>
          </div>
          <Link to="/doctor/patients" className="text-xs font-bold text-forest hover:text-forest-deep flex items-center gap-1">
            View patient records <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted">Loading change comparisons…</div>
        ) : (stats?.changeReviewQueue.length || 0) > 0 ? (
          <ul className="divide-y divide-line">
            {stats?.changeReviewQueue.slice(0, 5).map((cue) => (
              <li key={cue.patientId} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-warm/40 transition-colors">
                <div>
                  <Link
                    to={`/doctor/patients/${cue.patientId}`}
                    className="font-bold text-sm text-ink hover:text-forest"
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
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-mint text-forest hover:bg-mint/80 text-xs font-semibold transition-all shadow-xs"
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
      <div className="bg-gradient-to-r from-[#173026] via-[#1a382d] to-[#0f2119] p-6 sm:p-7 rounded-[24px] text-white shadow-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-forest/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white flex items-center gap-1 border border-white/20">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              NeuLens v2.5 Protocol
            </span>
            <span className="text-xs text-white/70">Biometric &amp; Speech Pipeline Active</span>
          </div>
          <h3 className="text-lg font-semibold font-display text-white tracking-[-0.02em]">
            Hospital Dual-Portal Architecture Active
          </h3>
          <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
            Patient portal strictly sanitizes all risk stratifications and diagnostic scores. Doctors retain sole authority to view composite domain scores, review raw eye/voice telemetry, and sign off official reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-2 text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Google AI Speech
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-2 text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            MediaPipe Gaze &amp; Face
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-2 text-white/90">
            <span className="w-2 h-2 rounded-full bg-teal-300"></span>
            Gemini 2.5 Flash Copilot
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-2 text-white/90">
            <span className="w-2 h-2 rounded-full bg-mint"></span>
            Gemini Live Vernacular
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RECENT CLINICAL ASSESSMENTS QUEUE TABLE                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-[24px] border border-line shadow-card overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-6 border-b border-line flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink font-display tracking-[-0.02em]">
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
                className="w-full pl-9 pr-4 py-2 rounded-full text-xs bg-warm/80 border border-line focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-medium text-ink transition"
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
