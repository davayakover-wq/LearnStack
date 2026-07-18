// Centralized query key factory — keeps cache keys consistent between the
// hooks that read/write them (see docs/06-api-architecture.md's "React
// Query cache is keyed by user.id + resource").
export const queryKeys = {
  lessonProgress: (lessonId: string, mode: string) =>
    ['lesson-progress', lessonId, mode] as const,
  quizAttempt: (quizId: string) => ['quiz-attempt', quizId] as const,
  reviewNext: () => ['review-next'] as const,
};
