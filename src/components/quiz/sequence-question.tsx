'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MathText } from '@/components/shared/math-text';
import type { QuestionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

// Shared by ordering/matching/drag_drop — none of these are exercised by
// the English seed content yet, so this is a simple, functional
// reorder-with-buttons UI rather than a full drag-and-drop implementation.
// Revisit once real content needs richer pairing semantics (see
// lib/data/progress.ts's gradeQuestionResponse).
export function SequenceQuestion({
  question,
  value,
  onChange,
  disabled,
  grade,
}: {
  question: QuestionForPlayer;
  value: QuestionResponseInput;
  onChange: (response: QuestionResponseInput) => void;
  disabled?: boolean;
  grade?: AnswerGrade | null;
}) {
  const [order, setOrder] = useState<string[]>(
    () => value.answerIds ?? question.answers.map((a) => a.id),
  );

  useEffect(() => {
    onChange({ answerIds: order });
    // Only re-run when the local order changes — syncing `order` up to the
    // parent is this effect's entire job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  function move(index: number, direction: -1 | 1) {
    setOrder((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const answersById = new Map(question.answers.map((a) => [a.id, a]));

  return (
    <div className="space-y-2">
      {order.map((answerId, index) => {
        const answer = answersById.get(answerId);
        if (!answer) return null;
        return (
          <div
            key={answerId}
            className={cn(
              'border-border/60 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm',
              grade &&
                (grade.isCorrect
                  ? 'border-success bg-success/10'
                  : 'border-destructive bg-destructive/10'),
            )}
          >
            <span>
              <MathText text={answer.content} />
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                aria-label="Move up"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled || index === order.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Move down"
              >
                <ChevronDown className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
