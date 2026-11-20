import React from 'react';

/**
 * Neulens logo mark — an inline vector network forming a brain profile.
 *
 * This is drawn as SVG rather than a cropped raster so it stays sharp at every
 * size, inherits the NeuLens palette, and never looks like a pasted image. The
 * mark sits on a forest tile so it reads on white headers, warm page
 * backgrounds and dark surfaces alike.
 */
export const NeulensLogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`inline-flex shrink-0 ${className || 'h-10 w-10'}`} aria-hidden="true">
    <svg
      viewBox="0 0 48 48"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      focusable="false"
    >
      {/* Tile */}
      <rect width="48" height="48" rx="13" fill="#2F5E4E" />

      {/* Network edges */}
      <g stroke="#DFF3EA" strokeOpacity="0.62" strokeWidth="1.05" strokeLinecap="round">
        {/* Brain outline */}
        <path d="M18 11 L25 9 L32 11 L37 17 L38 25 L33 31 L27 31 L21 30 L14 26 L12 19 L14 14 Z" />
        {/* Interior folds */}
        <path d="M18 11 L24 19 L31 20 L37 17" />
        <path d="M24 19 L18 24 L14 26" />
        <path d="M24 19 L27 25 L33 31" />
        <path d="M31 20 L34 26 L38 25" />
        <path d="M21 30 L27 25" />
        <path d="M12 19 L18 24" />
        <path d="M31 20 L25 9" />
      </g>

      {/* Nodes */}
      <g fill="#DFF3EA">
        <circle cx="18" cy="11" r="1.6" />
        <circle cx="25" cy="9" r="1.6" />
        <circle cx="32" cy="11" r="1.6" />
        <circle cx="37" cy="17" r="1.6" />
        <circle cx="38" cy="25" r="1.6" />
        <circle cx="33" cy="31" r="1.6" />
        <circle cx="27" cy="31" r="1.6" />
        <circle cx="21" cy="30" r="1.6" />
        <circle cx="14" cy="26" r="1.6" />
        <circle cx="12" cy="19" r="1.6" />
        <circle cx="14" cy="14" r="1.6" />
        <circle cx="24" cy="19" r="1.9" />
        <circle cx="31" cy="20" r="1.6" />
        <circle cx="18" cy="24" r="1.6" />
        <circle cx="27" cy="25" r="1.6" />
        <circle cx="34" cy="26" r="1.6" />
      </g>

      {/* Accent node — the "lens" focus */}
      <circle cx="24" cy="19" r="3.1" fill="none" stroke="#A9C7B6" strokeWidth="1.1" />
    </svg>
  </span>
);

export default NeulensLogoMark;
