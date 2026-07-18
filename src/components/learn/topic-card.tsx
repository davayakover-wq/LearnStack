import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { TopicWithProgress } from '@/lib/data/lessons';

export function TopicCard({
  subjectSlug,
  topic,
}: {
  subjectSlug: string;
  topic: TopicWithProgress;
}) {
  const progress =
    topic.lessonsTotal > 0 ? (topic.lessonsCompleted / topic.lessonsTotal) * 100 : 0;
  const locked = topic.isLocked;

  const content = (
    <Card
      className={cn(
        'border-border/60 group gap-2 p-5 transition-colors',
        locked ? 'opacity-60' : 'hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{topic.name}</h3>
        {locked ? (
          <Lock className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ArrowRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
        )}
      </div>
      {locked ? (
        <p className="text-muted-foreground text-xs">
          Complete the previous topic&apos;s lessons to unlock.
        </p>
      ) : topic.lessonsTotal > 0 ? (
        <>
          <Progress value={progress} aria-label={`${topic.name} lessons progress`} />
          <p className="text-muted-foreground text-xs">
            {topic.lessonsCompleted} / {topic.lessonsTotal} lessons complete
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-xs">No lessons published yet.</p>
      )}
    </Card>
  );

  if (locked) {
    return content;
  }

  return <Link href={`/learn/${subjectSlug}/${topic.slug}`}>{content}</Link>;
}
