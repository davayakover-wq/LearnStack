'use client';

import { MultipleChoiceQuestion } from '@/components/quiz/multiple-choice-question';
import { TextAnswerQuestion } from '@/components/quiz/text-answer-question';
import { SequenceQuestion } from '@/components/quiz/sequence-question';
import type { QuestionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

export interface QuestionRendererProps {
  question: QuestionForPlayer;
  value: QuestionResponseInput;
  onChange: (response: QuestionResponseInput) => void;
  disabled?: boolean;
  grade?: AnswerGrade | null;
}

// One dispatcher, one component per question_type — see
// docs/07-folder-structure.md. Built generically now so Phase 7 (Math)
// needs near-zero new player code, per docs/08-roadmap.md.
export function QuestionRenderer(props: QuestionRendererProps) {
  switch (props.question.type) {
    case 'multiple_choice':
    case 'image_choice':
      return <MultipleChoiceQuestion {...props} />;
    case 'fill_blank':
    case 'typing':
      return <TextAnswerQuestion {...props} />;
    case 'ordering':
    case 'matching':
    case 'drag_drop':
      return <SequenceQuestion {...props} />;
    default:
      return null;
  }
}

export function isResponseComplete(
  question: QuestionForPlayer,
  value: QuestionResponseInput,
): boolean {
  switch (question.type) {
    case 'multiple_choice':
    case 'image_choice':
      return Boolean(value.answerId);
    case 'fill_blank':
    case 'typing':
      return Boolean(value.text && value.text.trim().length > 0);
    case 'ordering':
    case 'matching':
    case 'drag_drop':
      return Boolean(
        value.answerIds && value.answerIds.length === question.answers.length,
      );
    default:
      return false;
  }
}
