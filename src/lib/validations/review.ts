import { z } from 'zod';
import { questionResponseSchema } from '@/lib/validations/lesson';

export const submitReviewAnswerSchema = z.object({
  questionId: z.string().uuid(),
  response: questionResponseSchema,
  timeSpentSeconds: z.number().int().min(0).max(3600).optional(),
});

export type SubmitReviewAnswerInput = z.infer<typeof submitReviewAnswerSchema>;
