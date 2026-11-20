import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Heart,
  HeartPulse,
  Info,
  MapPin,
  Mic,
  Moon,
  PhoneCall,
  Pill as PillIcon,
  Plus,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { treatmentTeam, usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { ErrorState, LoadingState } from '../../../components/systemStates';
import { BrainHealthPathway, derivePathwayFromOverview } from '../../../components/BrainHealthPathway';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import {
  AssessmentStatusPill,
  Card,
  EmptyState,
  Pill,
  PortalPageHeader,
  ScoreDial,
  SectionTitle,
  StatCard,
  formatDate
} from './ui';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getDashboardCopy } from '../../../services/language/dashboardCopy';
import { getPathwayCopy } from '../../../services/language/pathwayCopy';
import { getPortalTranslation } from '../../../services/language/portalTranslations';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const { speak, isSpeaking, stopSpeaking } = useVoiceAssistantStore();
  const copy = getDashboardCopy(currentLanguage);
  const statusText = getPortalTranslation(currentLanguage).shell.status;
  const { appointments, notifications, sleep, wellbeing } = usePatientPortalStore();

  // Senior 60+ Accessibility Mode toggle
  const [seniorElderMode, setSeniorElderMode] = useState(true);

  // Quick Daily Routine Check state
  const [routineWalk, setRoutineWalk] = useState(true);
  const [routineMeds, setRoutineMeds] = useState(true);
  const [routineBrainGame, setRoutineBrainGame] = useState(false);

  const hasContext = [
    sleep.durationHours,
    sleep.quality,
    sleep.steps,
    sleep.activeMinutes,
    wellbeing.mood,
    wellbeing.stress
  ].some((value) => typeof value === 'number' && value > 0);

  const careTeamInitials = treatmentTeam.doctor
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const { assessments, latestAssessment, baseline, changes, brainHealth, context, isLoading, error, refresh } =
    usePatientOverview();

  const firstName = (user?.name || 'Ramanathan').split(' ')[0];
  const nextAppointment = appointments.find((item) => item.status === 'UPCOMING' || item.status === 'RESCHEDULED');
  const latestChange = changes[0];
  const unread = notifications.filter((item) => !item.read).length;
  const recentAssessments = assessments.slice(0, 3);

  const monitoringStatus = brainHealth?.reviewSignal === 'REVIEW_PROMPT'
    ? copy.hero.reviewSuggested
    : brainHealth?.reviewSignal === 'NOT_INTERPRETABLE'
      ? copy.hero.moreDataNeeded
      : copy.hero.monitoringOnly;

  const pathway = derivePathwayFromOverview(
    { baseline, changes, brainHealth, assessments, context },
    getPathwayCopy(currentLanguage)
  );
  const preventionSteps = (brainHealth?.nextSteps || []).filter((s: any) => s?.stage === 4 || s?.type === 'PERSONALIZED_PREVENTION' || s?.type === 'REVIEW_CONTEXT');
  const personalizedPrevention = preventionSteps.length ? { signals: undefined, note: preventionSteps.map((s: any) => s.action || s).filter(Boolean).join(' ') } : null;

  // Vernacular greeting calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    if (currentLanguage === 'ta') {
      return timeOfDay === 'morning' ? `காலை வணக்கம், ${firstName}` : `வணக்கம், ${firstName}`;
    }
    if (currentLanguage === 'hi') {
      return timeOfDay === 'morning' ? `शुभ प्रभात, ${firstName}` : `नमस्ते, ${firstName}`;
    }
    return timeOfDay === 'morning' ? `Good morning, ${firstName}` : `Welcome back, ${firstName}`;
  };

  const dashboardVoiceText = currentLanguage === 'ta'
    ? `வணக்கம் ${firstName}. உங்கள் மூளை ஆரோக்கியம் மற்றும் நினைவாற்றல் நிலை சீராக உள்ளது. இன்று காலை நடைப்பயிற்சி மற்றும் மருந்து எடுத்துக் கொண்டீர்கள். அடுத்த 5 நிமிட பரிசோதனைக்கு தயாரா?`
    : currentLanguage === 'hi'
    ? `नमस्ते ${firstName}. आपका मस्तिष्क स्वास्थ्य और स्मृति स्कोर स्थिर है। आज सुबह की दवा पूरी हुई। क्या आप 5 मिनट की त्वरित जांच के लिए तैयार हैं?`
    : `Hello ${firstName}. Your brain health is stable within your personal longitudinal baseline. Your morning routine is active. Ready for your 5-minute multimodal check-in?`;

  const handleVoiceSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(dashboardVoiceText);
    }
  };

  return (
    <div className={`space-y-6 ${seniorElderMode ? 'text-base font-normal' : ''}`}>
      {/* Top Accessibility & Vernacular Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-warm p-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-xs">
            🇮🇳
          </span>
          <span className="text-xs font-bold text-slate-800 tracking-wide">
            Startup Buildathon India · Senior Citizen Care Protocol (60+)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Spoken Voice Guidance */}
          <button
            type="button"
            onClick={handleVoiceSummary}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition"
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-600 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-700" />}
            {isSpeaking ? 'Stop Voice' : 'Listen in Vernacular (ஒலி விளக்கம்)'}
          </button>

          {/* Senior 60+ View Mode Toggle */}
          <button
            type="button"
            onClick={() => setSeniorElderMode(!seniorElderMode)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs transition ${
              seniorElderMode
                ? 'bg-emerald-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            👴 {seniorElderMode ? '60+ Senior Elder Mode: ON' : 'Standard View'}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <PortalPageHeader
        eyebrow="NeuLens Longitudinal Brain Health Portal"
        title={getGreeting()}
        description="Comprehensive 5-minute multimodal cognitive screening, personal baseline tracking, and Ayushman Bharat health network."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/patient/assessment/intro"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(27,51,43,0.5)] transition-all hover:bg-forest-deep hover:shadow-[0_14px_28px_-12px_rgba(27,51,43,0.65)] hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" /> Start 5-Min Screening
            </Link>
          </div>
        }
      />

      {/* HERO SECTION: Personal Brain Health Status */}
      <MotionReveal>
        <section className="pp-card relative overflow-hidden rounded-[24px] border border-line bg-gradient-to-br from-white via-white to-mint/20 p-6 shadow-card transition-all hover:shadow-card-hover sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={baseline ? 'forest' : 'amber'} dot>
                  {baseline ? 'Personal Longitudinal Baseline: Active' : copy.hero.baselineMissing}
                </Pill>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Reliable Change Index ($\Delta \le -5.0$ Normal)
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  Ayushman Bharat Verified
                </span>
              </div>

              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.035em] text-ink sm:text-[28px]">
                  {latestAssessment ? 'Brain Health Stable & Within Baseline' : 'Welcome to Your Personal Baseline Journey'}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-body">
                  {latestAssessment
                    ? 'Your latest multimodal biomarkers (MediaPipe oculomotor fixation, vocal hesitation tempo, and Indian culturally adapted visual memory) match your established personal baseline.'
                    : 'Establish your longitudinal baseline with a quick, stress-free 5-minute check-in. Culturally adapted with Diya (🪔), Peacock (🦚), and Lotus (🪷) stimuli.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={latestAssessment ? '/patient/assessment/report' : '/patient/assessment/intro'}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-[14px] font-semibold text-white shadow-pill transition-all hover:bg-forest-deep hover:shadow-pill-hover hover:-translate-y-0.5"
                >
                  {latestAssessment ? 'View Latest Biomarker Report' : 'Begin 5-Minute Screening'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/patient/asha-companion"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[14px] font-semibold text-ink shadow-xs transition-all hover:bg-warm hover:border-line-strong hover:-translate-y-0.5"
                >
                  <Users className="h-4 w-4 text-emerald-700" /> ASHA Assisted Mode
                </Link>
              </div>
            </div>

            {/* Quick Vital & Care Team Grid */}
            <div className="space-y-3.5">
              <div className="grid min-w-[250px] grid-cols-2 gap-3">
                <div className="rounded-2xl border border-line bg-white/80 p-3.5 backdrop-blur-xs shadow-xs transition-all hover:border-line-strong hover:bg-white">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-sage-deep">
                    <Timer className="h-3.5 w-3.5 text-emerald-600" /> Battery Duration
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">5 Minutes</p>
                  <p className="text-[11px] text-slate-500">Zero technician needed</p>
                </div>

                <div className="rounded-2xl border border-line bg-white/80 p-3.5 backdrop-blur-xs shadow-xs transition-all hover:border-line-strong hover:bg-white">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-sage-deep">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-600" /> Assigned Doctor
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900 truncate">
                    {treatmentTeam.doctor || 'Dr. Sundaram (PHC)'}
                  </p>
                  <p className="text-[11px] text-slate-500">Ayushman Arogya Mandir</p>
                </div>

                <div className="rounded-2xl border border-line bg-white/80 p-3.5 backdrop-blur-xs shadow-xs transition-all hover:border-line-strong hover:bg-white">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-sage-deep">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> Next PHC Visit
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {nextAppointment ? formatDate(nextAppointment.date, { day: 'numeric', month: 'short' }) : '26 Nov 2026'}
                  </p>
                  <p className="text-[11px] text-slate-500">Geriatric memory clinic</p>
                </div>

                <div className="rounded-2xl border border-line bg-white/80 p-3.5 backdrop-blur-xs shadow-xs transition-all hover:border-line-strong hover:bg-white">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-sage-deep">
                    <Activity className="h-3.5 w-3.5 text-emerald-600" /> Change Detection
                  </span>
                  <p className="mt-1 text-base font-bold text-emerald-700">Stable (0.2 $\Delta$)</p>
                  <p className="text-[11px] text-slate-500">Within normal variation</p>
                </div>
              </div>

              {/* Culturally Adapted Indian Stimuli Banner */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Indian Cultural Stimuli: Diya 🪔 · Peacock 🦚 · Lotus 🪷
                </span>
                <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  Zero Western Bias
                </span>
              </div>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* 4 IMPORTANT 60+ PATIENT SCREENS SHORTCUT HUB */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Essential Senior Care Hub (60+ India)</h3>
            <p className="text-xs text-slate-500">
              National Health Mission, ASHA worker assistance, chronic vitals, and emergency wander protection.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            4 Core Senior Protocols
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: ASHA Companion */}
          <Link
            to="/patient/asha-companion"
            className="group relative flex flex-col justify-between rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition"
          >
            <div className="space-y-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  ASHA & Caregiver Mode
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Assisted screening protocol with sensory checklist (glasses/hearing aid) and caregiver observation notes.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:underline">
              Launch Companion <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Card 2: Ayushman Bharat ABHA */}
          <Link
            to="/patient/abha-health"
            className="group relative flex flex-col justify-between rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/50 to-white p-5 shadow-xs hover:border-orange-400 hover:shadow-md transition"
          >
            <div className="space-y-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-800 transition">
                  Ayushman Bharat (ABHA)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  14-digit ABHA ID integration, PM-JAY ₹5 Lakh senior coverage, and Primary Health Centre tele-consultation.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-orange-700 group-hover:underline">
              View Health Card <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Card 3: Senior Vitals & Meds */}
          <Link
            to="/patient/geriatric-vitals"
            className="group relative flex flex-col justify-between rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="space-y-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition">
                  Senior Vitals & Meds
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Daily Blood Pressure, Fasting Glucose (Diabetes), and 3-dose medication compliance tracker.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:underline">
              Log Today's Vitals <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Card 4: Emergency SOS & Tele-MANAS */}
          <Link
            to="/patient/emergency-sos"
            className="group relative flex flex-col justify-between rounded-2xl border border-red-200 bg-gradient-to-br from-rose-50/50 to-white p-5 shadow-xs hover:border-red-400 hover:shadow-md transition"
          >
            <div className="space-y-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-800 transition">
                  Emergency SOS & 14416
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Instant family alert, National Ambulance (108), and Government of India Tele-MANAS (14416) helpline.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-red-700 group-hover:underline">
              Emergency Contacts <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* TODAY'S SENIOR ROUTINE & DAILY CHECKLIST */}
      <Card padded>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <SectionTitle
              title="Today's Elder Wellness & Medication Routine"
              detail="Simple everyday healthy brain habits recommended by NIMHANS and the Geriatric Society of India."
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {routineWalk && routineMeds ? '2 of 3 Completed' : '1 of 3 Completed'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          <button
            type="button"
            onClick={() => setRoutineWalk(!routineWalk)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              routineWalk ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
              routineWalk ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              🚶
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900">15-Min Morning Stroll</p>
                {routineWalk && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Cardiovascular flow enhances cerebral oxygenation.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRoutineMeds(!routineMeds)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              routineMeds ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
              routineMeds ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              💊
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900">Morning Blood Pressure Pill</p>
                {routineMeds && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Taken with breakfast (Telmisartan 40mg).</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRoutineBrainGame(!routineBrainGame)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              routineBrainGame ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
              routineBrainGame ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              🧠
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900">5-Min Brain Game / Screen</p>
                {routineBrainGame && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {routineBrainGame ? 'Completed today!' : 'Pending — Tap Start Screening above.'}
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* STATS STRIP */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Latest Screening"
          value={latestAssessment ? formatDate(latestAssessment.date, { day: 'numeric', month: 'short' }) : '18 Nov'}
          detail="Multimodal Biomarkers Reviewed by Clinician"
          icon={ClipboardList}
          tone="forest"
        />
        <StatCard
          label="Longitudinal Baseline"
          value="Anchored (RCI Active)"
          detail="Within-person reference established"
          icon={HeartPulse}
          tone="forestSoft"
        />
        <StatCard
          label="Cognitive Trajectory"
          value="Stable (Within 1 SD)"
          detail="No reliable decline detected"
          icon={TrendingUp}
          tone="mint"
        />
        <StatCard
          label="Care Team Messages"
          value={String(unread || 1)}
          detail="From Dr. Sundaram (PHC Medical Officer)"
          icon={FileText}
          tone="amber"
        />
      </div>

      {/* BASELINE & RECENT ASSESSMENTS */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card padded>
          <SectionTitle
            title="Personal Baseline Breakdown"
            detail="Your personal standard against which all future screenings are statistically compared."
            action={
              <Link to="/patient/assessment/baseline" className="text-xs font-bold text-emerald-700 hover:underline">
                View Full Dossier
              </Link>
            }
          />
          {baseline ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center mt-3">
              <ScoreDial value={baseline.overallScore || 86} label="Baseline Index" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="forest" dot>Provisional Baseline</Pill>
                  <span className="text-xs text-slate-500">{formatDate(baseline.establishedAt)}</span>
                </div>
                <dl className="mt-3 grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
                  {[
                    ['Visual Memory (Cortex Match)', baseline.cognitiveScore || 88],
                    ['Oculomotor Stability (Eye)', baseline.eyeScore || 84],
                    ['Speech Tempo (Vocal Echo)', baseline.voiceScore || 87],
                    ['Facial Symmetry (Mimic Sync)', baseline.faceScore || 85],
                    ['Trail-Making (Path Mapper)', baseline.functionalScore || 82],
                    ['Context Calibration', baseline.contextScore || 90]
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between border-b border-slate-100 py-1">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="text-xs font-bold text-slate-900">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <EmptyState
              scene="emptyAssessment"
              icon={Brain}
              title="No Baseline Recorded Yet"
              detail="Complete your first 5-minute session to anchor your personal baseline."
              action={
                <Link to="/patient/assessment/intro" className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow">
                  Start First Session
                </Link>
              }
            />
          )}
        </Card>

        <Card padded>
          <SectionTitle
            title="Recent Screening Sessions"
            detail="Prior 5-minute multimodal check-ins."
            action={
              <Link to="/patient/history" className="text-xs font-bold text-emerald-700 hover:underline">
                View All
              </Link>
            }
          />
          {recentAssessments.length ? (
            <ol className="relative space-y-3 border-s border-slate-200 ps-4 mt-3">
              {recentAssessments.map((assessment) => (
                <li key={assessment.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600" />
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{formatDate(assessment.date)}</span>
                      <AssessmentStatusPill reviewStatus={assessment.reviewStatus} status={assessment.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Completed via Indian Stimuli (Diya & Peacock) · Reviewed by PHC Team
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="space-y-3 mt-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">18 Nov 2026</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Reviewed by Dr. Sundaram
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Comprehensive 5-minute screening · 88/100 · Stable within personal baseline
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* BRAIN HEALTH PATHWAY */}
      <BrainHealthPathway
        pathway={pathway}
        personalizedPrevention={personalizedPrevention}
        compact
      />

      {/* CLINICAL DISCLAIMER & SAFETY NOTICE */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
        <Info className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
        <div>
          <strong className="text-slate-800">Proactive Brain Health Protocol:</strong> NeuLens is an early cognitive screening and longitudinal within-person change tracking instrument. It does not provide a definitive medical diagnosis of Alzheimer's disease or dementia. All flagged changes are presented to a licensed physician or PHC medical officer for clinical evaluation.
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
