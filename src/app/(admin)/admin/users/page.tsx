import type { Metadata } from 'next';
import { UserTable } from '@/components/admin/user-table';
import { getAdminUsers } from '@/lib/data/admin';
import { getCurrentUser } from '@/lib/data/profile';

export const metadata: Metadata = { title: 'Manage Users — LearnStack Admin' };

export default async function AdminUsersPage() {
  const [users, currentUser] = await Promise.all([getAdminUsers(), getCurrentUser()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {users.length} registered {users.length === 1 ? 'learner' : 'learners'}. Grant
          or revoke admin access below.
        </p>
      </div>
      <UserTable users={users} currentUserId={currentUser?.id ?? ''} />
    </div>
  );
}
