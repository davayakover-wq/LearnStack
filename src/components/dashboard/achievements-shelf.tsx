import { Award, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AchievementProgress } from '@/lib/data/dashboard';
import { cn } from '@/lib/utils';

export function AchievementsShelf({
  achievements,
}: {
  achievements: AchievementProgress[];
}) {
  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Achievements</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {achievements.length === 0 ? (
          <p className="text-muted-foreground text-sm">No achievements defined yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex flex-col items-center gap-1.5 text-center"
                title={achievement.description}
              >
                <div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-full',
                    achievement.unlocked
                      ? 'bg-warning/15 text-warning'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {achievement.unlocked ? (
                    <Award className="size-5" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                </div>
                <p
                  className={cn(
                    'text-xs leading-tight',
                    achievement.unlocked ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {achievement.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
