'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import type { AnswerGrade } from '@/lib/data/progress';
import type { QuestionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';

export interface DueReviewItem {
  reviewScheduleId: string;
  question: QuestionForPlayer;
  dueCount: number;
}

async function fetchNextReviewItem(): Promise<DueReviewItem | null> {
  const res = await fetch('/api/review/next');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Failed to load the next review item.');
  }
  const data = await res.json();
  return data.item;
}

interface SubmitReviewAnswerArgs {
  questionId: string;
  response: QuestionResponseInput;
  timeSpentSeconds?: number;
}

async function submitReviewAnswerRequest(
  args: SubmitReviewAnswerArgs,
): Promise<{ grade: AnswerGrade }> {
  const res = await fetch('/api/review/next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Failed to submit your answer.');
  }
  return res.json();
}

// Pulls the next due spaced-repetition card and grades submitted answers —
// mirrors useQuizAttempt's start/submit split, but for a single-card queue
// (the "next due item") rather than a fixed question list. Deliberately
// does *not* refetch `nextItem` on a successful submit: the player needs to
// keep showing the just-answered card's grade until the user explicitly
// advances (same "Next" pattern as the lesson/quiz players), so refetching
// is the caller's job, triggered by that same "Next" action.
export function useReviewQueue() {
  const nextItem = useQuery({
    queryKey: queryKeys.reviewNext(),
    queryFn: fetchNextReviewItem,
  });

  const submitAnswer = useMutation({
    mutationFn: submitReviewAnswerRequest,
  });

  return { nextItem, submitAnswer };
}
