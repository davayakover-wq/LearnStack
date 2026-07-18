import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  dismissAchievementDialogs,
  supabaseAdmin,
  type TestUser,
} from './helpers/test-users';

const LESSON_PATH = '/learn/english/grammar/present-simple-vs-continuous';
const EXERCISE_CORRECT_ANSWER = 'is making';

test.describe('complete a lesson', () => {
  let user: TestUser;

  test.beforeEach(async () => {
    user = await createTestUser({ usernamePrefix: 'e2e-lesson' });
  });

  test.afterEach(async () => {
    await deleteTestUser(user.userId);
  });

  test('logs in, completes every section of a real lesson, and the completion persists', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(LESSON_PATH);
    await expect(page.getByText('1 / 5')).toBeVisible();

    // Section 1: explanation
    await page.getByRole('button', { name: 'Continue' }).click();
    // Section 2: example
    await expect(page.getByText('2 / 5')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    // Section 3: hint
    await expect(page.getByText('3 / 5')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Section 4: interactive exercise
    await expect(page.getByText('4 / 5')).toBeVisible();
    await page.getByRole('button', { name: EXERCISE_CORRECT_ANSWER }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByText('Correct!')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Section 5: summary
    await expect(page.getByText('5 / 5')).toBeVisible();
    await page.getByRole('button', { name: 'Finish' }).click();

    // This is a brand-new test user's first-ever lesson completion, which
    // genuinely and correctly unlocks the "First Steps" achievement —
    // CelebrationSequence shows that as a modal dialog *before* the
    // lesson-complete screen underneath it (docs/09/gamification design:
    // smaller celebrations first). Dismiss it to reach the screen below.
    await dismissAchievementDialogs(page);

    await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
    // This button renders as a next/link Link via Base UI's polymorphic
    // `render` prop, so its accessible role may be "link" rather than
    // "button" — match by visible text instead of assuming either role.
    await expect(page.getByText('Take the quiz')).toBeVisible();

    // Real DB-level verification — not just a UI check — that progress
    // actually persisted server-side.
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('slug', 'present-simple-vs-continuous')
      .single();
    const { data: progress } = await supabaseAdmin
      .from('lesson_progress')
      .select('status, completed_at, correct_count')
      .eq('user_id', user.userId)
      .eq('lesson_id', lesson!.id)
      .single();
    expect(progress?.status).toBe('completed');
    expect(progress?.completed_at).not.toBeNull();
    expect(progress?.correct_count).toBeGreaterThanOrEqual(1);

    // Persistence check via a fresh page load (not just client-side
    // session state): the topic listing marks this lesson as completed.
    // (Re-visiting the lesson's own URL intentionally restarts it from
    // section 1 for practice — `finished` is client-only state with no
    // special-cased "already completed" resume path, by design — so the
    // topic list, not the lesson URL, is the correct place to assert
    // persisted completion.)
    await page.goto('/learn/english/grammar');
    const lessonCard = page.locator('a', {
      has: page.getByText('Present Simple vs. Present Continuous'),
    });
    await expect(lessonCard.locator('svg.text-success')).toBeVisible();
  });
});
