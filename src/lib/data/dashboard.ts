import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import {
  getLessonUnlockState,
  getPublishedLessons,
  getTopicsAndSubjectsMaps,
  joinLessonsWithContext,
  type LessonWithContext,
} from '@/lib/data/lessons';
import { buildDailyActivitySeries, type DailyStatPoint } from '@/lib/data/stats';

export type { LessonWithContext };

// Same shape stats.ts's 30-day chart uses — see buildDailyActivitySeries.
export type WeeklyActivityDay = DailyStatPoint;

export interface ContinueLearning {
  lesson: LessonWithContext;
  completionPercent: number;
  mode: Tables<'lesson_progress'>['mode'];
}

export interface ActivityFeedItem {
  id: string;
  type: 'xp' | 'achievement';
  label: string;
  detail: string;
  amount?: number;
  occurredAt: string;
}

export interface AchievementProgress {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  xpBonus: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface StatsSummary {
  totalMinutes: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  accuracyPercent: number | null;
}

export interface DashboardData {
  weeklyActivity: WeeklyActivityDay[];
  continueLearning: ContinueLearning | null;
  recommendedLessons: LessonWithContext[];
  recentActivity: ActivityFeedItem[];
  achievements: AchievementProgress[];
  streakDates: Set<string>;
  statsSummary: StatsSummary;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const calendarStart = new Date(today);
  calendarStart.setDate(today.getDate() - 83); // 12 weeks for the heatmap

  const [
    { data: dailyActivityRows },
    { data: inProgressRows },
    publishedLessons,
    { topicsById, subjectsById },
    unlockState,
    { data: xpHistoryRows },
    { data: userAchievementRows },
    { data: achievementRows },
    { data: streakRows },
  ] = await Promise.all([
    supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', toDateKey(sevenDaysAgo)),
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(1),
    getPublishedLessons(),
    getTopicsAndSubjectsMaps(),
    getLessonUnlockState(userId),
    supabase
      .from('xp_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false }),
    supabase.from('achievements').select('*').order('xp_bonus', { ascending: true }),
    supabase
      .from('streaks')
      .select('activity_date')
      .eq('user_id', userId)
      .gte('activity_date', toDateKey(calendarStart)),
  ]);

  const [
    { data: allTimeActivity },
    { data: allCompletedLessons },
    { data: allCompletedQuizzes },
  ] = await Promise.all([
    supabase
      .from('daily_activity')
      .select('minutes_spent, correct_answers, incorrect_answers')
      .eq('user_id', userId),
    supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('quiz_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed'),
  ]);

  // ---- weekly activity, zero-filled -------------------------------------
  const weeklyActivity = buildDailyActivitySeries(dailyActivityRows ?? [], 7, today);

  // ---- continue learning --------------------------------------------------
  const inProgress = inProgressRows?.[0] ?? null;
  let continueLearning: ContinueLearning | null = null;
  if (inProgress) {
    const lesson = publishedLessons.find((l) => l.id === inProgress.lesson_id);
    if (lesson) {
      const [withContext] = joinLessonsWithContext([lesson], topicsById, subjectsById);
      if (withContext) {
        continueLearning = {
          lesson: withContext,
          completionPercent: Number(inProgress.completion_percent),
          mode: inProgress.mode,
        };
      }
    }
  }

  // ---- recommended lessons (DAG-aware, shared with /learn) ---------------
  const unlockedIncomplete = publishedLessons.filter((lesson) => {
    if (unlockState.completedLessonIds.has(lesson.id)) return false;
    if (inProgress && lesson.id === inProgress.lesson_id) return false;
    return unlockState.isUnlocked(lesson.id);
  });
  const recommendedLessons = joinLessonsWithContext(
    unlockedIncomplete.slice(0, 4),
    topicsById,
    subjectsById,
  );

  // ---- recent activity feed ------------------------------------------------
  const xpItems: ActivityFeedItem[] = (xpHistoryRows ?? []).map((row) => ({
    id: `xp-${row.id}`,
    type: 'xp',
    label: xpReasonLabel(row.reason),
    detail: `+${row.amount} XP`,
    amount: row.amount,
    occurredAt: row.created_at,
  }));
  const achievementsById = new Map((achievementRows ?? []).map((a) => [a.id, a]));
  const achievementItems: ActivityFeedItem[] = (userAchievementRows ?? []).map((row) => ({
    id: `achievement-${row.id}`,
    type: 'achievement',
    label: 'Achievement unlocked',
    detail: achievementsById.get(row.achievement_id)?.name ?? 'Achievement',
    occurredAt: row.unlocked_at,
  }));
  const recentActivity = [...xpItems, ...achievementItems]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 8);

  // ---- achievements shelf ---------------------------------------------------
  const unlockedByAchievementId = new Map(
    (userAchievementRows ?? []).map((r) => [r.achievement_id, r]),
  );
  const achievements: AchievementProgress[] = (achievementRows ?? []).map((a) => {
    const unlockedRow = unlockedByAchievementId.get(a.id);
    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpBonus: a.xp_bonus,
      unlocked: Boolean(unlockedRow),
      unlockedAt: unlockedRow?.unlocked_at ?? null,
    };
  });

  // ---- streak calendar -------------------------------------------------------
  const streakDates = new Set((streakRows ?? []).map((r) => r.activity_date));

  // ---- stats summary -----------------------------------------------------
  const totalMinutes = (allTimeActivity ?? []).reduce(
    (sum, row) => sum + row.minutes_spent,
    0,
  );
  const totalCorrect = (allTimeActivity ?? []).reduce(
    (sum, row) => sum + row.correct_answers,
    0,
  );
  const totalIncorrect = (allTimeActivity ?? []).reduce(
    (sum, row) => sum + row.incorrect_answers,
    0,
  );
  const totalAnswers = totalCorrect + totalIncorrect;
  const distinctCompletedLessons = new Set(
    (allCompletedLessons ?? []).map((r) => r.lesson_id),
  );

  const statsSummary: StatsSummary = {
    totalMinutes,
    totalLessonsCompleted: distinctCompletedLessons.size,
    totalQuizzesCompleted: (allCompletedQuizzes ?? []).length,
    accuracyPercent:
      totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 1000) / 10 : null,
  };

  return {
    weeklyActivity,
    continueLearning,
    recommendedLessons,
    recentActivity,
    achievements,
    streakDates,
    statsSummary,
  };
}

function xpReasonLabel(reason: Tables<'xp_history'>['reason']): string {
  switch (reason) {
    case 'lesson_complete':
      return 'Completed a lesson';
    case 'quiz_complete':
      return 'Completed a quiz';
    case 'streak_bonus':
      return 'Streak bonus';
    case 'achievement':
      return 'Achievement bonus';
    case 'daily_challenge':
      return 'Daily challenge';
    default:
      return 'XP earned';
  }
}
