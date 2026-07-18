import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';

export interface LessonWithContext {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: Tables<'lessons'>['difficulty'];
  xpReward: number;
  estimatedMinutes: number;
  topicName: string;
  topicSlug: string;
  subjectSlug: Tables<'subjects'>['slug'];
}

type LessonRow = Pick<
  Tables<'lessons'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'difficulty'
  | 'xp_reward'
  | 'estimated_minutes'
  | 'topic_id'
>;

// Pure — no I/O — so both the dashboard and the /learn browsing pages can
// share it without either owning the other's concerns.
export function joinLessonsWithContext(
  lessons: LessonRow[],
  topicsById: Map<string, Tables<'topics'>>,
  subjectsById: Map<string, Tables<'subjects'>>,
): LessonWithContext[] {
  return lessons.flatMap((lesson) => {
    const topic = topicsById.get(lesson.topic_id);
    const subject = topic ? subjectsById.get(topic.subject_id) : undefined;
    if (!topic || !subject) return [];
    return [
      {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        difficulty: lesson.difficulty,
        xpReward: lesson.xp_reward,
        estimatedMinutes: lesson.estimated_minutes,
        topicName: topic.name,
        topicSlug: topic.slug,
        subjectSlug: subject.slug,
      },
    ];
  });
}

export async function getTopicsAndSubjectsMaps() {
  const supabase = await createClient();
  const [{ data: topicRows }, { data: subjectRows }] = await Promise.all([
    supabase.from('topics').select('*'),
    supabase.from('subjects').select('*'),
  ]);
  return {
    topicsById: new Map((topicRows ?? []).map((t) => [t.id, t])),
    subjectsById: new Map((subjectRows ?? []).map((s) => [s.id, s])),
  };
}

export async function getPublishedLessons(): Promise<LessonRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lessons')
    .select(
      'id, slug, title, description, difficulty, xp_reward, estimated_minutes, topic_id, sort_order',
    )
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export interface LessonUnlockState {
  completedLessonIds: Set<string>;
  prerequisitesByLesson: Map<string, string[]>;
  isUnlocked: (lessonId: string) => boolean;
}

// Shared DAG check — used by the dashboard (recommendations, continue
// learning) and by the /learn topic/lesson list (lock icons). One place,
// one definition of "unlocked": every prerequisite has a completed
// lesson_progress row for this user.
export async function getLessonUnlockState(userId: string): Promise<LessonUnlockState> {
  const supabase = await createClient();
  const [{ data: completedRows }, { data: prerequisiteRows }] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase.from('lesson_prerequisites').select('lesson_id, prerequisite_lesson_id'),
  ]);

  const completedLessonIds = new Set((completedRows ?? []).map((r) => r.lesson_id));
  const prerequisitesByLesson = new Map<string, string[]>();
  for (const row of prerequisiteRows ?? []) {
    const list = prerequisitesByLesson.get(row.lesson_id) ?? [];
    list.push(row.prerequisite_lesson_id);
    prerequisitesByLesson.set(row.lesson_id, list);
  }

  return {
    completedLessonIds,
    prerequisitesByLesson,
    isUnlocked(lessonId: string) {
      const prereqs = prerequisitesByLesson.get(lessonId) ?? [];
      return prereqs.every((id) => completedLessonIds.has(id));
    },
  };
}

export async function getSubjects() {
  const supabase = await createClient();
  const { data } = await supabase.from('subjects').select('*').order('sort_order');
  return data ?? [];
}

const VALID_SUBJECT_SLUGS = ['english', 'mathematics'] as const;

function isValidSubjectSlug(slug: string): slug is Tables<'subjects'>['slug'] {
  return (VALID_SUBJECT_SLUGS as readonly string[]).includes(slug);
}

export async function getSubjectBySlug(slug: string) {
  // Validate before querying: `slug` is a Postgres enum column, and an
  // unrecognized value (arbitrary user-controlled URL segment) would raise
  // a DB error rather than just finding no rows.
  if (!isValidSubjectSlug(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('subjects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export interface TopicWithProgress extends Tables<'topics'> {
  lessonsTotal: number;
  lessonsCompleted: number;
  // Topics have no prerequisite graph of their own — this is derived from
  // whether the topic's first lesson (by sort_order) is unlocked, reusing
  // the same lesson_prerequisites DAG check the lesson list already uses,
  // so a topic whose entry lesson requires finishing something in another
  // topic shows as locked in the topic tree too.
  isLocked: boolean;
}

export async function getTopicsForSubject(
  subjectId: string,
  userId: string,
): Promise<TopicWithProgress[]> {
  const supabase = await createClient();
  const [{ data: topics }, publishedLessons, { data: completedRows }, unlockState] =
    await Promise.all([
      supabase.from('topics').select('*').eq('subject_id', subjectId).order('sort_order'),
      getPublishedLessons(),
      supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      getLessonUnlockState(userId),
    ]);

  const completedIds = new Set((completedRows ?? []).map((r) => r.lesson_id));
  const lessonsByTopic = new Map<string, LessonRow[]>();
  for (const lesson of publishedLessons) {
    const list = lessonsByTopic.get(lesson.topic_id) ?? [];
    list.push(lesson);
    lessonsByTopic.set(lesson.topic_id, list);
  }

  return (topics ?? []).map((topic) => {
    // getPublishedLessons() is already ordered by sort_order, so the first
    // entry here is the topic's entry lesson.
    const lessons = lessonsByTopic.get(topic.id) ?? [];
    return {
      ...topic,
      lessonsTotal: lessons.length,
      lessonsCompleted: lessons.filter((l) => completedIds.has(l.id)).length,
      isLocked: lessons.length > 0 && !unlockState.isUnlocked(lessons[0].id),
    };
  });
}

export async function getTopicBySlug(subjectId: string, topicSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('slug', topicSlug)
    .maybeSingle();
  return data;
}

export type LessonStatus = 'locked' | 'not_started' | 'in_progress' | 'completed';

export interface LessonListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: Tables<'lessons'>['difficulty'];
  xpReward: number;
  estimatedMinutes: number;
  status: LessonStatus;
  completionPercent: number;
}

export async function getLessonsForTopic(
  topicId: string,
  userId: string,
): Promise<LessonListItem[]> {
  const supabase = await createClient();
  const [{ data: lessons }, unlockState, { data: progressRows }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, slug, title, description, difficulty, xp_reward, estimated_minutes')
      .eq('topic_id', topicId)
      .eq('is_published', true)
      .order('sort_order'),
    getLessonUnlockState(userId),
    supabase
      .from('lesson_progress')
      .select('lesson_id, status, completion_percent')
      .eq('user_id', userId)
      .eq('mode', 'practice'),
  ]);

  const progressByLesson = new Map((progressRows ?? []).map((p) => [p.lesson_id, p]));

  return (lessons ?? []).map((lesson) => {
    const progress = progressByLesson.get(lesson.id);
    let status: LessonStatus;
    if (progress?.status === 'completed') status = 'completed';
    else if (progress?.status === 'in_progress') status = 'in_progress';
    else if (!unlockState.isUnlocked(lesson.id)) status = 'locked';
    else status = 'not_started';

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      xpReward: lesson.xp_reward,
      estimatedMinutes: lesson.estimated_minutes,
      status,
      completionPercent: Number(progress?.completion_percent ?? 0),
    };
  });
}

export interface AnswerOption {
  id: string;
  content: string;
  sortOrder: number;
  // Deliberately no `isCorrect` here — this shape is sent to the browser.
  // Grading always happens server-side (Route Handlers re-query `answers`
  // with a server-side Supabase client) so the answer key is never part of
  // the client bundle/RSC payload.
}

export interface QuestionForPlayer {
  id: string;
  type: Tables<'questions'>['type'];
  prompt: string;
  promptMediaUrl: string | null;
  metadata: Tables<'questions'>['metadata'];
  answers: AnswerOption[];
}

// Single-question equivalent of the join `getLessonDetail` does in bulk for
// a whole lesson's sections. Used by the review session (lib/data/review.ts),
// which only ever needs one question at a time, so the bulk `.in(...)` join
// below isn't the right shape to reuse there — this keeps the same
// `QuestionForPlayer`/`AnswerOption` contract (and the same "never send
// is_correct to the client" rule) without a second query shape to maintain.
export async function getQuestionForPlayer(
  questionId: string,
): Promise<QuestionForPlayer | null> {
  const supabase = await createClient();
  const [{ data: question }, { data: answerRows }] = await Promise.all([
    supabase.from('questions').select('*').eq('id', questionId).maybeSingle(),
    supabase
      .from('answers')
      .select('id, content, sort_order')
      .eq('question_id', questionId)
      .order('sort_order'),
  ]);
  if (!question) return null;

  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    promptMediaUrl: question.prompt_media_url,
    metadata: question.metadata,
    answers: (answerRows ?? []).map((a) => ({
      id: a.id,
      content: a.content,
      sortOrder: a.sort_order,
    })),
  };
}

export interface LessonSectionForPlayer {
  id: string;
  sectionType: Tables<'lesson_sections'>['section_type'];
  sortOrder: number;
  content: Tables<'lesson_sections'>['content'];
  question: QuestionForPlayer | null;
}

export interface LessonDetail extends LessonWithContext {
  sections: LessonSectionForPlayer[];
}

export async function getLessonDetail(
  subjectSlug: string,
  topicSlug: string,
  lessonSlug: string,
): Promise<LessonDetail | null> {
  const supabase = await createClient();

  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return null;
  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) return null;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('slug', lessonSlug)
    .eq('is_published', true)
    .maybeSingle();
  if (!lesson) return null;

  const { data: sectionRows } = await supabase
    .from('lesson_sections')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('sort_order');

  const questionIds = (sectionRows ?? [])
    .map((s) => s.question_id)
    .filter((id): id is string => Boolean(id));

  let questionsById = new Map<string, Tables<'questions'>>();
  let answersByQuestion = new Map<string, AnswerOption[]>();
  if (questionIds.length > 0) {
    const [{ data: questionRows }, { data: answerRows }] = await Promise.all([
      supabase.from('questions').select('*').in('id', questionIds),
      supabase
        .from('answers')
        .select('id, question_id, content, sort_order')
        .in('question_id', questionIds)
        .order('sort_order'),
    ]);
    questionsById = new Map((questionRows ?? []).map((q) => [q.id, q]));
    answersByQuestion = new Map();
    for (const row of answerRows ?? []) {
      const list = answersByQuestion.get(row.question_id) ?? [];
      list.push({ id: row.id, content: row.content, sortOrder: row.sort_order });
      answersByQuestion.set(row.question_id, list);
    }
  }

  const sections: LessonSectionForPlayer[] = (sectionRows ?? []).map((section) => {
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
            metadata: question.metadata,
            answers: answersByQuestion.get(question.id) ?? [],
          }
        : null,
    };
  });

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    difficulty: lesson.difficulty,
    xpReward: lesson.xp_reward,
    estimatedMinutes: lesson.estimated_minutes,
    topicName: topic.name,
    topicSlug: topic.slug,
    subjectSlug: subject.slug,
    sections,
  };
}

export interface LessonRewardInfo {
  topicId: string;
  xpReward: number;
}

// Used by the section-complete Route Handler: topicId to know which topic's
// user_progress rollup to recalculate, xpReward to know how much XP a
// first-time completion is worth (docs/08-roadmap.md Phase 9).
export async function getLessonRewardInfo(
  lessonId: string,
): Promise<LessonRewardInfo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lessons')
    .select('topic_id, xp_reward')
    .eq('id', lessonId)
    .maybeSingle();
  if (!data) return null;
  return { topicId: data.topic_id, xpReward: data.xp_reward };
}

export interface LessonSectionRef {
  id: string;
  sectionType: Tables<'lesson_sections'>['section_type'];
  sortOrder: number;
  questionId: string | null;
}

// Lightweight — used by the section-complete Route Handler to verify a
// section actually belongs to the lesson in the URL, and to compute the
// section's position/total server-side (never trusting client-supplied
// index/total, which would otherwise let a client fabricate progress).
export async function getLessonSectionRefs(
  lessonId: string,
): Promise<LessonSectionRef[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lesson_sections')
    .select('id, section_type, sort_order, question_id')
    .eq('lesson_id', lessonId)
    .order('sort_order');
  return (data ?? []).map((row) => ({
    id: row.id,
    sectionType: row.section_type,
    sortOrder: row.sort_order,
    questionId: row.question_id,
  }));
}

// Reverse lookup for building a "back to topic" link from a quiz, which
// only knows its topic_id (see the quiz player page).
export async function getTopicWithSubjectSlugs(
  topicId: string,
): Promise<{ subjectSlug: Tables<'subjects'>['slug']; topicSlug: string } | null> {
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from('topics')
    .select('slug, subject_id')
    .eq('id', topicId)
    .maybeSingle();
  if (!topic) return null;
  const { data: subject } = await supabase
    .from('subjects')
    .select('slug')
    .eq('id', topic.subject_id)
    .maybeSingle();
  if (!subject) return null;
  return { subjectSlug: subject.slug, topicSlug: topic.slug };
}
