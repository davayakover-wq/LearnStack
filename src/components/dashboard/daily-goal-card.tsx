import { Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function DailyGoalCard({
  goalMinutes,
  minutesToday,
}: {
  goalMinutes: number;
  minutesToday: number;
}) {
  const progress = goalMinutes > 0 ? Math.min(minutesToday / goalMinutes, 1) : 0;
  const met = minutesToday >= goalMinutes && goalMinutes > 0;

  return (
    <Card className="border-border/60 gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="bg-success/15 text-success flex size-9 items-center justify-center rounded-full">
          <Target className="size-4" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Daily goal</p>
          <p className="text-lg leading-none font-semibold">
            {minutesToday} / {goalMinutes} min
          </p>
        </div>
      </div>
      <Progress value={progress * 100} aria-label="Daily goal progress" />
      <p className="text-muted-foreground text-xs">
        {met
          ? "You've hit today's goal — nice work."
          : `${Math.max(goalMinutes - minutesToday, 0)} min to go today.`}
      </p>
    </Card>
  );
}
