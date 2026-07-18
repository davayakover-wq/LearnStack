import { describe, expect, it } from 'vitest';
import {
  achievementFormSchema,
  adminQuestionSchema,
  adminSectionSchema,
  lessonFormSchema,
  quizFormSchema,
  setUserRoleSchema,
  uploadImageSchema,
} from '@/lib/validations/admin';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

function validAnswer(overrides: Partial<{ content: string; isCorrect: boolean }> = {}) {
  return { content: 'Option', isCorrect: false, matchPattern: null, ...overrides };
}

function validQuestion(overrides: Record<string, unknown> = {}) {
  return {
    type: 'multiple_choice' as const,
    prompt: 'What is 2+2?',
    promptMediaUrl: null,
    explanation: null,
    difficulty: 'beginner' as const,
    points: 1,
    metadata: {},
    answers: [validAnswer({ isCorrect: true }), validAnswer()],
    ...overrides,
  };
}

describe('adminQuestionSchema', () => {
  it('accepts a well-formed question with at least one correct answer', () => {
    expect(adminQuestionSchema.safeParse(validQuestion()).success).toBe(true);
  });

  it('rejects a question where no answer is marked correct', () => {
    const result = adminQuestionSchema.safeParse(
      validQuestion({ answers: [validAnswer(), validAnswer()] }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a question with zero answers', () => {
    const result = adminQuestionSchema.safeParse(validQuestion({ answers: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range points value', () => {
    expect(adminQuestionSchema.safeParse(validQuestion({ points: 0 })).success).toBe(
      false,
    );
    expect(adminQuestionSchema.safeParse(validQuestion({ points: 101 })).success).toBe(
      false,
    );
  });

  it('rejects an invalid promptMediaUrl (must be a URL or null)', () => {
    expect(
      adminQuestionSchema.safeParse(validQuestion({ promptMediaUrl: 'not-a-url' }))
        .success,
    ).toBe(false);
  });
});

describe('adminSectionSchema', () => {
  it('accepts a non-exercise section with no question', () => {
    const result = adminSectionSchema.safeParse({
      sectionType: 'explanation',
      content: { heading: 'Intro', body: 'Text' },
      question: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an interactive_exercise section with no question', () => {
    const result = adminSectionSchema.safeParse({
      sectionType: 'interactive_exercise',
      content: {},
      question: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['question']);
    }
  });

  it('accepts an interactive_exercise section with a valid question', () => {
    const result = adminSectionSchema.safeParse({
      sectionType: 'interactive_exercise',
      content: {},
      question: validQuestion(),
    });
    expect(result.success).toBe(true);
  });
});

describe('lessonFormSchema', () => {
  function validLesson(overrides: Record<string, unknown> = {}) {
    return {
      topicId: VALID_UUID,
      slug: 'adding-fractions',
      title: 'Adding Fractions',
      description: null,
      difficulty: 'beginner' as const,
      xpReward: 10,
      estimatedMinutes: 5,
      sortOrder: 0,
      isPublished: false,
      sections: [],
      ...overrides,
    };
  }

  it('accepts a well-formed lesson with no sections', () => {
    expect(lessonFormSchema.safeParse(validLesson()).success).toBe(true);
  });

  it('rejects an uppercase or space-containing slug', () => {
    expect(
      lessonFormSchema.safeParse(validLesson({ slug: 'Adding Fractions' })).success,
    ).toBe(false);
    expect(
      lessonFormSchema.safeParse(validLesson({ slug: 'adding_fractions' })).success,
    ).toBe(false);
  });

  it('rejects a non-UUID topicId', () => {
    expect(lessonFormSchema.safeParse(validLesson({ topicId: 'nope' })).success).toBe(
      false,
    );
  });

  it('rejects estimatedMinutes outside the 1-180 range', () => {
    expect(lessonFormSchema.safeParse(validLesson({ estimatedMinutes: 0 })).success).toBe(
      false,
    );
    expect(
      lessonFormSchema.safeParse(validLesson({ estimatedMinutes: 181 })).success,
    ).toBe(false);
  });
});

describe('quizFormSchema', () => {
  function validQuiz(overrides: Record<string, unknown> = {}) {
    return {
      topicId: VALID_UUID,
      lessonId: null,
      title: 'Present Tenses Practice',
      description: null,
      difficulty: 'beginner' as const,
      isTimed: false,
      timeLimitSeconds: null,
      xpReward: 20,
      isPublished: false,
      questions: [validQuestion()],
      ...overrides,
    };
  }

  it('accepts a well-formed quiz', () => {
    expect(quizFormSchema.safeParse(validQuiz()).success).toBe(true);
  });

  it('rejects a quiz with zero questions', () => {
    expect(quizFormSchema.safeParse(validQuiz({ questions: [] })).success).toBe(false);
  });

  it('rejects a timeLimitSeconds below the 30s minimum', () => {
    expect(quizFormSchema.safeParse(validQuiz({ timeLimitSeconds: 10 })).success).toBe(
      false,
    );
  });

  it('accepts a null lessonId (unlinked quiz)', () => {
    expect(quizFormSchema.safeParse(validQuiz({ lessonId: null })).success).toBe(true);
  });
});

describe('achievementFormSchema', () => {
  function validAchievement(overrides: Record<string, unknown> = {}) {
    return {
      slug: 'first-lesson',
      name: 'First Steps',
      description: 'Complete your first lesson.',
      icon: null,
      criteria: { type: 'lessons_completed' as const, value: 1 },
      xpBonus: 10,
      ...overrides,
    };
  }

  it('accepts a well-formed achievement', () => {
    expect(achievementFormSchema.safeParse(validAchievement()).success).toBe(true);
  });

  it('rejects an unknown criteria type', () => {
    const result = achievementFormSchema.safeParse(
      validAchievement({ criteria: { type: 'unknown_type', value: 1 } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a criteria value below 1', () => {
    const result = achievementFormSchema.safeParse(
      validAchievement({ criteria: { type: 'streak', value: 0 } }),
    );
    expect(result.success).toBe(false);
  });
});

describe('setUserRoleSchema', () => {
  it('accepts admin and user roles', () => {
    expect(
      setUserRoleSchema.safeParse({ targetUserId: VALID_UUID, role: 'admin' }).success,
    ).toBe(true);
    expect(
      setUserRoleSchema.safeParse({ targetUserId: VALID_UUID, role: 'user' }).success,
    ).toBe(true);
  });

  it('rejects an unknown role', () => {
    expect(
      setUserRoleSchema.safeParse({ targetUserId: VALID_UUID, role: 'superadmin' })
        .success,
    ).toBe(false);
  });
});

describe('uploadImageSchema', () => {
  it('accepts a valid PNG under the size cap', () => {
    const result = uploadImageSchema.safeParse({
      fileName: 'photo.png',
      contentType: 'image/png',
      sizeBytes: 1024,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported content type', () => {
    const result = uploadImageSchema.safeParse({
      fileName: 'file.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a file over the 5MB cap', () => {
    const result = uploadImageSchema.safeParse({
      fileName: 'huge.png',
      contentType: 'image/png',
      sizeBytes: 5 * 1024 * 1024 + 1,
    });
    expect(result.success).toBe(false);
  });
});
