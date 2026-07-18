import { describe, expect, it } from 'vitest';
import {
  completeSectionSchema,
  lessonModeSchema,
  questionResponseSchema,
} from '@/lib/validations/lesson';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('lessonModeSchema', () => {
  it('accepts the three documented modes', () => {
    for (const mode of ['practice', 'challenge', 'review']) {
      expect(lessonModeSchema.safeParse(mode).success).toBe(true);
    }
  });

  it('rejects an unknown mode', () => {
    expect(lessonModeSchema.safeParse('speedrun').success).toBe(false);
  });
});

describe('questionResponseSchema', () => {
  it('accepts an answerId-only response (multiple choice)', () => {
    expect(questionResponseSchema.safeParse({ answerId: VALID_UUID }).success).toBe(true);
  });

  it('accepts a text-only response (fill-blank/typing)', () => {
    expect(questionResponseSchema.safeParse({ text: 'is making' }).success).toBe(true);
  });

  it('accepts an answerIds-only response (ordering/matching/drag-drop)', () => {
    expect(
      questionResponseSchema.safeParse({ answerIds: [VALID_UUID, VALID_UUID] }).success,
    ).toBe(true);
  });

  it('accepts a fully empty response (nothing answered yet)', () => {
    expect(questionResponseSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a non-UUID answerId', () => {
    expect(questionResponseSchema.safeParse({ answerId: 'not-a-uuid' }).success).toBe(
      false,
    );
  });

  it('rejects text over 500 characters', () => {
    expect(questionResponseSchema.safeParse({ text: 'a'.repeat(501) }).success).toBe(
      false,
    );
  });

  it('rejects more than 20 answerIds', () => {
    const tooMany = Array.from({ length: 21 }, () => VALID_UUID);
    expect(questionResponseSchema.safeParse({ answerIds: tooMany }).success).toBe(false);
  });
});

describe('completeSectionSchema', () => {
  it('defaults mode to practice when omitted', () => {
    const result = completeSectionSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe('practice');
    }
  });

  it('accepts an explicit mode + response + timeSpentSeconds', () => {
    const result = completeSectionSchema.safeParse({
      mode: 'challenge',
      response: { answerId: VALID_UUID },
      timeSpentSeconds: 42,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative timeSpentSeconds', () => {
    expect(completeSectionSchema.safeParse({ timeSpentSeconds: -1 }).success).toBe(false);
  });

  it('rejects timeSpentSeconds over the 1-hour cap', () => {
    expect(completeSectionSchema.safeParse({ timeSpentSeconds: 3601 }).success).toBe(
      false,
    );
  });

  it('rejects a non-integer timeSpentSeconds', () => {
    expect(completeSectionSchema.safeParse({ timeSpentSeconds: 12.5 }).success).toBe(
      false,
    );
  });
});
