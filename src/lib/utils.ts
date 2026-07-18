import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date-key label formatters for the stats page's charts (docs/07-folder-
// structure.md: utils.ts holds "cn(), formatters"). Locale pinned
// explicitly for the same reason src/components/ui/progress.tsx pins its
// Intl locale — an ambient/runtime-default locale can render differently
// between the server and the browser.
const DATE_LOCALE = 'en-US';

export function formatDayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(DATE_LOCALE, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

export function formatWeekLabel(periodStart: string): string {
  return new Date(`${periodStart}T00:00:00Z`).toLocaleDateString(DATE_LOCALE, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthLabel(periodStart: string): string {
  return new Date(`${periodStart}T00:00:00Z`).toLocaleDateString(DATE_LOCALE, {
    timeZone: 'UTC',
    month: 'short',
    year: '2-digit',
  });
}
