'use client';

import { useMutation } from '@tanstack/react-query';
import type { Tables } from '@/types/supabase';
import type { AnswerGrade } from '@/lib/data/progress';
import type { CompletionRewards } from '@/lib/data/gamification';
import type { QuestionResponseInput } from '@/lib/validations/lesson';

interface CompleteSectionArgs {
  sectionId: string;
  mode: Tables<'lesson_progress'>['mode'];
  response?: QuestionResponseInput;
  timeSpentSeconds?: number;
}

interface CompleteSectionResult {
  progress: Tables<'lesson_progress'>;
  grade: AnswerGrade | null;
  rewards: CompletionRewards | null;
}

async function completeSectionRequest(
  lessonId: string,
  args: CompleteSectionArgs,
): Promise<CompleteSectionResult> {
  const res = await fetch(
    `/api/lessons/${lessonId}/sections/${args.sectionId}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: args.mode,
        response: args.response,
        timeSpentSeconds: args.timeSpentSeconds,
      }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Failed to save your progress.');
  }
  return res.json();
}

// Wraps the section-complete Route Handler in a React Query mutation so the
// lesson player gets loading/error state for free and can show feedback
// (correct/incorrect) before advancing to the next section.
export function useLessonSession(lessonId: string) {
  return useMutation({
    mutationFn: (args: CompleteSectionArgs) => completeSectionRequest(lessonId, args),
  });
}
