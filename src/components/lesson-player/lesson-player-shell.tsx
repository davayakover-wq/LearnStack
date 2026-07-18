'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SectionRenderer } from '@/components/lesson-player/section-renderer';
import { isResponseComplete } from '@/components/quiz/question-renderer';
import { CelebrationSequence } from '@/components/gamification/celebration-sequence';
import { useLessonSession } from '@/lib/hooks/useLessonSession';
import type { LessonDetail } from '@/lib/data/lessons';
import type { QuizSummary } from '@/lib/data/quizzes';
import type { Tables } from '@/types/supabase';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';
import type { CompletionRewards } from '@/lib/data/gamification';

export function LessonPlayerShell({
  lesson,
  initialSectionIndex,
  mode,
  associatedQuiz,
}: {
  lesson: LessonDetail;
  initialSectionIndex: number;
  mode: Tables<'lesson_progress'>['mode'];
  associatedQuiz: QuizSummary | null;
}) {
  const session = useLessonSession(lesson.id);

  const [currentIndex, setCurrentIndex] = useState(initialSectionIndex);
  const [response, setResponse] = useState<QuestionResponseInput>({});
  const [grade, setGrade] = useState<AnswerGrade | null>(null);
  const [finished, setFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rewards, setRewards] = useState<CompletionRewards | null>(null);
  const sectionStartedAt = useRef<number | null>(null);

  // `Date.now()` is impure, so it can't be called directly in a ref
  // initializer during render — set it via effect instead, re-running
  // whenever the section changes.
  useEffect(() => {
    sectionStartedAt.current = Date.now();
  }, [currentIndex]);

  const totalSections = lesson.sections.length;
  const section = lesson.sections[currentIndex];
  const isExercise = section?.sectionType === 'interactive_exercise';
  const canCheck = section?.question
    ? isResponseComplete(section.question, response)
    : false;

  function elapsedSeconds() {
    if (sectionStartedAt.current === null) return 0;
    return Math.max(0, Math.round((Date.now() - sectionStartedAt.current) / 1000));
  }

  async function handleCheckAnswer() {
    if (!section) return;
    setErrorMessage(null);
    try {
      const result = await session.mutateAsync({
        sectionId: section.id,
        mode,
        response,
        timeSpentSeconds: elapsedSeconds(),
      });
      setGrade(result.grade);
      // A lesson can end on an interactive_exercise section (no separate
      // summary section) — this is the only call that completes it in that
      // case, so rewards can arrive here too, not just from handleContinue.
      if (result.rewards) setRewards(result.rewards);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  async function handleContinue() {
    if (!section) return;
    setErrorMessage(null);

    // Interactive exercises already recorded progress in handleCheckAnswer —
    // continuing here is purely a client-side step, no extra server call.
    if (!isExercise) {
      try {
        const result = await session.mutateAsync({
          sectionId: section.id,
          mode,
          timeSpentSeconds: elapsedSeconds(),
        });
        if (result.rewards) setRewards(result.rewards);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        return;
      }
    }

    if (currentIndex + 1 >= totalSections) {
      setFinished(true);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setResponse({});
    setGrade(null);
  }

  const topicHref = `/learn/${lesson.subjectSlug}/${lesson.topicSlug}`;

  if (finished) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <CelebrationSequence rewards={rewards} />
        <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-xl font-semibold">Lesson complete!</h1>
        <p className="text-muted-foreground text-sm">
          You finished &ldquo;{lesson.title}&rdquo;. Great work.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          {associatedQuiz && (
            <Button
              render={<Link href={`/quiz/${associatedQuiz.id}`} />}
              nativeButton={false}
            >
              Take the quiz
            </Button>
          )}
          <Button
            variant="outline"
            render={<Link href={topicHref} />}
            nativeButton={false}
          >
            Back to topic
          </Button>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-muted-foreground text-sm">This lesson has no content yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={topicHref} aria-label="Exit lesson" />}
          nativeButton={false}
        >
          <X className="size-4" />
        </Button>
        <Progress
          value={((currentIndex + 1) / totalSections) * 100}
          className="flex-1"
          aria-label="Lesson progress"
        />
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {currentIndex + 1} / {totalSections}
        </span>
      </div>

      <div className="flex-1">
        <SectionRenderer
          section={section}
          exerciseValue={response}
          onExerciseChange={setResponse}
          exerciseDisabled={Boolean(grade)}
          grade={grade}
        />
      </div>

      {grade && (
        <Alert variant={grade.isCorrect ? 'default' : 'destructive'}>
          <AlertDescription>
            {grade.isCorrect ? 'Correct!' : 'Not quite.'}
            {grade.explanation ? ` ${grade.explanation}` : ''}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        {isExercise && !grade ? (
          <Button onClick={handleCheckAnswer} disabled={!canCheck || session.isPending}>
            {session.isPending && <Loader2 className="size-4 animate-spin" />}
            Check answer
          </Button>
        ) : (
          <Button onClick={handleContinue} disabled={session.isPending}>
            {session.isPending && <Loader2 className="size-4 animate-spin" />}
            {currentIndex + 1 >= totalSections ? 'Finish' : 'Continue'}
          </Button>
        )}
      </div>
    </div>
  );
}
