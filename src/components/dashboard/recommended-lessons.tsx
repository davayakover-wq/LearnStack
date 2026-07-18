import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LessonWithContext } from '@/lib/data/dashboard';

export function RecommendedLessons({ lessons }: { lessons: LessonWithContext[] }) {
  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Recommended for you</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You&apos;ve completed everything available right now — check back soon for
            more.
          </p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/learn/${lesson.subjectSlug}/${lesson.topicSlug}/${lesson.slug}`}
                  className="border-border/60 hover:bg-muted/60 flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {lesson.subjectSlug === 'english' ? 'English' : 'Mathematics'} ·{' '}
                      {lesson.topicName}
                    </p>
                    <p className="text-sm font-medium">{lesson.title}</p>
                    <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                      <Badge variant="secondary" className="capitalize">
                        {lesson.difficulty}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {lesson.estimatedMinutes} min
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
