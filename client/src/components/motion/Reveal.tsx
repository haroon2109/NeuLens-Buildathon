import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * One motion scale, three jobs. Anything longer than `reveal` makes the
 * interface wait for the animation, which is exactly what it should never do.
 *
 * The CSS counterparts live in styles/index.css, styles/portalDesignSystem.css
 * and features/landing/landingStyles.css — keep the numbers in step.
 */
export const MOTION = {
  ease: [0.22, 1, 0.36, 1] as const,
  swap: 0.18,
  reveal: 0.24
};

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

export const MotionReveal: React.FC<Props> = ({ children, className = '', delay = 0, y = 8, once = true }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const safeDelay = delay > 5 ? delay / 1000 : delay;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15 }}
      transition={{ duration: MOTION.reveal, ease: MOTION.ease, delay: safeDelay }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Swap — for content that is replaced in place (tab panels, filtered lists).
 *
 * Put a `key` on it at the call site: the new pane fades and settles up a few
 * pixels while the old one leaves immediately. There is no exit animation on
 * purpose; waiting for an outgoing panel to finish would make a tab click feel
 * slower than no animation at all.
 */
export const Swap: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.swap, ease: MOTION.ease }}
    >
      {children}
    </motion.div>
  );
};

export const GentleFloat: React.FC<{ children: React.ReactNode; className?: string; amplitude?: number; duration?: number }> = ({
  children,
  className = '',
  amplitude = 6,
  duration = 6,
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

export const Stagger: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: MOTION.reveal, ease: MOTION.ease } } }}
    >
      {children}
    </motion.div>
  );
};
