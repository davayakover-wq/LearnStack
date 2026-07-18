import { z } from 'zod';

export const lessonModeSchema = z.enum(['practice', 'challenge', 'review']);

export const questionResponseSchema = z.object({
  answerId: z.string().uuid().optional(),
  text: z.string().max(500).optional(),
  answerIds: z.array(z.string().uuid()).max(20).optional(),
});

export const completeSectionSchema = z.object({
  mode: lessonModeSchema.default('practice'),
  response: questionResponseSchema.optional(),
  timeSpentSeconds: z.number().int().min(0).max(3600).optional(),
});

export type QuestionResponseInput = z.infer<typeof questionResponseSchema>;
export type CompleteSectionInput = z.infer<typeof completeSectionSchema>;
