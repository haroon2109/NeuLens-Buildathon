import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Cpu, 
  Hospital, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Globe2, 
  Award, 
  Microscope, 
  CheckCircle2, 
  ArrowUpRight,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HealthcareScene } from '../../components/illustrations/HealthcareScene';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Hero / Vision Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-xs font-bold uppercase tracking-wider text-sky-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About Neulens</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 tracking-tight leading-tight">
          AI-Powered Multimodal{' '}
          <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
            Neurological Screening
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
          Designed to make early cognitive assessment and neurodegenerative risk detection fast, non-invasive, accessible, and scalable across healthcare systems.
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <HealthcareScene
          kind="aboutTeam"
          className="w-full"
          title="Healthcare professionals and technology working together to support older adults"
        />
      </div>

      {/* The 3 Elegant Information Cards (Inspired by Reference) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Technology */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8 flex flex-col justify-between space-y-5 hover:border-sky-300 transition-all group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block font-display">
              Core Architecture
            </span>

            <h3 className="text-xl font-bold font-display text-slate-900">
              Multimodal AI Engine
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fuses high-frequency ocular gaze tracking, acoustic speech analysis, facial micro-kinematics, and executive task dynamics into a unified cognitive stability index.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Edge-computed MediaPipe Vision</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Real-time Web Audio Analysers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Multilingual voice synthesis & STT</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Deployment */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 sm:p-8 flex flex-col justify-between space-y-5 hover:border-sky-300 transition-all group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
              <Hospital className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block font-display">
              Clinical Deployment
            </span>

            <h3 className="text-xl font-bold font-display text-slate-900">
              Hospitals • Clinics • Care Teams
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Deployable across primary care OPDs, memory clinics, community health centers, and remote patient assessments with zero specialized hardware.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tablet, Desktop & Browser Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Under 5-minute screening turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Elderly-first accessible user interface</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Platform */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 sm:p-8 flex flex-col justify-between space-y-5 hover:border-sky-300 transition-all group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block font-display">
              Platform Vision
            </span>

            <h3 className="text-xl font-bold font-display text-slate-900">
              Early Neurological Detection
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Enables proactive identification of baseline cognitive drifts years before noticeable functional decline, supporting early intervention and timely neurological care.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Objective quantitative metric indices</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Direct neurologist referral pathways</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Role-based clinical access with recorded access logs</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Multimodal Differentiation Deep Dive */}
      <div className="glass-card p-6 sm:p-10 space-y-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider font-display">
            The Scientific Foundation
          </span>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Why Multimodal Screening Surpasses Single-Test Approaches
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Traditional cognitive evaluations rely on paper surveys (e.g. MMSE or MoCA) prone to cultural bias, anxiety skew, and educational disparities. Neulens measures involuntary neuro-physiological responses simultaneously:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-lg">👁️</span>
            <h4 className="text-sm font-bold text-slate-900">Oculomotor Saccades</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Involuntary eye fixation jitter and pursuit latency correlate strongly with early fronto-parietal decay.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-lg">🎤</span>
            <h4 className="text-sm font-bold text-slate-900">Acoustic Prosody</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vocal pitch variance, jitter, and silence ratio reflect subtle motor control and linguistic retrieval delays.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-lg">🙂</span>
            <h4 className="text-sm font-bold text-slate-900">Facial Bilateralism</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              468 landmark facial mesh tracking captures micro-asymmetry and involuntary motor tremors.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-lg">🧠</span>
            <h4 className="text-sm font-bold text-slate-900">Working Memory</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Interactive spatial search and trail tracing measure executive planning and processing speed.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical AI & Clinical Disclaimers */}
      <div className="p-6 bg-slate-100/80 border border-slate-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Ethical AI & Clinical Governance
            </h4>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Neulens is an exploratory screening and monitoring prototype, not a diagnostic or risk-prediction tool. It can surface changes for qualified clinician review; its tasks have not been locally validated across age, education, language, culture, or accessibility groups.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/screen"
          className="btn-primary text-xs font-bold py-3 px-6 whitespace-nowrap shadow-pill"
        >
          Try Assessment
        </Link>
      </div>
    </div>
  );
};
export default AboutPage;
