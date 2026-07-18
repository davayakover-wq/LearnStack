'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MathText } from '@/components/shared/math-text';
import {
  QuestionRenderer,
  isResponseComplete,
} from '@/components/quiz/question-renderer';
import { useReviewQueue } from '@/lib/hooks/useReviewQueue';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';

export function ReviewSessionShell() {
  const { nextItem, submitAnswer } = useReviewQueue();

  const [response, setResponse] = useState<QuestionResponseInput>({});
  const [grade, setGrade] = useState<AnswerGrade | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  // `nextItem` only ever changes when `handleNext` explicitly calls
  // `refetch()` (the hook doesn't auto-invalidate on submit), so it's safe
  // to read `nextItem.data` directly rather than freezing a local copy —
  // the just-graded question stays on screen until the user advances.
  const current = nextItem.data;

  useEffect(() => {
    startedAt.current = Date.now();
  }, [current?.question.id]);

  function elapsedSeconds() {
    if (startedAt.current === null) return 0;
    return Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
  }

  async function handleSubmit() {
    if (!current) return;
    setErrorMessage(null);
    try {
      const result = await submitAnswer.mutateAsync({
        questionId: current.question.id,
        response,
        timeSpentSeconds: elapsedSeconds(),
      });
      setGrade(result.grade);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit your answer.',
      );
    }
  }

  async function handleNext() {
    setResponse({});
    setGrade(null);
    setErrorMessage(null);
    await nextItem.refetch();
  }

  if (nextItem.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-16">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (nextItem.isError) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <Alert variant="destructive">
          <AlertDescription>
            {nextItem.error instanceof Error
              ? nextItem.error.message
              : 'Failed to load your review queue.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-xl font-semibold">You&apos;re all caught up!</h1>
        <p className="text-muted-foreground text-sm">
          Nothing is due for review right now. Check back later, or keep learning new
          lessons.
        </p>
        <Button render={<Link href="/learn" />} nativeButton={false}>
          Back to Learn
        </Button>
      </div>
    );
  }

  const canSubmit = isResponseComplete(current.question, response);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-8">
      <p className="text-muted-foreground text-xs">
        {current.dueCount} {current.dueCount === 1 ? 'card' : 'cards'} due for review
      </p>

      <div className="flex-1 space-y-3">
        <p className="font-medium">
          <MathText text={current.question.prompt} />
        </p>
        <QuestionRenderer
          question={current.question}
          value={response}
          onChange={setResponse}
          disabled={Boolean(grade)}
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
        {!grade ? (
          <Button onClick={handleSubmit} disabled={!canSubmit || submitAnswer.isPending}>
            {submitAnswer.isPending && <Loader2 className="size-4 animate-spin" />}
            Check answer
          </Button>
        ) : (
          <Button onClick={handleNext}>Next</Button>
        )}
      </div>
    </div>
  );
}
