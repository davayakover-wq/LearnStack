import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import type { AnswerOption, QuestionForPlayer } from '@/lib/data/lessons';

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  difficulty: Tables<'quizzes'>['difficulty'];
  isTimed: boolean;
  timeLimitSeconds: number | null;
  xpReward: number;
  questionCount: number;
}

export async function getQuizzesForTopic(topicId: string): Promise<QuizSummary[]> {
  const supabase = await createClient();
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, description, difficulty, is_timed, time_limit_seconds, xp_reward')
    .eq('topic_id', topicId)
    .eq('is_published', true);
  if (!quizzes || quizzes.length === 0) return [];

  const { data: questionRows } = await supabase
    .from('questions')
    .select('quiz_id')
    .in(
      'quiz_id',
      quizzes.map((q) => q.id),
    );
  const countByQuiz = new Map<string, number>();
  for (const row of questionRows ?? []) {
    if (!row.quiz_id) continue;
    countByQuiz.set(row.quiz_id, (countByQuiz.get(row.quiz_id) ?? 0) + 1);
  }

  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    difficulty: quiz.difficulty,
    isTimed: quiz.is_timed,
    timeLimitSeconds: quiz.time_limit_seconds,
    xpReward: quiz.xp_reward,
    questionCount: countByQuiz.get(quiz.id) ?? 0,
  }));
}

export async function getQuizByLessonId(lessonId: string): Promise<QuizSummary | null> {
  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, description, difficulty, is_timed, time_limit_seconds, xp_reward')
    .eq('lesson_id', lessonId)
    .eq('is_published', true)
    .maybeSingle();
  if (!quiz) return null;

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quiz.id);

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    difficulty: quiz.difficulty,
    isTimed: quiz.is_timed,
    timeLimitSeconds: quiz.time_limit_seconds,
    xpReward: quiz.xp_reward,
    questionCount: count ?? 0,
  };
}

export interface QuizDetail extends QuizSummary {
  topicId: string;
  questions: QuestionForPlayer[];
}

export async function getQuizDetail(quizId: string): Promise<QuizDetail | null> {
  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('is_published', true)
    .maybeSingle();
  if (!quiz) return null;

  const { data: questionRows } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order');

  const questionIds = (questionRows ?? []).map((q) => q.id);
  let answersByQuestion = new Map<string, AnswerOption[]>();
  if (questionIds.length > 0) {
    const { data: answerRows } = await supabase
      .from('answers')
      .select('id, question_id, content, sort_order')
      .in('question_id', questionIds)
      .order('sort_order');
    answersByQuestion = new Map();
    for (const row of answerRows ?? []) {
      const list = answersByQuestion.get(row.question_id) ?? [];
      list.push({ id: row.id, content: row.content, sortOrder: row.sort_order });
      answersByQuestion.set(row.question_id, list);
    }
  }

  const questions: QuestionForPlayer[] = (questionRows ?? []).map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    promptMediaUrl: q.prompt_media_url,
    metadata: q.metadata,
    answers: answersByQuestion.get(q.id) ?? [],
  }));

  return {
    id: quiz.id,
    topicId: quiz.topic_id,
    title: quiz.title,
    description: quiz.description,
    difficulty: quiz.difficulty,
    isTimed: quiz.is_timed,
    timeLimitSeconds: quiz.time_limit_seconds,
    xpReward: quiz.xp_reward,
    questionCount: questions.length,
    questions,
  };
}
