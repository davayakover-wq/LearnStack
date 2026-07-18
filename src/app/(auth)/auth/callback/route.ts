import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles both links Supabase emails out: email verification (redirects on
// to `next`, defaulting to the dashboard) and password recovery (redirects
// to /reset-password so the user can set a new password while the
// short-lived recovery session from exchangeCodeForSession is active).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = type === 'recovery' ? '/reset-password' : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
