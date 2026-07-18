import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSubjectBySlug, getTopicsForSubject } from '@/lib/data/lessons';
import { getCurrentUser } from '@/lib/data/profile';
import { TopicCard } from '@/components/learn/topic-card';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject: subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  return { title: subject ? `${subject.name} — LearnStack` : 'Learn — LearnStack' };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const topics = await getTopicsForSubject(subject.id, user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold">{subject.name}</h1>
      {subject.description && (
        <p className="text-muted-foreground mt-1 text-sm">{subject.description}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <TopicCard key={topic.id} subjectSlug={subject.slug} topic={topic} />
        ))}
      </div>
    </div>
  );
}
