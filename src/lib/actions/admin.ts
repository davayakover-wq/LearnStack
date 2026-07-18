'use server';

import { revalidatePath } from 'next/cache';
import {
  assertAdmin,
  createAchievement as createAchievementRow,
  createLessonWithSections,
  createQuizWithQuestions,
  deleteAchievement as deleteAchievementRow,
  deleteLesson as deleteLessonRow,
  deleteQuiz as deleteQuizRow,
  logAdminAction,
  setUserRole as setUserRoleRow,
  updateAchievement as updateAchievementRow,
  updateLessonWithSections,
  updateQuizWithQuestions,
  type LessonWriteInput,
  type QuizWriteInput,
} from '@/lib/data/admin';
import {
  achievementFormSchema,
  lessonFormSchema,
  quizFormSchema,
  setUserRoleSchema,
  type AchievementFormInput,
  type LessonFormInput,
  type QuizFormInput,
  type SetUserRoleInput,
} from '@/lib/validations/admin';
import type { ActionResult } from '@/lib/types/action-result';
import type { Json } from '@/types/supabase';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

// Zod's z.record(...) infers `content`/`metadata` as Record<string,
// unknown>, which isn't structurally assignable to Supabase's generated
// Json union (a recursive type a plain index signature can't match). A
// `.transform()` inside the schema would fix this at the source, but it
// blows up @hookform/resolvers' generic inference ("type instantiation
// excessively deep") when combined with this schema's nested arrays — so
// the bridge happens here instead, at the one place validated form data
// crosses into the data-access layer's Json-typed writes. The value is
// already plain JSON-safe at runtime (it only ever comes from a parsed
// form submission).
function asWriteInput<T>(data: unknown): T {
  return data as T;
}

// ============================================================ lessons ===

export async function createLesson(
  input: LessonFormInput,
): Promise<ActionResult<{ lessonId: string }>> {
  const parsed = lessonFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    const lessonId = await createLessonWithSections(
      asWriteInput<LessonWriteInput>(parsed.data),
    );
    await logAdminAction({
      adminId: userId,
      action: 'lesson.create',
      targetTable: 'lessons',
      targetId: lessonId,
      diff: asWriteInput<Json>(parsed.data),
    });
    revalidatePath('/learn', 'layout');
    revalidatePath('/admin/lessons');
    return { success: true, data: { lessonId } };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to create the lesson.') };
  }
}

export async function updateLesson(
  lessonId: string,
  input: LessonFormInput,
): Promise<ActionResult> {
  const parsed = lessonFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    await updateLessonWithSections(lessonId, asWriteInput<LessonWriteInput>(parsed.data));
    await logAdminAction({
      adminId: userId,
      action: 'lesson.update',
      targetTable: 'lessons',
      targetId: lessonId,
      diff: asWriteInput<Json>(parsed.data),
    });
    revalidatePath('/learn', 'layout');
    revalidatePath('/admin/lessons');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update the lesson.') };
  }
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  try {
    const { userId } = await assertAdmin();
    await deleteLessonRow(lessonId);
    await logAdminAction({
      adminId: userId,
      action: 'lesson.delete',
      targetTable: 'lessons',
      targetId: lessonId,
    });
    revalidatePath('/learn', 'layout');
    revalidatePath('/admin/lessons');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to delete the lesson.') };
  }
}

// ============================================================ quizzes ===

export async function createQuiz(
  input: QuizFormInput,
): Promise<ActionResult<{ quizId: string }>> {
  const parsed = quizFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    const quizId = await createQuizWithQuestions(
      asWriteInput<QuizWriteInput>(parsed.data),
    );
    await logAdminAction({
      adminId: userId,
      action: 'quiz.create',
      targetTable: 'quizzes',
      targetId: quizId,
      diff: asWriteInput<Json>(parsed.data),
    });
    revalidatePath('/learn', 'layout');
    revalidatePath('/admin/quizzes');
    return { success: true, data: { quizId } };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to create the quiz.') };
  }
}

export async function updateQuiz(
  quizId: string,
  input: QuizFormInput,
): Promise<ActionResult> {
  const parsed = quizFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    await updateQuizWithQuestions(quizId, asWriteInput<QuizWriteInput>(parsed.data));
    await logAdminAction({
      adminId: userId,
      action: 'quiz.update',
      targetTable: 'quizzes',
      targetId: quizId,
      diff: asWriteInput<Json>(parsed.data),
    });
    revalidatePath('/learn', 'layout');
    revalidatePath('/admin/quizzes');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update the quiz.') };
  }
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  try {
    const { userId } = await assertAdmin();
    await deleteQuizRow(quizId);
    await logAdminAction({
      adminId: userId,
      action: 'quiz.delete',
      targetTable: 'quizzes',
      targetId: quizId,
    });
    revalidatePath('/learn', 'layout');
    revalidatePath('/admin/quizzes');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to delete the quiz.') };
  }
}

// ============================================================ users ===

export async function setUserRole(input: SetUserRoleInput): Promise<ActionResult> {
  const parsed = setUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    await setUserRoleRow(parsed.data.targetUserId, parsed.data.role, userId);
    await logAdminAction({
      adminId: userId,
      action: 'user.role_change',
      targetTable: 'profiles',
      targetId: parsed.data.targetUserId,
      diff: { role: parsed.data.role },
    });
    revalidatePath('/admin/users');
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, 'Failed to update the user role.'),
    };
  }
}

// ============================================================ achievements ===

export async function createAchievement(
  input: AchievementFormInput,
): Promise<ActionResult<{ achievementId: string }>> {
  const parsed = achievementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    const achievementId = await createAchievementRow(parsed.data);
    await logAdminAction({
      adminId: userId,
      action: 'achievement.create',
      targetTable: 'achievements',
      targetId: achievementId,
      diff: parsed.data,
    });
    revalidatePath('/admin/achievements');
    revalidatePath('/dashboard');
    return { success: true, data: { achievementId } };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, 'Failed to create the achievement.'),
    };
  }
}

export async function updateAchievement(
  achievementId: string,
  input: AchievementFormInput,
): Promise<ActionResult> {
  const parsed = achievementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const { userId } = await assertAdmin();
    await updateAchievementRow(achievementId, parsed.data);
    await logAdminAction({
      adminId: userId,
      action: 'achievement.update',
      targetTable: 'achievements',
      targetId: achievementId,
      diff: parsed.data,
    });
    revalidatePath('/admin/achievements');
    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, 'Failed to update the achievement.'),
    };
  }
}

export async function deleteAchievement(achievementId: string): Promise<ActionResult> {
  try {
    const { userId } = await assertAdmin();
    await deleteAchievementRow(achievementId);
    await logAdminAction({
      adminId: userId,
      action: 'achievement.delete',
      targetTable: 'achievements',
      targetId: achievementId,
    });
    revalidatePath('/admin/achievements');
    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err, 'Failed to delete the achievement.'),
    };
  }
}
