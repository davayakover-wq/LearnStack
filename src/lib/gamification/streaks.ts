// Daily streak calculation with a grace/freeze mechanic (docs/01-features.md:
// "daily streak (with a grace/freeze mechanic)"). Pure and framework-
// agnostic per docs/07-folder-structure.md's rationale for lib/gamification.

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // YYYY-MM-DD
}

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakExtended: boolean; // currentStreak increased (including a freeze-covered gap)
  freezeUsed: boolean; // exactly one day was skipped and covered by the grace day
  streakBroken: boolean; // two+ days were missed, streak reset to 1
}

function daysBetween(earlier: string, later: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((Date.parse(later) - Date.parse(earlier)) / msPerDay);
}

function todayKey(today: Date): string {
  return today.toISOString().slice(0, 10);
}

// v1's schema has no purchasable/limited freeze inventory (no
// "freezes_available" column on profiles) — so the grace mechanic is the
// simplest faithful reading: one automatic grace day per gap, covering
// exactly one missed day without resetting the streak. Missing two or more
// consecutive days breaks it back down to 1 (starting fresh today).
export function computeStreakUpdate(
  state: StreakState,
  today: Date = new Date(),
): StreakUpdate {
  const todayStr = todayKey(today);

  if (state.lastActivityDate === todayStr) {
    // Already recorded activity today — nothing to change.
    return {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActivityDate: todayStr,
      streakExtended: false,
      freezeUsed: false,
      streakBroken: false,
    };
  }

  const gapDays = state.lastActivityDate
    ? daysBetween(state.lastActivityDate, todayStr)
    : null;

  let currentStreak: number;
  let freezeUsed = false;
  let streakBroken = false;

  if (gapDays === 1) {
    currentStreak = state.currentStreak + 1;
  } else if (gapDays === 2) {
    currentStreak = state.currentStreak + 1;
    freezeUsed = true;
  } else {
    currentStreak = 1;
    streakBroken = gapDays !== null && gapDays > 2;
  }

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActivityDate: todayStr,
    streakExtended: true,
    freezeUsed,
    streakBroken,
  };
}
