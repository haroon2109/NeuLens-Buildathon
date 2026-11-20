import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  Brain, 
  Eye, 
  Mic, 
  Smile, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Info,
  Sparkles,
  Play,
  Languages,
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import { doctorApi } from '../../services/portalApi';
import { PatientWorkflowNav } from './portal/ui';
import { Swap } from '../../components/motion/Reveal';

type TabType = 'info' | 'assessments' | 'reports';

export const DoctorPatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [selectedAssessmentIndex, setSelectedAssessmentIndex] = useState(0);
  const [carePlanAction, setCarePlanAction] = useState<'REPEAT_SCREENING' | 'CLINICAL_REVIEW' | 'REVIEW_CONTEXT' | 'SUPPORT_FUNCTION'>('CLINICAL_REVIEW');
  const [carePlanDate, setCarePlanDate] = useState('');
  const [carePlanNotes, setCarePlanNotes] = useState('');
  const [carePlanMessage, setCarePlanMessage] = useState<string | null>(null);
  const [carePlanError, setCarePlanError] = useState<string | null>(null);
  const [savingCarePlan, setSavingCarePlan] = useState(false);

  const [instrumentCatalog, setInstrumentCatalog] = useState<any[]>([]);
  const [instrumentForm, setInstrumentForm] = useState({
    instrumentKey: 'RUDAS',
    instrumentVersion: '',
    language: 'en',
    administeredOn: '',
    administeredBy: '',
    score: '',
    licenceConfirmed: false,
    licenceReference: '',
    notes: ''
  });
  const [instrumentSaving, setInstrumentSaving] = useState(false);
  const [instrumentMessage, setInstrumentMessage] = useState<string | null>(null);
  const [instrumentError, setInstrumentError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPatient = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await doctorApi.getPatientProfile(id);
        setData(res);
        try {
          const catalog = await doctorApi.getExternalInstrumentCatalog();
          setInstrumentCatalog(catalog.instruments || []);
        } catch {
          // Catalog is advisory; the form still accepts a keyed instrument.
        }
      } catch (err: any) {
        console.error('Failed to load patient dossier:', err);
        setError(err.message || 'Unable to load patient file');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  useEffect(() => {
    const assessment = data?.assessments?.[selectedAssessmentIndex];
    const savedPlan = assessment?.taskResponses?.clinicianCarePlan;
    if (savedPlan) {
      setCarePlanAction(savedPlan.action);
      setCarePlanDate(savedPlan.followUpDate || '');
      setCarePlanNotes(savedPlan.notes || '');
    } else {
      setCarePlanAction('CLINICAL_REVIEW');
      setCarePlanDate('');
      setCarePlanNotes('');
    }
    setCarePlanMessage(null);
    setCarePlanError(null);
  }, [data, selectedAssessmentIndex]);

  const handleRecordInstrument = async () => {
    if (!id) return;
    setInstrumentSaving(true);
    setInstrumentError(null);
    setInstrumentMessage(null);
    try {
      const score = Number(instrumentForm.score);
      const res = await doctorApi.recordExternalInstrument(id, {
        instrumentKey: instrumentForm.instrumentKey,
        instrumentVersion: instrumentForm.instrumentVersion || undefined,
        language: instrumentForm.language,
        administeredOn: instrumentForm.administeredOn,
        administeredBy: instrumentForm.administeredBy,
        score,
        licenceConfirmed: instrumentForm.licenceConfirmed,
        licenceReference: instrumentForm.licenceReference || undefined,
        notes: instrumentForm.notes || undefined
      });
      setData((prev: any) =>
        prev
          ? { ...prev, externalInstruments: res.records, externalAnchor: res.anchor }
          : prev
      );
      setInstrumentForm((prev) => ({
        ...prev,
        instrumentVersion: '',
        administeredOn: '',
        administeredBy: '',
        score: '',
        licenceConfirmed: false,
        licenceReference: '',
        notes: ''
      }));
      setInstrumentMessage('External instrument record saved. It is an anchor, not part of the Neulens composite.');
    } catch (err) {
      setInstrumentError(err instanceof Error ? err.message : 'Unable to save external instrument record.');
    } finally {
      setInstrumentSaving(false);
    }
  };

  const handleSaveCarePlan = async (assessmentId: string) => {
    setSavingCarePlan(true);
    setCarePlanError(null);
    setCarePlanMessage(null);
    try {
      await doctorApi.saveCarePlan(assessmentId, {
        action: carePlanAction,
        followUpDate: carePlanDate || null,
        notes: carePlanNotes
      });
      setCarePlanMessage('Clinician follow-up plan saved to this screening record.');
    } catch (err) {
      setCarePlanError(err instanceof Error ? err.message : 'Unable to save follow-up plan.');
    } finally {
      setSavingCarePlan(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-medical-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">Retrieving Patient Medical Dossier...</p>
      </div>
    );
  }

  if (error || !data || !data.patient) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white p-8 rounded-2xl border border-line">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-ink">Patient File Not Found</h2>
        <p className="text-xs text-muted">{error || 'No patient record found matching the specified identifier.'}</p>
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-2 px-4 py-2 bg-warm hover:bg-slate-200 text-body rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient Directory
        </Link>
      </div>
    );
  }

  const { patient, assessments = [], changeSummary } = data;
  const currentAssessment = assessments[selectedAssessmentIndex] || assessments[0] || null;
  const taskData = currentAssessment?.taskResponses || {};
  const scoreHistory = [...assessments].slice(0, 6).reverse();
  const functionalActivityLabels: Record<string, string> = {
    appointments: 'Remembering appointments',
    medication: 'Managing medicines',
    finances: 'Handling money or bills',
    household: 'Household tasks'
  };

  const getReviewStateBadge = (state: string | null) => {
    if (!state) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warm text-muted border border-line">
          No Screenings
        </span>
      );
    }
    switch (state.toUpperCase()) {
      case 'REVIEW_PROMPT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Review prompt
          </span>
        );
      case 'NOT_INTERPRETABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warm text-body border border-line">
            Not interpretable
          </span>
        );
      case 'CLINICIAN_REVIEWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Clinician reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* ---------------------------------------------------------------- */}
      {/* TOP ACTION BAR                                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient Registry
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-line text-body hover:bg-warm text-xs font-bold transition-all shadow-card cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-muted" />
            Print Dossier
          </button>

          <Link
            to={`/doctor/patients/${patient.patientId}/screen`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold transition-all shadow-card shadow-medical-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start Screening Battery
          </Link>
        </div>
      </div>

      {/* Clinical workflow: review → trends → changes → context → notes → care */}
      <PatientWorkflowNav patientId={patient.patientId} />

      {/* ---------------------------------------------------------------- */}
      {/* PATIENT HEADER CARD                                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-medical-600 to-blue-500 text-white flex items-center justify-center font-display font-semibold text-2xl shadow-elevated shadow-medical-500/20">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-display">
                  {patient.name}
                </h1>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  {patient.patientId}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Hospital Clinical Record • Enrolled on {new Date(patient.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentAssessment ? (
              getReviewStateBadge(currentAssessment.reviewState)
            ) : (
              getReviewStateBadge(null)
            )}
            
            <div className="px-3 py-1 bg-warm border border-line rounded-full text-xs font-bold text-body">
              {assessments.length} {assessments.length === 1 ? 'Screening Session' : 'Screening Sessions'}
            </div>
          </div>
        </div>
      </div>

      <section className={`rounded-2xl border shadow-card overflow-hidden ${
        changeSummary?.status === 'REVIEW'
          ? 'bg-amber-50/60 border-amber-200'
          : 'bg-white border-line'
      }`}>
        <div className="p-6 border-b border-line/70 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              changeSummary?.status === 'REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-medical-700'
            }`}>
              {changeSummary?.status === 'REVIEW' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Cognitive & daily-function change monitor</h2>
              <p className="text-xs text-body mt-1 max-w-2xl">
                Compares this patient with their own earlier screens and self-reported activities; cues support follow-up and are not diagnostic thresholds.
              </p>
            </div>
          </div>
          <span className={`self-start px-2.5 py-1 rounded-full text-xs font-bold border ${
            changeSummary?.status === 'REVIEW'
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-white border-line text-body'
          }`}>
            {changeSummary?.status === 'REVIEW'
              ? 'Clinician review cue'
              : changeSummary?.status === 'NO_CHANGE'
              ? 'No current change cue'
              : 'More comparisons needed'}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Screening score history</h3>
              {changeSummary?.cognitive?.change !== null && changeSummary?.cognitive?.change !== undefined && (
                <span className={`text-xs font-bold ${
                  changeSummary.cognitive.change < 0 ? 'text-amber-800' : 'text-body'
                }`}>
                  Since prior screen: {changeSummary.cognitive.change > 0 ? '+' : ''}{changeSummary.cognitive.change} points
                </span>
              )}
            </div>
            {scoreHistory.length > 0 ? (
              <div className="space-y-2">
                {scoreHistory.map((assessment: any) => (
                  <div key={assessment.id} className="grid grid-cols-[76px_1fr_38px] gap-3 items-center text-xs">
                    <span className="text-muted">{new Date(assessment.date).toLocaleDateString()}</span>
                    <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden" aria-label={`Score ${Math.round(assessment.overallScore)} out of 100`}>
                      <div
                        className="h-full rounded-full bg-medical-600"
                        style={{ width: `${Math.max(0, Math.min(100, assessment.overallScore))}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800 text-right">{Math.round(assessment.overallScore)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No completed cognitive screens recorded yet.</p>
            )}
            {changeSummary?.cognitive?.declineBeyondReliableChange && (
              <p className="mt-3 text-xs font-semibold text-amber-900">
                Latest score fell more than ±{changeSummary.cognitive.reliability.reliableChangeThreshold} points below the prior comparable mean — beyond this patient's own measured session-to-session variability.
              </p>
            )}
            {changeSummary?.cognitive?.reliability?.state === 'NOT_ESTABLISHED' && (
              <p className="mt-3 text-xs text-muted">
                No score-based change flag: {changeSummary.cognitive.reliability.pairs} comparable repeat pair(s) recorded, three are needed to measure how much this score moves when nothing has changed.
              </p>
            )}
            {changeSummary?.cognitive?.baselineRange && (
              <p className="mt-2 text-xs text-muted">
                Observed spread across prior comparable screens: {Math.round(changeSummary.cognitive.baselineRange.minimum)}–{Math.round(changeSummary.cognitive.baselineRange.maximum)}. Descriptive only — it is not a threshold.
              </p>
            )}
            {assessments.length < 2 && (
              <p className="mt-3 text-xs text-muted">A repeat screen is needed before a within-person score comparison is available.</p>
            )}
          </div>

          <div className="lg:border-l lg:border-line/70 lg:pl-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Daily-function self-report</h3>
            {changeSummary?.function?.currentCheckInDate ? (
              <>
                <p className="text-xs text-body">
                  Latest check-in: {new Date(changeSummary.function.currentCheckInDate).toLocaleDateString()}
                </p>
                <ul className="mt-3 space-y-2">
                  {Object.entries(functionalActivityLabels).map(([activityId, label]) => {
                    const rawLevel = changeSummary.function.currentActivityLevels?.[activityId];
                    const level = typeof rawLevel === 'number' ? rawLevel : undefined;
                    if (level === undefined) return null;
                    const worsened = changeSummary.function.worsenedActivityIds.includes(activityId);
                    return (
                      <li key={activityId} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-body">{label}</span>
                        <span className={`font-semibold ${worsened ? 'text-rose-800' : 'text-body'}`}>
                          {level === 0 ? 'About the same' : level === 1 ? 'More difficult' : 'Needs more help'}
                          {worsened ? ' · increased since prior check-in' : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {changeSummary.function.worsenedActivityIds.length > 0 ? (
                  <p className="mt-3 text-xs font-semibold text-rose-800">
                    Reported difficulty increased in {changeSummary.function.worsenedActivityIds.length} activity(ies) since the previous check-in.
                  </p>
                ) : changeSummary.function.previousCheckInDate ? (
                  <p className="mt-3 text-xs text-body">
                    No increase in reported difficulty across the daily activities compared with the prior check-in.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-body">
                    This is the first recorded daily-function check-in; future responses can be compared with it.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted">
                No daily-function check-in recorded. The next screening includes an optional check-in.
              </p>
            )}
          </div>

          <div className="lg:col-span-2 lg:border-t lg:border-line/70 lg:pt-5">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Recent health context</h3>
            {Object.keys(changeSummary?.context?.currentFactors || {}).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(changeSummary.context.currentFactors).map(([factor, rawLevel]) => {
                  const level = typeof rawLevel === 'number' ? rawLevel : undefined;
                  return (
                  <span key={factor} className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                    level && level > 0 ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-white border-line text-body'
                  }`}>
                    {factor === 'moodStress' ? 'Mood / stress' : factor === 'activity' ? 'Physical activity' : 'Sleep'}: {level === 0 ? 'about usual' : level === 1 ? 'somewhat worse' : 'much worse'}
                  </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">No recent self-reported context available.</p>
            )}
            {changeSummary?.context?.changedFactors?.length > 0 && (
              <p className="mt-2 text-xs text-sky-900">
                Context changed since the prior check-in; discuss whether it may be relevant. This does not establish a cause.
              </p>
            )}
            {taskData.externalContext?.status && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-body">
                  Linked FHIR R4 context: {taskData.externalContext.status === 'IMPORTED'
                    ? `Imported ${new Date(taskData.externalContext.importedAt).toLocaleString()}`
                    : taskData.externalContext.status.replaceAll('_', ' ').toLowerCase()}
                </p>
                {taskData.externalContext.observations?.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {taskData.externalContext.observations.map((observation: any, index: number) => (
                      <div key={`${observation.code}-${index}`} className="p-3 rounded-xl bg-white/80 border border-line">
                        <div className="text-xs text-muted">{observation.category} · {observation.recordedAt ? new Date(observation.recordedAt).toLocaleDateString() : 'date unavailable'}</div>
                        <div className="mt-1 text-xs font-bold text-slate-800">{observation.label}</div>
                        <div className="text-sm font-semibold text-medical-800">{observation.value} {observation.unit}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted">No supported recent observations were returned by the connected system.</p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 lg:border-t lg:border-line/70 lg:pt-5">
            <h3 className="text-sm font-bold text-slate-800">Clinician-confirmed next step</h3>
            <p className="text-xs text-body mt-1">
              Suggested discussion: {changeSummary?.reviewReasons?.includes('FUNCTIONAL_CHANGE')
                ? 'Review the activities that became harder and ask what support the patient wants.'
                : changeSummary?.reviewReasons?.includes('OUTSIDE_RELIABLE_CHANGE')
                ? 'Consider repeating the screen under comparable conditions and reviewing whether the change persists.'
                : changeSummary?.reviewReasons?.includes('CONTEXT_CHANGE')
                ? 'Review sleep, activity, and mood/stress changes as possible context; this does not establish cause.'
                : 'Continue clinician-directed monitoring; there is not enough comparable data to infer change.'}
            </p>
            <p className="text-xs text-muted mt-1">
              No automated diagnosis or patient-specific medical treatment is generated. A qualified clinician must confirm any plan.
            </p>
            {currentAssessment ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-body">
                  Follow-up action
                  <select
                    value={carePlanAction}
                    onChange={(event) => setCarePlanAction(event.target.value as typeof carePlanAction)}
                    className="mt-1 block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm"
                  >
                    <option value="REPEAT_SCREENING">Repeat screening under comparable conditions</option>
                    <option value="CLINICAL_REVIEW">Clinical review</option>
                    <option value="REVIEW_CONTEXT">Review contributing context</option>
                    <option value="SUPPORT_FUNCTION">Discuss daily-function supports</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-body">
                  Follow-up date (optional)
                  <input
                    type="date"
                    value={carePlanDate}
                    onChange={(event) => setCarePlanDate(event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold text-body md:col-span-1">
                  Clinician notes (optional)
                  <input
                    type="text"
                    maxLength={2000}
                    value={carePlanNotes}
                    onChange={(event) => setCarePlanNotes(event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm"
                    placeholder="Context reviewed, patient preference, or planned action"
                  />
                </label>
                <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveCarePlan(currentAssessment.id)}
                    disabled={savingCarePlan}
                    className="px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white text-xs font-bold"
                  >
                    {savingCarePlan ? 'Saving…' : 'Save clinician plan'}
                  </button>
                  {carePlanMessage && <span role="status" className="text-xs font-semibold text-emerald-700">{carePlanMessage}</span>}
                  {carePlanError && <span role="alert" className="text-xs font-semibold text-rose-700">{carePlanError}</span>}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">A screening record is needed before a follow-up plan can be saved.</p>
            )}
          </div>
        </div>
        <div className="px-6 pb-5 text-xs text-muted">
          Review cues: a score decline larger than this patient's own measured session-to-session variability (1.96 × SD of change, provisional), increased reported daily-activity difficulty, or worsening self-reported context. These prototype prompts are not validated clinical cutoffs or diagnoses, and no decline is reported at all until three comparable repeat pairs exist.
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SIMPLE TAB NAVIGATION                                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-line pb-px">
        
        {/* Tab 1: Patient Information */}
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-t border-l border-r ${
            activeTab === 'info'
              ? 'bg-white border-line text-medical-700 shadow-card -mb-px'
              : 'border-transparent text-muted hover:text-slate-800 hover:bg-warm'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Patient Information</span>
        </button>

        {/* Tab 2: Assessment History */}
        <button
          type="button"
          onClick={() => setActiveTab('assessments')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-t border-l border-r ${
            activeTab === 'assessments'
              ? 'bg-white border-line text-medical-700 shadow-card -mb-px'
              : 'border-transparent text-muted hover:text-slate-800 hover:bg-warm'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Assessment History</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-warm text-body">
            {assessments.length}
          </span>
        </button>

        {/* Tab 3: Screening Reports */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-t border-l border-r ${
            activeTab === 'reports'
              ? 'bg-white border-line text-medical-700 shadow-card -mb-px'
              : 'border-transparent text-muted hover:text-slate-800 hover:bg-warm'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Screening Reports</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-warm text-body">
            {assessments.length}
          </span>
        </button>

      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TAB CONTENT 1: PATIENT INFORMATION                               */}
      {/* ---------------------------------------------------------------- */}
      <Swap key={activeTab} className="space-y-6">
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-card space-y-6">
            
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-base font-bold text-ink font-display">
                  Demographic & Neurological Baseline
                </h2>
                <p className="text-xs text-muted">
                  Clinical characteristics registered for normative comparison
                </p>
              </div>

              <Link
                to={`/doctor/patients/${patient.patientId}/screen`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-medical-700 text-xs font-bold transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-medical-700" />
                <span>Administer New Assessment</span>
              </Link>
            </div>

            {/* Demographics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-warm p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                  Age
                </span>
                <span className="text-lg font-semibold text-ink">
                  {patient.age} yrs
                </span>
              </div>

              <div className="bg-warm p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                  Gender
                </span>
                <span className="text-lg font-semibold text-ink capitalize">
                  {patient.gender?.toLowerCase() || 'Unspecified'}
                </span>
              </div>

              <div className="bg-warm p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                  Birth Year / DOB
                </span>
                <span className="text-lg font-semibold text-ink">
                  {patient.dob || '1950'}
                </span>
              </div>

              <div className="bg-warm p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                  Primary Language
                </span>
                <span className="text-lg font-semibold text-ink uppercase">
                  {patient.language || 'EN'}
                </span>
              </div>

              <div className="bg-warm p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                  Handedness
                </span>
                <span className="text-lg font-semibold text-ink capitalize">
                  {patient.handedness?.toLowerCase() || 'Right'}
                </span>
              </div>

              <div className="bg-warm p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                  Education
                </span>
                <span className="text-lg font-semibold text-ink">
                  {patient.educationYears || 12} yrs
                </span>
              </div>
            </div>

            {/* Additional Patient Baseline Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-line">
              <div className="p-4 bg-warm rounded-2xl border border-line/60 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-medical-600" />
                  Clinical Status & Platform Record
                </span>
                <p className="text-xs text-body leading-relaxed">
                  Patient registered under unique identifier <span className="font-mono font-bold text-slate-800">{patient.patientId}</span>. All screening responses from patient and clinician-led sessions automatically synchronize with this file.
                </p>
              </div>

              <div className="p-4 bg-warm rounded-2xl border border-line/60 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-medical-600" />
                  Screening Summary
                </span>
                <p className="text-xs text-body leading-relaxed">
                  {assessments.length > 0 ? (
                    <>Latest assessment recorded on <span className="font-semibold text-slate-800">{new Date(assessments[0].date).toLocaleDateString()}</span>
                      {typeof assessments[0].overallScore === 'number'
                        ? <> with a composite score of <span className="font-bold text-slate-800">{Math.round(assessments[0].overallScore)}/100</span>.</>
                        : <>; no interpretable composite score was produced for that session.</>}
                    </>
                  ) : (
                    <>No assessments recorded yet. Initial cognitive baseline is pending administration.</>
                  )}
                </p>
              </div>
            </div>

            {/* External validated instrument anchor */}
            <div className="pt-4 border-t border-line space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink font-display flex items-center gap-2">
                  <Award className="w-4 h-4 text-medical-600" />
                  External validated-instrument record
                </h3>
                <p className="text-xs text-muted mt-1 max-w-3xl">
                  Record a score from a licensed screener the clinician administered outside Neulens (for example MoCA, RUDAS, AD8, MMSE).
                  This is an anchor for the record, not a Neulens measurement: it is not rescored, not interpreted by the platform, and never
                  merged into the Neulens composite. Any difference shown between two external administrations is arithmetic only.
                </p>
                {data.externalAnchor?.note && (
                  <p className="text-xs text-body mt-2 p-3 rounded-xl bg-warm border border-line/60">{data.externalAnchor.note}</p>
                )}
              </div>

              {Array.isArray(data.externalInstruments) && data.externalInstruments.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full text-xs">
                    <thead className="bg-warm/70 border-b border-line text-muted uppercase tracking-[0.1em]">
                      <tr>
                        <th className="text-left py-2.5 px-3 font-bold">Instrument</th>
                        <th className="text-left py-2.5 px-3 font-bold">Administered</th>
                        <th className="text-left py-2.5 px-3 font-bold">Language</th>
                        <th className="text-left py-2.5 px-3 font-bold">Score</th>
                        <th className="text-left py-2.5 px-3 font-bold">vs prior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.externalInstruments.map((record: any) => (
                        <tr key={record.id}>
                          <td className="py-2.5 px-3 font-semibold text-ink">
                            {record.instrumentName}{record.instrumentVersion ? ` (${record.instrumentVersion})` : ''}
                            <div className="text-[11px] text-muted font-normal">by {record.administeredBy}</div>
                          </td>
                          <td className="py-2.5 px-3 text-body">{new Date(record.administeredOn).toLocaleDateString()}</td>
                          <td className="py-2.5 px-3 text-body uppercase">{record.language}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-ink">{record.score} / {record.maxScore}</td>
                          <td className="py-2.5 px-3 text-body">
                            {record.deltaComparability === 'COMPARABLE' && typeof record.deltaFromPrevious === 'number'
                              ? `${record.deltaFromPrevious > 0 ? '+' : ''}${record.deltaFromPrevious} (arithmetic only)`
                              : record.deltaComparability === 'FIRST_RECORD'
                                ? 'First record'
                                : record.deltaComparability === 'DIFFERENT_INSTRUMENT'
                                  ? 'Different instrument — not compared'
                                  : record.deltaComparability === 'DIFFERENT_VERSION'
                                    ? 'Different version — not compared'
                                    : 'Different language — not compared'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted">No external validated-instrument score recorded.</p>
              )}

              <div className="p-4 rounded-2xl border border-line bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Record an external administration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Instrument</span>
                    <select
                      className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink bg-white"
                      value={instrumentForm.instrumentKey}
                      onChange={(e) => {
                        const key = e.target.value;
                        const def = instrumentCatalog.find((i: any) => i.key === key);
                        setInstrumentForm((p) => ({ ...p, instrumentKey: key, licenceConfirmed: def && !def.licence?.required ? p.licenceConfirmed : false }));
                      }}
                    >
                      {(instrumentCatalog.length ? instrumentCatalog : [{ key: 'MOCA', name: 'MoCA' }, { key: 'RUDAS', name: 'RUDAS' }, { key: 'AD8', name: 'AD8' }, { key: 'MMSE', name: 'MMSE' }]).map((i: any) => (
                        <option key={i.key} value={i.key}>{i.name || i.key}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Version / form</span>
                    <input className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.instrumentVersion} onChange={(e) => setInstrumentForm((p) => ({ ...p, instrumentVersion: e.target.value }))} placeholder="e.g. 8.1, A-RUDAS" />
                  </label>
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Language</span>
                    <input className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.language} onChange={(e) => setInstrumentForm((p) => ({ ...p, language: e.target.value }))} placeholder="e.g. ar, en" />
                  </label>
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Administered on</span>
                    <input type="date" className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.administeredOn} onChange={(e) => setInstrumentForm((p) => ({ ...p, administeredOn: e.target.value }))} />
                  </label>
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Administered by</span>
                    <input className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.administeredBy} onChange={(e) => setInstrumentForm((p) => ({ ...p, administeredBy: e.target.value }))} placeholder="Clinician name" />
                  </label>
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Total score</span>
                    <input type="number" step="any" className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.score} onChange={(e) => setInstrumentForm((p) => ({ ...p, score: e.target.value }))} placeholder="Raw total on its own scale" />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Licence / certification reference</span>
                    <input className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.licenceReference} onChange={(e) => setInstrumentForm((p) => ({ ...p, licenceReference: e.target.value }))} placeholder="If the publisher requires one" />
                  </label>
                  <label className="text-xs text-muted space-y-1">
                    <span className="font-semibold text-slate-700">Notes</span>
                    <input className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" value={instrumentForm.notes} onChange={(e) => setInstrumentForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional context (not interpreted by the platform)" />
                  </label>
                </div>
                <label className="flex items-start gap-2 text-xs text-body">
                  <input type="checkbox" className="mt-0.5" checked={instrumentForm.licenceConfirmed} onChange={(e) => setInstrumentForm((p) => ({ ...p, licenceConfirmed: e.target.checked }))} />
                  <span>
                    I confirm I hold the licence/certification required to administer and record this instrument (required for MoCA, AD8, MMSE).
                    {(() => {
                      const def = instrumentCatalog.find((i: any) => i.key === instrumentForm.instrumentKey);
                      return def?.licence?.note ? <span className="block text-muted mt-1">{def.licence.note}</span> : null;
                    })()}
                  </span>
                </label>
                {instrumentError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{instrumentError}</p>}
                {instrumentMessage && <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{instrumentMessage}</p>}
                <button
                  type="button"
                  onClick={handleRecordInstrument}
                  disabled={instrumentSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white text-xs font-bold"
                >
                  {instrumentSaving ? 'Saving…' : 'Record external instrument score'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB CONTENT 2: ASSESSMENT HISTORY                                */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          {assessments.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-2xl border border-line text-muted space-y-4">
              <Activity className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <h3 className="text-base font-bold text-slate-800">No Assessment History Recorded</h3>
                <p className="text-xs text-muted max-w-md mx-auto mt-1">
                  This patient has not yet completed a screening session. You can launch the standardized screening battery directly.
                </p>
              </div>
              <Link
                to={`/doctor/patients/${patient.patientId}/screen`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-2xl text-xs font-bold shadow-card shadow-medical-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Screening Battery</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Session Selector Cards */}
              <div className="bg-white p-6 rounded-2xl border border-line shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink font-display">
                      Select Screening Battery Session
                    </h3>
                    <p className="text-xs text-muted">
                      Chronological screening records with granular telemetry
                    </p>
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {assessments.length} {assessments.length === 1 ? 'record' : 'records'} available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {assessments.map((a: any, idx: number) => {
                    const isSelected = idx === selectedAssessmentIndex;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAssessmentIndex(idx)}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-medical-500 shadow-card ring-2 ring-medical-500/10'
                            : 'bg-white border-line hover:border-line-strong hover:bg-warm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {new Date(a.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="font-mono text-xs font-semibold text-medical-700">
                            {a.overallScore === null || a.overallScore === undefined ? 'Not interpretable' : `${Math.round(a.overallScore)}/100`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">
                            {String(a.reviewState || 'NOT_REVIEWED').replace(/_/g, ' ').toLowerCase()}
                          </span>
                          {getReviewBadge(a.reviewStatus)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Session Task Details */}
              {currentAssessment && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-ink font-display">
                        Session Telemetry ({new Date(currentAssessment.date).toLocaleDateString()})
                      </h3>
                      <p className="text-xs text-muted">
                        Task responses captured during this administration
                      </p>
                    </div>

                    <Link
                      to={`/doctor/reports/${currentAssessment.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold transition-all shadow-card"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Clinical Report</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Task 1: Focus Orbit */}
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-sm">Task 1: Focus Orbit</h4>
                            <p className="text-xs text-muted">Oculomotor Saccades & Tracking</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
                          MediaPipe Eye
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Latency</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task1?.saccadicLatencyMs || currentAssessment.eyeMetrics?.reactionTime || 240} ms
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Fixation</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task1?.fixationHoldPct || currentAssessment.eyeMetrics?.fixationScore || 88}%
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Errors</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task1?.targetErrors ?? 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task 2: Cortex Match */}
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Brain className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-sm">Task 2: Cortex Match</h4>
                            <p className="text-xs text-muted">Working Memory Recall</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">
                          Matrix Recall
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Matches</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task2?.matchedPairs ?? 6}
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Mismatches</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task2?.mismatches ?? 2}
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Duration</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task2?.completionTimeSec || 28}s
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task 3: Vocal Echo (Gnani AI) */}
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-card space-y-4 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-sm">Task 3: Vocal Echo Speech Repetition</h4>
                            <p className="text-xs text-muted">Gnani Prisma v2.5 STT & Web Audio Acoustic Telemetry</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700">
                          Gnani AI STT
                        </span>
                      </div>

                      <div className="bg-warm p-4 rounded-2xl border border-line/60">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-1">
                          Recorded Speech Transcript:
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-slate-800 italic">
                          "{taskData.task3?.transcript || 'Cognitive markers and visual path tracings measure baseline motor coordination and neural reaction delays.'}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Speech Rate</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task3?.wpm || currentAssessment.voiceMetrics?.speechRate || 135} WPM
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Pause Score</span>
                          <span className="text-sm font-semibold text-ink">
                            {currentAssessment.voiceMetrics?.pauseScore || 86}%
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Jitter</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task3?.jitterPct || currentAssessment.voiceMetrics?.jitter || 0.12}%
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Shimmer</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task3?.shimmerPct || currentAssessment.voiceMetrics?.shimmer || 1.2}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task 4: Mimic Sync */}
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Smile className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-sm">Task 4: Mimic Sync</h4>
                            <p className="text-xs text-muted">Neuromuscular Facial Landmark Symmetry</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700">
                          MediaPipe Face
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Symmetry</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task4?.facialSymmetryScore || currentAssessment.faceMetrics?.symmetry || 94}%
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Smile</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task4?.smileIntensityPct || 86}%
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Micro-Tremor</span>
                          <span className="text-sm font-semibold text-ink">
                            {currentAssessment.faceMetrics?.tremorScore || 7.2}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task 5: Path Mapper */}
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-sm">Task 5: Path Mapper</h4>
                            <p className="text-xs text-muted">Executive Trail Making & Sequencing</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700">
                          Trail B
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Completion</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task5?.trailBCompletionSec || 44.5}s
                          </span>
                        </div>
                        <div className="bg-warm p-3 rounded-xl">
                          <span className="text-xs text-muted font-bold block uppercase">Errors</span>
                          <span className="text-sm font-semibold text-ink">
                            {taskData.task5?.sequencingErrors ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB CONTENT 3: SCREENING REPORTS                                 */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {assessments.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-2xl border border-line text-muted space-y-4">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <h3 className="text-base font-bold text-slate-800">No Screening Reports Available</h3>
                <p className="text-xs text-muted max-w-md mx-auto mt-1">
                  No screening reports have been generated for this patient yet. Reports are produced automatically upon completion of a screening battery session.
                </p>
              </div>
              <Link
                to={`/doctor/patients/${patient.patientId}/screen`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-2xl text-xs font-bold shadow-card shadow-medical-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Screening Battery</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
              <div className="p-6 border-b border-line flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink font-display">
                    Confidential Clinical Screening Reports ({assessments.length})
                  </h3>
                  <p className="text-xs text-muted">
                    Official clinical documents with domain radar metrics and review sign-off
                  </p>
                </div>
              </div>

              <div className="divide-y divide-line">
                {assessments.map((a: any, idx: number) => (
                  <div key={a.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-warm/50 transition-colors">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-warm text-body">
                          REP-{a.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-muted">
                          Session Date: {new Date(a.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {getReviewBadge(a.reviewStatus)}
                      </div>

                      <div className="flex items-center gap-4 text-xs pt-1">
                        <div>
                          <span className="text-muted">Overall Score: </span>
                          <span className="font-bold text-ink">
                            {a.overallScore === null || a.overallScore === undefined ? 'Not interpretable' : `${Math.round(a.overallScore)}/100`}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Review state: </span>
                          <span className="font-bold text-ink">{String(a.reviewState || 'NOT_REVIEWED').replace(/_/g, ' ').toLowerCase()}</span>
                        </div>
                        {a.reviewedBy && (
                          <div className="text-muted text-xs">
                            Reviewed by: <span className="font-medium text-body">{a.reviewedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <Link
                        to={`/doctor/reports/${a.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold transition-all shadow-card"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Official Report</span>
                      </Link>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </Swap>

    </div>
  );
};
export default DoctorPatientProfilePage;
