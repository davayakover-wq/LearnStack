import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/data/profile';
import { AdminNav } from '@/components/admin/admin-nav';

// The real gate is RLS (admins-only write policies, checked at the DB via
// is_admin()) — this redirect is the UX layer so a non-admin never sees a
// flash of admin chrome. See docs/05-auth-flow.md.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-full">
      <AdminNav displayName={profile.display_name ?? profile.username} />
      {children}
    </div>
  );
}
