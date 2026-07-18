import Link from 'next/link';
import { Clock, ListChecks, Timer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuizSummary } from '@/lib/data/quizzes';

export function QuizListItem({ quiz }: { quiz: QuizSummary }) {
  return (
    <Link href={`/quiz/${quiz.id}`}>
      <Card className="border-border/60 hover:border-primary/40 hover:bg-muted/40 gap-2 p-4 transition-colors">
        <div className="flex items-center gap-2">
          <ListChecks className="text-primary size-4" />
          <p className="font-medium">{quiz.title}</p>
        </div>
        {quiz.description && (
          <p className="text-muted-foreground text-sm">{quiz.description}</p>
        )}
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <Badge variant="secondary" className="capitalize">
            {quiz.difficulty}
          </Badge>
          <span>{quiz.questionCount} questions</span>
          <span>{quiz.xpReward} XP</span>
          {quiz.isTimed && (
            <span className="flex items-center gap-1">
              <Timer className="size-3" />
              {quiz.timeLimitSeconds
                ? `${Math.round(quiz.timeLimitSeconds / 60)} min`
                : 'timed'}
            </span>
          )}
          {!quiz.isTimed && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              untimed
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
