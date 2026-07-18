// The leveling curve — shared so the dashboard's level/progress display and
// the future XP-awarding Server Action (Phase 9) agree on the same math.
// Quadratic curve: level n requires 50 * n * (n-1) cumulative XP, so each
// level costs progressively more (level 2 = 100 XP, level 3 = 300 XP total).
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
}

export function levelProgress(xp: number): LevelProgress {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 1,
  };
}
