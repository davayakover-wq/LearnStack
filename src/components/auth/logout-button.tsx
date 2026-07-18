'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending && <Loader2 className="size-4 animate-spin" />}
      Log out
    </Button>
  );
}
