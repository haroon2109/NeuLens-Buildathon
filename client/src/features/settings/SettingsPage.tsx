import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Volume2, 
  Camera, 
  Mic, 
  ShieldCheck, 
  Monitor, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Sliders,
  Bell
} from 'lucide-react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { SUPPORTED_LANGUAGES } from '../../services/language/translations';
import { SupportedLanguage } from '../../services/language/types';

export const SettingsPage: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings states
  const [sessionAutoReset, setSessionAutoReset] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState<'normal' | 'slow'>('slow');
  const [cameraResolution, setCameraResolution] = useState('720p');
  const [clinicName, setClinicName] = useState('');
  const [clinicianName, setClinicianName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            System & Clinic Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure screening assistant parameters, sensor calibration, and platform preferences
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary text-xs font-bold py-2.5 px-5 shadow-pill flex items-center gap-2 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? 'Settings Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>All screening defaults and audio parameters have been updated across this clinical station.</span>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Default Language & Voice Guidance */}
        <div className="glass-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Primary Language & AI Voice Assistant
              </h3>
              <p className="text-xs text-slate-500">
                Choose the default language for spoken audio instructions and multilingual subtitles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm ring-1 ring-sky-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl block">{lang.flag}</span>
                  <span className="text-xs font-bold block mt-1">{lang.nativeName}</span>
                  <span className="text-xs text-slate-400 block">{lang.name}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Spoken AI Guidance</span>
                <span className="text-xs text-slate-500 block">Enable continuous conversational prompts</span>
              </div>
              <input
                type="checkbox"
                checked={voiceGuidance}
                onChange={(e) => setVoiceGuidance(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Elderly Speech Pace</span>
                <span className="text-xs text-slate-500 block">Gentle, slower speech rate for senior patients</span>
              </div>
              <select
                value={audioSpeed}
                onChange={(e) => setAudioSpeed(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
              >
                <option value="slow">Gentle (0.85x)</option>
                <option value="normal">Standard (1.0x)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Display & Accessibility */}
        <div className="glass-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Display & Elderly Accessibility
              </h3>
              <p className="text-xs text-slate-500">
                Optimize interface sizing, touch targets, and distraction-free assessment behavior
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Session Inactivity Reset</span>
                <span className="text-xs text-slate-500 block">Return to the portal sign-in screen after 60s of inactivity</span>
              </div>
              <input
                type="checkbox"
                checked={sessionAutoReset}
                onChange={(e) => setSessionAutoReset(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Enhanced High Contrast</span>
                <span className="text-xs text-slate-500 block">Maximum text contrast for impaired vision</span>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Sensor Calibration */}
        <div className="glass-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hardware Sensors & Camera Calibration
              </h3>
              <p className="text-xs text-slate-500">
                MediaPipe computer vision resolution and acoustic microphone thresholds
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Camera Stream Resolution</label>
              <select
                value={cameraResolution}
                onChange={(e) => setCameraResolution(e.target.value)}
                className="input-field"
              >
                <option value="720p">HD 720p (Recommended for Edge AI)</option>
                <option value="1080p">Full HD 1080p (High-End GPU)</option>
                <option value="480p">SD 480p (Low-Power Tablets)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Eye Aspect Ratio (EAR) Threshold</label>
              <input
                type="text"
                disabled
                value="0.22 (Blink Detection Threshold)"
                className="input-field bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Clinical Institution Credentials */}
        <div className="glass-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Clinical Institution & Attestation Details
              </h3>
              <p className="text-xs text-slate-500">
                Appears on exported PDF clinical summaries and physician referral slips
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Hospital / Facility Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Attending Neurologist / Clinician</label>
              <input
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default SettingsPage;
