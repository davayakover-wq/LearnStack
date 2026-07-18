import { createClient } from '@/lib/supabase/server';
import { getQuestionForPlayer, type QuestionForPlayer } from '@/lib/data/lessons';
import { createInitialReviewState, sm2 } from '@/lib/srs/sm2';

export interface DueReviewItem {
  reviewScheduleId: string;
  question: QuestionForPlayer;
  dueCount: number; // total items due today (including this one)
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// One due item at a time — the review session pulls the next card without a
// full page navigation (docs/06-api-architecture.md), same rationale as the
// lesson/quiz players' React-Query-driven loops.
export async function getNextDueReviewItem(
  userId: string,
): Promise<DueReviewItem | null> {
  const supabase = await createClient();
  const { data: dueRows } = await supabase
    .from('review_schedule')
    .select('id, question_id')
    .eq('user_id', userId)
    .lte('due_at', todayDateKey())
    .order('due_at', { ascending: true })
    .limit(50);

  if (!dueRows || dueRows.length === 0) return null;

  const [first] = dueRows;
  const question = await getQuestionForPlayer(first.question_id);
  if (!question) return null;

  return { reviewScheduleId: first.id, question, dueCount: dueRows.length };
}

// Called after *every* question a user answers anywhere in the app (lesson
// exercises and quiz questions alike) — docs/01-features.md: "every question
// a user answers creates or updates a review_schedule row." Wrong answers
// reset the interval and lower ease; correct answers lengthen the interval
// (see lib/srs/sm2.ts for the exact quality mapping).
export async function recordReviewOutcome(
  userId: string,
  questionId: string,
  isCorrect: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('review_schedule')
    .select('ease_factor, interval_days, repetitions')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  const currentState = existing
    ? {
        easeFactor: Number(existing.ease_factor),
        intervalDays: existing.interval_days,
        repetitions: existing.repetitions,
      }
    : createInitialReviewState();

  const update = sm2(currentState, isCorrect);

  const { error } = await supabase.from('review_schedule').upsert(
    {
      user_id: userId,
      question_id: questionId,
      ease_factor: update.easeFactor,
      interval_days: update.intervalDays,
      repetitions: update.repetitions,
      memory_strength: update.memoryStrength,
      due_at: update.dueAt,
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,question_id' },
  );
  if (error) throw error;
}
