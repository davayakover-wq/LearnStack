import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/data/profile';
import {
  getLessonRewardInfo,
  getLessonSectionRefs,
  getLessonUnlockState,
} from '@/lib/data/lessons';
import {
  completeLessonSection,
  getLessonProgress,
  gradeQuestionResponse,
  hasCompletedLessonBefore,
  recalculateTopicMastery,
  recordQuestionAttempt,
  type AnswerGrade,
} from '@/lib/data/progress';
import { recordCompletionRewards, type CompletionRewards } from '@/lib/data/gamification';
import { recordReviewOutcome } from '@/lib/data/review';
import { completeSectionSchema } from '@/lib/validations/lesson';

// The one write path for "the user viewed/answered a lesson section" — see
// docs/06-api-architecture.md's Route Handlers inventory. Used via React
// Query from the lesson player (a rapid fetch-mutate-fetch loop, not a
// one-shot form submission, so a Server Action isn't the right fit here).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string; sectionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      { status: 401 },
    );
  }

  const { lessonId, sectionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = completeSectionSchema.safeParse(body);
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

  // Defense in depth: the lesson page already redirects away from locked
  // lessons, but that's a UI-layer check — a client could call this route
  // directly. Allow it only if already unlocked, or if the user already has
  // a progress row (started/completed before, don't re-lock on revisit).
  const [unlockState, existingProgress] = await Promise.all([
    getLessonUnlockState(user.id),
    getLessonProgress(user.id, lessonId, parsed.data.mode),
  ]);
  if (!existingProgress && !unlockState.isUnlocked(lessonId)) {
    return NextResponse.json(
      { error: { code: 'forbidden', message: 'This lesson is locked.' } },
      { status: 403 },
    );
  }

  // Section membership, ordering, and total count are always derived
  // server-side — never trusted from the client — so a client can't
  // fabricate its own completion percentage or skip ahead.
  const sections = await getLessonSectionRefs(lessonId);
  const sectionIndex = sections.findIndex((s) => s.id === sectionId);
  if (sectionIndex === -1) {
    return NextResponse.json(
      { error: { code: 'not_found', message: 'Section not found for this lesson.' } },
      { status: 404 },
    );
  }
  const section = sections[sectionIndex];

  // Read before completeLessonSection flips this call's row to 'completed' —
  // XP is awarded once per lesson (first completion in any mode), not per
  // mode and not on re-completion (see hasCompletedLessonBefore's comment).
  const alreadyCompletedLesson = await hasCompletedLessonBefore(user.id, lessonId);

  let grade: AnswerGrade | null = null;
  if (section.sectionType === 'interactive_exercise') {
    if (!section.questionId) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_state',
            message: 'This exercise has no linked question.',
          },
        },
        { status: 500 },
      );
    }
    if (!parsed.data.response) {
      return NextResponse.json(
        { error: { code: 'invalid_input', message: 'This section requires an answer.' } },
        { status: 400 },
      );
    }
    grade = await gradeQuestionResponse(section.questionId, parsed.data.response);
  }

  const progress = await completeLessonSection({
    userId: user.id,
    lessonId,
    sectionId,
    mode: parsed.data.mode,
    totalSections: sections.length,
    sectionIndex,
    isCorrect: grade?.isCorrect,
    timeSpentSeconds: parsed.data.timeSpentSeconds,
  });

  if (section.sectionType === 'interactive_exercise' && section.questionId && grade) {
    await recordQuestionAttempt({
      userId: user.id,
      questionId: section.questionId,
      isCorrect: grade.isCorrect,
      response: parsed.data.response ?? null,
      lessonProgressId: progress.id,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
    });
    // Every answered question feeds the spaced-repetition schedule, not
    // just wrong ones — see lib/data/review.ts.
    await recordReviewOutcome(user.id, section.questionId, grade.isCorrect);
  }

  // user_progress is scoped to 'practice' mode (same convention
  // getLessonsForTopic already uses for topic-level status/locking), so
  // challenge/review-mode completions don't skew the topic mastery rollup.
  const lessonMeta = await getLessonRewardInfo(lessonId);
  if (parsed.data.mode === 'practice' && lessonMeta) {
    await recalculateTopicMastery(user.id, lessonMeta.topicId);
  }

  // Streak and achievement checks run on *every* full completion, first
  // time or not — redoing an already-finished lesson still counts as
  // today's activity for streak purposes, and could still be the call that
  // pushes a streak/quiz-score achievement over its threshold. Only the
  // lesson's own XP is gated to a genuine first-time completion (via
  // xpAmount=0 below) and only a first-time completion counts toward
  // daily_activity's lessons_completed counter (via isLessonCompletion).
  let rewards: CompletionRewards | null = null;
  if (progress.status === 'completed' && lessonMeta) {
    rewards = await recordCompletionRewards({
      userId: user.id,
      xpAmount: alreadyCompletedLesson ? 0 : lessonMeta.xpReward,
      timeSpentSeconds: parsed.data.timeSpentSeconds ?? 0,
      isLessonCompletion: !alreadyCompletedLesson,
      isQuizCompletion: false,
      // The whole lesson's totals, not just this last section's grade —
      // recordCompletionRewards only runs once per lesson (on completion),
      // so daily_activity's correct/incorrect needs the cumulative count
      // across all of this lesson's exercise sections, already tracked on
      // lesson_progress (same rationale as the quiz route's identical fix).
      correctDelta: progress.correct_count,
      incorrectDelta: progress.incorrect_count,
    });
  }

  return NextResponse.json({ progress, grade, rewards });
}
