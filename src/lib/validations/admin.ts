import { z } from 'zod';

export const difficultySchema = z.enum([
  'beginner',
  'elementary',
  'intermediate',
  'advanced',
  'expert',
]);

export const questionTypeSchema = z.enum([
  'multiple_choice',
  'fill_blank',
  'drag_drop',
  'matching',
  'ordering',
  'typing',
  'image_choice',
]);

export const sectionTypeSchema = z.enum([
  'explanation',
  'example',
  'interactive_exercise',
  'hint',
  'summary',
]);

// Shared by a lesson's interactive_exercise section and a quiz's question
// list — one schema, two call sites (lib/data/admin.ts's
// AdminQuestionWrite has the identical rationale).
export const adminAnswerSchema = z.object({
  id: z.string().uuid().optional(),
  content: z.string().min(1, 'Answer text is required').max(500),
  isCorrect: z.boolean(),
  matchPattern: z.string().max(500).nullable(),
});

export const adminQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  type: questionTypeSchema,
  prompt: z.string().min(1, 'Prompt is required').max(1000),
  promptMediaUrl: z.string().url().nullable(),
  explanation: z.string().max(2000).nullable(),
  difficulty: difficultySchema,
  points: z.number().int().min(1).max(100),
  // No `.default({})` here: it would make this field optional on
  // z.input<> but required on z.output<>, which useForm<z.infer<>>
  // (output-shaped) and the resolver's input-shaped internals then
  // disagree about — the form's own defaultValues (see LessonForm/
  // QuizForm's emptyQuestion()) always sets this explicitly instead.
  metadata: z.record(z.string(), z.unknown()),
  answers: z
    .array(adminAnswerSchema)
    .min(1, 'At least one answer is required')
    .refine((answers) => answers.some((a) => a.isCorrect), {
      message: 'At least one answer must be marked correct',
    }),
});

// content is admin-authored structured JSON (docs/02-ux-design-system.md) —
// validated loosely here (it's a record, not free-form HTML) since its
// exact shape varies per section_type; each block component already
// tolerates missing/extra fields.
// Same rationale as adminQuestionSchema.metadata above — no `.default({})`.
const sectionContentSchema = z.record(z.string(), z.unknown());

export const adminSectionSchema = z
  .object({
    id: z.string().uuid().optional(),
    sectionType: sectionTypeSchema,
    content: sectionContentSchema,
    question: adminQuestionSchema.nullable(),
  })
  .refine(
    (section) =>
      section.sectionType !== 'interactive_exercise' || section.question !== null,
    {
      message: 'An interactive exercise section needs a question',
      path: ['question'],
    },
  );

export const lessonFormSchema = z.object({
  topicId: z.string().uuid('Select a topic'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens only',
    ),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable(),
  difficulty: difficultySchema,
  xpReward: z.number().int().min(0).max(1000),
  estimatedMinutes: z.number().int().min(1).max(180),
  sortOrder: z.number().int().min(0),
  isPublished: z.boolean(),
  sections: z.array(adminSectionSchema),
});
export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export const quizFormSchema = z.object({
  topicId: z.string().uuid('Select a topic'),
  lessonId: z.string().uuid().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable(),
  difficulty: difficultySchema,
  isTimed: z.boolean(),
  timeLimitSeconds: z.number().int().min(30).max(3600).nullable(),
  xpReward: z.number().int().min(0).max(1000),
  isPublished: z.boolean(),
  questions: z.array(adminQuestionSchema).min(1, 'A quiz needs at least one question'),
});
export type QuizFormInput = z.infer<typeof quizFormSchema>;

export const achievementFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens only',
    ),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required').max(500),
  icon: z.string().max(100).nullable(),
  criteria: z.object({
    type: z.enum(['lessons_completed', 'streak', 'quiz_score']),
    value: z.number().int().min(1),
  }),
  xpBonus: z.number().int().min(0).max(1000),
});
export type AchievementFormInput = z.infer<typeof achievementFormSchema>;

export const setUserRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  role: z.enum(['user', 'admin']),
});
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;

export const uploadImageSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024, 'File must be 5MB or smaller'),
});
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
