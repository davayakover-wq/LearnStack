'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatChartPoint {
  label: string; // pre-formatted x-axis category
  value: number | null; // null = no data for this point (e.g. accuracy on a day with no answers)
}

// Generic Recharts wrapper (docs/07-folder-structure.md's `StatChart`) — the
// caller maps whichever raw series (daily/weekly/monthly activity, accuracy
// trend) into {label, value} pairs, so this component never needs to know
// about lib/data/stats.ts's row shapes. `hasData` is explicit rather than
// `data.length > 0` because a zero-filled series (every day/week/month
// present, values all 0) still has a nonzero length for a brand-new user.
export function StatChart({
  title,
  variant = 'bar',
  data,
  hasData,
  emptyMessage,
  valueFormatter,
  color,
  connectNulls = true,
}: {
  title: string;
  variant?: 'bar' | 'line';
  data: StatChartPoint[];
  hasData: boolean;
  emptyMessage: string;
  valueFormatter?: (value: number) => string;
  color?: string;
  connectNulls?: boolean;
}) {
  // Recharts' Formatter type is generic over its own ValueType/NameType and
  // includes `undefined` (no data point at all) alongside whatever we
  // actually pass through `data` — widen to `unknown` and narrow here rather
  // than fighting that generic.
  const tooltipFormatter = (value: unknown) => {
    const numericValue = typeof value === 'number' ? value : null;
    return [
      numericValue === null
        ? 'No data'
        : (valueFormatter?.(numericValue) ?? numericValue.toLocaleString('en-US')),
      title,
    ];
  };

  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!hasData ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {emptyMessage}
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              {variant === 'bar' ? (
                <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    interval="preserveStartEnd"
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={tooltipFormatter}
                  />
                  <Bar
                    dataKey="value"
                    fill={color ?? 'var(--color-primary)'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={tooltipFormatter}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color ?? 'var(--color-success)'}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={connectNulls}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
