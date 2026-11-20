import React from 'react';
import {
  Brain,
  CircleCheck,
  Heart,
  Languages,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

type IllustrationVariant = 'care' | 'language' | 'secure' | 'complete' | 'clinical';
type IllustrationSize = 'micro' | 'compact' | 'regular';

type ClinicalIllustrationProps = {
  variant?: IllustrationVariant;
  size?: IllustrationSize;
  className?: string;
};

const variantCopy: Record<IllustrationVariant, string> = {
  care: 'Patient care',
  language: 'Language options',
  secure: 'Secure patient information',
  complete: 'Screening complete',
  clinical: 'Cognitive health',
};

const variantIcons: Record<IllustrationVariant, LucideIcon> = {
  care: Heart,
  language: Languages,
  secure: ShieldCheck,
  complete: CircleCheck,
  clinical: Brain,
};

const sizeClasses: Record<IllustrationSize, string> = {
  micro: 'clinical-illustration-micro',
  compact: 'clinical-illustration-compact',
  regular: 'clinical-illustration-regular',
};

export const ClinicalIllustration: React.FC<ClinicalIllustrationProps> = ({
  variant = 'clinical',
  size = 'regular',
  className = '',
}) => {
  const Icon = variantIcons[variant];

  return (
    <div
      className={`clinical-illustration ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label={variantCopy[variant]}
    >
      <span className="clinical-illustration-icon" aria-hidden="true">
        <Icon />
      </span>
    </div>
  );
};

export default ClinicalIllustration;
