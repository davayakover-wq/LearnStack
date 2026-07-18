'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WeeklyActivityDay } from '@/lib/data/dashboard';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyChart({ data }: { data: WeeklyActivityDay[] }) {
  const chartData = data.map((day) => ({
    ...day,
    label: DAY_LABELS[new Date(`${day.date}T00:00:00`).getDay()],
  }));
  const totalMinutes = data.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Weekly progress</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {totalMinutes === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No activity yet this week — your first lesson will show up here.
          </p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value} min`, 'Time spent']}
                />
                <Bar
                  dataKey="minutes"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
