import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isCurrentUserAdmin } from '@/lib/data/profile';
import type { Json, Tables } from '@/types/supabase';

export class ForbiddenError extends Error {}

// Called at the top of every admin Server Action/Route Handler (docs/06-api-
// architecture.md's `assertAdmin()` guard). The real security boundary is
// RLS (every admin-writable table's policy calls the same is_admin()
// function at the DB layer) — this is the fast, explicit application-layer
// check so a rejected mutation returns a clean ActionResult instead of a
// raw Postgres RLS error.
export async function assertAdmin(): Promise<{ userId: string }> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError('Sign in required.');
  if (!(await isCurrentUserAdmin())) throw new ForbiddenError('Admin access required.');
  return { userId: user.id };
}

export async function logAdminAction(input: {
  adminId: string;
  action: string;
  targetTable: string;
  targetId?: string | null;
  diff?: Json;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('admin_logs').insert({
    admin_id: input.adminId,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId ?? null,
    diff: input.diff ?? null,
  });
  if (error) throw error;
}

// ============================================================ platform stats ===

export interface PlatformStats {
  totalUsers: number;
  totalLessons: number;
  publishedLessons: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  totalAchievementsUnlocked: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();
  const [
    { count: totalUsers },
    { count: totalLessons },
    { count: publishedLessons },
    { count: totalQuizzes },
    { count: publishedQuizzes },
    { count: totalLessonsCompleted },
    { count: totalQuizzesCompleted },
    { count: totalAchievementsUnlocked },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase.from('quizzes').select('id', { count: 'exact', head: true }),
    supabase
      .from('quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('quiz_progress')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('user_achievements').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalLessons: totalLessons ?? 0,
    publishedLessons: publishedLessons ?? 0,
    totalQuizzes: totalQuizzes ?? 0,
    publishedQuizzes: publishedQuizzes ?? 0,
    totalLessonsCompleted: totalLessonsCompleted ?? 0,
    totalQuizzesCompleted: totalQuizzesCompleted ?? 0,
    totalAchievementsUnlocked: totalAchievementsUnlocked ?? 0,
  };
}

// ============================================================ taxonomy ===

export async function getAdminSubjectsAndTopics() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: topics }] = await Promise.all([
    supabase.from('subjects').select('*').order('sort_order'),
    supabase.from('topics').select('*').order('sort_order'),
  ]);
  return { subjects: subjects ?? [], topics: topics ?? [] };
}

// Lightweight — just enough for QuizForm's "linked lesson" picker, scoped
// client-side to the quiz's currently-selected topic.
export async function getAdminLessonsBasic(): Promise<
  Pick<Tables<'lessons'>, 'id' | 'title' | 'topic_id'>[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lessons')
    .select('id, title, topic_id')
    .order('title');
  return data ?? [];
}

// ============================================================ lessons ===

export interface AdminLessonSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Tables<'lessons'>['difficulty'];
  isPublished: boolean;
  topicName: string;
  subjectSlug: Tables<'subjects'>['slug'];
  sectionCount: number;
}

export async function getAdminLessons(): Promise<AdminLessonSummary[]> {
  const supabase = await createClient();
  const [{ data: lessons }, { data: topics }, { data: subjects }, { data: sections }] =
    await Promise.all([
      supabase
        .from('lessons')
        .select('id, slug, title, difficulty, is_published, topic_id')
        .order('created_at', { ascending: false }),
      supabase.from('topics').select('id, name, subject_id'),
      supabase.from('subjects').select('id, slug'),
      supabase.from('lesson_sections').select('lesson_id'),
    ]);

  const topicsById = new Map((topics ?? []).map((t) => [t.id, t]));
  const subjectsById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const sectionCountByLesson = new Map<string, number>();
  for (const s of sections ?? []) {
    sectionCountByLesson.set(
      s.lesson_id,
      (sectionCountByLesson.get(s.lesson_id) ?? 0) + 1,
    );
  }

  return (lessons ?? []).flatMap((lesson) => {
    const topic = topicsById.get(lesson.topic_id);
    const subject = topic ? subjectsById.get(topic.subject_id) : undefined;
    if (!topic || !subject) return [];
    return [
      {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        difficulty: lesson.difficulty,
        isPublished: lesson.is_published,
        topicName: topic.name,
        subjectSlug: subject.slug,
        sectionCount: sectionCountByLesson.get(lesson.id) ?? 0,
      },
    ];
  });
}

// Admin-facing question/answer shape *includes* is_correct — unlike
// lib/data/lessons.ts's learner-facing QuestionForPlayer, which deliberately
// excludes it. Gated entirely by is_admin() RLS, not a security concern.
// `sortOrder` is optional: reads always populate it from the persisted row,
// but writes recompute it from the submitted array's order (see
// writeQuestionAndAnswers) — a form never needs to submit it.
export interface AdminAnswer {
  id?: string; // absent = not yet persisted (new row from a form)
  content: string;
  isCorrect: boolean;
  matchPattern: string | null;
  sortOrder?: number;
}

export interface AdminQuestion {
  id?: string;
  type: Tables<'questions'>['type'];
  prompt: string;
  promptMediaUrl: string | null;
  explanation: string | null;
  difficulty: Tables<'questions'>['difficulty'];
  sortOrder: number;
  points: number;
  metadata: Json;
  answers: AdminAnswer[];
}

export interface AdminSection {
  id?: string;
  sectionType: Tables<'lesson_sections'>['section_type'];
  sortOrder: number;
  content: Json;
  question: AdminQuestion | null; // set only when sectionType === 'interactive_exercise'
}

export interface AdminLessonDetail {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: Tables<'lessons'>['difficulty'];
  xpReward: number;
  estimatedMinutes: number;
  sortOrder: number;
  isPublished: boolean;
  sections: AdminSection[];
}

export async function getAdminLessonDetail(
  lessonId: string,
): Promise<AdminLessonDetail | null> {
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();
  if (!lesson) return null;

  const { data: sectionRows } = await supabase
    .from('lesson_sections')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order');

  const questionIds = (sectionRows ?? [])
    .map((s) => s.question_id)
    .filter((id): id is string => Boolean(id));

  let questionsById = new Map<string, Tables<'questions'>>();
  let answersByQuestion = new Map<string, AdminAnswer[]>();
  if (questionIds.length > 0) {
    const [{ data: questionRows }, { data: answerRows }] = await Promise.all([
      supabase.from('questions').select('*').in('id', questionIds),
      supabase
        .from('answers')
        .select('*')
        .in('question_id', questionIds)
        .order('sort_order'),
    ]);
    questionsById = new Map((questionRows ?? []).map((q) => [q.id, q]));
    answersByQuestion = new Map();
    for (const row of answerRows ?? []) {
      const list = answersByQuestion.get(row.question_id) ?? [];
      list.push({
        id: row.id,
        content: row.content,
        isCorrect: row.is_correct,
        matchPattern: row.match_pattern,
        sortOrder: row.sort_order,
      });
      answersByQuestion.set(row.question_id, list);
    }
  }

  const sections: AdminSection[] = (sectionRows ?? []).map((section) => {
    const question = section.question_id
      ? questionsById.get(section.question_id)
      : undefined;
    return {
      id: section.id,
      sectionType: section.section_type,
      sortOrder: section.sort_order,
      content: section.content,
      question: question
        ? {
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            promptMediaUrl: question.prompt_media_url,
            explanation: question.explanation,
            difficulty: question.difficulty,
            sortOrder: question.sort_order,
            points: question.points,
            metadata: question.metadata,
            answers: answersByQuestion.get(question.id) ?? [],
          }
        : null,
    };
  });

  return {
    id: lesson.id,
    topicId: lesson.topic_id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    difficulty: lesson.difficulty,
    xpReward: lesson.xp_reward,
    estimatedMinutes: lesson.estimated_minutes,
    sortOrder: lesson.sort_order,
    isPublished: lesson.is_published,
    sections,
  };
}

// Shared write shape for a question + its answers, used both by a lesson's
// interactive_exercise section and by a quiz's question list — one shape,
// one write function (writeQuestionAndAnswers), no duplication.
export interface AdminQuestionWrite {
  id?: string;
  type: Tables<'questions'>['type'];
  prompt: string;
  promptMediaUrl: string | null;
  explanation: string | null;
  difficulty: Tables<'questions'>['difficulty'];
  points: number;
  metadata: Json;
  answers: AdminAnswer[];
}

export interface AdminSectionWrite {
  id?: string;
  sectionType: Tables<'lesson_sections'>['section_type'];
  content: Json;
  question: AdminQuestionWrite | null;
}

export interface LessonWriteInput {
  topicId: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: Tables<'lessons'>['difficulty'];
  xpReward: number;
  estimatedMinutes: number;
  sortOrder: number;
  isPublished: boolean;
  sections: AdminSectionWrite[];
}

async function writeQuestionAndAnswers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quizId: string | null,
  sortOrder: number,
  question: AdminQuestionWrite,
): Promise<string> {
  const questionPayload = {
    quiz_id: quizId,
    type: question.type,
    prompt: question.prompt,
    prompt_media_url: question.promptMediaUrl,
    explanation: question.explanation,
    difficulty: question.difficulty,
    sort_order: sortOrder,
    points: question.points,
    metadata: question.metadata,
  };

  let questionId: string;
  if (question.id) {
    const { error } = await supabase
      .from('questions')
      .update(questionPayload)
      .eq('id', question.id);
    if (error) throw error;
    questionId = question.id;
  } else {
    const { data, error } = await supabase
      .from('questions')
      .insert(questionPayload)
      .select('id')
      .single();
    if (error) throw error;
    questionId = data.id;
  }

  // Diff answers by id rather than delete-all/recreate: answers rows are the
  // target of question_attempts.answer references indirectly via
  // question_id (cascade-deleted with the *question*, not the answer row
  // itself), but keeping stable ids for unchanged answers avoids
  // unnecessary churn either way.
  const { data: existingAnswers } = await supabase
    .from('answers')
    .select('id')
    .eq('question_id', questionId);
  const existingIds = new Set((existingAnswers ?? []).map((a) => a.id));
  const submittedIds = new Set(question.answers.filter((a) => a.id).map((a) => a.id));

  const idsToDelete = [...existingIds].filter((id) => !submittedIds.has(id));
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('answers').delete().in('id', idsToDelete);
    if (error) throw error;
  }

  for (const [index, answer] of question.answers.entries()) {
    const payload = {
      question_id: questionId,
      content: answer.content,
      is_correct: answer.isCorrect,
      match_pattern: answer.matchPattern,
      sort_order: index,
    };
    if (answer.id && existingIds.has(answer.id)) {
      const { error } = await supabase
        .from('answers')
        .update(payload)
        .eq('id', answer.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('answers').insert(payload);
      if (error) throw error;
    }
  }

  return questionId;
}

export async function createLessonWithSections(input: LessonWriteInput): Promise<string> {
  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      topic_id: input.topicId,
      slug: input.slug,
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      xp_reward: input.xpReward,
      estimated_minutes: input.estimatedMinutes,
      sort_order: input.sortOrder,
      is_published: input.isPublished,
    })
    .select('id')
    .single();
  if (lessonError) throw lessonError;

  for (const [index, section] of input.sections.entries()) {
    let questionId: string | null = null;
    if (section.question) {
      questionId = await writeQuestionAndAnswers(supabase, null, index, section.question);
    }
    const { error: sectionError } = await supabase.from('lesson_sections').insert({
      lesson_id: lesson.id,
      section_type: section.sectionType,
      sort_order: index,
      content: section.content,
      question_id: questionId,
    });
    if (sectionError) throw sectionError;
  }

  return lesson.id;
}

export async function updateLessonWithSections(
  lessonId: string,
  input: LessonWriteInput,
): Promise<void> {
  const supabase = await createClient();

  const { error: lessonError } = await supabase
    .from('lessons')
    .update({
      topic_id: input.topicId,
      slug: input.slug,
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      xp_reward: input.xpReward,
      estimated_minutes: input.estimatedMinutes,
      sort_order: input.sortOrder,
      is_published: input.isPublished,
    })
    .eq('id', lessonId);
  if (lessonError) throw lessonError;

  const { data: existingSections } = await supabase
    .from('lesson_sections')
    .select('id')
    .eq('lesson_id', lessonId);
  const existingSectionIds = new Set((existingSections ?? []).map((s) => s.id));
  const submittedSectionIds = new Set(
    input.sections.filter((s) => s.id).map((s) => s.id),
  );

  // Sections removed from the form get deleted (lesson_progress.
  // last_section_id is ON DELETE SET NULL — safe, just resets a learner's
  // "resume position" pointer for anyone mid-lesson when this happens).
  const sectionIdsToDelete = [...existingSectionIds].filter(
    (id) => !submittedSectionIds.has(id),
  );
  if (sectionIdsToDelete.length > 0) {
    const { error } = await supabase
      .from('lesson_sections')
      .delete()
      .in('id', sectionIdsToDelete);
    if (error) throw error;
  }

  for (const [index, section] of input.sections.entries()) {
    let questionId: string | null = null;
    if (section.question) {
      questionId = await writeQuestionAndAnswers(supabase, null, index, section.question);
    }
    const payload = {
      lesson_id: lessonId,
      section_type: section.sectionType,
      sort_order: index,
      content: section.content,
      question_id: questionId,
    };
    if (section.id && existingSectionIds.has(section.id)) {
      const { error } = await supabase
        .from('lesson_sections')
        .update(payload)
        .eq('id', section.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('lesson_sections').insert(payload);
      if (error) throw error;
    }
  }
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw error;
}

// ============================================================ quizzes ===

export interface AdminQuizSummary {
  id: string;
  title: string;
  difficulty: Tables<'quizzes'>['difficulty'];
  isPublished: boolean;
  topicName: string;
  subjectSlug: Tables<'subjects'>['slug'];
  linkedLessonTitle: string | null;
  questionCount: number;
}

export async function getAdminQuizzes(): Promise<AdminQuizSummary[]> {
  const supabase = await createClient();
  const [
    { data: quizzes },
    { data: topics },
    { data: subjects },
    { data: lessons },
    { data: questions },
  ] = await Promise.all([
    supabase
      .from('quizzes')
      .select('id, title, difficulty, is_published, topic_id, lesson_id')
      .order('created_at', { ascending: false }),
    supabase.from('topics').select('id, name, subject_id'),
    supabase.from('subjects').select('id, slug'),
    supabase.from('lessons').select('id, title'),
    supabase.from('questions').select('quiz_id'),
  ]);

  const topicsById = new Map((topics ?? []).map((t) => [t.id, t]));
  const subjectsById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const lessonsById = new Map((lessons ?? []).map((l) => [l.id, l]));
  const questionCountByQuiz = new Map<string, number>();
  for (const q of questions ?? []) {
    if (!q.quiz_id) continue;
    questionCountByQuiz.set(q.quiz_id, (questionCountByQuiz.get(q.quiz_id) ?? 0) + 1);
  }

  return (quizzes ?? []).flatMap((quiz) => {
    const topic = topicsById.get(quiz.topic_id);
    const subject = topic ? subjectsById.get(topic.subject_id) : undefined;
    if (!topic || !subject) return [];
    return [
      {
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        isPublished: quiz.is_published,
        topicName: topic.name,
        subjectSlug: subject.slug,
        linkedLessonTitle: quiz.lesson_id
          ? (lessonsById.get(quiz.lesson_id)?.title ?? null)
          : null,
        questionCount: questionCountByQuiz.get(quiz.id) ?? 0,
      },
    ];
  });
}

export interface AdminQuizDetail {
  id: string;
  topicId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  difficulty: Tables<'quizzes'>['difficulty'];
  isTimed: boolean;
  timeLimitSeconds: number | null;
  xpReward: number;
  isPublished: boolean;
  questions: AdminQuestion[];
}

export async function getAdminQuizDetail(
  quizId: string,
): Promise<AdminQuizDetail | null> {
  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();
  if (!quiz) return null;

  const { data: questionRows } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order');
  const questionIds = (questionRows ?? []).map((q) => q.id);

  const { data: answerRows } =
    questionIds.length > 0
      ? await supabase
          .from('answers')
          .select('*')
          .in('question_id', questionIds)
          .order('sort_order')
      : { data: [] as Tables<'answers'>[] };
  const answersByQuestion = new Map<string, AdminAnswer[]>();
  for (const row of answerRows ?? []) {
    const list = answersByQuestion.get(row.question_id) ?? [];
    list.push({
      id: row.id,
      content: row.content,
      isCorrect: row.is_correct,
      matchPattern: row.match_pattern,
      sortOrder: row.sort_order,
    });
    answersByQuestion.set(row.question_id, list);
  }

  return {
    id: quiz.id,
    topicId: quiz.topic_id,
    lessonId: quiz.lesson_id,
    title: quiz.title,
    description: quiz.description,
    difficulty: quiz.difficulty,
    isTimed: quiz.is_timed,
    timeLimitSeconds: quiz.time_limit_seconds,
    xpReward: quiz.xp_reward,
    isPublished: quiz.is_published,
    questions: (questionRows ?? []).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      promptMediaUrl: q.prompt_media_url,
      explanation: q.explanation,
      difficulty: q.difficulty,
      sortOrder: q.sort_order,
      points: q.points,
      metadata: q.metadata,
      answers: answersByQuestion.get(q.id) ?? [],
    })),
  };
}

export interface QuizWriteInput {
  topicId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  difficulty: Tables<'quizzes'>['difficulty'];
  isTimed: boolean;
  timeLimitSeconds: number | null;
  xpReward: number;
  isPublished: boolean;
  questions: AdminQuestionWrite[];
}

export async function createQuizWithQuestions(input: QuizWriteInput): Promise<string> {
  const supabase = await createClient();

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      topic_id: input.topicId,
      lesson_id: input.lessonId,
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      is_timed: input.isTimed,
      time_limit_seconds: input.timeLimitSeconds,
      xp_reward: input.xpReward,
      is_published: input.isPublished,
    })
    .select('id')
    .single();
  if (quizError) throw quizError;

  for (const [index, question] of input.questions.entries()) {
    await writeQuestionAndAnswers(supabase, quiz.id, index, question);
  }

  return quiz.id;
}

export async function updateQuizWithQuestions(
  quizId: string,
  input: QuizWriteInput,
): Promise<void> {
  const supabase = await createClient();

  const { error: quizError } = await supabase
    .from('quizzes')
    .update({
      topic_id: input.topicId,
      lesson_id: input.lessonId,
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      is_timed: input.isTimed,
      time_limit_seconds: input.timeLimitSeconds,
      xp_reward: input.xpReward,
      is_published: input.isPublished,
    })
    .eq('id', quizId);
  if (quizError) throw quizError;

  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId);
  const existingIds = new Set((existingQuestions ?? []).map((q) => q.id));
  const submittedIds = new Set(input.questions.filter((q) => q.id).map((q) => q.id));

  // Questions removed from the form get deleted — this cascades to
  // question_attempts/review_schedule for that question (both ON DELETE
  // CASCADE), so a removed question's attempt history goes with it. That's
  // the correct behavior for a genuinely removed question; it's why
  // *unchanged* questions are updated in place by id rather than
  // delete-and-recreate on every save.
  const idsToDelete = [...existingIds].filter((id) => !submittedIds.has(id));
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('questions').delete().in('id', idsToDelete);
    if (error) throw error;
  }

  for (const [index, question] of input.questions.entries()) {
    await writeQuestionAndAnswers(supabase, quizId, index, question);
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
}

// ============================================================ users ===

export interface AdminUserSummary {
  id: string;
  username: string;
  displayName: string | null;
  role: Tables<'profiles'>['role'];
  xp: number;
  level: number;
  currentStreak: number;
  createdAt: string;
}

export async function getAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, xp, level, current_streak, created_at')
    .order('created_at', { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    xp: row.xp,
    level: row.level,
    currentStreak: row.current_streak,
    createdAt: row.created_at,
  }));
}

// profiles.role is trigger-protected against non-admin writers (see
// migration 20260715000003_profiles.sql's protect_profile_privileged_
// columns), but that trigger checks the *acting* session's is_admin() —
// this Server Action already ran assertAdmin() before calling here, so a
// plain session-scoped update is enough; no service-role client needed.
export async function setUserRole(
  targetUserId: string,
  role: Tables<'profiles'>['role'],
  grantedBy: string,
): Promise<void> {
  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId);
  if (updateError) throw updateError;

  const { error: roleLogError } = await supabase
    .from('roles')
    .insert({ user_id: targetUserId, role, granted_by: grantedBy });
  if (roleLogError) throw roleLogError;
}

// ============================================================ achievements ===

export interface AdminAchievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  criteria: Json;
  xpBonus: number;
}

export async function getAdminAchievements(): Promise<AdminAchievement[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('achievements').select('*').order('xp_bonus');
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    criteria: row.criteria,
    xpBonus: row.xp_bonus,
  }));
}

export interface AchievementWriteInput {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  criteria: Json;
  xpBonus: number;
}

export async function createAchievement(input: AchievementWriteInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
      icon: input.icon,
      criteria: input.criteria,
      xp_bonus: input.xpBonus,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateAchievement(
  achievementId: string,
  input: AchievementWriteInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('achievements')
    .update({
      slug: input.slug,
      name: input.name,
      description: input.description,
      icon: input.icon,
      criteria: input.criteria,
      xp_bonus: input.xpBonus,
    })
    .eq('id', achievementId);
  if (error) throw error;
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('achievements').delete().eq('id', achievementId);
  if (error) throw error;
}
