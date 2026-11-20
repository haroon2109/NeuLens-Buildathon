import React from 'react';

/**
 * NeuLensLogo — official brand logo rendered as an image logo with transparent background.
 *
 * Uses the official brand logo with white background cleanly removed:
 *   • Full logo: Brain network + "NeuLens" (horizontal)
 *   • Icon mark: Brain network (used when hideText=true)
 */

type NeuLensLogoProps = {
  className?: string;
  /** Tailwind h-* class controlling overall height, e.g. "h-9", "h-10". Defaults to "h-9". */
  height?: string;
  /** Hide the "NeuLens" wordmark and show the brain mark only */
  hideText?: boolean;
  /** aria-label override */
  label?: string;
};

export const NeuLensLogo: React.FC<NeuLensLogoProps> = ({
  className = '',
  height = 'h-9',
  hideText = false,
  label = 'NeuLens',
}) => {
  const src = hideText ? '/neulens-mark.png' : '/neulens-logo-horizontal.png';

  return (
    <img
      src={src}
      alt={label}
      className={`block shrink-0 ${height} w-auto object-contain select-none ${className}`}
      draggable={false}
    />
  );
};

export default NeuLensLogo;
