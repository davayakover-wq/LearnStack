import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';

export interface DailyStatPoint {
  date: string; // YYYY-MM-DD
  minutes: number;
  xp: number;
  lessonsCompleted: number;
  correct: number;
  incorrect: number;
}

export interface PeriodStatPoint {
  periodStart: string; // YYYY-MM-DD
  totalMinutes: number;
  totalXp: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  accuracyPercent: number | null;
}

export interface TopicAccuracy {
  topicId: string;
  topicName: string;
  subjectSlug: Tables<'subjects'>['slug'];
  correct: number;
  total: number;
  accuracyPercent: number;
}

export interface StatsPageData {
  daily: DailyStatPoint[]; // last 30 days, zero-filled
  weekly: PeriodStatPoint[]; // last 12 weeks, zero-filled
  monthly: PeriodStatPoint[]; // last 12 months, zero-filled
  topicAccuracy: TopicAccuracy[]; // weakest first
  streakDates: Set<string>;
}

type DailyActivityRow = Pick<
  Tables<'daily_activity'>,
  | 'activity_date'
  | 'minutes_spent'
  | 'xp_earned'
  | 'lessons_completed'
  | 'correct_answers'
  | 'incorrect_answers'
>;

// Shared by the dashboard's 7-day WeeklyChart and this page's 30-day chart —
// same zero-filled shape, just a different window. Uses UTC date math
// throughout (not just for the lookup key) so a timezone ahead of UTC can't
// shift which calendar day a row lands in — see CalendarHeatmap's identical
// concern.
export function buildDailyActivitySeries(
  rows: DailyActivityRow[],
  days: number,
  today: Date = new Date(),
): DailyStatPoint[] {
  const byDate = new Map(rows.map((row) => [row.activity_date, row]));
  const series: DailyStatPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    );
    const key = day.toISOString().slice(0, 10);
    const row = byDate.get(key);
    series.push({
      date: key,
      minutes: row?.minutes_spent ?? 0,
      xp: row?.xp_earned ?? 0,
      lessonsCompleted: row?.lessons_completed ?? 0,
      correct: row?.correct_answers ?? 0,
      incorrect: row?.incorrect_answers ?? 0,
    });
  }
  return series;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Sunday-start week, matching the dashboard WeeklyChart's DAY_LABELS
// convention (['Sun', 'Mon', ...]).
function startOfWeekUtc(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonthsUtc(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function accuracyFrom(correct: number, incorrect: number): number | null {
  const total = correct + incorrect;
  return total > 0 ? Math.round((correct / total) * 1000) / 10 : null;
}

async function upsertPeriodStatistics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  periodType: Tables<'statistics'>['period_type'],
  periodStart: string,
  periodEnd: string,
) {
  const { data: rows } = await supabase
    .from('daily_activity')
    .select(
      'minutes_spent, xp_earned, lessons_completed, quizzes_completed, correct_answers, incorrect_answers',
    )
    .eq('user_id', userId)
    .gte('activity_date', periodStart)
    .lte('activity_date', periodEnd);

  const totals = (rows ?? []).reduce(
    (acc, row) => ({
      minutes: acc.minutes + row.minutes_spent,
      xp: acc.xp + row.xp_earned,
      lessons: acc.lessons + row.lessons_completed,
      quizzes: acc.quizzes + row.quizzes_completed,
      correct: acc.correct + row.correct_answers,
      incorrect: acc.incorrect + row.incorrect_answers,
    }),
    { minutes: 0, xp: 0, lessons: 0, quizzes: 0, correct: 0, incorrect: 0 },
  );

  const { error } = await supabase.from('statistics').upsert(
    {
      user_id: userId,
      period_type: periodType,
      period_start: periodStart,
      total_minutes: totals.minutes,
      total_xp: totals.xp,
      lessons_completed: totals.lessons,
      quizzes_completed: totals.quizzes,
      accuracy_percent: accuracyFrom(totals.correct, totals.incorrect),
    },
    { onConflict: 'user_id,period_type,period_start' },
  );
  if (error) throw error;
}

// Recomputes the *current* week's and month's rollup from scratch (not an
// incremental += — avoids drift) — called whenever daily_activity changes
// for that period (docs/06-api-architecture.md: "Statistics rollups...
// written by application logic when daily_activity changes").
export async function recalculateStatistics(userId: string, date: Date = new Date()) {
  const supabase = await createClient();
  const weekStart = startOfWeekUtc(date);
  const monthStart = startOfMonthUtc(date);
  await Promise.all([
    upsertPeriodStatistics(
      supabase,
      userId,
      'weekly',
      toDateKey(weekStart),
      toDateKey(addDaysUtc(weekStart, 6)),
    ),
    upsertPeriodStatistics(
      supabase,
      userId,
      'monthly',
      toDateKey(monthStart),
      toDateKey(addDaysUtc(addMonthsUtc(monthStart, 1), -1)),
    ),
  ]);
}

function zeroFillPeriods(
  rows: Tables<'statistics'>[],
  periodStarts: string[],
): PeriodStatPoint[] {
  const byPeriod = new Map(rows.map((row) => [row.period_start, row]));
  return periodStarts.map((periodStart) => {
    const row = byPeriod.get(periodStart);
    return {
      periodStart,
      totalMinutes: row?.total_minutes ?? 0,
      totalXp: row?.total_xp ?? 0,
      lessonsCompleted: row?.lessons_completed ?? 0,
      quizzesCompleted: row?.quizzes_completed ?? 0,
      accuracyPercent: row ? Number(row.accuracy_percent) : null,
    };
  });
}

// Per-topic accuracy has no dedicated rollup column anywhere (neither
// `statistics` nor `daily_activity` track topic granularity) — it's derived
// directly from question_attempts, resolving each question's topic through
// whichever path applies: quiz questions via questions.quiz_id ->
// quizzes.topic_id, lesson-embedded questions via lesson_sections ->
// lessons.topic_id. Also naturally includes review-session-sourced
// attempts, since resolution is keyed off the question itself, not which
// context recorded the attempt.
async function getTopicAccuracy(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<TopicAccuracy[]> {
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select('question_id, is_correct')
    .eq('user_id', userId);
  if (!attempts || attempts.length === 0) return [];

  const questionIds = Array.from(new Set(attempts.map((a) => a.question_id)));
  const { data: questions } = await supabase
    .from('questions')
    .select('id, quiz_id')
    .in('id', questionIds);

  const quizIds = Array.from(
    new Set((questions ?? []).flatMap((q) => (q.quiz_id ? [q.quiz_id] : []))),
  );
  const lessonQuestionIds = (questions ?? []).filter((q) => !q.quiz_id).map((q) => q.id);

  const [{ data: quizzes }, { data: sections }] = await Promise.all([
    quizIds.length > 0
      ? supabase.from('quizzes').select('id, topic_id').in('id', quizIds)
      : Promise.resolve({ data: [] as { id: string; topic_id: string }[] }),
    lessonQuestionIds.length > 0
      ? supabase
          .from('lesson_sections')
          .select('question_id, lesson_id')
          .in('question_id', lessonQuestionIds)
      : Promise.resolve({
          data: [] as { question_id: string | null; lesson_id: string }[],
        }),
  ]);
  const topicIdByQuiz = new Map((quizzes ?? []).map((q) => [q.id, q.topic_id]));
  const lessonIdByQuestion = new Map(
    (sections ?? [])
      .filter((s) => s.question_id)
      .map((s) => [s.question_id as string, s.lesson_id]),
  );

  const lessonIds = Array.from(new Set([...lessonIdByQuestion.values()]));
  const { data: lessons } =
    lessonIds.length > 0
      ? await supabase.from('lessons').select('id, topic_id').in('id', lessonIds)
      : { data: [] as { id: string; topic_id: string }[] };
  const topicIdByLesson = new Map((lessons ?? []).map((l) => [l.id, l.topic_id]));

  const topicIdByQuestion = new Map<string, string>();
  for (const q of questions ?? []) {
    if (q.quiz_id) {
      const topicId = topicIdByQuiz.get(q.quiz_id);
      if (topicId) topicIdByQuestion.set(q.id, topicId);
    } else {
      const lessonId = lessonIdByQuestion.get(q.id);
      const topicId = lessonId ? topicIdByLesson.get(lessonId) : undefined;
      if (topicId) topicIdByQuestion.set(q.id, topicId);
    }
  }

  const statsByTopic = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const topicId = topicIdByQuestion.get(attempt.question_id);
    if (!topicId) continue;
    const entry = statsByTopic.get(topicId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (attempt.is_correct) entry.correct += 1;
    statsByTopic.set(topicId, entry);
  }
  if (statsByTopic.size === 0) return [];

  const topicIdsWithStats = Array.from(statsByTopic.keys());
  const [{ data: topics }, { data: subjects }] = await Promise.all([
    supabase.from('topics').select('id, name, subject_id').in('id', topicIdsWithStats),
    supabase.from('subjects').select('id, slug'),
  ]);
  const subjectSlugById = new Map((subjects ?? []).map((s) => [s.id, s.slug]));

  return (topics ?? [])
    .map((topic) => {
      const stat = statsByTopic.get(topic.id)!;
      return {
        topicId: topic.id,
        topicName: topic.name,
        subjectSlug: subjectSlugById.get(topic.subject_id) ?? ('english' as const),
        correct: stat.correct,
        total: stat.total,
        accuracyPercent: Math.round((stat.correct / stat.total) * 1000) / 10,
      };
    })
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);
}

export async function getStatsPageData(userId: string): Promise<StatsPageData> {
  const supabase = await createClient();
  const today = new Date();

  const dailyRangeStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29),
  );
  const calendarStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 83),
  );

  const weekStarts: string[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    weekStarts.push(toDateKey(addDaysUtc(startOfWeekUtc(today), -7 * i)));
  }
  const monthStarts: string[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    monthStarts.push(toDateKey(addMonthsUtc(startOfMonthUtc(today), -i)));
  }

  const [
    { data: dailyActivityRows },
    { data: weeklyRows },
    { data: monthlyRows },
    { data: streakRows },
    topicAccuracy,
  ] = await Promise.all([
    supabase
      .from('daily_activity')
      .select(
        'activity_date, minutes_spent, xp_earned, lessons_completed, quizzes_completed, correct_answers, incorrect_answers',
      )
      .eq('user_id', userId)
      .gte('activity_date', toDateKey(dailyRangeStart)),
    supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', 'weekly')
      .gte('period_start', weekStarts[0]),
    supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', 'monthly')
      .gte('period_start', monthStarts[0]),
    supabase
      .from('streaks')
      .select('activity_date')
      .eq('user_id', userId)
      .gte('activity_date', toDateKey(calendarStart)),
    getTopicAccuracy(supabase, userId),
  ]);

  return {
    daily: buildDailyActivitySeries(dailyActivityRows ?? [], 30, today),
    weekly: zeroFillPeriods(weeklyRows ?? [], weekStarts),
    monthly: zeroFillPeriods(monthlyRows ?? [], monthStarts),
    topicAccuracy,
    streakDates: new Set((streakRows ?? []).map((r) => r.activity_date)),
  };
}
