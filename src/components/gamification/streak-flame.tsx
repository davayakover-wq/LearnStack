'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

// The flame "pulses/scales" on streak extension (docs/02-ux-design-
// system.md). `pulse` should be true only right after an extension —
// reduced motion collapses the scale pulse to a simple opacity flash.
export function StreakFlame({
  pulse,
  className,
}: {
  pulse?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={
        pulse ? (reducedMotion ? { opacity: [0.5, 1] } : { scale: [1, 1.35, 1] }) : {}
      }
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn('inline-flex', className)}
    >
      <Flame className="text-warning size-4" />
    </motion.div>
  );
}
