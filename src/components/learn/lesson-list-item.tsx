import Link from 'next/link';
import { CheckCircle2, Clock, Lock, PlayCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { LessonListItem as LessonListItemData } from '@/lib/data/lessons';

export function LessonListItem({
  subjectSlug,
  topicSlug,
  lesson,
}: {
  subjectSlug: string;
  topicSlug: string;
  lesson: LessonListItemData;
}) {
  const locked = lesson.status === 'locked';
  const href = `/learn/${subjectSlug}/${topicSlug}/${lesson.slug}`;

  const content = (
    <Card
      className={cn(
        'border-border/60 gap-2 p-4 transition-colors',
        locked ? 'opacity-60' : 'hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{lesson.title}</p>
          {lesson.description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
              {lesson.description}
            </p>
          )}
        </div>
        <StatusIcon status={lesson.status} />
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <Badge variant="secondary" className="capitalize">
          {lesson.difficulty}
        </Badge>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {lesson.estimatedMinutes} min
        </span>
        <span>{lesson.xpReward} XP</span>
      </div>

      {lesson.status === 'in_progress' && (
        <Progress
          value={lesson.completionPercent}
          aria-label={`${lesson.title} completion progress`}
        />
      )}
      {locked && (
        <p className="text-muted-foreground text-xs">
          Complete the previous lesson in this topic to unlock.
        </p>
      )}
    </Card>
  );

  if (locked) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

function StatusIcon({ status }: { status: LessonListItemData['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="text-success size-5 shrink-0" />;
    case 'in_progress':
      return <PlayCircle className="text-primary size-5 shrink-0" />;
    case 'locked':
      return <Lock className="text-muted-foreground size-5 shrink-0" />;
    default:
      return <PlayCircle className="text-muted-foreground size-5 shrink-0" />;
  }
}
