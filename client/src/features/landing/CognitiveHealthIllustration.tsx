import type { FC } from 'react';
import { AudioLines, Check, ClipboardList, Eye, ScanFace, ShieldCheck } from 'lucide-react';

import { HealthcareScene } from '../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../components/motion/Reveal';

const items = [
  { icon: Eye, label: 'Eye movement', note: 'Gaze and fixation observations' },
  { icon: AudioLines, label: 'Voice', note: 'Speech and acoustic observations' },
  { icon: ScanFace, label: 'Facial movement', note: 'Guided behavioural observations' },
  { icon: ClipboardList, label: 'Cognitive tasks', note: 'Memory, attention, executive function' },
];

export const CognitiveHealthIllustration: FC = () => (
  <div className="relative w-full overflow-hidden">
    <MotionReveal>
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(47,94,78,0.28)] sm:p-8">
        <HealthcareScene
          kind="heroCare"
          className="w-full max-w-[42rem]"
          title="Doctor and elderly adults reviewing brain-health observations"
        />

        <div className="mt-4 flex flex-col gap-3">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border 0 bg-mist px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-forest">
            Multimodal, clinician-guided screening
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(({ icon: Icon, label, note }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-forest">
                  <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="block text-xs leading-5 text-slate-500">{note}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MotionReveal>
  </div>
);

export default CognitiveHealthIllustration;
