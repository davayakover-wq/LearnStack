import { createClient } from '@/lib/supabase/server';
import type { Json, Tables } from '@/types/supabase';

export async function getLessonProgress(
  userId: string,
  lessonId: string,
  mode: Tables<'lesson_progress'>['mode'],
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('mode', mode)
    .maybeSingle();
  return data;
}

// XP is awarded once per lesson, the first time it's ever completed in any
// mode — not per mode, and not on re-completion. Without this check,
// completing the same lesson in practice, then challenge, then review would
// award XP three times for the same content. Called *before*
// completeLessonSection flips the current mode's row to 'completed'.
export async function hasCompletedLessonBefore(
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('status', 'completed');
  return (count ?? 0) > 0;
}

// Same rationale as hasCompletedLessonBefore, but for quizzes: quiz_progress
// is one row *per attempt* (retaking creates a new row), so without this
// check every retake would re-award the quiz's XP.
export async function hasCompletedQuizBefore(
  userId: string,
  quizId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('quiz_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .eq('status', 'completed');
  return (count ?? 0) > 0;
}

// user_progress is a denormalized per-topic rollup (docs/04-database-
// schema.md) recalculated from lesson_progress whenever it changes for that
// topic — application logic, not a DB trigger, so the mastery formula stays
// easy to tune (same reasoning docs/04 gives for the XP leveling curve).
// Docs/04 says "via a Server Action"; the actual trigger point is the
// lesson-section-complete Route Handler, which already owns this write
// path per docs/06-api-architecture.md (a Server Action would just be a
// redundant wrapper around the same one-shot call) — the point being made
// there is app-logic vs. a heavy DB trigger, not the specific mechanism.
export async function recalculateTopicMastery(userId: string, topicId: string) {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('topic_id', topicId)
    .eq('is_published', true);
  const lessonIds = (lessons ?? []).map((l) => l.id);
  const lessonsTotal = lessonIds.length;

  let lessonsCompleted = 0;
  let mastery = 0;
  let hasAnyProgress = false;

  if (lessonsTotal > 0) {
    const { data: progressRows } = await supabase
      .from('lesson_progress')
      .select('lesson_id, status, completion_percent')
      .eq('user_id', userId)
      .eq('mode', 'practice')
      .in('lesson_id', lessonIds);

    const progressByLesson = new Map((progressRows ?? []).map((p) => [p.lesson_id, p]));
    hasAnyProgress = (progressRows ?? []).length > 0;
    lessonsCompleted = lessonIds.filter(
      (id) => progressByLesson.get(id)?.status === 'completed',
    ).length;

    const totalCompletionPercent = lessonIds.reduce(
      (sum, id) => sum + Number(progressByLesson.get(id)?.completion_percent ?? 0),
      0,
    );
    mastery = Math.round((totalCompletionPercent / lessonsTotal) * 100) / 100;
  }

  const status: Tables<'user_progress'>['status'] =
    lessonsTotal > 0 && lessonsCompleted === lessonsTotal
      ? 'completed'
      : hasAnyProgress
        ? 'in_progress'
        : 'not_started';

  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      topic_id: topicId,
      status,
      mastery_percent: mastery,
      lessons_completed: lessonsCompleted,
      lessons_total: lessonsTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,topic_id' },
  );
  if (error) throw error;
}

export interface SectionCompletionInput {
  userId: string;
  lessonId: string;
  sectionId: string;
  mode: Tables<'lesson_progress'>['mode'];
  totalSections: number;
  sectionIndex: number; // 0-based position of this section in the ordered list
  isCorrect?: boolean; // only meaningful for interactive_exercise sections
  timeSpentSeconds?: number;
}

// Upserts the lesson_progress row for this (user, lesson, mode) — the single
// write path for "the user viewed/answered a section", called from
// app/api/lessons/[lessonId]/sections/[sectionId]/complete. No XP/streak
// side effects here: those are Phase 9 (docs/08-roadmap.md).
export async function completeLessonSection(input: SectionCompletionInput) {
  const supabase = await createClient();
  const {
    userId,
    lessonId,
    sectionId,
    mode,
    totalSections,
    sectionIndex,
    isCorrect,
    timeSpentSeconds = 0,
  } = input;

  const existing = await getLessonProgress(userId, lessonId, mode);
  const isLastSection = sectionIndex + 1 >= totalSections;
  const completionPercent = Math.min(
    Math.round(((sectionIndex + 1) / totalSections) * 1000) / 10,
    100,
  );

  const correctDelta = isCorrect === true ? 1 : 0;
  const incorrectDelta = isCorrect === false ? 1 : 0;

  const row = {
    user_id: userId,
    lesson_id: lessonId,
    mode,
    status: isLastSection ? ('completed' as const) : ('in_progress' as const),
    completion_percent: completionPercent,
    correct_count: (existing?.correct_count ?? 0) + correctDelta,
    incorrect_count: (existing?.incorrect_count ?? 0) + incorrectDelta,
    time_spent_seconds: (existing?.time_spent_seconds ?? 0) + timeSpentSeconds,
    last_section_id: sectionId,
    completed_at: isLastSection ? new Date().toISOString() : existing?.completed_at,
  };

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(row, { onConflict: 'user_id,lesson_id,mode' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface AnswerGrade {
  isCorrect: boolean;
  explanation: string | null;
  // Only ever sent to the client *after* it has submitted a response — the
  // question payload rendered before submission (QuestionForPlayer) never
  // includes this, so there's nothing to peek at ahead of time.
  correctAnswerIds: string[];
  correctText: string | null;
}

// Shared by both the lesson player's interactive_exercise sections and the
// quiz player — the single place a submitted answer is checked against the
// database. Always re-reads the answer key server-side (never trusts a
// client-supplied `isCorrect`).
export async function gradeQuestionResponse(
  questionId: string,
  response: { answerId?: string; text?: string; answerIds?: string[] },
): Promise<AnswerGrade> {
  const supabase = await createClient();
  const [{ data: question }, { data: answers }] = await Promise.all([
    supabase
      .from('questions')
      .select('type, explanation, metadata')
      .eq('id', questionId)
      .single(),
    supabase
      .from('answers')
      .select('id, content, is_correct, match_pattern, sort_order')
      .eq('question_id', questionId)
      .order('sort_order'),
  ]);

  if (!question || !answers || answers.length === 0) {
    return {
      isCorrect: false,
      explanation: null,
      correctAnswerIds: [],
      correctText: null,
    };
  }

  const correctAnswers = answers.filter((a) => a.is_correct);
  const correctAnswerIds = correctAnswers.map((a) => a.id);
  const correctText =
    question.type === 'fill_blank' || question.type === 'typing'
      ? (correctAnswers[0]?.content ?? null)
      : null;

  let isCorrect = false;

  switch (question.type) {
    case 'multiple_choice':
    case 'image_choice': {
      const selected = answers.find((a) => a.id === response.answerId);
      isCorrect = Boolean(selected?.is_correct);
      break;
    }
    case 'fill_blank':
    case 'typing': {
      // Math content (docs/08-roadmap.md Phase 7) needs numeric equivalence —
      // "0.75" and ".75" should both match — not just exact/pattern text
      // matching. Opted into per-question via metadata.grading so English's
      // existing text questions are unaffected.
      if (isNumericGrading(question.metadata)) {
        const tolerance = question.metadata.tolerance ?? 0.01;
        const submittedValue = parseNumeric(response.text ?? '');
        isCorrect =
          submittedValue !== null &&
          answers
            .filter((a) => a.is_correct)
            .some((a) => {
              const target = parseNumeric(a.content);
              return target !== null && Math.abs(submittedValue - target) <= tolerance;
            });
      } else {
        const submitted = normalizeText(response.text ?? '');
        isCorrect = answers
          .filter((a) => a.is_correct)
          .some((a) => acceptableTextMatches(submitted, a.content, a.match_pattern));
      }
      break;
    }
    case 'ordering':
    case 'matching':
    case 'drag_drop': {
      // No real content exercises these yet (English seed uses only the
      // three types above) — grade by comparing the submitted sequence to
      // the canonical order (answers.sort_order). Revisit once Math/other
      // content actually needs richer pairing semantics.
      const correctOrder = answers.map((a) => a.id);
      const submittedOrder = response.answerIds ?? [];
      isCorrect =
        submittedOrder.length === correctOrder.length &&
        submittedOrder.every((id, i) => id === correctOrder[i]);
      break;
    }
    default:
      isCorrect = false;
  }

  return { isCorrect, explanation: question.explanation, correctAnswerIds, correctText };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface NumericGradingMetadata {
  [key: string]: Json | undefined;
  grading: 'numeric';
  tolerance?: number;
}

function isNumericGrading(metadata: Json): metadata is NumericGradingMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    !Array.isArray(metadata) &&
    (metadata as Record<string, unknown>).grading === 'numeric'
  );
}

// Accepts plain decimals ("0.75", ".75") and simple "a/b" fractions ("3/4")
// so a typed answer like "3/4" or "0.75" both grade the same question.
function parseNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(trimmed)) {
    const [numerator, denominator] = trimmed.split('/').map(Number);
    return denominator === 0 ? null : numerator / denominator;
  }
  if (!/^-?\d*\.?\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function acceptableTextMatches(
  submitted: string,
  content: string,
  matchPattern: string | null,
): boolean {
  if (matchPattern) {
    return matchPattern
      .split('|')
      .map((alt) => normalizeText(alt))
      .includes(submitted);
  }
  return normalizeText(content) === submitted;
}

export async function recordQuestionAttempt(input: {
  userId: string;
  questionId: string;
  isCorrect: boolean;
  response: Json;
  lessonProgressId?: string;
  quizProgressId?: string;
  timeSpentSeconds?: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('question_attempts').insert({
    user_id: input.userId,
    question_id: input.questionId,
    is_correct: input.isCorrect,
    response: input.response,
    lesson_progress_id: input.lessonProgressId ?? null,
    quiz_progress_id: input.quizProgressId ?? null,
    time_spent_seconds: input.timeSpentSeconds ?? null,
  });
  if (error) throw error;
}

// Lets the client resume mid-quiz at the right question instead of
// restarting from question 1 — which would otherwise re-submit already-
// answered questions and double-count them into quiz_progress's running
// correct/incorrect totals.
export async function getAnsweredQuestionIds(quizProgressId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('question_attempts')
    .select('question_id')
    .eq('quiz_progress_id', quizProgressId);
  return Array.from(new Set((data ?? []).map((r) => r.question_id)));
}

export async function createQuizAttempt(userId: string, quizId: string) {
  const supabase = await createClient();

  // Resume an in-progress attempt rather than spawning a new one every time
  // the player mounts (e.g. on a refresh mid-quiz).
  const { data: existing } = await supabase
    .from('quiz_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('quiz_progress')
    .insert({ user_id: userId, quiz_id: quizId, status: 'in_progress' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitQuizAnswer(input: {
  userId: string;
  quizId: string;
  quizProgressId: string;
  questionId: string;
  isCorrect: boolean;
  response: Json;
  timeSpentSeconds?: number;
}) {
  const supabase = await createClient();

  const { data: quizProgress, error: fetchError } = await supabase
    .from('quiz_progress')
    .select('*')
    .eq('id', input.quizProgressId)
    .eq('user_id', input.userId)
    .eq('quiz_id', input.quizId)
    .single();
  if (fetchError) throw fetchError;

  await recordQuestionAttempt({
    userId: input.userId,
    questionId: input.questionId,
    isCorrect: input.isCorrect,
    response: input.response,
    quizProgressId: input.quizProgressId,
    timeSpentSeconds: input.timeSpentSeconds,
  });

  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', input.quizId);

  // Count *distinct* answered questions, not raw question_attempts rows —
  // resubmitting the same question (e.g. a client retry, or a direct API
  // call bypassing the UI's disabled-after-grading state) must not let the
  // attempt appear "complete" before every question has actually been
  // answered once.
  const answeredCount = (await getAnsweredQuestionIds(input.quizProgressId)).length;

  const correctCount = quizProgress.correct_count + (input.isCorrect ? 1 : 0);
  const incorrectCount = quizProgress.incorrect_count + (input.isCorrect ? 0 : 1);
  const isComplete = (totalQuestions ?? 0) > 0 && answeredCount >= (totalQuestions ?? 0);

  const { data: updated, error: updateError } = await supabase
    .from('quiz_progress')
    .update({
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      time_spent_seconds: quizProgress.time_spent_seconds + (input.timeSpentSeconds ?? 0),
      status: isComplete ? 'completed' : 'in_progress',
      score: isComplete
        ? Math.round((correctCount / (correctCount + incorrectCount || 1)) * 1000) / 10
        : quizProgress.score,
      completed_at: isComplete ? new Date().toISOString() : quizProgress.completed_at,
    })
    .eq('id', input.quizProgressId)
    .select()
    .single();
  if (updateError) throw updateError;

  return { quizProgress: updated, isComplete };
}
