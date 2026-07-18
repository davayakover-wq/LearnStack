'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatChart, type StatChartPoint } from '@/components/stats/stat-chart';
import { formatDayLabel, formatMonthLabel, formatWeekLabel } from '@/lib/utils';
import type { DailyStatPoint, PeriodStatPoint } from '@/lib/data/stats';

type Period = 'daily' | 'weekly' | 'monthly';

function dailyAccuracy(day: DailyStatPoint): number | null {
  const total = day.correct + day.incorrect;
  return total > 0 ? Math.round((day.correct / total) * 1000) / 10 : null;
}

function buildAccuracyPoints(
  period: Period,
  daily: DailyStatPoint[],
  weekly: PeriodStatPoint[],
  monthly: PeriodStatPoint[],
): StatChartPoint[] {
  if (period === 'daily') {
    return daily.map((d) => ({ label: formatDayLabel(d.date), value: dailyAccuracy(d) }));
  }
  if (period === 'weekly') {
    return weekly.map((w) => ({
      label: formatWeekLabel(w.periodStart),
      value: w.accuracyPercent,
    }));
  }
  return monthly.map((m) => ({
    label: formatMonthLabel(m.periodStart),
    value: m.accuracyPercent,
  }));
}

// "Accuracy over time" (docs/01-features.md) — a line chart, not connected
// across no-data gaps (a day/week/month with no answered questions isn't
// "0% accuracy", it's simply not measured).
export function AccuracyTrendChart({
  daily,
  weekly,
  monthly,
}: {
  daily: DailyStatPoint[];
  weekly: PeriodStatPoint[];
  monthly: PeriodStatPoint[];
}) {
  const [period, setPeriod] = useState<Period>('daily');
  const points = buildAccuracyPoints(period, daily, weekly, monthly);
  const hasData = points.some((p) => p.value !== null);

  return (
    <div className="space-y-3">
      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
      <StatChart
        title="Accuracy"
        variant="line"
        data={points}
        hasData={hasData}
        connectNulls={false}
        emptyMessage="Answer some questions to see your accuracy trend here."
        valueFormatter={(v) => `${v}%`}
      />
    </div>
  );
}
