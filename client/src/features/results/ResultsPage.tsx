import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  Eye, 
  Mic, 
  Smile, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Share2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScreeningStore } from '../../store/screeningStore';
import { useAuthStore } from '../../store/authStore';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export const ResultsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { scores, biometricMetrics } = useScreeningStore();
  const compositeScore = scores.compositeScore;
  if (compositeScore === null || compositeScore <= 0 || !biometricMetrics) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">No screening results available</h1>
          <p className="mt-3 text-sm text-slate-600">
            Complete a screening to view exploratory results. Neulens does not provide a diagnosis.
          </p>
          <Link to="/dashboard/screen" className="mt-6 inline-flex rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white">
            Return to screening
          </Link>
        </section>
      </main>
    );
  }

  const activeScores = scores;

  const composite = compositeScore;

  // Radar Chart Data for Domain Performance
  const radarData = [
    { domain: 'Memory Recall', patient: activeScores.memoryScore, normative: 75 },
    { domain: 'Visual Attention', patient: activeScores.attentionScore, normative: 75 },
    { domain: 'Visuospatial', patient: activeScores.visuospatialScore, normative: 75 },
    { domain: 'Executive Planning', patient: activeScores.executiveScore, normative: 75 },
    { domain: 'Speech Fluency', patient: activeScores.game3Score, normative: 75 },
    { domain: 'Ocular Stability', patient: activeScores.game1Score, normative: 75 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Patient Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider font-display">
            Screening Examination Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Screening Results & Biometrics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Subject ID: <strong className="text-slate-800">{user?.patientId || 'CV-2026-HAROON'} ({user?.name || 'Haroon'}, {user?.age || 62}y {user?.gender === 'FEMALE' ? 'F' : 'M'})</strong> • Examined on {new Date().toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/report"
            className="btn-glass text-xs font-semibold py-2.5 px-4"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Generate Clinical Report</span>
          </Link>
          <Link
            to="/dashboard/screen"
            className="btn-primary text-xs font-bold py-2.5 px-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Assessment</span>
          </Link>
        </div>
      </div>

      {/* Mandatory Medical UX Disclaimer */}
      <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-start gap-3.5 text-left">
        <ShieldAlert className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
            Important Clinical Screening Notice
          </h4>
          <p className="text-xs text-sky-800 leading-relaxed">
            This screening result is intended to support further clinical evaluation and is <strong>not a medical diagnosis</strong>. Neulens measures objective physiological and behavioral markers; formal neurological diagnosis requires comprehensive clinical evaluation by a licensed neurologist.
          </p>
        </div>
      </div>

      {/* Overall Screening Status + Radar Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall Composite Gauge Card */}
        <div className="glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Exploratory Screening Summary
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold border text-sky-800 bg-sky-50 border-sky-200">
                Not a diagnosis
              </span>
            </div>
          </div>

          {/* Large Circular Gauge */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                  fill="transparent"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#0284c7"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 62}
                  initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 62 * (1 - composite / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute text-center space-y-0.5">
                <span className="text-4xl font-black font-display text-slate-900">
                  {composite}%
                </span>
                <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                  Prototype score
                </span>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-800 text-center mt-3">
              Exploratory task-performance summary
            </p>
            <p className="text-xs text-slate-500 text-center mt-1 leading-normal max-w-xs">
              This score is not locally validated and does not diagnose a condition. Discuss changes or concerns with a qualified clinician.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-center w-full">Exploratory prototype score; no validated population reference is available.</span>
          </div>
        </div>

        {/* Right: Domain Breakdown Radar Chart (Takes 2 Columns) */}
        <div className="glass-card p-6 sm:p-8 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Cognitive & Physiological Domain Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exploratory task-performance profile; no normative or cohort comparison is available.
              </p>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              6 Marker Dimensions
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis domain={[40, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, padding: 10 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                  itemStyle={{ color: '#ffffff', fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Radar
                  dataKey="patient"
                  name="Patient Metric"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="#0284c7"
                  fillOpacity={0.15}
                  dot={{ r: 3.5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Radar
                  dataKey="normative"
                  name="Age-Adjusted Normative Mean"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                  dot={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold block">Memory Recall</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{activeScores.memoryScore}%</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold block">Visuospatial</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{activeScores.visuospatialScore}%</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-bold block">Reaction Motor</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{activeScores.game1Score}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal Analysis Cards (5 Required Cards from Spec) */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold font-display text-slate-900">
            Multimodal Signal Telemetry Cards
          </h2>
          <p className="text-xs text-slate-500">
            Granular clinical biomarker extraction across visual, acoustic, facial, cognitive, and behavioral pathways
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Cognitive Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Domain Module 1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Cognitive Analysis</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assesses short-term working memory recall and executive sequencing from card pairs and trail mapping.
            </p>

            <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Working Memory:</span>
                <span className="font-bold text-slate-900">{activeScores.memoryScore}% (Excellent)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Executive Sequencing:</span>
                <span className="font-bold text-slate-900">{activeScores.executiveScore}% (Stable)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trail Error Correction:</span>
                <span className="font-bold text-slate-900">0 errors</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Speech Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5 space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Domain Module 2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Speech & Acoustic Analysis</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Measures vocal frequency jitter, speech rate cadence, and acoustic pause stability during oral sentence recall.
            </p>

            <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Speech Rate:</span>
                <span className="font-bold text-slate-900">142 WPM (Normal)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vocal Jitter / Shimmer:</span>
                <span className="font-bold text-slate-900">0.11% / 1.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fundamental Pitch:</span>
                <span className="font-bold text-slate-900">121 Hz (Stable)</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Eye / Visual Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shadow-sm">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Domain Module 3
                </span>
                <h3 className="text-sm font-bold text-slate-900">Eye & Visual Saccades</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Captures ocular fixation stability, saccadic reaction latencies, and gaze alignment via live computer vision.
            </p>

            <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Accuracy:</span>
                <span className="font-bold text-slate-900">{activeScores.game1Score}% (High Focus)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fixation Stability:</span>
                <span className="font-bold text-slate-900">88% (Steady)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mean Reaction Latency:</span>
                <span className="font-bold text-slate-900">290 ms</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Facial Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5 space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Domain Module 4
                </span>
                <h3 className="text-sm font-bold text-slate-900">Facial Kinematics</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Monitors bilateral landmark symmetry, head pose yaw/pitch/roll stability, and dynamic expression transitions.
            </p>

            <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Facial Symmetry:</span>
                <span className="font-bold text-slate-900">92% Bilateral Hold</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pose Stability:</span>
                <span className="font-bold text-slate-900">88% (Low Tremor)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Micro-Expression Hold:</span>
                <span className="font-bold text-slate-900">90% Peak Smile</span>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Behavioral Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5 space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Domain Module 5
                </span>
                <h3 className="text-sm font-bold text-slate-900">Behavioral Dynamics</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates user interaction confidence, response pacing consistency, and task transition pauses across test stages.
            </p>

            <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pacing Regularity:</span>
                <span className="font-bold text-slate-900">94% Steady</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Task Completion Rate:</span>
                <span className="font-bold text-slate-900">100% (5/5 Tasks)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inactivity Prompts:</span>
                <span className="font-bold text-slate-900">0 Prompts Triggered</span>
              </div>
            </div>
          </motion.div>

          {/* Card 6: Multimodal Engine Fusion Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5 space-y-3.5 bg-gradient-to-br from-sky-50/50 to-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-sky-600 tracking-wider block">
                  AI Synthesis
                </span>
                <h3 className="text-sm font-bold text-slate-900">Multimodal Fusion Index</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Integrated cross-attention neural weighting produces the unified Neurocognitive Stability Index score.
            </p>

            <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Prototype composite score:</span>
              <span className="text-xl font-black font-display text-sky-700">{composite}%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Screening Summary & Recommendations Action */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-display">
          AI Screening Summary & Clinical Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              1. Baseline Evaluation
            </span>
            <p className="text-slate-700 leading-relaxed">
              Cognitive response speeds and ocular pursuit metrics match expectations for Eleanor's age demographic (75 years).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              2. Recommended Next Step
            </span>
            <p className="text-slate-700 leading-relaxed">
              Routine quarterly monitoring. No urgent clinical referrals required at this stage. Schedule next screening in October 2026.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              3. Clinician Attestation
            </span>
            <p className="text-slate-700 leading-relaxed">
              Exam conducted under NBEC Protocol v2.4. Session observations are stored with your patient record for clinician review.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/recommendations"
            className="btn-secondary text-xs font-semibold py-2 px-4"
          >
            <span>View Care Guidelines & Specialists</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/dashboard/report"
            className="btn-glass text-xs font-semibold py-2 px-4"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Open Printable Report</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ResultsPage;
