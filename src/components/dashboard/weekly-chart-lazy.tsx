'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// next/dynamic's `ssr: false` isn't allowed directly inside a Server
// Component (dashboard/page.tsx) — this thin client boundary is the
// documented way to still defer recharts (a meaningfully heavy client
// bundle) out of the dashboard's critical render path. Lighthouse's mobile
// performance audit this phase showed the dashboard's LCP/TBT dragged by
// client JS execution under CPU throttling; this chart is useful but not
// LCP-critical, so it loads after the rest of the page is interactive.
const WeeklyChart = dynamic(
  () => import('@/components/dashboard/weekly-chart').then((m) => m.WeeklyChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[232px] w-full rounded-xl" />,
  },
);

export { WeeklyChart };
