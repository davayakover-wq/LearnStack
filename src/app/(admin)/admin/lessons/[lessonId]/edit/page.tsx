import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LessonForm } from '@/components/admin/lesson-form';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete-button';
import { deleteLesson } from '@/lib/actions/admin';
import { getAdminLessonDetail, getAdminSubjectsAndTopics } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Edit Lesson — LearnStack Admin' };

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const [lesson, { subjects, topics }] = await Promise.all([
    getAdminLessonDetail(lessonId),
    getAdminSubjectsAndTopics(),
  ]);
  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit lesson</h1>
          <p className="text-muted-foreground mt-1 text-sm">{lesson.title}</p>
        </div>
        <ConfirmDeleteButton
          confirmMessage={`Delete "${lesson.title}"? This can't be undone.`}
          action={deleteLesson.bind(null, lesson.id)}
          redirectTo="/admin/lessons"
        >
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Delete lesson
          </Button>
        </ConfirmDeleteButton>
      </div>
      <LessonForm subjects={subjects} topics={topics} lesson={lesson} />
    </div>
  );
}
