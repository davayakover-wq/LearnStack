import { Card } from '@/components/ui/card';
import { StreakFlame } from '@/components/gamification/streak-flame';

export function StreakCard({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}) {
  return (
    <Card className="border-border/60 gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="bg-warning/15 text-warning flex size-9 items-center justify-center rounded-full">
          <StreakFlame />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Current streak</p>
          <p className="text-lg leading-none font-semibold">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        {longestStreak > 0
          ? `Longest streak: ${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`
          : 'Complete a lesson today to start your streak.'}
      </p>
    </Card>
  );
}
