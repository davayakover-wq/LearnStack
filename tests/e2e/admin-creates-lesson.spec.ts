import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  supabaseAdmin,
  type TestUser,
} from './helpers/test-users';

test.describe('admin creates a lesson', () => {
  let admin: TestUser;
  let lessonSlug: string;

  test.beforeEach(async () => {
    admin = await createTestUser({ role: 'admin', usernamePrefix: 'e2e-admin' });
    lessonSlug = `e2e-admin-lesson-${Math.random().toString(36).slice(2, 8)}`;
  });

  test.afterEach(async () => {
    // Best-effort DB cleanup in case a test failed before the UI delete flow
    // ran — deleting a nonexistent row is a no-op, not an error.
    await supabaseAdmin.from('lessons').delete().eq('slug', lessonSlug);
    await deleteTestUser(admin.userId);
  });

  test('creates a lesson through the UI alone and it immediately appears in the learner-facing /learn flow', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(admin.email);
    await page.getByLabel('Password', { exact: true }).fill(admin.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/admin/lessons/new');

    const lessonTitle = `E2E Admin Lesson ${lessonSlug.slice(-6)}`;
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Grammar', exact: true }).click();
    await page.locator('input[name="title"]').fill(lessonTitle);
    await page.locator('input[name="slug"]').fill(lessonSlug);
    await page
      .locator('textarea[name="description"]')
      .fill('Created by the Phase 13 admin-creates-lesson E2E test.');

    await page.getByRole('button', { name: 'Add section' }).click();
    await page
      .locator('input[name="sections.0.content.heading"]')
      .fill('E2E Test Heading');
    await page
      .locator('textarea[name="sections.0.content.body"]')
      .fill('E2E test body content.');

    // "Published (visible to learners)" checkbox — must be checked for the
    // lesson to actually appear in the learner-facing /learn flow below.
    // Target the checkbox itself, not its adjacent label text: the label
    // isn't associated via htmlFor/wrapping (see the lesson-form.tsx fix
    // in this same phase), so clicking the text alone wouldn't toggle it.
    await page.getByRole('checkbox').click();

    await page.getByRole('button', { name: 'Create lesson' }).click();
    await expect(page).toHaveURL(/\/admin\/lessons$/, { timeout: 15_000 });
    await expect(page.getByText(lessonTitle)).toBeVisible();

    // The actual Phase 11 exit criterion: no direct DB edits, and it shows
    // up immediately in the learner-facing flow.
    await page.goto('/learn/english/grammar');
    await expect(page.getByText(lessonTitle)).toBeVisible();

    // Real DB-level confirmation this wasn't just a client-side optimistic
    // update — the lesson (and its section) genuinely persisted.
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, title, is_published, lesson_sections(id)')
      .eq('slug', lessonSlug)
      .single();
    expect(lesson?.title).toBe(lessonTitle);
    expect(lesson?.is_published).toBe(true);
    expect(lesson?.lesson_sections?.length).toBe(1);
  });
});
