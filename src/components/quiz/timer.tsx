'use client';

import { useEffect, useState } from 'react';
import { TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Timer({
  totalSeconds,
  onExpire,
}: {
  totalSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const low = remaining <= 30;

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-medium tabular-nums',
        low ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      <TimerIcon className="size-3.5" />
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}
