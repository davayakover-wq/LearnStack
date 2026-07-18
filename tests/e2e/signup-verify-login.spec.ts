import { test, expect } from '@playwright/test';
import { supabaseAdmin, deleteTestUser } from './helpers/test-users';

// Signup -> verify -> login, against the real dev/production server and
// real Supabase project — no mocks (docs/08-roadmap.md's Phase 13
// instruction). The one deliberate substitution: Supabase's real
// verification flow requires clicking a link in a real email
// (docs/05-auth-flow.md), and no real inbox is reachable from this test
// environment. Instead of skipping "verify" or faking it in the UI layer,
// this test flips the exact same `email_confirmed_at` field via the
// Supabase Admin API that clicking the real link would flip, then
// re-verifies the app's own Server-Action-enforced check reacts correctly
// — the same backend mechanism, only the literal browser-click-a-link
// step is out of reach here.
//
// Real-behavior correction made while writing this test: docs/05-auth-
// flow.md states "Unverified users can log in (Supabase allows this by
// default) but see a persistent verify-your-email banner." Running this
// against the real project showed that's not this project's actual
// configured behavior — `supabase.auth.signInWithPassword()` itself
// rejects unconfirmed accounts with `email_not_confirmed`, which
// `lib/actions/auth.ts` already correctly handles and surfaces as "Please
// verify your email before logging in." So an unconfirmed user can never
// reach the dashboard in the first place, which means the dashboard's
// `!emailConfirmed` banner (`(app)/dashboard/page.tsx`) is unreachable
// through the normal login flow as currently configured — not a code bug
// (the code correctly handles the real Supabase response), but a real
// discrepancy from the docs, and effectively dead code for that banner.
// Documented in this phase's final report rather than silently "fixed" by
// guessing at a Supabase project-settings change that's a product decision,
// not a testing one. This test verifies the flow that's actually reachable.
test.describe('signup → verify → login', () => {
  let userEmail: string;
  let userId: string | null = null;

  test.afterEach(async () => {
    if (userId) {
      await deleteTestUser(userId);
      userId = null;
    }
  });

  test('new user can sign up, is blocked from logging in until verified, then logs in successfully after verification', async ({
    page,
  }) => {
    userEmail = `e2e-signup-${Math.random().toString(36).slice(2, 10)}@gmail.com`;
    const password = 'E2eTest!2026';

    await page.goto('/signup');
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    // shadcn's CardTitle renders a plain styled <div>, not a semantic
    // heading tag — confirmed while writing this test (getByRole('heading')
    // never matched despite the text being visible). That's a real,
    // systemic gap (this project's Card component never exposes a
    // heading-role element), but reworking every CardTitle call site's
    // heading level across the whole app is out of scope for a single test
    // locator — noted as deferred technical debt in this phase's report.
    await expect(page.getByText('Check your email')).toBeVisible({
      timeout: 15_000,
    });

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const createdUser = userList.users.find((u) => u.email === userEmail);
    expect(createdUser).toBeTruthy();
    userId = createdUser!.id;

    // Verify: attempting to log in before confirmation is genuinely
    // rejected, with the app's specific verify-your-email error message.
    await page.goto('/login');
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(
      page.getByText('Please verify your email before logging in'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);

    // "Click the emailed link" — simulated via the real Admin API flipping
    // the real field Supabase itself checks on sign-in.
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true },
    );
    expect(confirmError).toBeNull();

    // Login now succeeds for real.
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
