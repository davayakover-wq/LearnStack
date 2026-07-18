'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/logout-button';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/lessons', label: 'Lessons' },
  { href: '/admin/quizzes', label: 'Quizzes' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/achievements', label: 'Achievements' },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-border/60 bg-card/40 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            App
          </Link>
          <div className="bg-border/60 h-5 w-px" />
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="text-primary size-4" />
            Admin
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-3 text-sm">
          <span className="truncate">{displayName}</span>
          <LogoutButton />
        </div>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
