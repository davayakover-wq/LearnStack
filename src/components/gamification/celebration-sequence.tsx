'use client';

import { useState } from 'react';
import { XpGainPopup } from '@/components/gamification/xp-gain-popup';
import { AchievementToast } from '@/components/gamification/achievement-toast';
import { LevelUpOverlay } from '@/components/gamification/level-up-overlay';
import type { CompletionRewards } from '@/lib/data/gamification';

// Shared by the lesson player's "finished" screen and the quiz player's
// "results" screen — both need the exact same celebration sequencing, so it
// lives here once rather than being reimplemented at each call site.
// Smaller celebrations first: XP popup renders immediately, achievement
// unlocks are stepped through one at a time, and the full-screen level-up
// overlay (if any) comes last so it doesn't compete for attention with a
// modal that's still open.
//
// No effect resets `achievementIndex`/`levelUpDismissed` when `rewards`
// changes — there's nothing to reset. The parent only renders this
// component once it transitions into its finished/results view, so this
// mounts fresh (with fresh initial state) exactly when a new `rewards`
// value first appears.
export function CelebrationSequence({ rewards }: { rewards: CompletionRewards | null }) {
  const [achievementIndex, setAchievementIndex] = useState(0);
  const [levelUpDismissed, setLevelUpDismissed] = useState(false);

  if (!rewards) return null;

  const achievements = rewards.unlockedAchievements;
  const currentAchievement = achievements[achievementIndex] ?? null;
  const showLevelUp =
    rewards.leveledUp && achievementIndex >= achievements.length && !levelUpDismissed;

  return (
    <>
      {rewards.xpAwarded > 0 && <XpGainPopup amount={rewards.xpAwarded} />}
      <AchievementToast
        achievement={currentAchievement}
        open={currentAchievement !== null}
        onOpenChange={(open) => {
          if (!open) setAchievementIndex((i) => i + 1);
        }}
      />
      <LevelUpOverlay
        level={rewards.newLevel}
        open={showLevelUp}
        onDismiss={() => setLevelUpDismissed(true)}
      />
    </>
  );
}
