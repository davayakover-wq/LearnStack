'use client';

import Image from 'next/image';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MathText } from '@/components/shared/math-text';
import type { QuestionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

export function MultipleChoiceQuestion({
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
  return (
    <div className="space-y-2">
      {question.promptMediaUrl && (
        <div className="border-border/60 relative h-64 w-full overflow-hidden rounded-lg border">
          <Image
            src={question.promptMediaUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
        </div>
      )}
      {question.answers.map((answer) => {
        const selected = value.answerId === answer.id;
        const isRevealedCorrect = grade && grade.correctAnswerIds.includes(answer.id);
        const isRevealedWrongSelection = grade && selected && !grade.isCorrect;

        return (
          <button
            key={answer.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ answerId: answer.id })}
            className={cn(
              'border-border/60 flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed',
              selected && !grade && 'border-primary bg-primary/10',
              !selected && !grade && 'hover:bg-muted/60',
              isRevealedCorrect && 'border-success bg-success/10',
              isRevealedWrongSelection && 'border-destructive bg-destructive/10',
            )}
          >
            <span>
              <MathText text={answer.content} />
            </span>
            {isRevealedCorrect && <Check className="text-success size-4 shrink-0" />}
            {isRevealedWrongSelection && (
              <X className="text-destructive size-4 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
