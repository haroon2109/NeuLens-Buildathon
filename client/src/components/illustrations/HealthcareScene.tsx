import React from 'react';
import {
  NL,
  Margaret,
  Harold,
  Doctor,
  Caregiver,
  Chair,
  Sofa,
  Desk,
  Monitor,
  Plant,
  WindowPane,
  ChartCard,
  SpeechMic,
  CameraFrame,
  LifeIcon,
  Ground,
  Tree,
  Sun,
  Bed,
  SleepingHead,
  RoundTable,
  Cup,
} from './cast';

export type SceneKind =
  | 'heroCare'
  | 'aboutTeam'
  | 'howItWorks'
  | 'contact'
  | 'patientHome'
  | 'registration'
  | 'caregiverAssist'
  | 'profile'
  | 'consent'
  | 'assessmentIntro'
  | 'cognitive'
  | 'eyeTracking'
  | 'voice'
  | 'facial'
  | 'assessmentComplete'
  | 'timeline'
  | 'contextLifestyle'
  | 'functional'
  | 'prevention'
  | 'followup'
  | 'doctorDashboard'
  | 'patientManagement'
  | 'clinicalReview'
  | 'longitudinal'
  | 'contextReview'
  | 'report'
  | 'referral'
  | 'quality'
  | 'emptyAssessment'
  | 'emptyAppointments'
  | 'emptyNotifications'
  | 'emptySearch'
  | 'errorCalm'
  | 'logout'
  | 'tabletIndependent'
  | 'manWithDoctor'
  | 'explainResults'
  | 'cognitiveAssessment'
  | 'memoryActivity'
  | 'attentionActivity'
  | 'walkingOutdoors'
  | 'sleeping'
  | 'social'
  | 'caregiverSupport';

/** Scenes where measurement is in progress: keep every character perfectly still. */
const STATIC_SCENES: SceneKind[] = [
  'cognitive',
  'eyeTracking',
  'voice',
  'facial',
  'memoryActivity',
  'attentionActivity',
  'cognitiveAssessment'
];

type Props = {
  kind: SceneKind;
  className?: string;
  title?: string;
  /** Ambient motion only. Static artwork is always the fallback. */
  animated?: boolean;
};

const Backdrop: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={NL.mintSoft} />
      <stop offset="100%" stopColor={NL.white} />
    </linearGradient>
    <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={NL.mint} stopOpacity="0.4" />
      <stop offset="100%" stopColor={NL.mint} stopOpacity="0" />
    </linearGradient>
  </defs>
);

/** Room framing shared by every scene: soft wall wash and a quiet floor. */
const Room: React.FC<{ id: string; animated: boolean }> = ({ id, animated }) => (
  <>
    <rect x="0" y="0" width="400" height="260" rx="24" fill={`url(#${id}-bg)`} />
    <rect x="24" y="196" width="352" height="64" rx="18" fill={`url(#${id}-floor)`} />
    <circle cx="336" cy="46" r="54" fill={NL.mint} opacity="0.4" className={animated ? 'nl-scene-drift' : undefined} />
    <circle cx="58" cy="196" r="42" fill={NL.sage} opacity="0.12" className={animated ? 'nl-scene-drift-slow' : undefined} />
    <path d="M24 168c36-18 76-18 116 0" stroke={NL.sage} strokeWidth="1.4" fill="none" opacity="0.2" />
  </>
);

const WallCards: React.FC = () => (
  <g opacity="0.9">
    <rect x="292" y="70" width="62" height="76" rx="9" fill={NL.white} stroke={NL.greyLight} />
    <rect x="302" y="82" width="28" height="4" rx="2" fill={NL.sageDark} opacity="0.7" />
    <rect x="302" y="92" width="42" height="3" rx="1.5" fill={NL.greyLight} />
    <rect x="302" y="100" width="36" height="3" rx="1.5" fill={NL.greyLight} />
    <rect x="302" y="112" width="20" height="10" rx="3" fill={NL.mint} />
    <rect x="326" y="112" width="16" height="10" rx="3" fill={NL.mintSoft} />
    <rect x="302" y="128" width="30" height="4" rx="2" fill={NL.sage} opacity="0.35" />
  </g>
);

const FormCard: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width="70" height="54" rx="7" fill={NL.white} stroke={NL.greyLight} />
    <rect x="10" y="12" width="30" height="3.4" rx="1.7" fill={NL.sageDark} opacity="0.7" />
    <rect x="10" y="22" width="50" height="3" rx="1.5" fill={NL.greyLight} />
    <rect x="10" y="30" width="42" height="3" rx="1.5" fill={NL.greyLight} />
    <rect x="10" y="38" width="46" height="3" rx="1.5" fill={NL.greyLight} />
    <circle cx="57" cy="14" r="6" fill={NL.mint} />
    <path d="M54 14l2.2 2.2 4-4.4" stroke={NL.sageDeep} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const ShieldCard: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width="64" height="44" rx="9" fill={NL.white} stroke={NL.greyLight} />
    <path d="M22 12l10 3v8c0 7-5 11-10 13-5-2-10-6-10-13v-8z" fill={NL.mint} stroke={NL.sageDeep} strokeWidth="1.5" />
    <path d="M18 24l3.4 3.4L27 22" stroke={NL.sageDeep} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="38" y="16" width="18" height="3" rx="1.5" fill={NL.sageDark} opacity="0.65" />
    <rect x="38" y="24" width="14" height="3" rx="1.5" fill={NL.greyLight} />
  </g>
);

const BellCard: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width="76" height="64" rx="12" fill={NL.white} stroke={NL.greyLight} />
    <path d="M38 16a10 10 0 00-10 10v9l-4 6h28l-4-6v-9a10 10 0 00-10-10z" fill={NL.mint} />
    <path d="M38 16a10 10 0 00-10 10v9l-4 6h28l-4-6v-9a10 10 0 00-10-10z" stroke={NL.sageDeep} strokeWidth="1.8" fill="none" />
    <circle cx="38" cy="46" r="3" fill={NL.sageDeep} />
  </g>
);

const SearchCard: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width="62" height="74" rx="8" fill={NL.white} stroke={NL.greyLight} />
    <rect x="12" y="14" width="26" height="4" rx="2" fill={NL.sageDark} opacity="0.6" />
    <rect x="12" y="24" width="38" height="3" rx="1.5" fill={NL.greyLight} />
    <rect x="12" y="32" width="30" height="3" rx="1.5" fill={NL.greyLight} />
    <rect x="12" y="40" width="34" height="3" rx="1.5" fill={NL.greyLight} />
    <circle cx="46" cy="48" r="14" fill={NL.mintSoft} stroke={NL.sageDeep} strokeWidth="2.6" />
    <path d="M56 58l9 9" stroke={NL.sageDeep} strokeWidth="2.8" strokeLinecap="round" />
  </g>
);

const TaskCards: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width="38" height="38" rx="9" fill={NL.white} stroke={NL.sage} />
    <circle cx="19" cy="19" r="7" fill={NL.sage} opacity="0.7" />
    <rect x="44" y="0" width="38" height="38" rx="9" fill={NL.white} stroke={NL.greyLight} />
    <rect x="54" y="12" width="18" height="4" rx="2" fill={NL.sage} opacity="0.6" />
    <rect x="54" y="21" width="13" height="4" rx="2" fill={NL.sage} opacity="0.45" />
    <rect x="0" y="44" width="38" height="38" rx="9" fill={NL.white} stroke={NL.greyLight} />
    <path d="M10 70l9-12 9 12" stroke={NL.sageDeep} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <rect x="44" y="44" width="38" height="38" rx="9" fill={NL.mint} stroke={NL.sage} />
    <path d="M55 63l6 6 11-13" stroke={NL.sageDeep} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const LeafCard: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width="58" height="42" rx="9" fill={NL.white} stroke={NL.greyLight} />
    <path d="M22 28c-2-10 6-15 16-16-1 10-6 16-16 16z" fill={NL.mint} stroke={NL.sageDeep} strokeWidth="1.5" />
    <path d="M20 31c4-7 8-11 14-14" stroke={NL.sageDeep} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="38" y="16" width="12" height="3" rx="1.5" fill={NL.sageDark} opacity="0.6" />
    <rect x="38" y="23" width="9" height="3" rx="1.5" fill={NL.greyLight} />
  </g>
);

const ReportSheet: React.FC<{ x: number; y: number; w?: number; h?: number }> = ({ x, y, w = 128, h = 106 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width={w} height={h} rx="9" fill={NL.white} stroke={NL.greyLight} />
    <rect x="14" y="14" width={w * 0.44} height="5" rx="2.5" fill={NL.forest} opacity="0.7" />
    <rect x="14" y="27" width={w - 30} height="3.4" rx="1.7" fill={NL.greyLight} />
    <rect x="14" y="35" width={w - 44} height="3.4" rx="1.7" fill={NL.greyLight} />
    <rect x="14" y="49" width="10" height="24" rx="2" fill={NL.sage} />
    <rect x="28" y="42" width="10" height="31" rx="2" fill={NL.sageDark} />
    <rect x="42" y="52" width="10" height="21" rx="2" fill={NL.sage} />
    <rect x="56" y="46" width="10" height="27" rx="2" fill={NL.forest} opacity="0.65" />
    <path d={`M78 72c8-12 16-4 24-16 4-6 10-6 12-10`} stroke={NL.sageDeep} strokeWidth="2" fill="none" strokeLinecap="round" />
    <rect x="14" y={h - 18} width={w - 40} height="3.4" rx="1.7" fill={NL.greyLight} />
  </g>
);

const Doorway: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x="0" y="0" width="66" height="120" rx="10" fill={NL.cream} stroke={NL.greyLight} />
    <rect x="8" y="8" width="50" height="104" rx="6" fill="#F2FAF6" />
    <path d="M8 108h50" stroke={NL.greyLight} strokeWidth="2" />
    <rect x="42" y="58" width="12" height="3.6" rx="1.8" fill={NL.sageDark} />
    <rect x="-6" y="118" width="78" height="5" rx="2.5" fill={NL.greyLight} />
  </g>
);

const ClinicianTable: React.FC<{ x: number; y: number; chart?: boolean }> = ({ x, y, chart = true }) => (
  <>
    <Desk x={x} y={y} width={120} />
    <Monitor x={x - 42} y={y - 74} w={68} h={44} chart={chart} />
    <rect x={x + 8} y={y - 32} width="40" height="24" rx="3" fill={NL.white} stroke={NL.greyLight} />
    <rect x={x + 14} y={y - 26} width="20" height="2.6" rx="1.3" fill={NL.sage} />
    <rect x={x + 14} y={y - 20} width="26" height="2.6" rx="1.3" fill={NL.greyLight} />
  </>
);

const SceneSvg: React.FC<{ kind: SceneKind; id: string; animated: boolean }> = ({ kind, id, animated }) => {
  const room = <Room id={id} animated={animated} />;

  switch (kind) {
    /* ------------------------------------------------ public-facing pages */
    case 'heroCare':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={236} y={54} w={92} h={74} />
          <Plant x={82} y={212} scale={1.05} />
          <Ground y={216} width={168} />
          <Margaret x={186} y={214} scale={1.04} />
          <Harold x={240} y={216} scale={1.0} facing="left" />
          <Doctor x={314} y={212} scale={1.06} tablet />
          <ChartCard x={58} y={104} w={72} h={54} variant="check" />
        </svg>
      );
    case 'aboutTeam':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={42} y={54} w={82} h={68} />
          <WallCards />
          <Ground y={218} width={172} />
          <Doctor x={112} y={214} scale={0.94} facing="right" gesture />
          <Caregiver x={178} y={216} scale={0.92} facing="left" />
          <Margaret x={254} y={216} scale={0.92} facing="left" />
          <Harold x={308} y={218} scale={0.9} facing="left" />
        </svg>
      );
    case 'howItWorks':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <path d="M70 86h260" stroke={NL.sage} strokeWidth="2" strokeDasharray="5 6" fill="none" opacity="0.7" />
          {[
            { x: 70, label: '1' },
            { x: 135, label: '2' },
            { x: 200, label: '3' },
            { x: 265, label: '4' },
            { x: 330, label: '5' },
          ].map(({ x, label }) => (
            <g key={label}>
              <circle cx={x} cy="86" r="17" fill={NL.white} stroke={NL.sage} strokeWidth="1.6" />
              <text x={x} y="91" textAnchor="middle" fontSize="12" fontWeight="700" fill={NL.forest} fontFamily="system-ui, sans-serif">
                {label}
              </text>
            </g>
          ))}
          <g opacity="0.95">
            <ChartCard x={24} y={112} w={70} h={48} variant="bars" />
            <ShieldCard x={334} y={106} />
          </g>
          <Plant x={44} y={222} scale={0.8} />
          <Ground y={228} width={190} />
          <Margaret x={122} y={224} scale={0.86} />
          <Harold x={166} y={226} scale={0.84} facing="left" />
          <Doctor x={266} y={224} scale={0.86} facing="left" gesture />
          <Caregiver x={320} y={226} scale={0.82} facing="left" />
        </svg>
      );
    case 'contact':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={48} y={50} w={84} h={70} />
          <WallCards />
          <Plant x={352} y={218} scale={0.95} />
          <Ground y={220} width={150} />
          <Doctor x={268} y={214} scale={1.0} facing="left" gesture />
          <FormCard x={36} y={96} />
          <Margaret x={134} y={220} scale={0.9} />
          <Harold x={176} y={222} scale={0.88} facing="left" />
        </svg>
      );

    /* ------------------------------------------------------ patient portal */
    case 'patientHome':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={52} y={52} w={80} h={66} />
          <Plant x={338} y={212} scale={1.1} />
          <Sofa x={158} y={202} scale={1.08} />
          <Margaret x={150} y={202} scale={1.0} seated tablet />
          <Harold x={246} y={214} scale={0.9} facing="left" />
          <ChartCard x={54} y={128} w={62} h={46} variant="check" />
        </svg>
      );
    case 'registration':
    case 'caregiverAssist':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={252} y={54} w={84} h={68} />
          <Chair x={130} y={200} />
          <Ground y={208} width={160} />
          <Margaret x={130} y={200} scale={1.0} seated />
          <Caregiver x={216} y={212} scale={1.02} facing="left" gesture />
          <Harold x={292} y={216} scale={0.92} facing="left" />
          <FormCard x={40} y={96} />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Plant x={56} y={214} scale={1.05} />
          <Ground y={218} width={150} />
          <Margaret x={190} y={216} scale={1.1} />
          <Harold x={288} y={218} scale={1.0} facing="left" />
          <ChartCard x={44} y={84} w={82} h={62} variant="line" />
          <ShieldCard x={304} y={68} />
        </svg>
      );
    case 'consent':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WallCards />
          <Ground y={218} width={172} />
          <Margaret x={148} y={214} scale={1.0} />
          <Harold x={200} y={216} scale={0.96} facing="left" />
          <Doctor x={292} y={212} scale={1.02} facing="left" gesture />
          <ShieldCard x={44} y={104} />
        </svg>
      );
    case 'assessmentIntro':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={48} y={54} w={78} h={64} />
          <Plant x={322} y={212} scale={1.05} />
          <Chair x={172} y={202} />
          <Ground y={210} width={156} />
          <Margaret x={172} y={202} scale={1.04} seated />
          <FormCard x={300} y={88} />
        </svg>
      );
    case 'cognitive':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Chair x={124} y={200} />
          <Ground y={208} width={130} />
          <Margaret x={124} y={200} scale={1.0} seated />
          <TaskCards x={216} y={78} />
          <rect x="196" y="176" width="34" height="22" rx="3" fill={NL.white} stroke={NL.greyLight} />
          <path d="M202 190l6-8 5 6 4-5 6 7" stroke={NL.sageDark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'eyeTracking':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <CameraFrame x={236} y={84} w={102} h={72} />
          <Chair x={124} y={202} />
          <Ground y={210} width={130} />
          <Margaret x={124} y={202} scale={1.0} seated gesture />
          <path d="M188 120c14-14 28-16 40-10" stroke={NL.sageDark} strokeWidth="1.6" strokeDasharray="3 5" fill="none" opacity="0.7" />
          <circle cx="190" cy="120" r="3" fill={NL.sageDeep} opacity="0.7" />
        </svg>
      );
    case 'voice':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Chair x={124} y={202} />
          <Ground y={210} width={130} />
          <Margaret x={124} y={202} scale={1.0} seated gesture />
          <SpeechMic x={238} y={132} />
          <path d="M253 164v44" stroke={NL.grey} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="239" y="206" width="28" height="4" rx="2" fill={NL.greyLight} />
          <g stroke={NL.sage} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.75">
            <path d="M298 152v-16M308 158v-28M318 150v-12M328 156v-24" />
          </g>
        </svg>
      );
    case 'facial':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <CameraFrame x={112} y={42} w={176} h={150} />
          <Ground y={216} width={140} />
          <Margaret x={200} y={208} scale={1.12} />
          <g stroke={NL.sageDark} strokeWidth="2" fill="none" opacity="0.75">
            <path d="M74 84v-14h14M326 70h14v14M74 176v14h14M340 176v14h-14" />
          </g>
        </svg>
      );
    case 'assessmentComplete':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={40} y={52} w={78} h={64} />
          <Ground y={218} width={176} />
          <Margaret x={148} y={214} scale={1.0} />
          <Harold x={200} y={216} scale={0.96} facing="left" />
          <Doctor x={292} y={212} scale={1.02} facing="left" tablet />
          <ChartCard x={54} y={126} w={70} h={52} variant="check" />
        </svg>
      );
    case 'timeline':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <ChartCard x={108} y={36} w={184} h={80} variant="line" />
          <Ground y={228} width={160} />
          <Margaret x={132} y={224} scale={0.88} />
          <Harold x={178} y={226} scale={0.86} facing="left" />
          <Doctor x={282} y={222} scale={0.9} facing="left" gesture />
        </svg>
      );
    case 'contextLifestyle':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <LifeIcon x={74} y={62} kind="sleep" />
          <LifeIcon x={150} y={62} kind="activity" />
          <LifeIcon x={226} y={62} kind="nutrition" />
          <LifeIcon x={302} y={62} kind="social" />
          <Ground y={226} width={146} />
          <Margaret x={176} y={222} scale={0.92} />
          <Harold x={222} y={224} scale={0.9} facing="left" />
          <Caregiver x={312} y={224} scale={0.82} facing="left" gesture />
        </svg>
      );
    case 'functional':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <rect x="244" y="150" width="86" height="8" rx="4" fill="#E3D7C5" />
          <rect x="254" y="158" width="6" height="60" rx="3" fill="#D8CAB6" />
          <rect x="314" y="158" width="6" height="60" rx="3" fill="#D8CAB6" />
          <rect x="266" y="128" width="42" height="22" rx="4" fill={NL.white} stroke={NL.greyLight} />
          <path d="M274 135h9M274 141h17" stroke={NL.sage} strokeWidth="1.8" strokeLinecap="round" />
          <Plant x={374} y={212} scale={0.7} />
          <Ground y={218} width={160} />
          <Margaret x={128} y={214} scale={1.04} cane />
          <Harold x={200} y={216} scale={0.94} facing="left" />
        </svg>
      );
    case 'prevention':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WallCards />
          <LeafCard x={64} y={92} />
          <LeafCard x={64} y={144} />
          <Ground y={218} width={172} />
          <Margaret x={162} y={214} scale={1.0} />
          <Harold x={212} y={216} scale={0.96} facing="left" />
          <Doctor x={298} y={212} scale={1.02} facing="left" tablet />
        </svg>
      );
    case 'followup':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={48} y={54} w={80} h={64} />
          <Chair x={152} y={202} />
          <Chair x={286} y={202} />
          <Ground y={210} width={180} />
          <Margaret x={152} y={202} scale={1.0} seated />
          <Doctor x={288} y={202} scale={0.98} facing="left" seated gesture />
          <g>
            <rect x="202" y="170" width="44" height="7" rx="3.5" fill={NL.white} stroke={NL.greyLight} />
            <rect x="210" y="177" width="3" height="33" rx="1.5" fill={NL.greyLight} />
            <rect x="234" y="177" width="3" height="33" rx="1.5" fill={NL.greyLight} />
          </g>
          <ChartCard x={302} y={50} w={76} h={56} variant="line" />
        </svg>
      );

    /* ------------------------------------------------------- doctor portal */
    case 'doctorDashboard':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <ClinicianTable x={276} y={198} />
          <Plant x={44} y={212} scale={1.05} />
          <Ground y={218} width={158} />
          <Doctor x={148} y={214} scale={1.05} facing="right" />
          <ChartCard x={48} y={84} w={78} h={58} variant="bars" />
          <FormCard x={300} y={108} />
        </svg>
      );
    case 'patientManagement':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Ground y={218} width={160} />
          <Doctor x={124} y={214} scale={1.02} facing="right" />
          <g>
            <rect x="214" y="70" width="118" height="102" rx="10" fill={NL.white} stroke={NL.greyLight} />
            {[0, 1, 2].map((row) => (
              <g key={row}>
                <circle cx="234" cy={92 + row * 28} r="9" fill={row === 0 ? NL.mint : NL.mintSoft} stroke={NL.sage} strokeWidth="1.2" />
                <rect x="250" y={86 + row * 28} width="46" height="3.6" rx="1.8" fill={NL.sageDark} opacity="0.6" />
                <rect x="250" y={94 + row * 28} width="62" height="3" rx="1.5" fill={NL.greyLight} />
              </g>
            ))}
          </g>
          <Plant x={358} y={212} scale={0.85} />
        </svg>
      );
    case 'clinicalReview':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <ReportSheet x={196} y={66} w={140} h={112} />
          <Ground y={222} width={170} />
          <Doctor x={112} y={216} scale={1.02} facing="right" gesture />
          <Margaret x={332} y={222} scale={0.94} facing="left" />
          <ChartCard x={44} y={92} w={62} h={48} variant="check" />
        </svg>
      );
    case 'longitudinal':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <ChartCard x={132} y={52} w={156} h={74} variant="line" />
          <Chair x={126} y={202} />
          <Chair x={296} y={202} />
          <Ground y={210} width={182} />
          <Margaret x={126} y={202} scale={0.98} seated />
          <Doctor x={298} y={202} scale={0.96} facing="left" seated gesture />
          <path d="M186 160c14-8 28-8 42-2" stroke={NL.sageDark} strokeWidth="1.6" strokeDasharray="3 5" fill="none" opacity="0.65" />
        </svg>
      );
    case 'contextReview':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <LifeIcon x={44} y={84} kind="activity" />
          <LifeIcon x={44} y={134} kind="sleep" />
          <Ground y={218} width={170} />
          <Doctor x={132} y={214} scale={1.02} facing="right" gesture />
          <Harold x={236} y={216} scale={1.0} facing="left" />
          <ChartCard x={296} y={82} w={78} h={58} variant="line" />
        </svg>
      );
    case 'report':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <ReportSheet x={206} y={58} w={136} h={120} />
          <Ground y={222} width={160} />
          <Doctor x={122} y={216} scale={1.04} facing="right" />
          <Plant x={364} y={216} scale={0.8} />
        </svg>
      );
    case 'referral':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Ground y={220} width={180} />
          <Doctor x={136} y={214} scale={1.0} facing="right" gesture />
          <Doctor x={278} y={214} scale={1.0} facing="left" gesture />
          <path d="M176 138c16-12 32-12 48 0" stroke={NL.sageDark} strokeWidth="1.8" strokeDasharray="4 5" fill="none" opacity="0.7" />
          <g transform="translate(172,86)">
            <rect width="56" height="40" rx="8" fill={NL.white} stroke={NL.greyLight} />
            <path d="M16 12h10l4 5h12v14H16z" fill={NL.mint} stroke={NL.sage} strokeWidth="1.2" />
          </g>
        </svg>
      );
    case 'quality':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <g>
            <rect x="170" y="54" width="176" height="116" rx="10" fill={NL.white} stroke={NL.greyLight} />
            <rect x="186" y="70" width="52" height="4" rx="2" fill={NL.forest} opacity="0.6" />
            {[0.42, 0.7, 0.52, 0.86, 0.64, 0.78].map((ratio, index) => (
              <rect key={index} x={188 + index * 24} y={152 - ratio * 58} width="14" height={ratio * 58} rx="3" fill={index % 2 ? NL.sage : NL.sageDark} opacity="0.9" />
            ))}
            <path d="M188 126c24-14 52 10 78-14 20-18 42-6 66-18" stroke={NL.forest} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
          </g>
          <Ground y={222} width={170} />
          <Doctor x={98} y={216} scale={1.0} facing="right" />
          <Caregiver x={314} y={222} scale={0.94} facing="left" />
        </svg>
      );

    /* ------------------------------------------- empty states and utility */
    case 'emptyAssessment':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Plant x={86} y={212} scale={1.0} />
          <Ground y={218} width={158} />
          <Margaret x={192} y={214} scale={1.06} />
          <g transform="translate(256,92)">
            <rect width="80" height="60" rx="9" fill={NL.white} stroke={NL.greyLight} />
            <rect x="14" y="14" width="34" height="4" rx="2" fill={NL.sageDark} opacity="0.6" />
            <rect x="14" y="24" width="52" height="3" rx="1.5" fill={NL.greyLight} />
            <circle cx="62" cy="44" r="12" fill={NL.mint} />
            <path d="M57 44h10M62 39v10" stroke={NL.forest} strokeWidth="2" strokeLinecap="round" />
            <rect x="14" y="38" width="30" height="3" rx="1.5" fill={NL.greyLight} />
          </g>
        </svg>
      );
    case 'emptyAppointments':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={64} y={54} w={82} h={66} />
          <Chair x={186} y={208} />
          <Ground y={212} width={168} />
          <Doctor x={300} y={212} scale={1.06} facing="left" />
          <FormCard x={52} y={120} />
        </svg>
      );
    case 'emptyNotifications':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <BellCard x={162} y={96} />
          <Plant x={104} y={212} scale={0.9} />
          <Plant x={296} y={212} scale={0.75} />
          <Ground y={216} width={150} />
        </svg>
      );
    case 'emptySearch':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <SearchCard x={196} y={78} />
          <Ground y={214} width={190} />
          <Doctor x={112} y={212} scale={0.98} facing="right" gesture />
          <Plant x={326} y={212} scale={0.85} />
        </svg>
      );
    case 'errorCalm':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Plant x={64} y={218} scale={0.95} />
          <Ground y={222} width={172} />
          <Margaret x={154} y={218} scale={0.94} />
          <Doctor x={276} y={216} scale={0.96} facing="left" />
          <g transform="translate(198,96)">
            <rect width="58" height="52" rx="10" fill={NL.white} stroke={NL.greyLight} />
            <circle cx="29" cy="22" r="10" fill={NL.mint} />
            <path d="M29 17v7M29 27h.01" stroke={NL.forest} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="14" y="38" width="30" height="3" rx="1.5" fill={NL.greyLight} />
          </g>
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Doorway x={268} y={96} />
          <Ground y={220} width={160} />
          <Margaret x={154} y={216} scale={1.04} gesture />
          <Caregiver x={218} y={218} scale={0.92} facing="left" />
          <g transform="translate(56,120)">
            <rect width="52" height="38" rx="8" fill={NL.white} stroke={NL.greyLight} />
            <path d="M18 19h16M28 13l6 6-6 6" stroke={NL.sageDeep} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    /* --------------------------------------------- everyday life & sessions */
    case 'tabletIndependent':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={246} y={52} w={86} h={66} />
          <Plant x={332} y={216} scale={1.05} />
          <Ground y={216} width={180} />
          <Margaret x={190} y={216} scale={1.06} tablet />
          <FormCard x={48} y={112} />
        </svg>
      );
    case 'manWithDoctor':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={44} y={54} w={76} h={64} />
          <Ground y={218} width={190} />
          <Harold x={148} y={216} scale={1.04} gesture />
          <Doctor x={286} y={214} scale={1.04} facing="left" gesture />
          <ChartCard x={64} y={130} w={68} h={50} variant="line" />
        </svg>
      );
    case 'explainResults':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={254} y={48} w={88} h={68} />
          <Ground y={220} width={200} />
          <Doctor x={132} y={216} scale={1.05} facing="right" gesture />
          <Margaret x={234} y={218} scale={0.98} facing="left" />
          <Harold x={288} y={220} scale={0.96} facing="left" />
          <ChartCard x={46} y={96} w={70} h={56} variant="bars" />
        </svg>
      );
    case 'cognitiveAssessment':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Chair x={146} y={202} />
          <Ground y={208} width={210} />
          <Margaret x={146} y={202} scale={1.0} seated />
          <Doctor x={262} y={214} scale={1.0} facing="left" gesture />
          <TaskCards x={286} y={58} />
        </svg>
      );
    case 'memoryActivity':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Chair x={132} y={202} />
          <Ground y={208} width={160} />
          <Margaret x={132} y={202} scale={1.0} seated gesture />
          <g transform="translate(212,84)">
            {[0, 1, 2, 3].map((tile) => (
              <rect
                key={tile}
                x={(tile % 2) * 52}
                y={Math.floor(tile / 2) * 52}
                width="44"
                height="44"
                rx="10"
                fill={tile === 1 ? NL.mint : NL.white}
                stroke={tile === 1 ? NL.sage : NL.greyLight}
              />
            ))}
            <circle cx="22" cy="22" r="8" fill={NL.sage} opacity="0.65" />
            <path d="M70 26l8 8 14-16" stroke={NL.sageDeep} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 78l8-12 8 12z" fill={NL.sageDark} opacity="0.55" />
            <rect x="56" y="72" width="18" height="4" rx="2" fill={NL.sage} opacity="0.6" />
            <rect x="56" y="82" width="12" height="4" rx="2" fill={NL.sage} opacity="0.4" />
          </g>
        </svg>
      );
    case 'attentionActivity':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Chair x={132} y={202} />
          <Ground y={208} width={160} />
          <Margaret x={132} y={202} scale={1.0} seated gesture />
          <g transform="translate(206,92)">
            <rect width="150" height="92" rx="12" fill={NL.white} stroke={NL.greyLight} />
            {[0, 1, 2, 3, 4].map((step) => (
              <g key={step}>
                <circle cx={21 + step * 27} cy="34" r="10" fill={step === 2 ? NL.sage : NL.mintSoft} stroke={step === 2 ? NL.sageDeep : NL.greyLight} />
                <text
                  x={21 + step * 27}
                  y="38"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={NL.forest}
                  fontFamily="system-ui, sans-serif"
                >
                  {step + 1}
                </text>
                {step < 4 && <path d={`M${33 + step * 27} 34h7`} stroke={NL.sage} strokeWidth="1.6" />}
              </g>
            ))}
            <rect x="18" y="58" width="114" height="4" rx="2" fill={NL.greyLight} />
            <rect x="18" y="58" width="74" height="4" rx="2" fill={NL.sage} opacity="0.8" />
            <circle cx="122" cy="74" r="8" fill={NL.mint} />
            <path d="M122 70v4l3 2" stroke={NL.sageDeep} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'walkingOutdoors':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Sun x={330} y={54} />
          <Tree x={74} y={212} scale={1.1} />
          <Tree x={348} y={216} scale={0.78} />
          <path d="M18 220c84-10 168-10 364 0" stroke={NL.sage} strokeWidth="2" opacity="0.3" fill="none" />
          <Ground y={220} width={220} opacity={0.45} />
          <Margaret x={166} y={218} scale={1.02} cane />
          <Caregiver x={232} y={220} scale={0.94} facing="left" />
        </svg>
      );
    case 'sleeping':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={40} y={46} w={76} h={62} />
          <RoundTable x={92} y={214} w={44} />
          <Cup x={92} y={194} />
          <Bed x={226} y={216} />
          <SleepingHead x={176} y={168} />
          <Ground y={218} width={210} opacity={0.35} />
        </svg>
      );
    case 'social':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WindowPane x={252} y={48} w={86} h={64} />
          <Ground y={208} width={230} />
          <Chair x={132} y={202} />
          <Chair x={236} y={202} />
          <Margaret x={132} y={202} scale={1.0} seated gesture />
          <Harold x={236} y={202} scale={1.0} seated facing="left" />
          <RoundTable x={184} y={206} w={66} />
          <Cup x={172} y={186} />
          <Cup x={198} y={186} />
          <Caregiver x={318} y={216} scale={0.9} facing="left" gesture />
        </svg>
      );
    case 'caregiverSupport':
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <WallCards />
          <Ground y={208} width={190} />
          <Chair x={148} y={202} />
          <Margaret x={148} y={202} scale={1.0} seated />
          <Caregiver x={224} y={216} scale={1.02} facing="left" gesture />
          <ChartCard x={62} y={104} w={66} h={50} variant="check" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 400 260" role="img" aria-hidden="true">
          <Backdrop id={id} />
          {room}
          <Ground y={218} width={170} />
          <Margaret x={172} y={214} scale={1.04} />
          <Doctor x={272} y={212} scale={1.02} facing="left" />
          <Plant x={54} y={214} scale={0.9} />
        </svg>
      );
  }
};

export const HealthcareScene: React.FC<Props> = ({ kind, className = '', title, animated = true }) => {
  const id = React.useId().replace(/:/g, '');
  const quiet = !animated || STATIC_SCENES.includes(kind);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${quiet ? 'nl-scene-static' : ''} ${className}`}
      /* Below-fold scenes are skipped by the browser until they scroll near the viewport. */
      style={{ aspectRatio: '400 / 260', contentVisibility: 'auto', containIntrinsicSize: '400px 260px' }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <SceneSvg kind={kind} id={id} animated={animated} />
    </div>
  );
};

export default HealthcareScene;
