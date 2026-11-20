import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  FileText, 
  Stethoscope, 
  Brain, 
  Eye, 
  Mic, 
  Smile, 
  Compass, 
  Clock, 
  ShieldCheck,
  Building,
  User,
  Sparkles,
  Download
} from 'lucide-react';
import { doctorApi } from '../../services/portalApi';
import { aiServiceApi } from '../../services/aiServiceApi';

export const DoctorReportViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Form state
  const [reviewStatus, setReviewStatus] = useState<'PENDING_REVIEW' | 'REVIEWED' | 'FOLLOWUP_REQUIRED'>('PENDING_REVIEW');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [explanationAudience, setExplanationAudience] = useState<'patient' | 'clinician'>('clinician');
  const [explanationDraft, setExplanationDraft] = useState('');
  const [explanationMeta, setExplanationMeta] = useState<{
    provider: string;
    model: string | null;
    guardrail: string;
    review_required: boolean;
  } | null>(null);
  const [generatingExplanation, setGeneratingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        let assessmentId = id;
        
        // If no ID passed in URL, load dashboard to find the most recent assessment
        if (!assessmentId) {
          const stats = await doctorApi.getDashboard();
          if (stats?.recentAssessments && stats.recentAssessments.length > 0) {
            assessmentId = stats.recentAssessments[0].id;
          } else {
            throw new Error('No clinical screening reports available in the database.');
          }
        }

        const data = await doctorApi.getScreeningReport(assessmentId!);
        setReportData(data);
        if (data?.assessment) {
          setReviewStatus(data.assessment.reviewStatus || 'PENDING_REVIEW');
          setDoctorNotes(data.assessment.report?.doctorNotes || '');
        }
      } catch (err: any) {
        console.error('Failed to load clinical report:', err);
        setError(err.message || 'Unable to retrieve clinical screening report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleGenerateExplanation = async () => {
    setGeneratingExplanation(true);
    setExplanationError(null);
    try {
      const metrics: Record<string, number> = {};
      if (typeof overallScore === 'number') metrics.composite_score = overallScore;
      const memoryMatched = taskData.task2?.matchedPairs;
      const memoryTotal = taskData.task2?.totalPairs;
      if (typeof memoryMatched === 'number' && typeof memoryTotal === 'number' && memoryTotal > 0) {
        metrics.memory_accuracy = Math.round((memoryMatched / memoryTotal) * 100);
      }
      if (typeof assessment.eyeMetrics?.reactionTime === 'number') {
        metrics.attention_response_time_ms = assessment.eyeMetrics.reactionTime;
      }
      if (typeof taskData.task5?.trailBCompletionSec === 'number') {
        metrics.visuospatial_completion_seconds = taskData.task5.trailBCompletionSec;
      }
      if (typeof taskData.task5?.sequencingErrors === 'number') {
        metrics.executive_errors = taskData.task5.sequencingErrors;
      }
      if (typeof assessment.voiceMetrics?.speechRate === 'number') {
        metrics.speech_rate_syllables_per_minute = assessment.voiceMetrics.speechRate;
      }
      if (typeof assessment.eyeMetrics?.fixationScore === 'number') {
        metrics.gaze_fixation_score = assessment.eyeMetrics.fixationScore;
      }

      const result = await aiServiceApi.explain({
        audience: explanationAudience,
        metrics,
        session_count: 1,
        quality: 'good',
      });
      setExplanationDraft(result.text);
      setExplanationMeta({
        provider: result.provider,
        model: result.model,
        guardrail: result.guardrail,
        review_required: result.review_required,
      });
    } catch (err: any) {
      setExplanationError(err?.message || 'Unable to generate an explanation draft.');
    } finally {
      setGeneratingExplanation(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData?.assessment?.id) return;
    
    setSavingReview(true);
    setSaveSuccess(false);
    try {
      await doctorApi.updateReportReview(reportData.assessment.id, reviewStatus, doctorNotes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(`Error updating report: ${err.message}`);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-medical-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Generating Confidential Clinical Report...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4 bg-white p-8 rounded-2xl border border-line">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-ink">Report Unavailable</h2>
        <p className="text-xs text-muted">{error || 'Could not locate the requested screening record.'}</p>
        <Link
          to="/doctor/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-warm hover:bg-slate-200 text-body rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>
    );
  }

  const { assessment, patient } = reportData;
  // No fallback value: a session without an interpretable score renders as such.
  const overallScore = assessment.overallScore === null || assessment.overallScore === undefined
    ? null
    : Math.round(assessment.overallScore);
  const reviewState = String(assessment.reviewState || 'NOT_REVIEWED');
  const taskData = assessment.taskResponses || {};
  // Recorded measurements only. A missing value renders as missing rather than a
  // plausible-looking default, so the report never presents invented data.
  const recorded = (value: unknown, suffix = '') =>
    value === null || value === undefined || value === '' ? 'Not recorded' : `${value}${suffix}`;


  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      
      {/* ---------------------------------------------------------------- */}
      {/* ACTION BAR (Back, Print, Status)                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          to="/doctor/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctor Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/doctor/patients/${patient.patientId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-line text-body hover:bg-warm text-xs font-bold shadow-card"
          >
            <User className="w-3.5 h-3.5 text-medical-600" />
            Patient Profile
          </Link>

          <button
            onClick={async () => {
              setExportError(null);
              setExporting(true);
              try {
                await doctorApi.exportAssessment(reportData.assessment.id);
              } catch (err: any) {
                setExportError(err?.message || 'Export failed.');
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            title="Download structured session data (JSON) for audit or pilot analysis"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-line text-body hover:bg-warm text-xs font-bold transition-all shadow-card disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 text-medical-600" />
            {exporting ? 'Exporting…' : 'Export JSON'}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold transition-all shadow-card shadow-medical-600/20"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {exportError}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* CONFIDENTIAL CLINICAL REPORT CONTAINER (Printable)               */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Hospital Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-line">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-medical-600 text-white flex items-center justify-center shadow-card">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-medical-700 uppercase tracking-[0.14em] block font-display">
                Neulens Clinical Screening Report
              </span>
              <h1 className="text-xl sm:text-2xl font-semibold text-ink font-display">
                Neurocognitive Multimodal Assessment
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Hospital Clinical Screening Center • Protocol Version 2.5
              </p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warm text-body">
              <ShieldCheck className="w-3.5 h-3.5 text-medical-600" />
              CONFIDENTIAL MEDICAL RECORD
            </div>
            <div className="text-xs text-muted font-mono">
              Ref: <span className="font-bold text-body">{assessment.id}</span>
            </div>
            <div className="text-xs text-muted">
              Assessed: <span className="font-semibold text-body">{new Date(assessment.date).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="bg-warm p-5 rounded-2xl border border-line/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] block">Patient ID</span>
            <span className="font-mono text-sm font-semibold text-medical-700">{patient.patientId}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] block">Full Name</span>
            <span className="text-sm font-bold text-ink">{patient.name}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] block">Age & Gender</span>
            <span className="text-sm font-bold text-ink">{patient.age} yrs • {patient.gender}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] block">Language</span>
            <span className="text-sm font-bold text-ink uppercase">{patient.language}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] block">Handedness</span>
            <span className="text-sm font-bold text-ink capitalize">{patient.handedness || 'Not recorded'}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.12em] block">Education</span>
            <span className="text-sm font-bold text-ink">{patient.educationYears ? `${patient.educationYears} yrs` : 'Not recorded'}</span>
          </div>
        </div>

        {/* Primary Scores */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Overall Composite Score Box */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-medical-950 p-7 rounded-2xl text-white space-y-6 shadow-card">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-medical-300 block mb-1">
                Neurocognitive Composite Index
              </span>
              {overallScore === null ? (
                <p className="text-sm font-semibold text-amber-300">Not interpretable</p>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold font-display text-white">{overallScore}</span>
                  <span className="text-lg text-muted font-bold">/ 100</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Review state:</span>
                <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-[0.12em] text-xs ${
                  reviewState === 'REVIEW_PROMPT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : reviewState === 'NOT_INTERPRETABLE'
                    ? 'bg-slate-500/20 text-slate-200 border border-slate-500/30'
                    : 'bg-slate-500/20 text-slate-200 border border-slate-500/30'
                }`}>
                  {reviewState.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Clinical Review:</span>
                <span className="font-bold text-white uppercase tracking-[0.12em]">
                  {reviewStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/10">
              *The Neulens composite combines oculomotor fixation, working memory, Gnani AI vocal acoustics, facial symmetry, and trail speed into an age-adjusted index.
            </p>
          </div>

          {/*
            Domain-level scores are deliberately not charted. This build has no
            validated domain scoring and no local normative data, so a domain
            radar would be an invented clinical picture.
          */}
          <div className="md:col-span-7 rounded-2xl border border-line bg-warm p-6">
            <h3 className="text-sm font-bold text-ink">Domain breakdown not available</h3>
            <p className="mt-2 text-xs leading-6 text-body">
              This build records session measurements only. It does not compute validated
              domain scores and has no age-adjusted local normative data, so no domain
              profile is displayed. Interpret the recorded session measurements with
              session quality, missing tasks and the patient’s own baseline in view.
            </p>
          </div>

        </div>

        {/* Multimodal AI Telemetry Grid */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-ink font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-medical-600" />
            Multimodal AI Sensor Telemetry
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Oculomotor */}
            <div className="bg-warm p-4 rounded-2xl border border-line/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                <Eye className="w-4 h-4" />
                Oculomotor Tracking
              </div>
              <div className="text-xs space-y-1 text-body">
                <div className="flex justify-between">
                  <span>Saccadic Latency:</span>
                  <span className="font-bold text-ink">{recorded(assessment.eyeMetrics?.reactionTime, ' ms')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fixation Stability:</span>
                  <span className="font-bold text-ink">{recorded(assessment.eyeMetrics?.fixationScore, '%')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blink Frequency:</span>
                  <span className="font-bold text-ink">{recorded(assessment.eyeMetrics?.blinkRate, '/min')}</span>
                </div>
              </div>
            </div>

            {/* Vocal Acoustics (Gnani AI) */}
            <div className="bg-warm p-4 rounded-2xl border border-line/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <Mic className="w-4 h-4" />
                Gnani AI Vocal Acoustics
              </div>
              <div className="text-xs space-y-1 text-body">
                <div className="flex justify-between">
                  <span>Speech Rate:</span>
                  <span className="font-bold text-ink">{recorded(assessment.voiceMetrics?.speechRate, ' WPM')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pause Integrity:</span>
                  <span className="font-bold text-ink">{recorded(assessment.voiceMetrics?.pauseScore, '%')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jitter / Shimmer:</span>
                  <span className="font-bold text-ink">
                    {assessment.voiceMetrics?.jitter === null || assessment.voiceMetrics?.jitter === undefined
                      ? 'Not recorded'
                      : `${assessment.voiceMetrics.jitter}% / ${recorded(assessment.voiceMetrics?.shimmer, '%')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Neuromuscular Facial */}
            <div className="bg-warm p-4 rounded-2xl border border-line/60 space-y-2">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
                <Smile className="w-4 h-4" />
                Facial Landmarks & Tremor
              </div>
              <div className="text-xs space-y-1 text-body">
                <div className="flex justify-between">
                  <span>Bilateral Symmetry:</span>
                  <span className="font-bold text-ink">{recorded(assessment.faceMetrics?.symmetry, '%')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tremor Score:</span>
                  <span className="font-bold text-ink">{recorded(assessment.faceMetrics?.tremorScore)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Task Responses Breakdown */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-ink font-display">
            Screening Battery Task Responses
          </h2>

          <div className="bg-warm p-5 rounded-2xl border border-line/60 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Focus Orbit & Cortex Match:</span>
                <p className="text-body">
                  Target latency: {recorded(taskData.task1?.saccadicLatencyMs, 'ms')} • Memory matched pairs: {recorded(taskData.task2?.matchedPairs)} (errors: {recorded(taskData.task2?.mismatches)})
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Path Mapper Trail-Making:</span>
                <p className="text-body">
                  Trail B completed in {recorded(taskData.task5?.trailBCompletionSec, 's')} with {recorded(taskData.task5?.sequencingErrors)} sequencing errors.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-line">
              <span className="font-bold text-slate-800 block mb-0.5">Gnani Prisma v2.5 Speech Transcription:</span>
              <p className="text-body italic">
                {taskData.task3?.transcript ? `“${taskData.task3.transcript}”` : 'No transcript was recorded for this session.'}
              </p>
            </div>
          </div>
        </div>

        {/* Automated Clinical Recommendation */}
        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-[0.12em] flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-medical-600" />
            AI Algorithmic Screening Impression
          </h3>
          <p className="text-xs text-blue-950 leading-relaxed">
            {assessment.report?.recommendation ||
              'No screening impression was recorded for this session. Review the recorded measurements above and document your own interpretation.'}
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONSTRAINED EXPLANATION DRAFT (CLINICIAN REVIEW REQUIRED)      */}
        {/* ------------------------------------------------------------- */}
        <div className="p-5 rounded-2xl bg-warm border border-line space-y-3 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-ink font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-medical-600" />
                Plain-language explanation draft
              </h3>
              <p className="text-xs text-muted">
                Drafted only from the deterministic scores above. Clinician review is required before anything is shared.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={explanationAudience}
                onChange={(e) => setExplanationAudience(e.target.value as 'patient' | 'clinician')}
                className="text-xs font-bold bg-white border border-line rounded-xl px-3 py-2"
              >
                <option value="clinician">Clinician audience</option>
                <option value="patient">Patient audience</option>
              </select>
              <button
                type="button"
                onClick={handleGenerateExplanation}
                disabled={generatingExplanation}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold transition-all shadow-card shadow-medical-600/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingExplanation ? 'Drafting...' : 'Generate draft'}
              </button>
            </div>
          </div>

          {explanationError && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {explanationError}
            </div>
          )}

          {explanationMeta && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
              <span className="px-2 py-1 rounded-lg bg-white border border-line">
                Provider: {explanationMeta.provider}
              </span>
              {explanationMeta.model && (
                <span className="px-2 py-1 rounded-lg bg-white border border-line">
                  Model: {explanationMeta.model}
                </span>
              )}
              <span className="px-2 py-1 rounded-lg bg-white border border-line">
                Guardrail: {explanationMeta.guardrail}
              </span>
              {explanationMeta.review_required && (
                <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                  Review required
                </span>
              )}
            </div>
          )}

          <textarea
            rows={6}
            value={explanationDraft}
            onChange={(e) => setExplanationDraft(e.target.value)}
            placeholder="Generated draft will appear here. It is editable; nothing is saved until you sign off below."
            className="w-full p-3.5 rounded-2xl text-xs bg-white border border-line focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted">
              Drafts are auxiliary text, not a clinical result. Edit or discard before sharing.
            </span>
            <button
              type="button"
              onClick={() => setDoctorNotes((notes) => [notes, explanationDraft].filter(Boolean).join('\n\n'))}
              disabled={!explanationDraft.trim()}
              className="text-xs font-bold text-medical-700 hover:text-medical-800 disabled:opacity-40"
            >
              Append to physician notes
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DOCTOR'S INTERACTIVE REVIEW & SIGN-OFF FORM                   */}
        {/* ------------------------------------------------------------- */}
        <form onSubmit={handleSaveReview} className="space-y-4 pt-4 border-t border-line">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-ink font-display flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-medical-600" />
                Attending Neurologist Review & Verification
              </h3>
              <p className="text-xs text-muted">
                Assign clinical review status and provide physician's diagnostic impressions.
              </p>
            </div>

            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Review Signed & Saved Successfully
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['PENDING_REVIEW', 'REVIEWED', 'FOLLOWUP_REQUIRED'] as const).map((status) => (
              <label
                key={status}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  reviewStatus === status
                    ? 'bg-blue-50/70 border-medical-500 shadow-card ring-2 ring-medical-500/10'
                    : 'bg-warm border-line hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="reviewStatus"
                  value={status}
                  checked={reviewStatus === status}
                  onChange={() => setReviewStatus(status)}
                  className="w-4 h-4 text-medical-600 focus:ring-medical-500"
                />
                <div>
                  <span className="text-xs font-bold text-ink block">
                    {status === 'PENDING_REVIEW' && 'Pending Review'}
                    {status === 'REVIEWED' && 'Reviewed / Verified'}
                    {status === 'FOLLOWUP_REQUIRED' && 'Follow-up Required'}
                  </span>
                  <span className="text-xs text-muted">
                    {status === 'PENDING_REVIEW' && 'Awaiting doctor assessment'}
                    {status === 'REVIEWED' && 'Screening confirmed normal'}
                    {status === 'FOLLOWUP_REQUIRED' && 'Schedule clinical consult'}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-body block">
              Physician's Clinical Impression & Notes:
            </label>
            <textarea
              rows={4}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Enter clinical observations, differential diagnoses, or instructions for follow-up care..."
              className="w-full p-3.5 rounded-2xl text-xs bg-warm border border-line focus:bg-white focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 leading-relaxed font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted">
              Reviewed by: <strong className="text-body">{assessment.reviewedBy || '—'}</strong>
            </span>

            <button
              type="submit"
              disabled={savingReview}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold transition-all shadow-card shadow-medical-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingReview ? 'Saving Verification...' : 'Save & Sign Off Review'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
