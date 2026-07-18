'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setUserRole } from '@/lib/actions/admin';
import type { AdminUserSummary } from '@/lib/data/admin';

export function UserTable({
  users,
  currentUserId,
}: {
  users: AdminUserSummary[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(users);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggleRole(user: AdminUserSummary) {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    setError(null);
    setPendingId(user.id);
    startTransition(async () => {
      const result = await setUserRole({ targetUserId: user.id, role: nextRole });
      setPendingId(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === user.id ? { ...r, role: nextRole } : r)),
      );
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="border-border/60 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
            <tr>
              <th className="px-4 py-2 font-medium">Username</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Level</th>
              <th className="px-4 py-2 font-medium">XP</th>
              <th className="px-4 py-2 font-medium">Streak</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {rows.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2">
                  <p className="font-medium">{user.displayName ?? user.username}</p>
                  <p className="text-muted-foreground text-xs">@{user.username}</p>
                </td>
                <td className="px-4 py-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-2 tabular-nums">{user.level}</td>
                <td className="px-4 py-2 tabular-nums">
                  {user.xp.toLocaleString('en-US')}
                </td>
                <td className="px-4 py-2 tabular-nums">{user.currentStreak}</td>
                <td className="text-muted-foreground px-4 py-2">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={user.id === currentUserId || pendingId === user.id}
                    onClick={() => handleToggleRole(user)}
                  >
                    {user.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
