import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  Home, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  User, 
  Lock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatDate, formatTime } from './portal/ui';
import { deploymentConfig } from '../../config/deployment';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { ClinicalIllustration } from '../../components/ClinicalIllustration';
import { patientApi } from '../../services/portalApi';
import { useScreeningCopy } from '../screening/screeningCopy';

export const PatientCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const copy = useScreeningCopy();
  const { user, logout } = useAuthStore();
  const [cardData, setCardData] = useState<any | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // Fetch real patient confirmation card data from the backend
    patientApi.getConfirmationCard()
      .then(res => setCardData(res))
      .catch(() => {
        // Fallback using authenticated user session
        if (user) {
          setCardData({
            patientId: user.patientId || '',
            patientName: user.name || 'Valued Patient',
            registeredDate: new Date(),
            language: user.language || 'en',
            hospitalName: deploymentConfig.isConfigured ? deploymentConfig.clinicName : 'Your clinic',
            instructions: 'Present this Patient ID card to hospital staff or during your follow-up clinical appointments.'
          });
        }
      });
  }, [user]);

  const displayId = cardData?.patientId || user?.patientId || '—';
  const displayName = cardData?.patientName || user?.name || 'Valued Patient';
  const completionDate = formatDate(new Date(), { month: 'long', day: 'numeric', year: 'numeric' });
  const completionTime = formatTime(new Date());

  const handleDownloadConfirmation = () => {
    // Generate clean printable / downloadable text confirmation slip
    const slipText = `=====================================================
COGNIVISION AI HOSPITAL SCREENING CENTER
OFFICIAL PATIENT ID CONFIRMATION SLIP
=====================================================

Patient ID:       ${displayId}
Patient Name:     ${displayName}
Date of Session:  ${completionDate} at ${completionTime}
Status:           Screening Assessment Completed

INSTRUCTIONS FOR PATIENT:
1. Please keep this confirmation slip for your records.
2. Present this Patient ID (${displayId}) when checking in
   with hospital reception or your attending physician.
3. Your assessment responses have been securely transmitted
   for licensed medical review.

NeuLens screening session — patient confirmation
Not a diagnosis. Screening support for clinician review.
=====================================================`;

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Neulens-Confirmation-${displayId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleReturnHome = () => {
    logout();
    navigate('/patient');
  };

  return (
    <div className="min-h-screen bg-warm text-slate-800 flex flex-col justify-between py-12 px-6 selection:bg-medical-500 selection:text-white">
      
      <main className="max-w-xl mx-auto w-full space-y-6">
        
        {/* ------------------------------------------------------------- */}
        {/* SUCCESS CARD                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white border border-line rounded-2xl p-8 sm:p-10 shadow-card text-center space-y-6">
          
          <ClinicalIllustration variant="complete" size="compact" className="mx-auto" />

          {/* Heading & Friendly Message */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-ink">{copy.completion.title}</h1>
            <p className="text-base text-body max-w-md mx-auto leading-relaxed">{copy.completion.thanks}</p>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* CONFIRMATION ID DISPLAY (Printable)                         */}
          {/* ----------------------------------------------------------- */}
          <div className="bg-warm border-2 border-line rounded-2xl p-6 text-start space-y-4 print:border-slate-800 print:bg-white">
            
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <NeuLensLogo height="h-8" />
                  <span className="text-xs text-muted font-medium">{copy.completion.badge}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {copy.completion.badge}
              </span>
            </div>

            {/* Big Patient ID */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                {copy.completion.identifierLabel}
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-black text-medical-700 tracking-wider">
                {displayId}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-line">
              <div>
                <span className="text-muted font-medium block">{copy.completion.nameLabel}</span>
                <span className="font-bold text-slate-800">{displayName}</span>
              </div>
              <div>
                <span className="text-muted font-medium block">{copy.completion.dateLabel}</span>
                <span className="font-bold text-slate-800">{completionDate}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-line rounded-xl text-xs text-body leading-relaxed flex items-start gap-2">
              <Lock className="w-4 h-4 text-medical-600 shrink-0 mt-0.5" />
              <span>{copy.completion.keepNote}</span>
            </div>

          </div>

          {/* ----------------------------------------------------------- */}
          {/* ACTION BUTTONS (Large, Clear Touch Targets)                 */}
          {/* ----------------------------------------------------------- */}
          <div className="space-y-3 pt-2">
            
            {/* Download / Print Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadConfirmation}
                className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-card"
              >
                <Download className="w-4 h-4 text-body" />
                <span>{downloadSuccess ? copy.completion.downloaded : copy.completion.download}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintSlip}
                className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-card"
              >
                <Printer className="w-4 h-4 text-body" />
                <span>{copy.completion.print}</span>
              </button>
            </div>

            {/* Return to Home Button */}
            <button
              type="button"
              onClick={handleReturnHome}
              className="w-full py-4 px-6 bg-medical-600 hover:bg-medical-700 active:scale-[0.99] text-white text-base font-bold rounded-2xl shadow-md shadow-medical-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>{copy.completion.returnHome}</span>
            </button>
          </div>

          <div className="text-xs text-muted flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{copy.completion.confidential}</span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted mt-8">
        NeuLens &bull; Screening support, not a diagnosis
      </footer>

    </div>
  );
};