import { QuestionRenderer } from '@/components/quiz/question-renderer';
import { MathText } from '@/components/shared/math-text';
import type { Json } from '@/types/supabase';
import type { QuestionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

interface ExerciseContent {
  prompt?: string;
}

export function InteractiveExerciseBlock({
  content,
  question,
  value,
  onChange,
  disabled,
  grade,
}: {
  content: Json;
  question: QuestionForPlayer;
  value: QuestionResponseInput;
  onChange: (response: QuestionResponseInput) => void;
  disabled?: boolean;
  grade?: AnswerGrade | null;
}) {
  const data = (content ?? {}) as ExerciseContent;
  return (
    <div className="space-y-3">
      {data.prompt && (
        <p className="text-muted-foreground text-sm">
          <MathText text={data.prompt} />
        </p>
      )}
      <p className="font-medium">
        <MathText text={question.prompt} />
      </p>
      <QuestionRenderer
        question={question}
        value={value}
        onChange={onChange}
        disabled={disabled}
        grade={grade}
      />
    </div>
  );
}
