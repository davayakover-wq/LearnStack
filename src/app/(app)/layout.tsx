import { redirect } from 'next/navigation';
import { getCurrentProfile, getCurrentUser } from '@/lib/data/profile';
import { AppShell } from '@/components/shared/app-shell';

// Middleware already blocks unauthenticated requests to this route group —
// this is the defense-in-depth check described in docs/05-auth-flow.md,
// backed by a real query rather than a possibly-stale cookie.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getCurrentProfile();

  return (
    <AppShell
      displayName={profile?.username ?? user.email ?? 'You'}
      isAdmin={profile?.role === 'admin'}
    >
      {children}
    </AppShell>
  );
}
