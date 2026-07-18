'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignUpInput,
} from '@/lib/validations/auth';
import type { ActionResult } from '@/lib/types/action-result';

async function getOrigin() {
  const headerList = await headers();
  return (
    headerList.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  );
}

export async function signUp(
  input: SignUpInput,
): Promise<ActionResult<{ emailConfirmationRequired: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Supabase returns a user with no active session when the project
  // requires email confirmation; a session comes back immediately when it
  // doesn't. Either way the profile row already exists — handle_new_user()
  // fires on the auth.users insert regardless of confirmation status.
  return {
    success: true,
    data: { emailConfirmationRequired: data.session === null },
  };
}

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return {
        success: false,
        error:
          'Please verify your email before logging in — check your inbox for the link.',
      };
    }
    // Deliberately generic for any other failure: never confirm/deny
    // whether an email is registered.
    return { success: false, error: 'Invalid email or password.' };
  }

  return { success: true, data: undefined };
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });

  // Always succeed from the caller's point of view, whether or not the
  // email is registered — the alternative leaks which emails have
  // accounts.
  return { success: true, data: undefined };
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
