import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { levelProgress } from '@/lib/gamification/xp';
import { computeStreakUpdate } from '@/lib/gamification/streaks';
import { recalculateStatistics } from '@/lib/data/stats';
import type { Tables } from '@/types/supabase';

type XpReason = Tables<'xp_history'>['reason'];

export interface UnlockedAchievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  xpBonus: number;
}

export interface CompletionRewards {
  xpAwarded: number;
  coinsAwarded: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  streak: {
    current: number;
    longest: number;
    extended: boolean;
    freezeUsed: boolean;
    broken: boolean;
  };
  unlockedAchievements: UnlockedAchievement[];
}

export interface CompletionEventInput {
  userId: string;
  xpAmount: number;
  timeSpentSeconds: number;
  isLessonCompletion: boolean;
  isQuizCompletion: boolean;
  correctDelta: number;
  incorrectDelta: number;
  quizScore?: number; // 0-100, only meaningful for quiz completions
}

// Coins are a secondary currency "earned alongside XP" (docs/01-features.md)
// with no spendable use yet in v1 (the shop/unlockables concept is [Ready],
// not built) — a simple, documented rule: half the XP awarded, rounded down.
function coinsForXp(xp: number): number {
  return Math.floor(xp / 2);
}

interface AchievementCriteria {
  type: 'lessons_completed' | 'streak' | 'quiz_score';
  value: number;
}

async function checkAndUnlockAchievements(
  userId: string,
  context: { lessonsCompletedCount: number; currentStreak: number; quizScore?: number },
): Promise<UnlockedAchievement[]> {
  const supabase = await createClient();
  const [{ data: allAchievements }, { data: unlockedRows }] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
  ]);
  const alreadyUnlocked = new Set((unlockedRows ?? []).map((r) => r.achievement_id));

  const newlyUnlocked: UnlockedAchievement[] = [];
  for (const achievement of allAchievements ?? []) {
    if (alreadyUnlocked.has(achievement.id)) continue;

    const criteria = achievement.criteria as unknown as AchievementCriteria;
    const met =
      (criteria.type === 'lessons_completed' &&
        context.lessonsCompletedCount >= criteria.value) ||
      (criteria.type === 'streak' && context.currentStreak >= criteria.value) ||
      (criteria.type === 'quiz_score' &&
        context.quizScore !== undefined &&
        context.quizScore >= criteria.value);
    if (!met) continue;

    // Unique (user_id, achievement_id) makes this safe against a concurrent
    // double-insert — a race just hits the constraint and is skipped below.
    const { error } = await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievement.id });
    if (error) continue;

    newlyUnlocked.push({
      id: achievement.id,
      slug: achievement.slug,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      xpBonus: achievement.xp_bonus,
    });
  }
  return newlyUnlocked;
}

// The single write path for "the user completed a lesson/quiz for the
// first time" — XP, coins, streak, achievement unlocks, and the
// daily_activity rollup all move together so they can never drift out of
// sync with each other. Callers (the lesson/quiz Route Handlers) are
// responsible for only invoking this on a genuine first-time completion —
// see their own comments for why re-completions/retakes don't re-trigger it.
export async function recordCompletionRewards(
  input: CompletionEventInput,
): Promise<CompletionRewards> {
  const supabase = await createClient();
  // profiles.xp/level/coins/current_streak/longest_streak/last_activity_date
  // are pinned back to their old value for any non-service-role caller by
  // the protect_profile_privileged_columns trigger (migration
  // 20260715000003_profiles.sql) — a deliberate guard against a user
  // self-escalating their own stats via the RLS-scoped client. This is
  // exactly the "trusted server context" docs/03-tech-stack.md reserves the
  // service-role key for, so the read+update of those specific columns uses
  // the admin client; everything else in this file stays on the regular
  // session-scoped client.
  const adminSupabase = createAdminClient();

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('xp, level, coins, current_streak, longest_streak, last_activity_date')
    .eq('id', input.userId)
    .single();
  if (!profile) throw new Error('Profile not found');

  const streakUpdate = computeStreakUpdate({
    currentStreak: profile.current_streak,
    longestStreak: profile.longest_streak,
    lastActivityDate: profile.last_activity_date,
  });

  const { count: lessonsCompletedCount } = await supabase
    .from('lesson_progress')
    .select('lesson_id', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .eq('status', 'completed')
    .eq('mode', 'practice');

  const unlockedAchievements = await checkAndUnlockAchievements(input.userId, {
    lessonsCompletedCount: lessonsCompletedCount ?? 0,
    currentStreak: streakUpdate.currentStreak,
    quizScore: input.quizScore,
  });

  const achievementXp = unlockedAchievements.reduce((sum, a) => sum + a.xpBonus, 0);
  const totalXp = input.xpAmount + achievementXp;
  const totalCoins = coinsForXp(input.xpAmount) + coinsForXp(achievementXp);
  const newXpTotal = profile.xp + totalXp;
  const newCoinsTotal = profile.coins + totalCoins;
  const newLevel = levelProgress(newXpTotal).level;
  const leveledUp = newLevel > profile.level;

  const { error: profileUpdateError } = await adminSupabase
    .from('profiles')
    .update({
      xp: newXpTotal,
      level: newLevel,
      coins: newCoinsTotal,
      current_streak: streakUpdate.currentStreak,
      longest_streak: streakUpdate.longestStreak,
      last_activity_date: streakUpdate.lastActivityDate,
    })
    .eq('id', input.userId);
  if (profileUpdateError) throw profileUpdateError;

  const baseReason: XpReason = input.isQuizCompletion
    ? 'quiz_complete'
    : 'lesson_complete';
  const xpHistoryRows: {
    user_id: string;
    amount: number;
    reason: XpReason;
    source_id?: string;
  }[] = [
    { user_id: input.userId, amount: input.xpAmount, reason: baseReason },
    ...unlockedAchievements.map((a) => ({
      user_id: input.userId,
      amount: a.xpBonus,
      reason: 'achievement' as const,
      source_id: a.id,
    })),
  ].filter((row) => row.amount > 0);
  if (xpHistoryRows.length > 0) {
    const { error: xpHistoryError } = await supabase
      .from('xp_history')
      .insert(xpHistoryRows);
    if (xpHistoryError) throw xpHistoryError;
  }

  // streaks is genuinely append-only (docs/04-database-schema.md) — its RLS
  // only grants insert, not update, so this can't be an upsert. That's also
  // the semantically correct behavior: a second completion on a day already
  // recorded doesn't change that day's streak count (computeStreakUpdate
  // already returns the same currentStreak/freezeUsed for same-day calls),
  // so there's nothing to update — only insert the first time a given day
  // sees activity.
  const { data: existingStreakRow } = await supabase
    .from('streaks')
    .select('id')
    .eq('user_id', input.userId)
    .eq('activity_date', streakUpdate.lastActivityDate)
    .maybeSingle();
  if (!existingStreakRow) {
    const { error: streakLedgerError } = await supabase.from('streaks').insert({
      user_id: input.userId,
      activity_date: streakUpdate.lastActivityDate,
      streak_count_at_date: streakUpdate.currentStreak,
      freeze_used: streakUpdate.freezeUsed,
    });
    if (streakLedgerError) throw streakLedgerError;
  }

  const { data: existingActivity } = await supabase
    .from('daily_activity')
    .select('*')
    .eq('user_id', input.userId)
    .eq('activity_date', streakUpdate.lastActivityDate)
    .maybeSingle();
  const { error: dailyActivityError } = await supabase.from('daily_activity').upsert(
    {
      user_id: input.userId,
      activity_date: streakUpdate.lastActivityDate,
      minutes_spent:
        (existingActivity?.minutes_spent ?? 0) + Math.round(input.timeSpentSeconds / 60),
      lessons_completed:
        (existingActivity?.lessons_completed ?? 0) + (input.isLessonCompletion ? 1 : 0),
      quizzes_completed:
        (existingActivity?.quizzes_completed ?? 0) + (input.isQuizCompletion ? 1 : 0),
      xp_earned: (existingActivity?.xp_earned ?? 0) + totalXp,
      correct_answers: (existingActivity?.correct_answers ?? 0) + input.correctDelta,
      incorrect_answers:
        (existingActivity?.incorrect_answers ?? 0) + input.incorrectDelta,
    },
    { onConflict: 'user_id,activity_date' },
  );
  if (dailyActivityError) throw dailyActivityError;

  // Keep the current week's/month's precomputed rollup in sync with the
  // daily_activity row that just changed (docs/06-api-architecture.md).
  await recalculateStatistics(input.userId, new Date(streakUpdate.lastActivityDate));

  return {
    xpAwarded: totalXp,
    coinsAwarded: totalCoins,
    newXp: newXpTotal,
    newLevel,
    leveledUp,
    streak: {
      current: streakUpdate.currentStreak,
      longest: streakUpdate.longestStreak,
      extended: streakUpdate.streakExtended,
      freezeUsed: streakUpdate.freezeUsed,
      broken: streakUpdate.streakBroken,
    },
    unlockedAchievements,
  };
}
