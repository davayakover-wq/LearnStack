'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, ADMIN_NAV_ITEM } from './nav-items';
import { LogoutButton } from '@/components/auth/logout-button';

interface AppShellProps {
  children: React.ReactNode;
  displayName: string;
  isAdmin: boolean;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The lesson and quiz players are full-screen, distraction-free experiences
// (docs/02-ux-design-system.md) — no sidebar/tab bar while actively playing.
// Detected here (rather than restructuring route groups) so the rest of
// `(app)` keeps a single shared layout.
const CHROME_FREE_PATTERNS = [/^\/learn\/[^/]+\/[^/]+\/[^/]+/, /^\/quiz\/[^/]+/];

function isChromeFree(pathname: string) {
  return CHROME_FREE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function AppShell({ children, displayName, isAdmin }: AppShellProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  if (isChromeFree(pathname)) {
    return <main className="flex min-h-full flex-1 flex-col">{children}</main>;
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="border-border/60 bg-card/40 hidden w-60 shrink-0 flex-col border-r lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="bg-primary size-7 rounded-lg" />
          <span className="font-semibold">LearnStack</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-border/60 flex items-center justify-between gap-2 border-t px-4 py-4">
          <span className="text-muted-foreground truncate text-sm">{displayName}</span>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        <nav className="border-border/60 bg-card/95 fixed inset-x-0 bottom-0 z-40 flex border-t backdrop-blur lg:hidden">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
