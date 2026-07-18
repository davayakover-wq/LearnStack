'use client';

import { useMutation } from '@tanstack/react-query';
import type { Tables } from '@/types/supabase';
import type { AnswerGrade } from '@/lib/data/progress';
import type { CompletionRewards } from '@/lib/data/gamification';
import type { QuestionResponseInput } from '@/lib/validations/lesson';

interface SubmitAnswerArgs {
  quizProgressId: string;
  questionId: string;
  response: QuestionResponseInput;
  timeSpentSeconds?: number;
}

interface SubmitAnswerResult {
  grade: AnswerGrade;
  quizProgress: Tables<'quiz_progress'>;
  isComplete: boolean;
  rewards: CompletionRewards | null;
}

async function startAttemptRequest(
  quizId: string,
): Promise<{ attempt: Tables<'quiz_progress'>; answeredQuestionIds: string[] }> {
  const res = await fetch(`/api/quizzes/${quizId}/attempts`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Failed to start the quiz.');
  }
  return res.json();
}

async function submitAnswerRequest(
  quizId: string,
  args: SubmitAnswerArgs,
): Promise<SubmitAnswerResult> {
  const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Failed to submit your answer.');
  }
  return res.json();
}

// Two mutations sharing one quizId — starting/resuming an attempt, and
// submitting one answer at a time (timed quizzes and adaptive stepping in
// the future both need this per-question round trip rather than a single
// end-of-quiz submission).
export function useQuizAttempt(quizId: string) {
  const start = useMutation({ mutationFn: () => startAttemptRequest(quizId) });
  const submitAnswer = useMutation({
    mutationFn: (args: SubmitAnswerArgs) => submitAnswerRequest(quizId, args),
  });
  return { start, submitAnswer };
}
