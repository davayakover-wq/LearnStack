import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/admin/quiz-form';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete-button';
import { deleteQuiz } from '@/lib/actions/admin';
import {
  getAdminLessonsBasic,
  getAdminQuizDetail,
  getAdminSubjectsAndTopics,
} from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Edit Quiz — LearnStack Admin' };

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const [quiz, { subjects, topics }, lessons] = await Promise.all([
    getAdminQuizDetail(quizId),
    getAdminSubjectsAndTopics(),
    getAdminLessonsBasic(),
  ]);
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit quiz</h1>
          <p className="text-muted-foreground mt-1 text-sm">{quiz.title}</p>
        </div>
        <ConfirmDeleteButton
          confirmMessage={`Delete "${quiz.title}"? This can't be undone.`}
          action={deleteQuiz.bind(null, quiz.id)}
          redirectTo="/admin/quizzes"
        >
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Delete quiz
          </Button>
        </ConfirmDeleteButton>
      </div>
      <QuizForm subjects={subjects} topics={topics} lessons={lessons} quiz={quiz} />
    </div>
  );
}
