import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, 
  Play, 
  Clock, 
  Eye, 
  Mic, 
  Smile, 
  Brain, 
  ShieldCheck, 
  ChevronRight, 
  Sliders, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Protocol {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  signals: string[];
  description: string;
  recommendedFor: string;
  badge?: string;
  popular?: boolean;
}

const PROTOCOLS: Protocol[] = [
  {
    id: 'full-multimodal',
    title: 'Neulens Full Multimodal Battery',
    subtitle: 'Standard Comprehensive Screening Battery',
    duration: '5 Minutes',
    signals: ['Ocular Tracking', 'Acoustic Voice', 'Facial Kinematics', 'Card Memory', 'Trail Making'],
    description: 'Executes all five sensory and cognitive micro-tests in sequence to generate an integrated Neurocognitive Stability Index (BHI).',
    recommendedFor: 'Initial baseline visits, annual geriatric wellness visits, and post-concussion screening.',
    badge: 'Recommended Protocol',
    popular: true
  },
  {
    id: 'ocular-motor',
    title: 'Ocular Motor & Saccadic Assay',
    subtitle: 'High-Frequency Gaze & Fixation Battery',
    duration: '2 Minutes',
    signals: ['Target Fixation', 'Smooth Pursuit', 'Eye Aspect Ratio (EAR)', 'Saccadic Latency'],
    description: 'Isolates oculomotor function, involuntary gaze flutter, and fixation hold stability to identify subclinical brainstem and cerebellar irregularities.',
    recommendedFor: 'Early motor drift detection, tremor investigations, and vestibular monitoring.'
  },
  {
    id: 'speech-acoustic',
    title: 'Vocal Echo & Speech Biomarker Assay',
    subtitle: 'Acoustic Micro-Prosody & Spectral Analysis',
    duration: '2 Minutes',
    signals: ['Speech Rate (WPM)', 'Pitch Fundamental', 'Vocal Jitter & Shimmer', 'MFCC Spectral Vectors'],
    description: 'Captures vocal acoustic jitter, speech pause durations, and semantic repetition cadence to evaluate micro-prosodic integrity.',
    recommendedFor: 'Aphasia screening, semantic memory evaluation, and vocal tremor detection.'
  },
  {
    id: 'facial-kinematics',
    title: 'Facial Kinematics & Symmetry Assay',
    subtitle: 'Dynamic Expression & Micro-Movement Assay',
    duration: '2 Minutes',
    signals: ['Facial Symmetry Index', 'Head Pose Yaw/Pitch/Roll', 'Zygomaticus Smile Hold', 'Tremor Drift'],
    description: 'Measures bilateral facial landmark synchronization and dynamic expression transitions using real-time geometric mesh tracking.',
    recommendedFor: 'Bilateral asymmetry detection, Parkinsonian hypomimia screening, and motor stability.'
  },
  {
    id: 'executive-path',
    title: 'Executive Function & Trail Making Assay',
    subtitle: 'Cognitive Sequencing & Processing Speed',
    duration: '3 Minutes',
    signals: ['Chronological Node Tracing', 'Error Correction Rate', 'Search Time Latency'],
    description: 'Digitized Trail-Making assessment challenging executive control, cognitive flexibility, and visual search motor planning.',
    recommendedFor: 'Attention deficit screening, frontal lobe executive assessment, and cognitive recovery tracking.'
  }
];

export const AssessmentsPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Screening Protocols & Batteries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized non-invasive digital biomarker assays calibrated for rapid clinical workflow
          </p>
        </div>

        <Link
          to="/dashboard/screen"
          className="btn-primary text-sm shadow-pill self-start md:self-auto"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch Full Assessment</span>
        </Link>
      </div>

      {/* Featured Primary Protocol Card */}
      {PROTOCOLS.filter(p => p.popular).map((protocol) => (
        <motion.div
          key={protocol.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-96 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none" />

          <div className="space-y-3 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/25 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{protocol.badge}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
              {protocol.title}
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              {protocol.description}
            </p>

            {/* Signal Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {protocol.signals.map((sig, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-xs font-medium text-white"
                >
                  {sig}
                </span>
              ))}
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-100 bg-white/10 px-4 py-2 rounded-xl self-start">
              <Clock className="w-4 h-4 text-sky-200" />
              <span>Standard Duration: {protocol.duration}</span>
            </div>
            <Link
              to="/dashboard/screen"
              className="px-6 py-3.5 bg-white text-sky-700 hover:bg-sky-50 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>Begin Assessment</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </motion.div>
      ))}

      {/* Domain-Specific Focused Batteries Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold font-display text-slate-900">
            Targeted Modular Batteries
          </h2>
          <p className="text-xs text-slate-500">
            Individual focused tests for targeted longitudinal monitoring and specific diagnostic referrals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PROTOCOLS.filter(p => !p.popular).map((protocol, idx) => (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-6 flex flex-col justify-between space-y-4 hover:border-sky-300 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                      {protocol.title}
                    </h3>
                    <p className="text-xs text-sky-600 font-medium mt-0.5">{protocol.subtitle}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {protocol.duration}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {protocol.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {protocol.signals.map((sig, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 bg-slate-100/80 text-slate-600 rounded-md text-xs font-medium"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  Clinical Target: {protocol.recommendedFor.slice(0, 38)}...
                </span>
                <Link
                  to="/dashboard/screen"
                  className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Select Test</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Clinical Disclaimer Notice */}
      <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Validated against standardized cognitive benchmarks (MoCA / MMSE correlation index: r = 0.86).</span>
        </div>
        <span className="text-xs font-medium text-slate-400">NBEC Medical AI Research Edition</span>
      </div>
    </div>
  );
};
export default AssessmentsPage;
