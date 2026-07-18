import { z } from 'zod';
import { questionResponseSchema } from '@/lib/validations/lesson';

export const submitQuizAnswerSchema = z.object({
  quizProgressId: z.string().uuid(),
  questionId: z.string().uuid(),
  response: questionResponseSchema,
  timeSpentSeconds: z.number().int().min(0).max(3600).optional(),
});

export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerSchema>;
