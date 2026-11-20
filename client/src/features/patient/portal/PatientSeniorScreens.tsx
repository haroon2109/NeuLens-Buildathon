import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck2,
  Heart,
  HeartPulse,
  Info,
  MapPin,
  Mic,
  PhoneCall,
  Pill as PillIcon,
  Plus,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Volume2,
  VolumeX,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';
import { MotionReveal } from '../../../components/motion/Reveal';
import { seniorScreensCopyByLang } from './seniorScreensCopy';
import {
  Card,
  InfoRow,
  Pill,
  PortalPageHeader,
  SectionTitle,
  StatCard,
  primaryButton,
  secondaryButton
} from './ui';

// ============================================================================
// 1. ASHA WORKER & CAREGIVER COMPANION SCREEN (Elderly 60+ Assisted Mode)
// ============================================================================
export const AshaCompanionPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const { speak, isSpeaking, stopSpeaking } = useVoiceAssistantStore();

  const t = (seniorScreensCopyByLang[currentLanguage] || seniorScreensCopyByLang.en).asha;

  const [glassesReady, setGlassesReady] = useState(true);
  const [hearingAidReady, setHearingAidReady] = useState(true);
  const [quietRoom, setQuietRoom] = useState(true);
  const [morningAlertness, setMorningAlertness] = useState(true);
  const [ashaNotes, setAshaNotes] = useState('Patient is alert and oriented today. Slight hesitation with fine motor grip, recommended audio-guided mode.');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(t.voiceGuidanceText);
    }
  };

  const handleSaveNotes = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <button
            type="button"
            onClick={handleSpeak}
            className={`${secondaryButton} flex items-center gap-2 border-forest/30 bg-mint/50 text-forest hover:bg-mint`}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isSpeaking ? t.stopVoice : t.listenVernacular}
          </button>
        }
      />

      {/* Senior Profile Strip */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white shadow-md text-xl">
              {user?.name ? user.name[0]?.toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{user?.name || 'Ramanathan Swaminathan'}</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  {t.seniorCitizen}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ABHA ID: <span className="font-mono font-medium text-slate-700">91-4402-8821-3091</span> · ASHA Ward: Thanjavur Rural PHC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/patient/assessment/intro"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-800 transition"
            >
              <Activity className="h-4 w-4" />
              {t.startAssisted}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sensory Readiness Checklist */}
        <Card padded>
          <SectionTitle
            title={t.checklistTitle}
            detail={t.checklistDetail}
          />
          <div className="space-y-3 mt-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={glassesReady}
                onChange={(e) => setGlassesReady(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.glassesTitle}</p>
                <p className="text-xs text-slate-500">{t.glassesDesc}</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={hearingAidReady}
                onChange={(e) => setHearingAidReady(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.hearingTitle}</p>
                <p className="text-xs text-slate-500">{t.hearingDesc}</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={quietRoom}
                onChange={(e) => setQuietRoom(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.quietTitle}</p>
                <p className="text-xs text-slate-500">{t.quietDesc}</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={morningAlertness}
                onChange={(e) => setMorningAlertness(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.alertTitle}</p>
                <p className="text-xs text-slate-500">{t.alertDesc}</p>
              </div>
            </label>
          </div>
        </Card>

        {/* ASHA Field Observation Notes */}
        <Card padded>
          <SectionTitle
            title={t.notesTitle}
            detail={t.notesDetail}
          />
          <div className="mt-4 space-y-3">
            <textarea
              rows={5}
              value={ashaNotes}
              onChange={(e) => setAshaNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t.autoSynced}
              </span>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
              >
                {savedMessage ? t.savedSuccess : t.saveNotes}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed flex gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Clinical Protocol:</strong> {t.protocolAlert}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// 2. AYUSHMAN BHARAT (ABHA) DIGITAL HEALTH & PHC LINKAGE SCREEN
// ============================================================================
export const AbhaHealthLinkagePage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const t = (seniorScreensCopyByLang[currentLanguage] || seniorScreensCopyByLang.en).abha;

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');

  const triggerSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => setSyncStatus('synced'), 1800);
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      {/* ABHA Digital Card Mockup */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                {t.govAuthority} · {t.abhaCardTitle}
              </span>
              <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[11px] font-bold text-white">
                {t.activeVerified}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'Ramanathan Swaminathan'}</h2>
              <p className="font-mono text-sm font-semibold text-slate-600 mt-0.5">
                {t.abhaNumLabel}: 91-4402-8821-3091
              </p>
              <p className="text-xs text-slate-500">
                {t.abhaAddrLabel}: <span className="font-medium text-slate-700">ramanathan68@abdm</span> · DOB: 14/05/1958
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-orange-600" /> Thanjavur District Arogya Mandir
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Stethoscope className="h-3.5 w-3.5 text-emerald-700" /> Dr. Priya Sundaram, MO
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <QrCode className="h-24 w-24 text-slate-800" />
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{t.scanAnyPhc}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card padded>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">PHC Network</p>
              <p className="text-sm font-bold text-slate-900">{t.benefit1Title}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            {t.benefit1Desc}
          </p>
        </Card>

        <Card padded>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">PM-JAY Scheme</p>
              <p className="text-sm font-bold text-slate-900">{t.benefit2Title}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            {t.benefit2Desc}
          </p>
        </Card>

        <Card padded>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Family Gateway</p>
              <p className="text-sm font-bold text-slate-900">{t.benefit3Title}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            {t.benefit3Desc}
          </p>
        </Card>
      </div>

      {/* Sync with National Registry */}
      <Card padded>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">{t.benefitsTitle}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.benefit1Desc}
            </p>
          </div>
          <button
            type="button"
            onClick={triggerSync}
            disabled={syncStatus === 'syncing'}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition disabled:opacity-50"
          >
            {syncStatus === 'syncing' ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.syncingBtn}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {t.syncBtn}
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// 3. GERIATRIC VITALS & POLYPHARMACY TRACKER (Diabetes, BP & Routine)
// ============================================================================
export const GeriatricVitalsPage: React.FC = () => {
  const { currentLanguage } = useLanguageStore();
  const t = (seniorScreensCopyByLang[currentLanguage] || seniorScreensCopyByLang.en).vitals;

  const [systolic, setSystolic] = useState('128');
  const [diastolic, setDiastolic] = useState('82');
  const [fastingSugar, setFastingSugar] = useState('110');
  const [morningPillsTaken, setMorningPillsTaken] = useState(true);
  const [afternoonPillsTaken, setAfternoonPillsTaken] = useState(true);
  const [nightPillsTaken, setNightPillsTaken] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(5);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.bpLabel}
          value={`${systolic} / ${diastolic}`}
          detail={t.bpTarget}
          icon={Heart}
          tone="forestSoft"
        />
        <StatCard
          label={t.sugarLabel}
          value={`${fastingSugar} mg/dL`}
          detail={t.sugarTarget}
          icon={Activity}
          tone="forest"
        />
        <StatCard
          label={t.medAdherence}
          value={`${(morningPillsTaken ? 1 : 0) + (afternoonPillsTaken ? 1 : 0) + (nightPillsTaken ? 1 : 0)} / 3`}
          detail={t.medAdherenceDetail}
          icon={PillIcon}
          tone="mint"
        />
        <StatCard
          label={t.habitsLabel}
          value={`${waterGlasses} / 8`}
          detail={t.habitsDetail}
          icon={Activity}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Medication Compliance Schedule */}
        <Card padded>
          <SectionTitle
            title={t.todaySchedule}
            detail={t.tapToMark}
          />
          <div className="space-y-3 mt-4">
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition ${morningPillsTaken ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${morningPillsTaken ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  🌅
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.morningPill}</h4>
                  <p className="text-xs text-slate-500">{t.morningPillDetail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMorningPillsTaken(!morningPillsTaken)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${morningPillsTaken ? 'bg-emerald-700 text-white shadow' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {morningPillsTaken ? `✓ ${t.taken}` : t.pending}
              </button>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition ${afternoonPillsTaken ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${afternoonPillsTaken ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  ☀️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.afternoonPill}</h4>
                  <p className="text-xs text-slate-500">{t.afternoonPillDetail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAfternoonPillsTaken(!afternoonPillsTaken)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${afternoonPillsTaken ? 'bg-emerald-700 text-white shadow' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {afternoonPillsTaken ? `✓ ${t.taken}` : t.pending}
              </button>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition ${nightPillsTaken ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${nightPillsTaken ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  🌙
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.nightPill}</h4>
                  <p className="text-xs text-slate-500">{t.nightPillDetail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNightPillsTaken(!nightPillsTaken)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${nightPillsTaken ? 'bg-emerald-700 text-white shadow' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {nightPillsTaken ? `✓ ${t.taken}` : t.pending}
              </button>
            </div>
          </div>
        </Card>

        {/* Vitals Log Entry Form */}
        <Card padded>
          <SectionTitle
            title={t.logVitals}
            detail={t.logVitalsDetail}
          />
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.systolicLabel}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-base font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-400">mmHg</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.diastolicLabel}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-base font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-400">mmHg</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.fastingSugarLabel}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={fastingSugar}
                  onChange={(e) => setFastingSugar(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-base font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-400">mg/dL</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">{t.hydrationLabel}:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50"
                >
                  -
                </button>
                <span className="font-bold text-sm text-slate-800">{waterGlasses}</span>
                <button
                  type="button"
                  onClick={() => setWaterGlasses(waterGlasses + 1)}
                  className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{t.vitalsNormal}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// 4. EMERGENCY SOS & DEMENTIA WANDER ALERT SCREEN (India Tele-MANAS / 108)
// ============================================================================
export const EmergencySosPage: React.FC = () => {
  const { currentLanguage } = useLanguageStore();
  const t = (seniorScreensCopyByLang[currentLanguage] || seniorScreensCopyByLang.en).sos;

  const [sosSent, setSosSent] = useState(false);

  const triggerSos = () => {
    setSosSent(true);
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      {/* Primary SOS Action Card */}
      <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-rose-50 to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg animate-pulse">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.sosHeading}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {t.sosSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={triggerSos}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-8 py-4 text-base font-black text-white shadow-xl hover:bg-red-700 transition active:scale-95"
          >
            <PhoneCall className="h-5 w-5" />
            {sosSent ? t.sosTriggered : t.sosTriggerBtn}
          </button>

          {sosSent && (
            <div className="rounded-xl border border-red-300 bg-red-100/80 px-4 py-2.5 text-xs font-semibold text-red-900 animate-fade-in">
              {t.sosDispatched}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tele-MANAS */}
        <Card padded>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t.teleManasTitle}</h4>
              <p className="text-xs text-purple-700 font-bold">{t.teleManasNum}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            {t.teleManasDesc}
          </p>
          <a
            href="tel:14416"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
          >
            {t.teleManasCall} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Card>

        {/* 108 Emergency Ambulance */}
        <Card padded>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700 font-bold">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t.ambulanceTitle}</h4>
              <p className="text-xs text-red-700 font-bold">{t.ambulanceNum}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            {t.ambulanceDesc}
          </p>
          <a
            href="tel:108"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline"
          >
            {t.ambulanceCall} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Card>

        {/* Family Caregiver Proxy */}
        <Card padded>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t.caregiverTitle}</h4>
              <p className="text-xs text-blue-700 font-bold">{t.caregiverNum}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            {t.caregiverDesc}
          </p>
          <a
            href="tel:+919840123456"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
          >
            {t.caregiverCall} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Card>
      </div>
    </div>
  );
};
