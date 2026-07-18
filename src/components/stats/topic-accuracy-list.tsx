import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { TopicAccuracy } from '@/lib/data/stats';

// "Weak topics vs. strong topics" (docs/01-features.md) — the same
// per-topic accuracy list rendered twice: weakest first and strongest
// first, so both framings read naturally without a second data shape.
export function TopicAccuracyList({
  topics,
  title,
  emptyMessage,
}: {
  topics: TopicAccuracy[];
  title: string;
  emptyMessage: string;
}) {
  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {topics.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>
        ) : (
          topics.map((topic) => (
            <div key={topic.topicId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  {topic.topicName}
                  <Badge variant="secondary" className="capitalize">
                    {topic.subjectSlug}
                  </Badge>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {topic.accuracyPercent}%
                </span>
              </div>
              <Progress
                value={topic.accuracyPercent}
                aria-label={`${topic.topicName} accuracy`}
              />
              <p className="text-muted-foreground text-xs">
                {topic.correct} / {topic.total} correct
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
