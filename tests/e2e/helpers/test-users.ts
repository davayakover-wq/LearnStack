import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

// Playwright's own process doesn't auto-load .env.local the way Next.js
// does — read it manually once so the service-role client below can talk
// to the same real Supabase project the app itself uses. No mocks: E2E
// tests exercise real signup/login/lesson-completion/admin-CRUD against
// real Supabase, per docs/08-roadmap.md's Phase 13 instruction.
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, '../../../.env.local');
  if (!existsSync(envPath)) {
    throw new Error(`.env.local not found at ${envPath} — required for E2E tests.`);
  }
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx), l.slice(idx + 1)];
      }),
  );
}

const env = loadEnvLocal();

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export interface TestUser {
  userId: string;
  email: string;
  password: string;
  username: string;
}

// A single random-ish suffix per test user avoids collisions across
// parallel/retried runs without needing a counter or lockfile.
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function createTestUser(
  options: {
    role?: 'user' | 'admin';
    emailConfirmed?: boolean;
    usernamePrefix?: string;
  } = {},
): Promise<TestUser> {
  const { role = 'user', emailConfirmed = true, usernamePrefix = 'e2e' } = options;
  const suffix = randomSuffix();
  const email = `${usernamePrefix}-${suffix}@learnstack.test`;
  const password = 'E2eTest!2026';
  const username = `${usernamePrefix}${suffix}`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirmed,
  });
  if (error || !data.user) {
    throw new Error(`Failed to create test user ${email}: ${error?.message}`);
  }
  const userId = data.user.id;

  // profiles row is inserted by the on_auth_user_created trigger
  // (docs/05-auth-flow.md) — give it a moment before updating it.
  await new Promise((resolve) => setTimeout(resolve, 500));
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ username, role })
    .eq('id', userId);
  if (profileError) {
    throw new Error(`Failed to update profile for ${email}: ${profileError.message}`);
  }

  return { userId, email, password, username };
}

export async function deleteTestUser(userId: string): Promise<void> {
  // admin_logs.admin_id has no ON DELETE CASCADE (docs/04-database-schema.md
  // — an audit trail deliberately isn't cleaned up implicitly), so an admin
  // test user's logged actions must be deleted first or auth.admin.deleteUser
  // fails with a foreign-key violation.
  await supabaseAdmin.from('admin_logs').delete().eq('admin_id', userId);
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

// CelebrationSequence (components/gamification/celebration-sequence.tsx) steps
// through zero or more unlocked achievements one dialog at a time before the
// underlying "complete" screen becomes interactive/visible. A one-shot
// `isVisible().catch(() => false)` check races the dialog's initial mount —
// `rewards` is set synchronously on the completing submission, but the
// Dialog's own render/portal commit isn't guaranteed to have happened yet on
// the very next line, so the check can return false, skip the close, and
// leave the modal open (hiding the underlying heading from the a11y tree)
// when the next assertion runs. Polling with waitFor + looping (since more
// than one achievement can unlock at once) avoids both problems.
export async function dismissAchievementDialogs(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Achievement unlocked!' });
  // The first achievement (if any) only appears once the completing
  // mutation round-trips to the server and `finished`/`results` flips —
  // that's a real network + DB write, not instant, so this wait needs
  // real headroom. Once one dialog is showing, any subsequent one in the
  // same CelebrationSequence is already in memory (just the next index),
  // so it appears immediately — no need for the same long timeout there.
  let timeout = 10_000;
  for (;;) {
    try {
      await dialog.waitFor({ state: 'visible', timeout });
    } catch {
      return;
    }
    await page.getByRole('button', { name: 'Close' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
    timeout = 1_500;
  }
}
