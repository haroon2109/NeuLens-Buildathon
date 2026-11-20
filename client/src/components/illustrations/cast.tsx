import React from 'react';

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};


/* ---------------------------------------------------------------------------
 * The NeuLens cast.
 *
 * Every scene in the product is drawn from this one set of people so the same
 * elderly couple and the same clinician appear on the landing page, in patient
 * onboarding, during the assessment and in follow-up. Character identity is
 * fixed here on purpose — do not vary hair, skin tone, clothing or glasses at
 * the call site. Only pose and placement change.
 *
 *   Margaret  — 76, silver bob, round glasses, sage cardigan over cream blouse.
 *   Harold    — 80, her husband, short white hair, cream shirt, forest cardigan.
 *   Dr. Rahman— clinician, white coat over forest scrubs, stethoscope, tablet.
 *   Priya     — caregiver / daughter, teal top, lanyard, dark ponytail.
 *
 * Figures are drawn with the feet on y = 0 and centred on x = 0, roughly 120
 * units tall, so a scene only has to supply a baseline and a scale.
 * ------------------------------------------------------------------------- */

export const NL = {
  sage: '#A9C7B6',
  sageDark: '#7FA692',
  sageDeep: '#4F7E69',
  mint: '#DFF3EA',
  mintSoft: '#EEF8F3',
  forest: '#2F5E4E',
  forestDeep: '#24493D',
  teal: '#7FA99A',
  cream: '#FBF7EF',
  white: '#FFFFFF',
  offWhite: '#FBFDFB',
  stone: '#DCD3C6',
  stoneDark: '#C4B9A9',
  grey: '#8B9792',
  greyLight: '#D7DFDB',
  slate: '#5B6B73',
  skinMargaret: '#EBC8A9',
  skinMargaretShade: '#DDb193',
  skinHarold: '#DCB08A',
  skinHaroldShade: '#CB9C76',
  skinDoctor: '#C68A5F',
  skinDoctorShade: '#B2774F',
  skinPriya: '#D3A078',
  skinPriyaShade: '#C08D66',
  hairSilver: '#D8DCDA',
  hairSilverDark: '#BAC2BF',
  hairWhite: '#EDEFEC',
  hairWhiteDark: '#D2D8D4',
  hairDoctor: '#33261F',
  hairPriya: '#2C2320',
  gold: '#C6A05A',
  line: '#4A5A55',
  shadow: '#2F5E4E',
  warm: '#E8DDCB',
  coat: '#F7FAF8',
} as const;

type Facing = 'left' | 'right';

export type FigureProps = {
  x: number;
  y: number;
  scale?: number;
  /** 'right' is the drawn orientation; 'left' mirrors it. */
  facing?: Facing;
  seated?: boolean;
  /** Holds a tablet in both hands. */
  tablet?: boolean;
  /** Reaches an arm forward, as when explaining something. */
  gesture?: boolean;
  /** Uses a walking cane in the right hand. */
  cane?: boolean;
};

const transformFor = ({ x, y, scale = 1, facing = 'right' }: FigureProps) =>
  `translate(${x},${y}) scale(${facing === 'left' ? -scale : scale},${scale})`;

/* --------------------------------------------------------------- shared bits */

const Shoes: React.FC<{ tone?: string }> = ({ tone = '#55635C' }) => (
  <g fill={tone}>
    <rect x="-15" y="-7" width="14" height="7" rx="3.5" />
    <rect x="1" y="-7" width="15" height="7" rx="3.5" />
  </g>
);

const Smile: React.FC<{ y?: number; width?: number }> = ({ y = -94, width = 7 }) => (
  <path
    d={`M${-width / 2} ${y}c${width / 4} ${3.2} ${(width * 3) / 4} ${3.2} ${width} 0`}
    stroke={NL.line}
    strokeWidth="1.3"
    strokeLinecap="round"
    fill="none"
    opacity="0.75"
  />
);

const RoundGlasses: React.FC<{ cy?: number }> = ({ cy = -99 }) => (
  <g stroke={NL.line} strokeWidth="1.3" fill={NL.white} fillOpacity="0.45">
    <circle cx="-5.4" cy={cy} r="4.3" />
    <circle cx="5.4" cy={cy} r="4.3" />
    <path d="M-1.1 -99h2.2M-9.7 -99h-2.4M9.7 -99h2.4" fill="none" strokeLinecap="round" />
  </g>
);

/* Gentle blink: lids stay hidden, then close briefly and open again. */
const Blink: React.FC<{ y: number; skin: string; delay?: number }> = ({ y, skin, delay = 0 }) => (      <g className="nl-blink" fill={skin} style={{ animationDelay: `${delay}s`, animationPlayState: prefersReducedMotion() ? 'paused' : 'running' }}>
    <rect x="-8.2" y={y - 1.6} width="5.6" height="3.2" rx="1.6" />
    <rect x="2.6" y={y - 1.6} width="5.6" height="3.2" rx="1.6" />
  </g>
);

const RectGlasses: React.FC<{ cy?: number }> = ({ cy = -102 }) => (
  <g stroke={NL.line} strokeWidth="1.25" fill={NL.white} fillOpacity="0.4">
    <rect x="-10" y={cy - 3.6} width="8.6" height="7.2" rx="2" />
    <rect x="1.4" y={cy - 3.6} width="8.6" height="7.2" rx="2" />
    <path d="M-1.4 -102h2.8M-10 -102h-2.4M10 -102h2.4" fill="none" strokeLinecap="round" />
  </g>
);

/* ------------------------------------------------------------------ Margaret */

export const Margaret: React.FC<FigureProps> = (props) => {
  const { seated, tablet, gesture, cane } = props;
  return (
    <g transform={transformFor(props)}>
      {/* contact shadow so the figure is anchored to the floor */}
      <ellipse cx={seated ? 14 : 0} cy="1" rx={seated ? 27 : 20} ry="3.6" fill={NL.shadow} opacity="0.18" />
      <g className="nl-breathe" style={{ animationDelay: `${((props.x % 7) * 0.19 + 0.15).toFixed(2)}s`, animationPlayState: prefersReducedMotion() ? 'paused' : 'running' }}>
      {/* legs */}
      {seated ? (
        <g>
          {/* lap: thighs come forward from the hip */}
          <path d="M-16 -48c0-6 32-6 32 0l6 15c-14 5-30 5-44 0z" fill={NL.stone} />
          {/* far leg */}
          <rect x="6" y="-34" width="11" height="27" rx="5" fill={NL.stoneDark} />
          <rect x="4" y="-7" width="15" height="7" rx="3.5" fill="#4B5852" />
          {/* near leg */}
          <rect x="20" y="-34" width="11" height="27" rx="5" fill={NL.stone} />
          <rect x="18" y="-7" width="16" height="7" rx="3.5" fill="#55635C" />
        </g>
      ) : (
        <g>
          <rect x="-12.5" y="-48" width="10" height="44" rx="4" fill={NL.stone} />
          <rect x="2.5" y="-48" width="10" height="44" rx="4" fill={NL.stone} />
          <Shoes />
        </g>
      )}

      {/* skirt hem over the hips */}
      <path d="M-20 -48h40l3 12c-16 4-30 4-46 0z" fill={NL.stoneDark} opacity="0.55" />

      {/* cardigan */}
      <path d="M-17 -76c0-8 34-8 34 0l4 32c-13 5-29 5-42 0z" fill={NL.sage} />
      <path d="M-17 -76c0-8 34-8 34 0l4 32c-13 5-29 5-42 0z" fill={NL.white} opacity="0.15" />
      <path d="M2 -80v34" stroke={NL.sageDark} strokeWidth="1.4" opacity="0.55" />

      {/* blouse + collar */}
      <path d="M-8.5 -82L0 -67l8.5-15z" fill={NL.cream} />
      <path d="M-8.5 -82L-3 -74M8.5 -82L3 -74" stroke={NL.stoneDark} strokeWidth="1.2" strokeLinecap="round" />

      {/* arms */}
      <path
        d={gesture ? 'M15 -72c7 2 12 6 16 10' : seated ? 'M15 -74c7 7 9 17 9 25' : 'M15 -72c6 6 8 16 7 26'}
        stroke={NL.sageDark}
        strokeWidth="7.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d={seated ? 'M-15 -74c-6 6-8 15-7 22' : 'M-15 -72c-6 6-8 16-7 26'} stroke={NL.sageDark} strokeWidth="7.5" strokeLinecap="round" fill="none" />
      {!tablet && (
        <circle
          cx={gesture ? 32 : seated ? 24 : 22}
          cy={gesture ? -60 : seated ? -49 : -44}
          r="4.2"
          fill={NL.skinMargaret}
        />
      )}
      <circle cx="-22" cy={seated ? -52 : -44} r="4.2" fill={NL.skinMargaret} />
      {cane && (
        <g stroke={NL.stoneDark} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M-22 -42v-30" />
          <path d="M-22 -72c0-4 6-4 6-1" />
        </g>
      )}

      {/* neck */}
      <rect x="-4" y="-88" width="8" height="12" rx="3.5" fill={NL.skinMargaretShade} />

      {/* head */}
      <ellipse cx="0" cy="-101" rx="12.4" ry="14.2" fill={NL.skinMargaret} />
      <ellipse cx="0" cy="-101" rx="12.4" ry="14.2" fill={NL.white} opacity="0.06" />
      <ellipse cx="-12.8" cy="-100" rx="2.4" ry="3.4" fill={NL.skinMargaretShade} />
      <ellipse cx="12.8" cy="-100" rx="2.4" ry="3.4" fill={NL.skinMargaretShade} />

      {/* silver bob — same shape in every scene */}
      <path
        d="M-12.8 -103c0-12 6-17 12.8-17s12.8 5 12.8 17c0 2-.2 3.4-.6 4.6-1.6-7-5.6-10.2-12.2-10.2S-10.2-105.4-12-98.4c-.5-1.2-.8-2.6-.8-4.6z"
        fill={NL.hairSilver}
      />
      <path d="M-12.6 -103c-1.6 6-1.4 12 .6 16 .9.5 2 0 2.4-1.2-1.2-5-1.4-10-.8-14.8z" fill={NL.hairSilver} />
      <path d="M12.6 -103c1.6 6 1.4 12-.6 16-.9.5-2 0-2.4-1.2 1.2-5 1.4-10 .8-14.8z" fill={NL.hairSilver} />
      <path d="M-7 -111c2.6-3 9-3.6 12.4-1.2" stroke={NL.hairSilverDark} strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* face */}
      <path d="M-4 -95.5h8" stroke={NL.skinMargaretShade} strokeWidth="1" opacity="0.7" />
      <circle cx="-5.4" cy="-99" r="1.15" fill={NL.line} opacity="0.8" />
      <circle cx="5.4" cy="-99" r="1.15" fill={NL.line} opacity="0.8" />
      <Blink y={-99} skin={NL.skinMargaret} delay={(props.x % 5) * 0.6} />
      <RoundGlasses />
      <Smile y={-93} width={7.5} />
      <ellipse cx="-8.6" cy="-93.5" rx="2.4" ry="1.4" fill="#E9A9A2" opacity="0.35" />
      <ellipse cx="8.6" cy="-93.5" rx="2.4" ry="1.4" fill="#E9A9A2" opacity="0.35" />
      <circle cx="-11.8" cy="-92.5" r="1.5" fill={NL.gold} opacity="0.85" />
      <circle cx="11.8" cy="-92.5" r="1.5" fill={NL.gold} opacity="0.85" />

      {tablet && <HeldTablet skin={NL.skinMargaret} />}
      </g>
    </g>
  );
};

/* -------------------------------------------------------------------- Harold */

export const Harold: React.FC<FigureProps> = (props) => {
  const { seated, tablet, gesture, cane } = props;
  return (
    <g transform={transformFor(props)}>
      <ellipse cx={seated ? 14 : 0} cy="1" rx={seated ? 27 : 20} ry="3.6" fill={NL.shadow} opacity="0.18" />
      <g className="nl-breathe" style={{ animationDelay: `${((props.x % 7) * 0.23 + 0.4).toFixed(2)}s`, animationPlayState: prefersReducedMotion() ? 'paused' : 'running' }}>
      {seated ? (
        <g>
          <path d="M-16 -49c0-6 32-6 32 0l6 15c-14 5-30 5-44 0z" fill="#6E7A75" />
          <rect x="6" y="-34" width="11" height="27" rx="5" fill="#5C6863" />
          <rect x="4" y="-7" width="15" height="7" rx="3.5" fill="#4C5852" />
          <rect x="20" y="-34" width="11" height="27" rx="5" fill="#6E7A75" />
          <rect x="18" y="-7" width="16" height="7" rx="3.5" fill="#4C5852" />
        </g>
      ) : (
        <g>
          <rect x="-12.5" y="-49" width="10" height="45" rx="4" fill="#6E7A75" />
          <rect x="2.5" y="-49" width="10" height="45" rx="4" fill="#6E7A75" />
          <Shoes tone="#4C5852" />
        </g>
      )}

      {/* shirt */}
      <path d="M-17 -78c0-8 34-8 34 0l3 30c-13 5-27 5-40 0z" fill={NL.cream} />
      {/* forest cardigan, open */}
      <path d="M-17 -78c0-8 9-10 13-6l-3 38-13 1z" fill={NL.forest} opacity="0.88" />
      <path d="M17 -78c0-8-9-10-13-6l3 38 13 1z" fill={NL.forest} opacity="0.88" />
      <path d="M0 -80v34" stroke={NL.cream} strokeWidth="1.1" opacity="0.65" />
      <g fill={NL.stoneDark}>
        <circle cx="0" cy="-72" r="1.1" />
        <circle cx="0" cy="-62" r="1.1" />
        <circle cx="0" cy="-52" r="1.1" />
      </g>

      {/* collar */}
      <path d="M-6.5 -83L0 -74l6.5-9z" fill={NL.white} />
      <path d="M-6.5 -83L-2.5 -78M6.5 -83L2.5 -78" stroke={NL.stoneDark} strokeWidth="1.1" strokeLinecap="round" />

      {/* arms */}
      <path
        d={gesture ? 'M15 -73c7 2 13 6 17 11' : seated ? 'M15 -75c7 7 9 18 9 26' : 'M15 -73c6 6 8 17 7 27'}
        stroke={NL.forest}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path d={seated ? 'M-15 -75c-6 6-8 16-7 23' : 'M-15 -73c-6 6-8 17-7 27'} stroke={NL.forest} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />
      {!tablet && (
        <circle
          cx={gesture ? 33 : seated ? 24 : 22}
          cy={gesture ? -60 : seated ? -50 : -43}
          r="4.3"
          fill={NL.skinHarold}
        />
      )}
      <circle cx="-22" cy={seated ? -52 : -43} r="4.3" fill={NL.skinHarold} />
      {cane && (
        <g stroke={NL.stoneDark} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M22 -41v-32" />
          <path d="M22 -73c0-4 6-4 6-1" />
        </g>
      )}

      {/* neck */}
      <rect x="-4.2" y="-90" width="8.4" height="13" rx="3.5" fill={NL.skinHaroldShade} />

      {/* head */}
      <ellipse cx="0" cy="-104" rx="12.6" ry="14.4" fill={NL.skinHarold} />
      <ellipse cx="-13" cy="-103" rx="2.4" ry="3.4" fill={NL.skinHaroldShade} />
      <ellipse cx="13" cy="-103" rx="2.4" ry="3.4" fill={NL.skinHaroldShade} />

      {/* short white hair, receding hairline */}
      <path
        d="M-12.6 -107c0-9 5.4-14 12.6-14s12.6 5 12.6 14c-1.4-3.6-3.4-5.6-6.4-6.4-4 1.8-8.6 1.8-12.6 0-2.8.8-4.6 3-6.2 6.4z"
        fill={NL.hairWhite}
      />
      <path d="M-12.4 -107c-1 4-.6 8 1 11 .8.3 1.7-.2 2-1-1-3.4-1-7-.4-10z" fill={NL.hairWhite} />
      <path d="M12.4 -107c1 4 .6 8-1 11-.8.3-1.7-.2-2-1 1-3.4 1-7 .4-10z" fill={NL.hairWhite} />

      {/* brows, eyes, smile; same rectangular glasses everywhere */}
      <path d="M-8.6 -108.4c1.8-1 4-1 5.6 0M3 -108.4c1.6-1 3.8-1 5.6 0" stroke={NL.hairWhiteDark} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="-5.6" cy="-102" r="1.15" fill={NL.line} opacity="0.8" />
      <circle cx="5.6" cy="-102" r="1.15" fill={NL.line} opacity="0.8" />
      <Blink y={-102} skin={NL.skinHarold} delay={((props.x + 2) % 5) * 0.5} />
      <RectGlasses />
      <path d="M-1.6 -98.6h3.2" stroke={NL.skinHaroldShade} strokeWidth="1" strokeLinecap="round" />
      <Smile y={-96} width={7} />

      {tablet && <HeldTablet skin={NL.skinHarold} />}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------- Dr. Rahman */

export const Doctor: React.FC<FigureProps & { badge?: boolean }> = (props) => {
  const { seated, tablet, gesture } = props;
  const rightArm = gesture ? 'M16 -72c8 1 15 5 20 11' : seated ? 'M16 -74c7 7 9 17 9 25' : 'M16 -73c7 6 9 17 8 27';
  const leftArm = seated ? 'M-16 -74c-6 6-8 15-7 23' : 'M-16 -73c-7 6-9 17-8 27';
  return (
    <g transform={transformFor({ ...props, facing: props.facing ?? 'left' })}>
      <ellipse cx={seated ? 14 : 0} cy="1" rx={seated ? 27 : 20} ry="3.6" fill={NL.shadow} opacity="0.18" />
      <g className="nl-breathe" style={{ animationDelay: `${((props.x % 7) * 0.17 + 0.6).toFixed(2)}s`, animationPlayState: prefersReducedMotion() ? 'paused' : 'running' }}>
      {seated ? (
        <g>
          <path d="M-15 -48c0-6 31-6 31 0l6 15c-14 5-29 5-43 0z" fill={NL.slate} />
          <rect x="6" y="-34" width="11" height="27" rx="5" fill="#5E6C75" />
          <rect x="4" y="-7" width="15" height="7" rx="3.5" fill="#3E4A4F" />
          <rect x="20" y="-34" width="11" height="27" rx="5" fill={NL.slate} />
          <rect x="18" y="-7" width="16" height="7" rx="3.5" fill="#3E4A4F" />
        </g>
      ) : (
        <g>
          <rect x="-12.5" y="-50" width="10.5" height="46" rx="4" fill={NL.slate} />
          <rect x="2" y="-50" width="10.5" height="46" rx="4" fill={NL.slate} />
          <Shoes tone="#3E4A4F" />
        </g>
      )}

      {/* coat */}
      <path d="M-18 -78c0-9 36-9 36 0l4 46c-14 5-30 5-44 0z" fill={NL.coat ?? NL.white} />
      <path d="M-18 -78c0-9 36-9 36 0l4 46c-14 5-30 5-44 0z" fill={NL.mintSoft} opacity="0.5" />
      <path d="M2 -78l-4 46" stroke={NL.greyLight} strokeWidth="1.2" />
      {/* scrub top in the opening */}
      <path d="M-9 -83L0 -64l9-19z" fill={NL.forest} />
      <path d="M-9 -83L0 -64l9-19z" fill={NL.white} opacity="0.08" />

      {/* stethoscope */}
      <path d="M-7 -82c-2 10 2 17 7 19 5-2 9-9 7-19" stroke={NL.slate} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="2.4" cy="-61" r="3.1" fill={NL.forest} />
      <circle cx="2.4" cy="-61" r="1.4" fill={NL.mint} opacity="0.75" />

      {/* id badge */}
      <rect x="-15" y="-66" width="9" height="6.5" rx="1.6" fill={NL.mint} stroke={NL.sage} strokeWidth="0.8" />
      <path d="M-13 -63.5h5" stroke={NL.sageDark} strokeWidth="0.9" strokeLinecap="round" />

      {/* arms */}
      {/* sleeves are outlined so the white coat still reads against pale backgrounds */}
      <path d={rightArm} stroke="#C1D2C9" strokeWidth="10.5" strokeLinecap="round" fill="none" />
      <path d={leftArm} stroke="#C1D2C9" strokeWidth="10.5" strokeLinecap="round" fill="none" />
      <path d={rightArm} stroke="#EDF5F1" strokeWidth="8.5" strokeLinecap="round" fill="none" />
      <path d={leftArm} stroke="#EDF5F1" strokeWidth="8.5" strokeLinecap="round" fill="none" />
      {!tablet && (
        <circle
          cx={gesture ? 37 : seated ? 24 : 21}
          cy={gesture ? -59 : seated ? -49 : -44}
          r="4.3"
          fill={NL.skinDoctor}
        />
      )}
      <circle cx="-21" cy={seated ? -51 : -44} r="4.3" fill={NL.skinDoctor} />

      {/* neck */}
      <rect x="-4.2" y="-89" width="8.4" height="12" rx="3.5" fill={NL.skinDoctorShade} />

      {/* head */}
      <ellipse cx="0" cy="-103" rx="12.2" ry="14" fill={NL.skinDoctor} />
      <ellipse cx="-12.6" cy="-102" rx="2.3" ry="3.3" fill={NL.skinDoctorShade} />
      <ellipse cx="12.6" cy="-102" rx="2.3" ry="3.3" fill={NL.skinDoctorShade} />

      {/* dark hair with a low bun */}
      <path d="M-12.4 -105c0-11 5.6-16 12.4-16s12.4 5 12.4 16c0 2-.2 3.4-.6 4.6-1.6-7-5.4-10-11.8-10s-10.2 3-11.8 10c-.4-1.2-.6-2.6-.6-4.6z" fill={NL.hairDoctor} />
      <circle cx="-12" cy="-96" r="5.6" fill={NL.hairDoctor} />
      <circle cx="-13.4" cy="-94.6" r="2.2" fill={NL.hairDoctor} opacity="0.7" />
      <path d="M-4 -110.5c3-1.4 7-1.4 10 0" stroke="#4A382E" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* face */}
      <path d="M-5 -107.5c1.8-.8 3.8-.8 5.4 0M2.4 -107.5c1.6-.8 3.6-.8 5.4 0" stroke={NL.hairDoctor} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75" />
      <circle cx="-5.2" cy="-102" r="1.15" fill="#2A211C" />
      <circle cx="5.2" cy="-102" r="1.15" fill="#2A211C" />
      <Blink y={-102} skin={NL.skinDoctor} delay={((props.x + 1) % 5) * 0.55} />
      <path d="M-1.4 -98.4h2.8" stroke={NL.skinDoctorShade} strokeWidth="1" strokeLinecap="round" />
      <Smile y={-95.6} width={7.6} />
      <circle cx="12.4" cy="-95" r="1.1" fill={NL.gold} opacity="0.8" />

      {tablet && <HeldTablet skin={NL.skinDoctor} />}
      </g>
    </g>
  );
};

/* --------------------------------------------------------------------- Priya */

export const Caregiver: React.FC<FigureProps> = (props) => {
  const { gesture, tablet } = props;
  return (
    <g transform={transformFor(props)}>
      <ellipse cx="0" cy="1" rx="20" ry="3.6" fill={NL.shadow} opacity="0.18" />
      <g className="nl-breathe" style={{ animationDelay: `${((props.x % 7) * 0.21 + 0.3).toFixed(2)}s`, animationPlayState: prefersReducedMotion() ? 'paused' : 'running' }}>
      <rect x="-12.5" y="-48" width="10" height="44" rx="4" fill="#66707C" />
      <rect x="2.5" y="-48" width="10" height="44" rx="4" fill="#66707C" />
      <Shoes tone="#3F474E" />

      {/* teal top */}
      <path d="M-16.5 -77c0-8 33-8 33 0l3 31c-13 4-26 4-39 0z" fill={NL.teal} />
      <path d="M-6 -82L0 -72l6-10z" fill={NL.cream} />
      {/* lanyard */}
      <path d="M-5 -81l5 22 5-22" stroke={NL.forest} strokeWidth="1.2" fill="none" opacity="0.7" />
      <rect x="-2" y="-60" width="4" height="7" rx="1" fill={NL.cream} stroke={NL.sageDark} strokeWidth="0.7" />

      {/* arms */}
      <path
        d={gesture ? 'M15 -72c8 3 13 7 17 13' : 'M15 -72c6 6 8 16 7 26'}
        stroke={NL.teal}
        strokeWidth="7.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M-15 -72c-6 6-8 16-7 26" stroke={NL.teal} strokeWidth="7.5" strokeLinecap="round" fill="none" />
      <circle cx={gesture ? 34 : 22} cy={gesture ? -58 : -44} r="4.1" fill={NL.skinPriya} />
      <circle cx="-22" cy="-44" r="4.1" fill={NL.skinPriya} />

      <rect x="-4" y="-88" width="8" height="12" rx="3.5" fill={NL.skinPriyaShade} />
      <ellipse cx="0" cy="-101" rx="12.2" ry="14" fill={NL.skinPriya} />
      <ellipse cx="-12.6" cy="-100" rx="2.3" ry="3.3" fill={NL.skinPriyaShade} />
      <ellipse cx="12.6" cy="-100" rx="2.3" ry="3.3" fill={NL.skinPriyaShade} />

      {/* dark ponytail */}
      <path d="M-12.4 -103c0-11 5.4-16 12.4-16s12.4 5 12.4 16c0 2-.2 3.4-.6 4.6-1.6-7-5.4-10-11.8-10s-10.2 3-11.8 10c-.4-1.2-.6-2.6-.6-4.6z" fill={NL.hairPriya} />
      <path d="M12 -104c3.4 1.4 4.6 6 3.6 12-1 5-3.4 7.6-5.8 8.2-1.2-.6-1.4-1.8-.6-2.8 2-2 3-5.4 3-9.6 0-3-.4-5.6-1.2-7.4z" fill={NL.hairPriya} />
      <path d="M-4 -108.5c3-1.4 7-1.4 10 0" stroke="#3B2E29" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      <circle cx="-5.2" cy="-100" r="1.15" fill="#2A211C" />
      <circle cx="5.2" cy="-100" r="1.15" fill="#2A211C" />
      <Blink y={-100} skin={NL.skinPriya} delay={((props.x + 3) % 5) * 0.45} />
      <path d="M-1.4 -96.6h2.8" stroke={NL.skinPriyaShade} strokeWidth="1" strokeLinecap="round" />
      <Smile y={-94} width={7.4} />

      {tablet && <HeldTablet skin={NL.skinPriya} />}
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- props */

const HeldTablet: React.FC<{ skin?: string }> = ({ skin = NL.skinMargaret }) => (
  <g transform="translate(4,-64) rotate(-8)" className="nl-tablet">
    <rect x="0" y="0" width="27" height="20" rx="3" fill={NL.forestDeep} />
    <rect x="2" y="2" width="23" height="15" rx="2" fill={NL.mintSoft} />      <g className="nl-tablet-screen" style={{ animationPlayState: prefersReducedMotion() ? 'paused' : 'running' }}>
      <rect x="5" y="5" width="10" height="2" rx="1" fill={NL.sageDark} opacity="0.7" />
      <rect x="5" y="9" width="16" height="1.8" rx="0.9" fill={NL.sage} opacity="0.55" />
      <rect x="5" y="12.4" width="12" height="1.8" rx="0.9" fill={NL.sage} opacity="0.45" />
    </g>

    {/* supporting hand sits over the tablet so the hold reads as connected */}
    <circle cx="14" cy="20" r="4.2" fill={skin} />
  </g>
);

export const Chair: React.FC<{ x: number; y: number; scale?: number; tone?: string }> = ({
  x,
  y,
  scale = 1,
  tone = NL.warm ?? '#E8DDCB',
}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    {/* backrest */}
    <rect x="-23" y="-84" width="46" height="46" rx="11" fill={tone} />
    <rect x="-19" y="-80" width="38" height="36" rx="8" fill={NL.white} opacity="0.3" />
    {/* seat — top sits at the seated figure's lap height */}
    <rect x="-26" y="-35" width="52" height="11" rx="5.5" fill={tone} />
    <rect x="-26" y="-35" width="52" height="3.5" rx="1.75" fill={NL.white} opacity="0.28" />
    {/* armrests keep the chair readable around a seated figure */}
    <rect x="-31" y="-48" width="17" height="7" rx="3.5" fill={tone} />
    <rect x="14" y="-48" width="17" height="7" rx="3.5" fill={tone} />
    <rect x="-31" y="-41" width="6" height="17" rx="3" fill={tone} opacity="0.85" />
    <rect x="25" y="-41" width="6" height="17" rx="3" fill={tone} opacity="0.85" />
    {/* legs */}
    <rect x="-21" y="-24" width="5" height="24" rx="2.5" fill={tone} opacity="0.8" />
    <rect x="16" y="-24" width="5" height="24" rx="2.5" fill={tone} opacity="0.8" />
  </g>
);

export const Sofa: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    {/* back frame and two cushions */}
    <rect x="-46" y="-74" width="92" height="44" rx="14" fill="#C9DBD1" />
    <rect x="-40" y="-68" width="38" height="30" rx="10" fill="#E5F0E9" />
    <rect x="2" y="-68" width="38" height="30" rx="10" fill="#E5F0E9" />
    {/* arms */}
    <rect x="-52" y="-56" width="14" height="40" rx="7" fill="#C9DBD1" />
    <rect x="38" y="-56" width="14" height="40" rx="7" fill="#C9DBD1" />
    {/* seat with a front seam */}
    <rect x="-40" y="-36" width="80" height="16" rx="8" fill="#DCE9E1" />
    <path d="M-34 -23h68" stroke="#BCD0C4" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <rect x="-38" y="-20" width="5" height="20" rx="2.5" fill={NL.stoneDark} opacity="0.6" />
    <rect x="33" y="-20" width="5" height="20" rx="2.5" fill={NL.stoneDark} opacity="0.6" />
  </g>
);

export const Desk: React.FC<{ x: number; y: number; width?: number }> = ({ x, y, width = 150 }) => (
  <g>
    <rect x={x - width / 2} y={y - 10} width={width} height="10" rx="4" fill="#E3D7C5" />
    <rect x={x - width / 2 + 10} y={y} width="6" height="34" rx="3" fill="#D8CAB6" />
    <rect x={x + width / 2 - 16} y={y} width="6" height="34" rx="3" fill="#D8CAB6" />
  </g>
);

export const Monitor: React.FC<{ x: number; y: number; w?: number; h?: number; chart?: boolean; className?: string }> = ({
  x,
  y,
  w = 78,
  h = 50,
  chart,
  className,
}) => (
  <g transform={`translate(${x},${y})`} className={className}>
    <rect x="0" y="0" width={w} height={h} rx="5" fill={NL.forestDeep} />
    <rect x="3" y="3" width={w - 6} height={h - 11} rx="3" fill={NL.mintSoft} />
    {chart ? (
      <g>
        <rect x="9" y={h - 20} width="5" height="10" rx="1.6" fill={NL.sage} />
        <rect x="18" y={h - 26} width="5" height="16" rx="1.6" fill={NL.sageDark} />
        <rect x="27" y={h - 22} width="5" height="12" rx="1.6" fill={NL.sage} />
        <rect x="36" y={h - 30} width="5" height="20" rx="1.6" fill={NL.forest} opacity="0.75" />
        <path d={`M48 ${h - 32}c8 4 12-4 20-10`} stroke={NL.sageDeep} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <rect x="9" y="9" width="26" height="3" rx="1.5" fill={NL.sageDark} opacity="0.7" />
        <rect x="9" y="16" width={w - 22} height="2.4" rx="1.2" fill={NL.sage} opacity="0.5" />
        <rect x="9" y="22" width={w - 32} height="2.4" rx="1.2" fill={NL.sage} opacity="0.4" />
      </g>
    )}
    <rect x={w / 2 - 8} y={h} width="16" height="5" rx="2" fill={NL.greyLight} />
    <rect x={w / 2 - 16} y={h + 4} width="32" height="3" rx="1.5" fill={NL.greyLight} />
  </g>
);

export const Plant: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <path d="M-9 -14h18l-2.5 14h-13z" fill="#D9C7AC" />
    <path d="M0 -14c-1-12-7-18-15-22 2 10 8 17 15 22z" fill={NL.sage} />
    <path d="M0 -14c1-14 7-20 16-24-1 12-8 19-16 24z" fill={NL.sageDark} opacity="0.85" />
    <path d="M0 -14c0-10 1-18 4-25" stroke={NL.sageDeep} strokeWidth="1.6" fill="none" opacity="0.6" />
  </g>
);

export const WindowPane: React.FC<{ x: number; y: number; w?: number; h?: number }> = ({ x, y, w = 74, h = 62 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="9" fill={NL.white} stroke="#D3E0D8" strokeWidth="2" />
    <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx="5" fill="#F1FAF5" />
    <path
      d={`M${x + w / 2} ${y + 5}v${h - 10}M${x + 5} ${y + h / 2}h${w - 10}`}
      stroke="#CFDED6"
      strokeWidth="2.4"
    />
    <rect x={x - 4} y={y + h} width={w + 8} height="5" rx="2.5" fill="#DCE9E1" />
  </g>
);

export const ChartCard: React.FC<{ x: number; y: number; w?: number; h?: number; variant?: 'line' | 'bars' | 'check' }> = ({
  x,
  y,
  w = 96,
  h = 64,
  variant = 'line',
}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x="0" y="0" width={w} height={h} rx="8" fill={NL.white} stroke={NL.greyLight} />
    <rect x="10" y="10" width={w * 0.42} height="4" rx="2" fill={NL.forest} opacity="0.65" />
    {variant === 'line' && (
      <g>
        <path d={`M10 ${h - 16}c${w * 0.14} ${-h * 0.16} ${w * 0.2} ${h * 0.06} ${w * 0.32} ${-h * 0.12}s${w * 0.2} ${h * 0.04} ${w * 0.36} ${-h * 0.2}`} stroke={NL.sageDeep} strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx={10 + w * 0.32} cy={h - 28} r="2.6" fill={NL.sageDark} />
        <circle cx={10 + w * 0.68} cy={h - 30} r="2.6" fill={NL.forest} />
      </g>
    )}
    {variant === 'bars' && (
      <g>
        {[0.32, 0.58, 0.44, 0.76, 0.62].map((ratio, index) => (
          <rect key={index} x={10 + index * (w - 24) / 5} y={h - 12 - ratio * (h - 30)} width="7" height={ratio * (h - 30)} rx="2" fill={index % 2 ? NL.sage : NL.sageDark} opacity="0.85" />
        ))}
      </g>
    )}
    {variant === 'check' && (
      <g>
        <circle cx={w / 2} cy={h / 2 + 6} r="14" fill={NL.mint} />
        <path d={`M${w / 2 - 6} ${h / 2 + 6}l4.4 4.6 8-9`} stroke={NL.sageDeep} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </g>
);

export const SpeechMic: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x="9" y="0" width="13" height="24" rx="6.5" fill={NL.slate} />
    <rect x="13" y="24" width="5" height="9" rx="2" fill={NL.grey} />
    <rect x="5" y="31" width="21" height="4" rx="2" fill={NL.greyLight} />
    <path d="M0 10c5 9 26 9 31 0" stroke={NL.sageDark} strokeWidth="2.4" fill="none" opacity="0.7" />
    <path d="M-7 6c9 15 38 15 47 0" stroke={NL.sage} strokeWidth="1.8" fill="none" opacity="0.45" />
  </g>
);

export const CameraFrame: React.FC<{ x: number; y: number; w?: number; h?: number }> = ({ x, y, w = 92, h = 66 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x="0" y="0" width={w} height={h} rx="8" fill={NL.forestDeep} opacity="0.92" />
    <rect x="4" y="4" width={w - 8} height={h - 8} rx="5" fill={NL.mintSoft} />
    <g stroke={NL.sageDark} strokeWidth="2" fill="none" opacity="0.8">
      <path d={`M12 18v-6h6M${w - 18} 12h6v6M${w - 12} ${h - 18}v6h-6M18 ${h - 12}h-6v-6`} />
    </g>
    <circle cx={w / 2} cy={h / 2 + 4} r="2.4" fill={NL.forest} />
    <path d={`M${w / 2 - 12} ${h / 2 + 4}h-6M${w / 2 + 12} ${h / 2 + 4}h6`} stroke={NL.sageDark} strokeWidth="1.6" strokeLinecap="round" />
  </g>
);

export const LifeIcon: React.FC<{ x: number; y: number; kind: 'sleep' | 'activity' | 'nutrition' | 'social'; size?: number }> = ({
  x,
  y,
  kind,
  size = 30,
}) => (
  <g transform={`translate(${x},${y}) scale(${size / 46})`}>
    <rect x="0" y="0" width="46" height="46" rx="10" fill={NL.white} stroke={NL.greyLight} />
    <g stroke={NL.sageDeep} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'sleep' && <path d="M16 32V16l14 16V16" />}
      {kind === 'activity' && <path d="M12 27h6l4-11 5 17 3-6h4" />}
      {kind === 'nutrition' && <path d="M23 33c-8-6-11-12-6-15 3-2 5 0 6 2 1-2 3-4 6-2 5 3 2 9-6 15z" />}
      {kind === 'social' && <><circle cx="18" cy="19" r="4" /><circle cx="29" cy="21" r="3.2" /><path d="M11 33c1-5 4-7 7-7s6 2 7 7M25 33c.6-4 2.6-6 5-6s4 2 4.6 6" /></>}
    </g>
  </g>
);

/** A soft rounded mat suggesting a clinical room floor. */
/* ------------------------------------------------------- everyday props */

export const Tree: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x="-3" y="-34" width="6" height="34" rx="3" fill="#C4B199" />
    <circle cx="0" cy="-50" r="22" fill={NL.sage} opacity="0.4" />
    <circle cx="-13" cy="-38" r="14" fill={NL.sage} opacity="0.3" />
    <circle cx="13" cy="-38" r="14" fill={NL.sage} opacity="0.3" />
  </g>
);

export const Sun: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 17 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#F6E7C4" />
    <g stroke="#F1DDB0" strokeWidth="2.4" strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const inner = r + 7;
        const outer = r + 13;
        return (
          <path
            key={angle}
            d={`M${x + Math.cos(rad) * inner} ${y + Math.sin(rad) * inner}L${x + Math.cos(rad) * outer} ${y + Math.sin(rad) * outer}`}
          />
        );
      })}
    </g>
  </g>
);

export const Bed: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    {/* headboard and frame */}
    <rect x="-78" y="-64" width="14" height="64" rx="6" fill="#D7C7AE" />
    <rect x="-78" y="-30" width="156" height="16" rx="7" fill="#E7EFE9" />
    <rect x="-78" y="-16" width="156" height="8" rx="4" fill="#CBBBA6" />
    <rect x="-72" y="-8" width="6" height="8" rx="3" fill="#CBBBA6" />
    <rect x="66" y="-8" width="6" height="8" rx="3" fill="#CBBBA6" />
    {/* pillow */}
    <rect x="-70" y="-46" width="44" height="18" rx="9" fill={NL.white} stroke={NL.greyLight} />
    {/* blanket over the body */}
    <path d="M-16 -32h94v16c-32 8-72 8-94 0z" fill={NL.sage} opacity="0.7" />
    <path d="M-16 -32h94v6c-30 4-66 4-94 0z" fill={NL.white} opacity="0.32" />
  </g>
);

/** Margaret asleep: the same silver bob and glasses, eyes closed. */
export const SleepingHead: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx="0" cy="0" rx="12.4" ry="14.2" fill={NL.skinMargaret} />
    <path
      d="M-12.8 -2c0-12 6-17 12.8-17s12.8 5 12.8 17c0 2-.2 3.4-.6 4.6-1.6-7-5.6-10.2-12.2-10.2S-10.2-4.4-12-2.4c-.5-1.2-.8-2.6-.8-4.6z"
      fill={NL.hairSilver}
    />
    <path d="M-12.6 -2c-1.6 6-1.4 12 .6 16 .9.5 2 0 2.4-1.2-1.2-5-1.4-10-.8-14.8z" fill={NL.hairSilver} />
    <path d="M12.6 -2c1.6 6 1.4 12-.6 16-.9.5-2 0-2.4-1.2 1.2-5 1.4-10 .8-14.8z" fill={NL.hairSilver} />
    <path d="M-6 2c1.6 1.2 3.8 1.2 5.4 0M2 2c1.4 1 3.4 1 4.8 0" stroke={NL.line} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7" />
    <path d="M-4 7c1.6 1.4 4.4 1.4 6 0" stroke={NL.line} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.55" />
    <circle cx="-9" cy="8.5" r="2.2" fill="#E9A9A2" opacity="0.3" />
    <circle cx="9" cy="8.5" r="2.2" fill="#E9A9A2" opacity="0.3" />
  </g>
);

export const RoundTable: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 74 }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx="0" cy="-20" rx={w / 2} ry="9" fill="#E8DCC9" />
    <rect x="-5" y="-14" width="10" height="14" rx="3" fill="#D8CAB6" />
    <ellipse cx="0" cy="0" rx="20" ry="4" fill="#D8CAB6" opacity="0.7" />
  </g>
);

export const Cup: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-5 -8h10v6a5 5 0 0 1-10 0z" fill={NL.white} stroke={NL.greyLight} strokeWidth="1.2" />
    <path d="M5 -6c3.4 0 3.4 5 0 5" stroke={NL.greyLight} strokeWidth="1.3" fill="none" />
    <path d="M-2 -11c.8-1.4.8-2.4 0-3.6M2 -11c.8-1.4.8-2.4 0-3.6" stroke={NL.sage} strokeWidth="1.1" opacity="0.5" fill="none" />
  </g>
);

export const Ground: React.FC<{ y?: number; width?: number; opacity?: number }> = ({ y = 214, width = 150, opacity = 0.5 }) => (
  <ellipse cx="200" cy={y} rx={width} ry="16" fill={NL.mint} opacity={opacity} />
);
