import React from 'react';

type NeulensWordmarkProps = {
  className?: string;
  size?: 'small' | 'medium' | 'large';
};

const wordmarkSizes = {
  small: 'text-lg leading-none tracking-[-0.07em]',
  medium: 'text-3xl leading-none tracking-[-0.07em]',
  large: 'text-[3.2rem] leading-none tracking-[-0.08em]',
} as const;

export const NeulensWordmark: React.FC<NeulensWordmarkProps> = ({
  className = '',
  size = 'medium',
}) => (
  <span
    className={`inline-flex shrink-0 items-center font-black ${wordmarkSizes[size]} ${className}`}
    role="img"
    aria-label="Neulens"
  >
    <span className="text-ink">Neu</span>
    <span className="text-forest">Lens</span>
  </span>
);

export default NeulensWordmark;
