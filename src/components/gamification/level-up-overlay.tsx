'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// "Full-screen celebratory overlay, skippable" (docs/02-ux-design-
// system.md). Controlled by the parent — mounted only while `open`,
// dismissible by clicking anywhere or the explicit button.
export function LevelUpOverlay({
  level,
  open,
  onDismiss,
}: {
  level: number;
  open: boolean;
  onDismiss: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={`Level ${level} reached`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          className="bg-background/95 fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-4 backdrop-blur-sm"
        >
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0.3 : 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="bg-xp/15 text-xp flex size-24 items-center justify-center rounded-full">
              <Sparkles className="size-12" />
            </div>
            <h2 className="text-3xl font-bold">Level {level}!</h2>
            <p className="text-muted-foreground">You leveled up. Keep it going.</p>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
