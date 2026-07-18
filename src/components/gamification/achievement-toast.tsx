'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UnlockedAchievement } from '@/lib/data/gamification';

const CONFETTI_COLORS = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info'];
const CONFETTI_COUNT = 16;

// "Modal with confetti-style particle burst using a lightweight canvas or
// CSS approach, not a heavy dependency" (docs/02-ux-design-system.md) — a
// handful of small divs animated outward with Framer Motion, no canvas or
// confetti library. Skipped entirely under prefers-reduced-motion.
function ConfettiBurst() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        const angle = (i / CONFETTI_COUNT) * Math.PI * 2;
        const distance = 60 + (i % 3) * 20;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.5,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute top-1/2 left-1/2 size-1.5 rounded-full ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`}
          />
        );
      })}
    </div>
  );
}

export function AchievementToast({
  achievement,
  open,
  onOpenChange,
}: {
  achievement: UnlockedAchievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden text-center">
        {achievement && (
          <>
            <ConfettiBurst />
            <DialogHeader className="items-center">
              <div className="bg-warning/15 text-warning flex size-16 items-center justify-center rounded-full">
                <Award className="size-8" />
              </div>
              <DialogTitle className="text-lg">Achievement unlocked!</DialogTitle>
              <DialogDescription>
                <span className="text-foreground font-medium">{achievement.name}</span>
                <br />
                {achievement.description}
                {achievement.xpBonus > 0 && (
                  <>
                    <br />
                    <span className="text-xp">+{achievement.xpBonus} XP bonus</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
