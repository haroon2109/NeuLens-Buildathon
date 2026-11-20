import React from 'react';
import { Eye, ShieldAlert, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpokenInstructionBannerProps {
  icon?: string;
  stepNumber: number;
  totalSteps?: number;
  taskTitle: string;
  heading: string;
  subtitle: string;
  whatToDo?: string;
  whatNotToDo?: string;
  whereToLook?: string;
  nextTaskPreview?: string;
}

export const SpokenInstructionBanner: React.FC<SpokenInstructionBannerProps> = ({
  icon = '👁️ ➔ 📷',
  stepNumber,
  totalSteps = 5,
  taskTitle,
  heading,
  subtitle,
  whatToDo,
  whatNotToDo,
  whereToLook,
  nextTaskPreview
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-r from-health-gray-900 via-health-gray-950 to-health-gray-900 border border-health-blue border-opacity-30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-health-blue bg-opacity-5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: "Where am I?" & Step Tracker */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white border-opacity-10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-health-blue-light font-display">
            Where Am I?
          </span>
          <span className="text-health-gray-500">•</span>
          <span className="text-xs font-bold text-white">
            Task {stepNumber} of {totalSteps}: {taskTitle}
          </span>
        </div>

        {nextTaskPreview && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-health-gray-400 bg-health-gray-900 px-2.5 py-1 rounded-full border border-health-gray-800">
            <span>What's Next:</span>
            <span className="text-health-teal">{nextTaskPreview}</span>
            <ArrowRight className="w-3 h-3 text-health-teal" />
          </div>
        )}
      </div>

      {/* Primary Visual Command: Icon + Large Typography */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Large High-Contrast Icon Pill */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-health-blue bg-opacity-15 border-2 border-health-blue border-opacity-40 flex items-center justify-center shrink-0 shadow-healthRing">
          <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Task Action">
            {icon}
          </span>
        </div>

        {/* Big Action Instruction */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide uppercase leading-tight">
            {heading}
          </h2>
          <p className="text-sm sm:text-base text-health-gray-300 font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Structured Guidelines: What To Do, What NOT To Do, Where to Look */}
      {(whatToDo || whatNotToDo || whereToLook) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white border-opacity-10 text-xs">
          {whatToDo && (
            <div className="p-3 bg-health-gray-950 bg-opacity-70 rounded-xl border border-health-teal border-opacity-20 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-health-teal shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-health-teal uppercase block tracking-wider">
                  What To Do
                </span>
                <span className="text-health-gray-200 font-medium leading-normal mt-0.5 block">
                  {whatToDo}
                </span>
              </div>
            </div>
          )}

          {whatNotToDo && (
            <div className="p-3 bg-health-gray-950 bg-opacity-70 rounded-xl border border-red-500 border-opacity-20 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-red-400 uppercase block tracking-wider">
                  What NOT To Do
                </span>
                <span className="text-health-gray-200 font-medium leading-normal mt-0.5 block">
                  {whatNotToDo}
                </span>
              </div>
            </div>
          )}

          {whereToLook && (
            <div className="p-3 bg-health-gray-950 bg-opacity-70 rounded-xl border border-health-blue border-opacity-20 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-health-blue-light shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-health-blue-light uppercase block tracking-wider">
                  Where To Look
                </span>
                <span className="text-health-gray-200 font-medium leading-normal mt-0.5 block">
                  {whereToLook}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
