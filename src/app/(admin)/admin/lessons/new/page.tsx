import type { Metadata } from 'next';
import { LessonForm } from '@/components/admin/lesson-form';
import { getAdminSubjectsAndTopics } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'New Lesson — LearnStack Admin' };

export default async function NewLessonPage() {
  const { subjects, topics } = await getAdminSubjectsAndTopics();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold">New lesson</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add sections and, if needed, an interactive exercise for each one.
        </p>
      </div>
      <LessonForm subjects={subjects} topics={topics} />
    </div>
  );
}
