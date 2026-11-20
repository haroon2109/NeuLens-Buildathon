import React from 'react';
import { ShieldAlert, HeartHandshake, Phone, Mail, MapPin, ExternalLink, Calendar, Sparkles, Brain, Moon, Footprints, Apple } from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const specialists: Array<{
    name: string;
    specialty: string;
    clinic: string;
    distance: string;
    phone: string;
    email: string;
    address: string;
    availability: string;
  }> = [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-medical-50 border border-medical-200 text-medical-600 flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Care Recommendations & Clinical Pathways</h1>
            <p className="text-xs text-slate-500">Neurology consultant referrals, memory clinics, and evidence-based neuro-maintenance</p>
          </div>
        </div>
      </div>

      {/* Warning Alert Banner */}
      <div className="p-5 bg-amber-50/90 border border-amber-200/80 rounded-3xl flex gap-4 text-left shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Clinical Advisory & Scope Notice</h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            Neulens screening outputs provide quantitative cognitive indices and risk categorizations to assist clinical triage. They do NOT constitute a medical diagnosis of dementia, Alzheimer's disease, or cerebrovascular pathology. Formal neurological diagnosis requires in-person medical evaluation by a licensed physician.
          </p>
        </div>
      </div>

      {/* Neurologists Referral Directory */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Specialist Clinical Care Directory</h3>
          <p className="text-xs text-slate-500">Accredited memory clinics and cognitive neurology centers accepting referral transfers</p>
        </div>

        {specialists.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-slate-700">No specialist referrals currently listed</p>
            <p className="text-xs text-slate-500 mt-1">Specialist directory listings are configured by your clinical organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialists.map((doc, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-card hover:shadow-card-hover transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-3 py-1 bg-medical-50 text-medical-700 border border-medical-200 rounded-full font-bold uppercase tracking-wider">
                      Partner Network
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{doc.distance}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-display">{doc.name}</h4>
                    <p className="text-xs text-medical-600 font-semibold mt-0.5">{doc.specialty}</p>
                    <p className="text-xs text-slate-500">{doc.clinic}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-medical-600 shrink-0" />
                    <span>{doc.availability}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.email}</span>
                  </p>
                </div>

                <button className="w-full btn-primary text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-pill">
                  Request Clinical Referral
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Care Instructions Guidelines */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-card">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Daily Neuro-Maintenance Guidelines</h3>
          <p className="text-xs text-slate-500">Clinically supported lifestyle interventions to enhance brain resilience and cognitive reserve</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-medical-50 border border-medical-200 text-medical-600 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900">Cognitive Engagement</h5>
            <p className="text-slate-500 leading-relaxed">Engage in dual-task challenges, spatial puzzles, and language drills for 15–20 minutes daily.</p>
          </div>

          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900">Sleep Architecture</h5>
            <p className="text-slate-500 leading-relaxed">Prioritize 7–8 hours of consistent sleep. Glymphatic clearance during deep sleep removes metabolic waste.</p>
          </div>

          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900">Aerobic Vascular Pulse</h5>
            <p className="text-slate-500 leading-relaxed">30 minutes of brisk walking or cycling promotes Brain-Derived Neurotrophic Factor (BDNF) synthesis.</p>
          </div>

          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Apple className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900">Mediterranean Nutrition</h5>
            <p className="text-slate-500 leading-relaxed">Incorporate omega-3 fatty acids, polyphenol-rich berries, leafy greens, and lean proteins for brain health.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};
export default RecommendationsPage;
