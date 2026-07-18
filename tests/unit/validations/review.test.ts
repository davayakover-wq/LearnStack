import { describe, expect, it } from 'vitest';
import { submitReviewAnswerSchema } from '@/lib/validations/review';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('submitReviewAnswerSchema', () => {
  it('accepts a valid review answer submission', () => {
    const result = submitReviewAnswerSchema.safeParse({
      questionId: VALID_UUID,
      response: { answerId: VALID_UUID },
      timeSpentSeconds: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing questionId', () => {
    const result = submitReviewAnswerSchema.safeParse({
      response: { text: 'answer' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing response', () => {
    const result = submitReviewAnswerSchema.safeParse({
      questionId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });
});
