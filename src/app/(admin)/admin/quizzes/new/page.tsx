import type { Metadata } from 'next';
import { QuizForm } from '@/components/admin/quiz-form';
import { getAdminLessonsBasic, getAdminSubjectsAndTopics } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'New Quiz — LearnStack Admin' };

export default async function NewQuizPage() {
  const [{ subjects, topics }, lessons] = await Promise.all([
    getAdminSubjectsAndTopics(),
    getAdminLessonsBasic(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold">New quiz</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add questions and, optionally, link this quiz to a lesson.
        </p>
      </div>
      <QuizForm subjects={subjects} topics={topics} lessons={lessons} />
    </div>
  );
}
