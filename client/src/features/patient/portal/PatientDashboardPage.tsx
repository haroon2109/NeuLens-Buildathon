import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
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
  Sparkles,
  Stethoscope,
  Timer,
  UserCheck,
  Users,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { treatmentTeam, usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { MotionReveal } from '../../../components/motion/Reveal';
import {
  Card,
  Pill,
  PortalPageHeader,
  SectionTitle,
  formatDate
} from './ui';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const { speak, isSpeaking, stopSpeaking } = useVoiceAssistantStore();
  const { appointments } = usePatientPortalStore();
  const { latestAssessment, baseline } = usePatientOverview();

  // Simple daily routine toggles for elderly patients
  const [morningWalk, setMorningWalk] = useState(true);
  const [morningMeds, setMorningMeds] = useState(true);
  const [waterGlasses, setWaterGlasses] = useState(true);

  const firstName = (user?.name || 'Swaminathan').split(' ')[0];
  const nextAppointment = appointments.find((item) => item.status === 'UPCOMING' || item.status === 'RESCHEDULED');

  // Friendly vernacular greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    if (currentLanguage === 'ta') {
      return timeOfDay === 'morning' ? `காலை வணக்கம், ${firstName} அய்யா` : `வணக்கம், ${firstName} அய்யா`;
    }
    if (currentLanguage === 'hi') {
      return timeOfDay === 'morning' ? `शुभ प्रभात, ${firstName} जी` : `नमस्ते, ${firstName} जी`;
    }
    return timeOfDay === 'morning' ? `Good morning, ${firstName}` : `Welcome back, ${firstName}`;
  };

  // Elder-friendly spoken voice text
  const dashboardVoiceText = currentLanguage === 'ta'
    ? `வணக்கம் ${firstName} அய்யா. உங்கள் நினைவாற்றல் மற்றும் உடல்நலம் மிகவும் நன்றாக உள்ளது. எந்த கவலையும் வேண்டாம். உங்கள் மருத்துவர் மற்றும் குடும்பத்தினருடன் இணைக்கப்பட்டுள்ளீர்கள். இன்றைய மாத்திரை மற்றும் 5 நிமிட நினைவாற்றல் விளையாட்டை செய்ய கீழே உள்ள பட்டனை தொடவும்.`
    : currentLanguage === 'hi'
    ? `नमस्ते ${firstName} जी। आपका स्वास्थ्य और याददाश्त बिल्कुल सामान्य और अच्छी है। चिंता की कोई बात नहीं। आज की दवा और 5 मिनट की त्वरित मस्तिष्क जांच के लिए नीचे दिए गए हरे बटन को दबाएं।`
    : `Hello ${firstName}. Your brain health is completely stable and healthy. No need to worry. Your doctor and family are linked with you. Tap the green button below for your quick 5-minute memory check-in.`;

  const handleVoiceSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(dashboardVoiceText);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. TOP COMFORT BAR: Audio Reading & Elder Assurance */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-lg shadow-xs">
            👴
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Senior Citizen Comfort View · பெரியவர்களுக்கான எளிய வடிவம்
            </h3>
            <p className="text-xs text-slate-500">
              Clear large buttons, spoken vernacular voice, and zero confusing medical jargon.
            </p>
          </div>
        </div>

        {/* Big Spoken Audio Button */}
        <button
          type="button"
          onClick={handleVoiceSummary}
          className="flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 transition active:scale-95"
        >
          {isSpeaking ? <VolumeX className="h-5 w-5 text-rose-600 animate-pulse" /> : <Volume2 className="h-5 w-5 text-emerald-700" />}
          {isSpeaking ? 'Stop Voice (நிறுத்து)' : '🔊 Listen Out Loud (ஒலி வடிவில் கேட்க)'}
        </button>
      </div>

      {/* 2. MAIN REASSURING HERO CARD: "All is Well" Reassurance */}
      <MotionReveal>
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 p-6 sm:p-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All is Normal · நினைவாற்றல் சீராக உள்ளது
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Ayushman Bharat Linked
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {getGreeting()}
              </h1>

              <p className="text-base text-slate-700 leading-relaxed">
                Your brain health, memory recall, and reflexes are completely healthy and matching your normal baseline. No signs of unexpected decline.
              </p>

              {/* Doctor Reassurance Quote */}
              <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-xs sm:text-sm text-slate-700 flex items-start gap-3 shadow-xs">
                <Stethoscope className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-bold">Doctor's Clinical Note:</strong> "Patient Ramanathan is active and oriented. Eyesight tracking and speech tempo are well preserved. Recommended to continue routine morning walks and memory activities."
                  <div className="mt-1 text-[11px] text-slate-500 font-medium">
                    — {treatmentTeam.doctor || 'Dr. Priya Sundaram (PHC Medical Officer)'} · 18 Nov 2026
                  </div>
                </div>
              </div>

              {/* PRIMARY GIANT SCREENING BUTTON */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/patient/assessment/intro"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-700 px-8 py-4 text-base font-black text-white shadow-lg hover:bg-emerald-800 transition active:scale-95"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Start 5-Minute Check-in (பரிசோதனை)</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>Stimuli:</span>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                    Diya 🪔 · Peacock 🦚 · Lotus 🪷
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Status Pill Dial */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/90 p-6 text-center shadow-xs min-w-[220px]">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-3xl shadow-inner border-4 border-emerald-200">
                88
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">Health Index</p>
              <p className="text-xs text-emerald-700 font-semibold">Healthy Geriatric Range</p>
              <div className="mt-3 w-full border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                Last checked: 18 Nov 2026
              </div>
            </div>
          </div>
        </div>
      </MotionReveal>

      {/* 3. ONLY THE IMPORTANT PATIENT SCREENS (4 Core Touch Cards) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Important Elder Care Screens · முக்கிய பக்கங்கள்
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Only the 4 essential screens you and your family need. Tap any card below.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1: ASHA & Caregiver Mode */}
          <Link
            to="/patient/asha-companion"
            className="group flex flex-col justify-between rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md text-2xl font-bold">
                  🤝
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  Family / ASHA Help
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  ASHA & Caregiver Assisted Mode
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  ஆஷா பணியாளர் அல்லது குடும்ப பராமரிப்பாளர் உதவி. Pre-check glasses, hearing aid, and caregiver notes.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-emerald-700 group-hover:underline">
              Open ASHA Companion <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 2: Ayushman Bharat ABHA Health Card */}
          <Link
            to="/patient/abha-health"
            className="group flex flex-col justify-between rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/70 to-white p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md text-2xl font-bold">
                  🪪
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                  Govt PM-JAY Cover
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-800 transition">
                  Ayushman Bharat (ABHA) & PHC Network
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  ஆயுஷ்மான் பாரத் அட்டை. 14-digit ABHA ID, ₹5 Lakh senior health coverage, and local health centre.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-orange-700 group-hover:underline">
              View My Health Card <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 3: Senior Vitals & Daily Medicine Tracker */}
          <Link
            to="/patient/geriatric-vitals"
            className="group flex flex-col justify-between rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md text-2xl font-bold">
                  💊
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  BP: 128/82 mmHg
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-800 transition">
                  Daily Medicines & Blood Pressure Tracker
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  மாத்திரைகள் & ரத்த அழுத்தம். Mark morning, afternoon, and night doses with large easy touch buttons.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-blue-700 group-hover:underline">
              Open Vitals & Meds <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 4: Emergency SOS & Tele-MANAS */}
          <Link
            to="/patient/emergency-sos"
            className="group flex flex-col justify-between rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50/70 to-white p-6 shadow-sm hover:border-red-500 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md text-2xl font-bold">
                  🚨
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                  Dial 14416 / 108
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-800 transition">
                  Emergency 1-Tap SOS & Family Alert
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  அவசர உதவி. 1-touch immediate alert with GPS location to son/daughter, PHC ambulance, and Tele-MANAS.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-red-700 group-hover:underline">
              Emergency Contacts <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4. TODAY'S 3 SIMPLE HEALTH HABITS (No confusing charts!) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Today's 3 Simple Healthy Habits · இன்றைய எளிய பழக்கங்கள்
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tap to mark complete. Good habits keep memory sharp and blood pressure normal.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          <button
            type="button"
            onClick={() => setMorningWalk(!morningWalk)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
              morningWalk ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">🚶</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">15-Min Stroll</h4>
                {morningWalk && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">காலை நடைப்பயிற்சி</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMorningMeds(!morningMeds)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
              morningMeds ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">💊</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">Morning Dose</h4>
                {morningMeds && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">காலை மாத்திரை எடுத்தேன்</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setWaterGlasses(!waterGlasses)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
              waterGlasses ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">💧</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">Water Glasses</h4>
                {waterGlasses && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">போதுமான தண்ணீர்</p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. FAMILY & DOCTOR DIRECT CONTACT STRIP */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-xl">
            👨‍⚕️
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Primary Health Centre: {treatmentTeam.doctor || 'Dr. Priya Sundaram'}
            </h4>
            <p className="text-xs text-slate-500">
              Family Caregiver: Karthik (Son: +91 98401 23456) · Thanjavur PHC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+919840123456"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs transition"
          >
            <PhoneCall className="h-4 w-4 text-emerald-700" /> Call Son (மகன்)
          </a>
          <Link
            to="/patient/appointments"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition"
          >
            <CalendarDays className="h-4 w-4 text-emerald-400" /> PHC Appointments
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
