import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const WEEKS = 12;
const DAYS = WEEKS * 7;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CalendarHeatmap({ activeDates }: { activeDates: Set<string> }) {
  // Deliberately not zeroed to local midnight: toDateKey() derives the
  // calendar date via toISOString() (UTC), and in a timezone ahead of UTC
  // (e.g. UTC+3), local-midnight is still the *previous* UTC day — that
  // combination silently shifted every cell back by one day.
  const today = new Date();

  // Build DAYS calendar cells ending today, oldest first, grouped into
  // columns of 7 (one column per week) to render as a GitHub-style grid.
  const cells: { key: string; active: boolean }[] = [];
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = toDateKey(date);
    cells.push({ key, active: activeDates.has(key) });
  }
  const columns: { key: string; active: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  const activeCount = cells.filter((c) => c.active).length;

  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Learning calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {columns.map((column) => (
            <div key={column[0]?.key} className="flex flex-col gap-1">
              {column.map((cell) => (
                <div
                  key={cell.key}
                  title={cell.key}
                  className={cn(
                    'size-3 rounded-sm',
                    cell.active ? 'bg-success' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          {activeCount > 0
            ? `Active on ${activeCount} of the last ${DAYS} days.`
            : 'No activity logged in the last 12 weeks yet.'}
        </p>
      </CardContent>
    </Card>
  );
}
