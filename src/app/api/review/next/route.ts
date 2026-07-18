import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/data/profile';
import { gradeQuestionResponse, recordQuestionAttempt } from '@/lib/data/progress';
import { getNextDueReviewItem, recordReviewOutcome } from '@/lib/data/review';
import { submitReviewAnswerSchema } from '@/lib/validations/review';

// GET pulls the next due spaced-repetition card; POST grades the submitted
// answer and reschedules it. Same rapid fetch-mutate-fetch rationale as the
// lesson/quiz Route Handlers (docs/06-api-architecture.md) — the review
// session pulls one card at a time without a full page navigation.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      { status: 401 },
    );
  }

  const item = await getNextDueReviewItem(user.id);
  return NextResponse.json({ item });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = submitReviewAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_input',
          message: parsed.error.issues[0]?.message ?? 'Invalid input',
        },
      },
      { status: 400 },
    );
  }

  const grade = await gradeQuestionResponse(parsed.data.questionId, parsed.data.response);

  await recordQuestionAttempt({
    userId: user.id,
    questionId: parsed.data.questionId,
    isCorrect: grade.isCorrect,
    response: parsed.data.response,
    timeSpentSeconds: parsed.data.timeSpentSeconds,
  });
  await recordReviewOutcome(user.id, parsed.data.questionId, grade.isCorrect);

  return NextResponse.json({ grade });
}
