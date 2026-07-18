'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  QuestionRenderer,
  isResponseComplete,
} from '@/components/quiz/question-renderer';
import { Timer } from '@/components/quiz/timer';
import { MathText } from '@/components/shared/math-text';
import { CelebrationSequence } from '@/components/gamification/celebration-sequence';
import { useQuizAttempt } from '@/lib/hooks/useQuizAttempt';
import type { QuizDetail } from '@/lib/data/quizzes';
import type { QuestionResponseInput } from '@/lib/validations/lesson';
import type { AnswerGrade } from '@/lib/data/progress';
import type { CompletionRewards } from '@/lib/data/gamification';

export function QuizPlayerShell({
  quiz,
  backHref,
}: {
  quiz: QuizDetail;
  backHref: string;
}) {
  const { start, submitAnswer } = useQuizAttempt(quiz.id);
  const hasStarted = useRef(false);

  const [quizProgressId, setQuizProgressId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [response, setResponse] = useState<QuestionResponseInput>({});
  const [grade, setGrade] = useState<AnswerGrade | null>(null);
  const [results, setResults] = useState<{
    correct: number;
    incorrect: number;
    score: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [rewards, setRewards] = useState<CompletionRewards | null>(null);
  const questionStartedAt = useRef<number | null>(null);

  // `Date.now()` is impure, so it can't be called directly in a ref
  // initializer during render — set it via effect, re-running whenever the
  // current question changes.
  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [currentIndex]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    start.mutate(undefined, {
      onSuccess: ({ attempt, answeredQuestionIds }) => {
        setQuizProgressId(attempt.id);
        const answered = new Set(answeredQuestionIds);
        const firstUnanswered = quiz.questions.findIndex((q) => !answered.has(q.id));
        if (firstUnanswered === -1) {
          // Every question already has an attempt recorded for this
          // in-progress row — treat it as complete rather than re-asking
          // already-answered questions. The row's own counts are
          // authoritative (server-computed), not re-derived here.
          setResults({
            correct: attempt.correct_count,
            incorrect: attempt.incorrect_count,
            score: attempt.score ?? 0,
          });
        } else {
          setCurrentIndex(firstUnanswered);
        }
      },
      onError: (err) =>
        setErrorMessage(err instanceof Error ? err.message : 'Failed to start.'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = currentIndex !== null ? quiz.questions[currentIndex] : null;
  const canSubmit = question ? isResponseComplete(question, response) : false;

  function elapsedSeconds() {
    if (questionStartedAt.current === null) return 0;
    return Math.max(0, Math.round((Date.now() - questionStartedAt.current) / 1000));
  }

  async function handleSubmitAnswer() {
    if (!question || !quizProgressId) return;
    setErrorMessage(null);
    try {
      const result = await submitAnswer.mutateAsync({
        quizProgressId,
        questionId: question.id,
        response,
        timeSpentSeconds: elapsedSeconds(),
      });
      setGrade(result.grade);
      if (result.isComplete) {
        setResults({
          correct: result.quizProgress.correct_count,
          incorrect: result.quizProgress.incorrect_count,
          score: result.quizProgress.score ?? 0,
        });
        if (result.rewards) setRewards(result.rewards);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit your answer.',
      );
    }
  }

  function handleNext() {
    if (currentIndex === null) return;
    setCurrentIndex((i) => (i === null ? null : i + 1));
    setResponse({});
    setGrade(null);
  }

  if (errorMessage && !quizProgressId) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <Button className="mt-4" render={<Link href={backHref} />} nativeButton={false}>
          Go back
        </Button>
      </div>
    );
  }

  if (results) {
    const total = results.correct + results.incorrect;
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <CelebrationSequence rewards={rewards} />
        <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-xl font-semibold">Quiz complete!</h1>
        <p className="text-muted-foreground text-sm">
          You scored {results.score}% ({results.correct} / {total} correct).
        </p>
        <Button render={<Link href={backHref} />} nativeButton={false}>
          Back to topic
        </Button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center px-6 py-16">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={backHref} aria-label="Exit quiz" />}
          nativeButton={false}
        >
          <X className="size-4" />
        </Button>
        <Progress
          value={((currentIndex! + 1) / quiz.questions.length) * 100}
          className="flex-1"
          aria-label="Quiz progress"
        />
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {currentIndex! + 1} / {quiz.questions.length}
        </span>
        {quiz.isTimed && quiz.timeLimitSeconds && !timeUp && (
          <Timer totalSeconds={quiz.timeLimitSeconds} onExpire={() => setTimeUp(true)} />
        )}
      </div>

      <div className="flex-1 space-y-3">
        <p className="font-medium">
          <MathText text={question.prompt} />
        </p>
        <QuestionRenderer
          question={question}
          value={response}
          onChange={setResponse}
          disabled={Boolean(grade) || timeUp}
          grade={grade}
        />
      </div>

      {timeUp && !grade && (
        <Alert variant="destructive">
          <AlertDescription>Time&apos;s up for this quiz.</AlertDescription>
        </Alert>
      )}

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
          <Button
            onClick={handleSubmitAnswer}
            disabled={!canSubmit || submitAnswer.isPending || timeUp}
          >
            {submitAnswer.isPending && <Loader2 className="size-4 animate-spin" />}
            Submit answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex! + 1 >= quiz.questions.length ? 'Finish' : 'Next question'}
          </Button>
        )}
      </div>
    </div>
  );
}
