import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ContinueLearning } from '@/lib/data/dashboard';

export function ContinueLearningCard({ item }: { item: ContinueLearning | null }) {
  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Continue learning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {item ? (
          <>
            <div>
              <p className="text-muted-foreground text-xs">
                {item.lesson.subjectSlug === 'english' ? 'English' : 'Mathematics'} ·{' '}
                {item.lesson.topicName}
              </p>
              <p className="font-medium">{item.lesson.title}</p>
            </div>
            <Progress
              value={item.completionPercent}
              aria-label={`${item.lesson.title} completion progress`}
            />
            <Button
              size="sm"
              className="w-full gap-2"
              nativeButton={false}
              render={
                <Link
                  href={`/learn/${item.lesson.subjectSlug}/${item.lesson.topicSlug}/${item.lesson.slug}?mode=${item.mode}`}
                />
              }
            >
              <PlayCircle className="size-4" />
              Resume lesson
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No lesson in progress yet — start one from your recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
