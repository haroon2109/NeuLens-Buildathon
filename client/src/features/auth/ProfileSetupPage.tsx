import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Activity, 
  GraduationCap, 
  Stethoscope, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  ShieldCheck 
} from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  primaryLanguage: string;
  educationYears: number;
  handedness: 'LEFT' | 'RIGHT' | 'AMBIDEXTROUS';
  medicalHistory: {
    hypertension: boolean;
    diabetes: boolean;
    headInjury: boolean;
    hearingLoss: boolean;
    sleepApnea: boolean;
    cardiovascularDisease: boolean;
  };
  familyHistory: {
    alzheimers: boolean;
    dementia: boolean;
    parkinsons: boolean;
    stroke: boolean;
  };
}

export const ProfileSetupPage: React.FC = () => {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    gender: 'MALE',
    primaryLanguage: 'English',
    educationYears: 12,
    handedness: 'RIGHT',
    medicalHistory: {
      hypertension: false,
      diabetes: false,
      headInjury: false,
      hearingLoss: false,
      sleepApnea: false,
      cardiovascularDisease: false,
    },
    familyHistory: {
      alzheimers: false,
      dementia: false,
      parkinsons: false,
      stroke: false,
    }
  });

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleToggleMedical = (key: keyof ProfileData['medicalHistory']) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [key]: !prev.medicalHistory[key]
      }
    }));
  };

  const handleToggleFamily = (key: keyof ProfileData['familyHistory']) => {
    setFormData(prev => ({
      ...prev,
      familyHistory: {
        ...prev.familyHistory,
        [key]: !prev.familyHistory[key]
      }
    }));
  };

  const handleSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (user) {
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        profile: {
          gender: formData.gender,
          primaryLanguage: formData.primaryLanguage,
          educationYears: formData.educationYears,
          handedness: formData.handedness,
          medicalHistory: formData.medicalHistory,
          familyHistory: formData.familyHistory,
        }
      };
      login(updatedUser);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-8 space-y-6 shadow-card relative overflow-hidden">

        {/* Progress Bar Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span className="uppercase tracking-wider">Step {step} of {totalSteps}</span>
            <span className="text-medical-600 font-bold">{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-medical-600 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard step animation boundaries */}
        <div className="min-h-[300px] flex flex-col justify-between py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* STEP 1: Basic Demographics */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-medical-600" />
                      Core Demographic Details
                    </h2>
                    <p className="text-xs text-slate-500">Verify basic profile identifiers for clinical screening calibration</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">First Name</label>
                      <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Last Name</label>
                      <input 
                        type="text" 
                        value={formData.lastName}
                        onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Biological Gender</label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other / Non-Binary</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Primary Language</label>
                      <input 
                        type="text" 
                        value={formData.primaryLanguage}
                        onChange={e => setFormData(prev => ({ ...prev, primaryLanguage: e.target.value }))}
                        placeholder="e.g. English"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Physical/Cognitive Parameters */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      Demographic Modifiers
                    </h2>
                    <p className="text-xs text-slate-500">Education curves shape raw cognitive scores and adjust normative scoring bounds</p>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-bold">Years of Formal Education</span>
                      <span className="font-bold text-medical-600 font-display">{formData.educationYears} years</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="25" 
                      value={formData.educationYears}
                      onChange={e => setFormData(prev => ({ ...prev, educationYears: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-medical-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-semibold">
                      <span>0 yrs (None)</span>
                      <span>12 yrs (High School)</span>
                      <span>16 yrs (Bachelor)</span>
                      <span>22+ yrs (Doctoral)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Handedness (Motor Control)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['RIGHT', 'LEFT', 'AMBIDEXTROUS'] as const).map((hand) => (
                        <button
                          key={hand}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, handedness: hand }))}
                          className={`py-3 px-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            formData.handedness === hand
                              ? 'bg-medical-50 border-medical-500 text-medical-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {hand.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Medical History */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-amber-600" />
                      Cardiovascular & Neurological History
                    </h2>
                    <p className="text-xs text-slate-500">Vascular health markers correlate with cognitive performance metrics</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formData.medicalHistory).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleToggleMedical(key as any)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          val 
                            ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Heart className={`w-4 h-4 shrink-0 ${val ? 'fill-amber-600 text-amber-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Family History */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-medical-600" />
                      Family Neurological History
                    </h2>
                    <p className="text-xs text-slate-500">First-degree genetic conditions relating to neurological and memory health</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formData.familyHistory).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleToggleFamily(key as any)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          val 
                            ? 'bg-medical-50/80 border-medical-300 text-medical-900 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Activity className={`w-4 h-4 shrink-0 ${val ? 'text-medical-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action controls */}
          <div className="flex gap-4 border-t border-slate-100 pt-6 mt-6">
            {step > 1 && (
              <button 
                type="button" 
                onClick={handleBack} 
                className="btn-secondary flex-1 py-3 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            {step < totalSteps ? (
              <button 
                type="button" 
                onClick={handleNext} 
                className="btn-primary flex-1 py-3 font-bold text-xs rounded-2xl shadow-pill flex items-center justify-center gap-1.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit} 
                className="btn-primary flex-1 py-3 font-bold text-xs rounded-2xl shadow-pill flex items-center justify-center gap-1.5"
              >
                Complete Setup
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Data-use statement */}
        <div className="pt-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your information is used only for your cognitive screening record</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfileSetupPage;
