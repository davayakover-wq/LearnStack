import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getAdminLessons } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Manage Lessons — LearnStack Admin' };

export default async function AdminLessonsPage() {
  const lessons = await getAdminLessons();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lessons</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage lesson content across every subject.
          </p>
        </div>
        <Button render={<Link href="/admin/lessons/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <Card className="border-border/60 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No lessons yet — create the first one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/admin/lessons/${lesson.id}/edit`}>
              <Card className="border-border/60 hover:border-primary/40 hover:bg-muted/40 flex-row items-center justify-between gap-3 p-4 transition-colors">
                <div className="min-w-0">
                  <p className="truncate font-medium">{lesson.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {lesson.subjectSlug} / {lesson.topicName} · {lesson.sectionCount}{' '}
                    sections
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {lesson.difficulty}
                  </Badge>
                  <Badge variant={lesson.isPublished ? 'default' : 'outline'}>
                    {lesson.isPublished ? 'Published' : 'Draft'}
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
