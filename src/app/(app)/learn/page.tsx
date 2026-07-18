import type { Metadata } from 'next';
import { getSubjects } from '@/lib/data/lessons';
import { SubjectCard } from '@/components/learn/subject-card';

export const metadata: Metadata = { title: 'Learn — LearnStack' };

export default async function LearnPage() {
  const subjects = await getSubjects();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold">What do you want to learn?</h1>
      <p className="text-muted-foreground mt-1 text-sm">Pick a subject to get started.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
}
