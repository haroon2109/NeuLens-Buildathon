import type { FC } from 'react';

export type MascotPose = 'welcome' | 'guide' | 'encourage' | 'celebrate' | 'support';

/** The two recurring people: the same patient and clinician drawn everywhere. */
export type MascotCharacter = 'patient' | 'clinician';

type ElderCareMascotProps = {
  pose?: MascotPose;
  character?: MascotCharacter;
  className?: string;
  /** Render subtle motion (respects reduced-motion via CSS). */
  animated?: boolean;
  title?: string;
};

/*
 * Portrait of the NeuLens cast, drawn to match components/illustrations/cast.
 *   patient   — Margaret: silver bob, round glasses, sage cardigan.
 *   clinician — Dr. Rahman: white coat over forest scrubs, stethoscope.
 * Keep hair, skin, clothing and glasses identical to the full-body figures.
 */
const patientPalette = {
  skin: '#EBC8A9',
  skinShadow: '#DDB193',
  hair: '#D8DCDA',
  hairDark: '#BAC2BF',
  outfit: '#7FA692',
  outfitDark: '#5F8875',
  under: '#FBF7EF',
  scarf: '#DFF3EA',
  line: '#4A5A55',
  blush: '#E9A9A2',
  accent: '#C6A05A',
  chair: '#E7EFE9',
  chairDark: '#D3E0D8',
  backdrop: '#EEF8F3',
  bubble: '#DFF3EA',
};

const clinicianPalette = {
  skin: '#C68A5F',
  skinShadow: '#B2774F',
  hair: '#33261F',
  hairDark: '#4A382E',
  outfit: '#F7FAF8',
  outfitDark: '#D7DFDB',
  under: '#2F5E4E',
  scarf: '#DFF3EA',
  line: '#33443E',
  blush: '#C98A6A',
  accent: '#C6A05A',
  chair: '#E7EFE9',
  chairDark: '#D3E0D8',
  backdrop: '#EEF8F3',
  bubble: '#DFF3EA',
};

/**
 * A warm, dignified companion illustration used across NeuLens to make the
 * screening experience feel guided and approachable for older adults.
 * Decorative by default unless a meaningful title is provided.
 */
export const ElderCareMascot: FC<ElderCareMascotProps> = ({
  pose = 'welcome',
  character = 'patient',
  className = '',
  animated = true,
  title,
}) => {
  const motionClass = animated ? 'mascot-animate' : '';
  const waveArm = pose === 'welcome' || pose === 'celebrate';
  const thumbsOrOpen = pose === 'celebrate';
  const gentleNod = pose === 'guide' || pose === 'support';
  const encouraging = pose === 'encourage' || pose === 'celebrate';
  const p = character === 'clinician' ? clinicianPalette : patientPalette;
  const isClinician = character === 'clinician';

  return (
    <svg
      viewBox="0 0 240 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`mascot-svg ${motionClass} ${className}`.trim()}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id="mascot-bg" x1="24" y1="24" x2="216" y2="236" gradientUnits="userSpaceOnUse">
          <stop stopColor={p.backdrop} />
          <stop offset="1" stopColor="#FBFDFB" />
        </linearGradient>
        <filter id="mascot-shadow" x="20" y="180" width="200" height="70" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#2F5E4E" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* soft backdrop */}
      <rect x="18" y="18" width="204" height="224" rx="28" fill="url(#mascot-bg)" />
      <circle cx="188" cy="56" r="22" fill={p.bubble} className={animated ? 'mascot-float-slow' : ''} />
      <circle cx="46" cy="76" r="10" fill={p.bubble} opacity="0.75" className={animated ? 'mascot-float' : ''} />
      {encouraging && (
        <g className={animated ? 'mascot-sparkle' : ''}>
          <path d="M196 118l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" fill={p.outfit} opacity="0.8" />
          <path d="M44 132l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill={p.outfitDark} opacity="0.6" />
        </g>
      )}

      {/* chair / base */}
      <g filter="url(#mascot-shadow)">
        <ellipse cx="120" cy="222" rx="64" ry="12" fill={p.chairDark} opacity="0.55" />
      </g>
      <rect x="72" y="160" width="96" height="54" rx="18" fill={p.chair} />
      <rect x="72" y="160" width="96" height="14" rx="7" fill={p.chairDark} opacity="0.35" />

      {/* body */}
      <g className={gentleNod && animated ? 'mascot-nod' : ''}>
        {/* torso */}
        <path d="M82 206c0-28 17-46 38-46s38 18 38 46v10H82v-10z" fill={p.outfit} />
        <path d="M120 160v56" stroke={p.outfitDark} strokeWidth="4" strokeLinecap="round" opacity={isClinician ? 0.5 : 0.35} />
        {isClinician ? (
          <>
            {/* coat opening + scrub top */}
            <path d="M104 164l16 22 16-22" fill={p.under} />
            <path d="M92 208c2-20 10-34 22-40M148 208c-2-20-10-34-22-40" stroke={p.outfitDark} strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M104 168c-2 8 1 14 5 16M136 168c2 8-1 14-5 16" stroke={p.line} strokeWidth="1.8" fill="none" opacity="0.6" />
            <circle cx="122" cy="186" r="3.4" fill={p.under} />
            <circle cx="122" cy="186" r="1.5" fill={p.scarf} />
            <rect x="103" y="193" width="10" height="7" rx="2" fill={p.scarf} stroke={p.outfitDark} strokeWidth="0.8" />
          </>
        ) : (
          <>
            {/* cream blouse under an open cardigan */}
            <path d="M104 162l16 20 16-20-6 34h-20z" fill={p.under} />
            <path d="M104 162l10 12M136 162l-10 12" stroke={p.hairDark} strokeWidth="1.2" opacity="0.5" />
            <rect x="108" y="186" width="24" height="18" rx="4" fill={p.under} opacity="0.9" />
          </>
        )}

        {/* left arm */}
        <path d="M86 174c-14 6-22 16-24 28" stroke={p.outfit} strokeWidth="14" strokeLinecap="round" />
        <circle cx="60" cy="206" r="8" fill={p.skin} />

        {/* right arm (waves or rests) */}
        <g className={waveArm && animated ? 'mascot-wave' : ''} style={{ transformOrigin: '150px 170px' }}>
          <path
            d={waveArm ? 'M154 172c12-8 22-18 26-30' : 'M154 174c14 6 22 16 24 28'}
            stroke={p.outfit}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx={waveArm ? 182 : 180} cy={waveArm ? 138 : 206} r="8" fill={p.skin} />
        </g>

        {/* neck */}
        <rect x="111" y="142" width="18" height="18" rx="6" fill={p.skinShadow} />

        {/* head */}
        <g>
          <ellipse cx="120" cy="118" rx="34" ry="38" fill={p.skin} />
          <ellipse cx="84" cy="122" rx="5" ry="8" fill={p.skinShadow} />
          <ellipse cx="156" cy="122" rx="5" ry="8" fill={p.skinShadow} />

          {/* hair — identical to the full-body figures */}
          {isClinician ? (
            <>
              <path
                d="M86 116c0-27 15-44 34-44s34 16 34 44c0 4-.6 7-1.6 9.6-3-12-9-18-18-18s-15 5-18 18l-2 18h-5l-2-18c-2-8-5-13-10-14-2 2-4 5-5 8-2 4-4 10-4 10-1.4-3-2-7-2-13z"
                fill={p.hair}
              />
              <circle cx="86" cy="138" r="13" fill={p.hair} />
              <circle cx="82" cy="142" r="5" fill={p.hairDark} opacity="0.7" />
            </>
          ) : (
            <>
              <path
                d="M86 112c0-25 15-42 34-42s34 16 34 42c0 3-.4 5.6-1.2 8-4-13-10-19-20-21-6 4-14 6-24 6-6 0-11-1-15-3-3 3-5 8-6 14-1-1-1.6-2.6-1.6-4.6z"
                fill={p.hair}
              />
              <path
                d="M87 112c-4 16-3 30 2 38 3 1 6-1 7-4-4-11-5-23-3-34zM153 112c4 16 3 30-2 38-3 1-6-1-7-4 4-11 5-23 3-34z"
                fill={p.hair}
              />
              <path d="M92 92c5-8 13-13 22-14" stroke={p.hairDark} strokeWidth="3" strokeLinecap="round" />
              <circle cx="86" cy="130" r="2.4" fill={p.accent} opacity="0.9" />
              <circle cx="154" cy="130" r="2.4" fill={p.accent} opacity="0.9" />
            </>
          )}

          {/* brows */}
          <path
            d={isClinician ? 'M100 108c4-2 9-2 13 0M128 108c4-2 9-2 13 0' : 'M99 107c4-2 9-2 13 0M129 107c4-2 9-2 13 0'}
            stroke={isClinician ? p.hair : p.hairDark}
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* eyes */}
          <circle cx="104" cy="119" r={pose === 'celebrate' ? 2 : 2.6} fill={p.line} />
          <circle cx="136" cy="119" r={pose === 'celebrate' ? 2 : 2.6} fill={p.line} />
          {pose === 'celebrate' && (
            <>
              <path d="M100 118c2-2 6-2 8 0" stroke={p.line} strokeWidth="2" strokeLinecap="round" />
              <path d="M132 118c2-2 6-2 8 0" stroke={p.line} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* glasses — round for the patient, spare for the clinician */}
          {!isClinician && (
            <g stroke={p.line} strokeWidth="2.4" fill="none">
              <circle cx="104" cy="119" r="12" fill="#FBFDFB" fillOpacity="0.35" />
              <circle cx="136" cy="119" r="12" fill="#FBFDFB" fillOpacity="0.35" />
              <path d="M116 119h8M92 119h-8M148 119h8" strokeLinecap="round" />
            </g>
          )}

          {/* nose and smile */}
          <path d="M120 126v5h4" stroke={p.skinShadow} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path
            d={thumbsOrOpen ? 'M108 138c4 6 20 6 24 0' : 'M110 138c3 4 17 4 20 0'}
            stroke={p.line}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <ellipse cx="96" cy="132" rx="5" ry="3" fill={p.blush} opacity="0.35" />
          <ellipse cx="144" cy="132" rx="5" ry="3" fill={p.blush} opacity="0.35" />
        </g>
      </g>

      {/* supportive cue */}
      {pose === 'support' && (
        <g className={animated ? 'mascot-float' : ''}>
          <rect x="148" y="62" width="64" height="34" rx="10" fill="white" stroke={p.bubble} />
          <path d="M156 96l-6 8 16-4" fill="white" />
          <rect x="158" y="74" width="28" height="4" rx="2" fill={p.outfit} opacity="0.6" />
          <rect x="158" y="82" width="44" height="4" rx="2" fill={p.chairDark} />
        </g>
      )}
      {pose === 'guide' && (
        <g className={animated ? 'mascot-float-slow' : ''}>
          <circle cx="188" cy="150" r="16" fill="white" stroke={p.outfit} strokeOpacity="0.4" />
          <path d="M182 150l4 4 8-10" stroke={p.outfitDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};

export default ElderCareMascot;
