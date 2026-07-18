import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatsSummary } from '@/lib/data/dashboard';

export function StatsSummaryCard({ stats }: { stats: StatsSummary }) {
  const items = [
    { label: 'Lessons completed', value: stats.totalLessonsCompleted.toString() },
    { label: 'Quizzes completed', value: stats.totalQuizzesCompleted.toString() },
    {
      label: 'Time spent learning',
      value:
        stats.totalMinutes >= 60
          ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
          : `${stats.totalMinutes}m`,
    },
    {
      label: 'Accuracy',
      value: stats.accuracyPercent === null ? '—' : `${stats.accuracyPercent}%`,
    },
  ];

  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 p-0 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-lg font-semibold">{item.value}</p>
            <p className="text-muted-foreground text-xs">{item.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
