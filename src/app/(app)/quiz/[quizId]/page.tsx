import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuizDetail } from '@/lib/data/quizzes';
import { getTopicWithSubjectSlugs } from '@/lib/data/lessons';
import { getCurrentUser } from '@/lib/data/profile';
import { QuizPlayerShell } from '@/components/quiz/quiz-player-shell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ quizId: string }>;
}): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = await getQuizDetail(quizId);
  return { title: quiz ? `${quiz.title} — LearnStack` : 'Quiz — LearnStack' };
}

export default async function QuizPlayerPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  const user = await getCurrentUser();
  if (!user) notFound();

  const quiz = await getQuizDetail(quizId);
  if (!quiz) notFound();

  const topicSlugs = await getTopicWithSubjectSlugs(quiz.topicId);
  const backHref = topicSlugs
    ? `/learn/${topicSlugs.subjectSlug}/${topicSlugs.topicSlug}`
    : '/learn';

  return <QuizPlayerShell quiz={quiz} backHref={backHref} />;
}
