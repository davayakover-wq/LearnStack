'use client';

import { cloneElement, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/types/action-result';

// Generic confirm-then-delete wrapper reused for lessons/quizzes/
// achievements — a native confirm() is a deliberately small footprint for
// an admin-only destructive action rather than adding a full AlertDialog
// component for this one use.
export function ConfirmDeleteButton({
  confirmMessage,
  action,
  redirectTo,
  children,
}: {
  confirmMessage: string;
  action: () => Promise<ActionResult>;
  redirectTo?: string;
  children: React.ReactElement<{ onClick?: () => void; disabled?: boolean }>;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.success) {
      window.alert(result.error);
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return cloneElement(children, {
    onClick: handleClick,
    disabled: pending || children.props.disabled,
  });
}
