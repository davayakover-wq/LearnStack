'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatChart, type StatChartPoint } from '@/components/stats/stat-chart';
import { formatDayLabel, formatMonthLabel, formatWeekLabel } from '@/lib/utils';
import type { DailyStatPoint, PeriodStatPoint } from '@/lib/data/stats';

type Period = 'daily' | 'weekly' | 'monthly';

function buildPoints(
  period: Period,
  daily: DailyStatPoint[],
  weekly: PeriodStatPoint[],
  monthly: PeriodStatPoint[],
  metric: 'minutes' | 'xp',
): StatChartPoint[] {
  if (period === 'daily') {
    return daily.map((d) => ({
      label: formatDayLabel(d.date),
      value: metric === 'minutes' ? d.minutes : d.xp,
    }));
  }
  if (period === 'weekly') {
    return weekly.map((w) => ({
      label: formatWeekLabel(w.periodStart),
      value: metric === 'minutes' ? w.totalMinutes : w.totalXp,
    }));
  }
  return monthly.map((m) => ({
    label: formatMonthLabel(m.periodStart),
    value: metric === 'minutes' ? m.totalMinutes : m.totalXp,
  }));
}

function hasAnyActivity(points: StatChartPoint[]): boolean {
  return points.some((p) => (p.value ?? 0) > 0);
}

// Daily/weekly/monthly learning-time and XP charts (docs/01-features.md),
// sharing one period toggle so switching granularity updates both charts
// together rather than needing two independent controls.
export function ActivityPeriodChart({
  daily,
  weekly,
  monthly,
}: {
  daily: DailyStatPoint[];
  weekly: PeriodStatPoint[];
  monthly: PeriodStatPoint[];
}) {
  const [period, setPeriod] = useState<Period>('daily');

  const minutesPoints = buildPoints(period, daily, weekly, monthly, 'minutes');
  const xpPoints = buildPoints(period, daily, weekly, monthly, 'xp');

  return (
    <div className="space-y-3">
      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatChart
          title="Time spent"
          data={minutesPoints}
          hasData={hasAnyActivity(minutesPoints)}
          emptyMessage="No time logged yet for this range."
          valueFormatter={(v) => `${v} min`}
        />
        <StatChart
          title="XP earned"
          data={xpPoints}
          hasData={hasAnyActivity(xpPoints)}
          emptyMessage="No XP earned yet for this range."
          valueFormatter={(v) => `${v.toLocaleString('en-US')} XP`}
          color="var(--color-xp)"
        />
      </div>
    </div>
  );
}
