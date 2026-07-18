import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  dismissAchievementDialogs,
  supabaseAdmin,
  type TestUser,
} from './helpers/test-users';

const QUIZ_ID = '4c85d100-0bb8-4ff6-b7ee-e31bc3feed21'; // "Present Tenses Practice"

test.describe('submit a quiz', () => {
  let user: TestUser;

  test.beforeEach(async () => {
    user = await createTestUser({ usernamePrefix: 'e2e-quiz' });
  });

  test.afterEach(async () => {
    await deleteTestUser(user.userId);
  });

  test('logs in, answers every real question, and the attempt persists with a score', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/quiz/${QUIZ_ID}`);
    await expect(page.getByText('1 / 3')).toBeVisible({ timeout: 15_000 });

    // Q1: multiple choice
    await page.getByRole('button', { name: 'She is reading a book right now.' }).click();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByText(/Correct!|Not quite\./)).toBeVisible();
    await page.getByRole('button', { name: 'Next question' }).click();

    // Q2: fill in the blank
    await expect(page.getByText('2 / 3')).toBeVisible();
    await page.getByPlaceholder('Type your answer…').fill('walks / is driving');
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByText(/Correct!|Not quite\./)).toBeVisible();
    await page.getByRole('button', { name: 'Next question' }).click();

    // Q3: typing (free text) — the last question. Submitting it completes
    // the whole attempt in the same round-trip (quiz-player-shell.tsx sets
    // `results` as soon as the response says isComplete), so the UI jumps
    // straight to the results screen — there's no intermediate grade
    // feedback or "Finish" button to click for this one, unlike Q1/Q2.
    await expect(page.getByText('3 / 3')).toBeVisible();
    await page.getByPlaceholder('Type your answer…').fill('eat');
    await page.getByRole('button', { name: 'Submit answer' }).click();

    // A perfect run on this quiz genuinely and correctly unlocks the real
    // "Perfectionist" achievement — CelebrationSequence shows that modal
    // before the results screen underneath it (see the identical case in
    // complete-lesson.spec.ts).
    await dismissAchievementDialogs(page);

    await expect(page.getByRole('heading', { name: 'Quiz complete!' })).toBeVisible();
    await expect(page.getByText(/scored \d+% \(\d+ \/ 3 correct\)/)).toBeVisible();

    // Real DB-level verification of the persisted attempt.
    const { data: progress } = await supabaseAdmin
      .from('quiz_progress')
      .select('status, score, correct_count, incorrect_count')
      .eq('user_id', user.userId)
      .eq('quiz_id', QUIZ_ID)
      .single();
    expect(progress?.status).toBe('completed');
    expect(progress?.correct_count).toBeGreaterThanOrEqual(1);
    expect((progress?.correct_count ?? 0) + (progress?.incorrect_count ?? 0)).toBe(3);
  });
});
