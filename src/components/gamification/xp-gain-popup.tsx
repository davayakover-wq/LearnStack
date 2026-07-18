'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// "+10 XP floats and fades" (docs/02-ux-design-system.md's celebration
// moments). Self-contained: mounts already visible and fades/floats on its
// own shortly after, so callers just render it once when rewards arrive
// rather than managing a show/hide timer themselves.
export function XpGainPopup({ amount }: { amount: number }) {
  const reducedMotion = useReducedMotion();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (amount <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: settled ? 0 : 1,
        y: reducedMotion ? 0 : settled ? -32 : -16,
      }}
      transition={{ duration: reducedMotion ? 0.2 : 0.6, ease: 'easeOut' }}
      className="text-xp flex items-center gap-1 text-lg font-semibold"
    >
      <Sparkles className="size-4" />+{amount} XP
    </motion.div>
  );
}
