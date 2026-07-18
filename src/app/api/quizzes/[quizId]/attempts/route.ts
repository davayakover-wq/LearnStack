import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/data/profile';
import {
  createQuizAttempt,
  getAnsweredQuestionIds,
  gradeQuestionResponse,
  hasCompletedQuizBefore,
  submitQuizAnswer,
} from '@/lib/data/progress';
import { recordCompletionRewards, type CompletionRewards } from '@/lib/data/gamification';
import { recordReviewOutcome } from '@/lib/data/review';
import { submitQuizAnswerSchema } from '@/lib/validations/quiz';

// POST starts (or resumes) an attempt; PATCH submits one answer at a time.
// Same rationale as the lesson section-complete route: a rapid interactive
// loop driven by React Query, not a one-shot form submission.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      { status: 401 },
    );
  }

  const { quizId } = await params;
  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('is_published', true)
    .maybeSingle();
  if (!quiz) {
    return NextResponse.json(
      { error: { code: 'not_found', message: 'Quiz not found.' } },
      { status: 404 },
    );
  }

  const attempt = await createQuizAttempt(user.id, quizId);
  const answeredQuestionIds = await getAnsweredQuestionIds(attempt.id);
  return NextResponse.json({ attempt, answeredQuestionIds });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      { status: 401 },
    );
  }

  const { quizId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = submitQuizAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_input',
          message: parsed.error.issues[0]?.message ?? 'Invalid input',
        },
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: question } = await supabase
    .from('questions')
    .select('id')
    .eq('id', parsed.data.questionId)
    .eq('quiz_id', quizId)
    .maybeSingle();
  if (!question) {
    return NextResponse.json(
      { error: { code: 'not_found', message: 'Question does not belong to this quiz.' } },
      { status: 404 },
    );
  }

  const grade = await gradeQuestionResponse(parsed.data.questionId, parsed.data.response);

  // Read before submitQuizAnswer can flip this attempt to 'completed' — XP
  // is awarded once per quiz, on the first-ever completed attempt, not on
  // every retake (see hasCompletedQuizBefore's comment).
  const alreadyCompletedQuiz = await hasCompletedQuizBefore(user.id, quizId);

  let result;
  try {
    result = await submitQuizAnswer({
      userId: user.id,
      quizId,
      quizProgressId: parsed.data.quizProgressId,
      questionId: parsed.data.questionId,
      isCorrect: grade.isCorrect,
      response: parsed.data.response,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
    });
  } catch {
    // submitQuizAnswer is the only call here that fails for an ordinary,
    // expected reason (a stale/invalid quizProgressId) — narrowly scoped so
    // a real bug in the calls below surfaces as its actual error instead of
    // being mislabeled as "attempt not found".
    return NextResponse.json(
      { error: { code: 'not_found', message: 'Quiz attempt not found for this user.' } },
      { status: 404 },
    );
  }

  // Every answered question feeds the spaced-repetition schedule, not just
  // wrong ones — see lib/data/review.ts.
  await recordReviewOutcome(user.id, parsed.data.questionId, grade.isCorrect);

  // Streak and achievement checks run on every full completion, first time
  // or not — see the lesson route's identical comment. Only the quiz's own
  // XP is gated to a genuine first-time completion.
  let rewards: CompletionRewards | null = null;
  if (result.isComplete) {
    const { data: quizMeta } = await supabase
      .from('quizzes')
      .select('xp_reward')
      .eq('id', quizId)
      .maybeSingle();
    if (quizMeta) {
      rewards = await recordCompletionRewards({
        userId: user.id,
        xpAmount: alreadyCompletedQuiz ? 0 : quizMeta.xp_reward,
        timeSpentSeconds: parsed.data.timeSpentSeconds ?? 0,
        isLessonCompletion: false,
        isQuizCompletion: !alreadyCompletedQuiz,
        // The *whole attempt's* totals, not just this last question's grade
        // — recordCompletionRewards only runs once per quiz (on
        // completion), so daily_activity's correct/incorrect needs the
        // cumulative count across all of this attempt's questions, already
        // tracked on quiz_progress.
        correctDelta: result.quizProgress.correct_count,
        incorrectDelta: result.quizProgress.incorrect_count,
        quizScore: result.quizProgress.score ?? undefined,
      });
    }
  }

  return NextResponse.json({
    grade,
    quizProgress: result.quizProgress,
    isComplete: result.isComplete,
    rewards,
  });
}
