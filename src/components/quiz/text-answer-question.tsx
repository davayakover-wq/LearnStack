'use client';

import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MathText } from '@/components/shared/math-text';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

export function TextAnswerQuestion({
  value,
  onChange,
  disabled,
  grade,
}: {
  value: QuestionResponseInput;
  onChange: (response: QuestionResponseInput) => void;
  disabled?: boolean;
  grade?: AnswerGrade | null;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={value.text ?? ''}
        onChange={(e) => onChange({ text: e.target.value })}
        disabled={disabled}
        placeholder="Type your answer…"
        autoComplete="off"
      />
      {grade && !grade.isCorrect && grade.correctText && (
        <Alert>
          <AlertDescription>
            Correct answer: <MathText text={grade.correctText} />
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
