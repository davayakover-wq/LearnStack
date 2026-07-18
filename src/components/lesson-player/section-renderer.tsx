import { ExplanationBlock } from '@/components/lesson-player/explanation-block';
import { ExampleBlock } from '@/components/lesson-player/example-block';
import { HintPanel } from '@/components/lesson-player/hint-panel';
import { SummaryBlock } from '@/components/lesson-player/summary-block';
import { InteractiveExerciseBlock } from '@/components/lesson-player/interactive-exercise-block';
import type { LessonSectionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

// One dispatcher per docs/07-folder-structure.md — covers every
// section_type from docs/01-features.md's lesson system.
export function SectionRenderer({
  section,
  exerciseValue,
  onExerciseChange,
  exerciseDisabled,
  grade,
}: {
  section: LessonSectionForPlayer;
  exerciseValue: QuestionResponseInput;
  onExerciseChange: (response: QuestionResponseInput) => void;
  exerciseDisabled?: boolean;
  grade?: AnswerGrade | null;
}) {
  switch (section.sectionType) {
    case 'explanation':
      return <ExplanationBlock content={section.content} />;
    case 'example':
      return <ExampleBlock content={section.content} />;
    case 'hint':
      return <HintPanel content={section.content} />;
    case 'summary':
      return <SummaryBlock content={section.content} />;
    case 'interactive_exercise':
      if (!section.question) return null;
      return (
        <InteractiveExerciseBlock
          content={section.content}
          question={section.question}
          value={exerciseValue}
          onChange={onExerciseChange}
          disabled={exerciseDisabled}
          grade={grade}
        />
      );
    default:
      return null;
  }
}
