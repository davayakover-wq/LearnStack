import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getAdminQuizzes } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Manage Quizzes — LearnStack Admin' };

export default async function AdminQuizzesPage() {
  const quizzes = await getAdminQuizzes();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quizzes</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage quizzes, optionally linked to a lesson.
          </p>
        </div>
        <Button render={<Link href="/admin/quizzes/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card className="border-border/60 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No quizzes yet — create the first one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/admin/quizzes/${quiz.id}/edit`}>
              <Card className="border-border/60 hover:border-primary/40 hover:bg-muted/40 flex-row items-center justify-between gap-3 p-4 transition-colors">
                <div className="min-w-0">
                  <p className="truncate font-medium">{quiz.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {quiz.subjectSlug} / {quiz.topicName} · {quiz.questionCount} questions
                    {quiz.linkedLessonTitle
                      ? ` · linked to "${quiz.linkedLessonTitle}"`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {quiz.difficulty}
                  </Badge>
                  <Badge variant={quiz.isPublished ? 'default' : 'outline'}>
                    {quiz.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
