import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSubjectBySlug, getTopicBySlug, getLessonsForTopic } from '@/lib/data/lessons';
import { getQuizzesForTopic } from '@/lib/data/quizzes';
import { getCurrentUser } from '@/lib/data/profile';
import { LessonListItem } from '@/components/learn/lesson-list-item';
import { QuizListItem } from '@/components/learn/quiz-list-item';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}): Promise<Metadata> {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: 'Learn — LearnStack' };
  const topic = await getTopicBySlug(subject.id, topicSlug);
  return { title: topic ? `${topic.name} — LearnStack` : 'Learn — LearnStack' };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const [lessons, quizzes] = await Promise.all([
    getLessonsForTopic(topic.id, user.id),
    getQuizzesForTopic(topic.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold">{topic.name}</h1>
      {topic.description && (
        <p className="text-muted-foreground mt-1 text-sm">{topic.description}</p>
      )}

      <div className="mt-6 space-y-3">
        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lessons published yet.</p>
        ) : (
          lessons.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              subjectSlug={subject.slug}
              topicSlug={topic.slug}
              lesson={lesson}
            />
          ))
        )}
      </div>

      {quizzes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-muted-foreground mb-3 text-sm font-medium">Quizzes</h2>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <QuizListItem key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
