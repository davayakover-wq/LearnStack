import { describe, expect, it } from 'vitest';
import { submitQuizAnswerSchema } from '@/lib/validations/quiz';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('submitQuizAnswerSchema', () => {
  it('accepts a valid quiz answer submission', () => {
    const result = submitQuizAnswerSchema.safeParse({
      quizProgressId: VALID_UUID,
      questionId: VALID_UUID,
      response: { answerId: VALID_UUID },
      timeSpentSeconds: 12,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a submission without the optional timeSpentSeconds', () => {
    const result = submitQuizAnswerSchema.safeParse({
      quizProgressId: VALID_UUID,
      questionId: VALID_UUID,
      response: { text: '4' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing quizProgressId', () => {
    const result = submitQuizAnswerSchema.safeParse({
      questionId: VALID_UUID,
      response: { text: '4' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID questionId', () => {
    const result = submitQuizAnswerSchema.safeParse({
      quizProgressId: VALID_UUID,
      questionId: 'not-a-uuid',
      response: { text: '4' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed nested response', () => {
    const result = submitQuizAnswerSchema.safeParse({
      quizProgressId: VALID_UUID,
      questionId: VALID_UUID,
      response: { answerId: 'not-a-uuid' },
    });
    expect(result.success).toBe(false);
  });
});
