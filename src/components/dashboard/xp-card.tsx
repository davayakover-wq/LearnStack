import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { levelProgress } from '@/lib/gamification/xp';

export function XpCard({ xp, coins }: { xp: number; coins: number }) {
  const { level, xpIntoLevel, xpForNextLevel, progress } = levelProgress(xp);

  return (
    <Card className="border-border/60 gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-xp/15 text-xp flex size-9 items-center justify-center rounded-full">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Level {level}</p>
            <p className="text-lg leading-none font-semibold">
              {xp.toLocaleString('en-US')} XP
            </p>
          </div>
        </div>
        {/* Locale pinned explicitly — see progress.tsx's locale prop for why:
            an ambient/runtime-default locale can format grouped numbers
            differently between the server and the browser. */}
        <p className="text-muted-foreground text-xs">
          {coins.toLocaleString('en-US')} coins
        </p>
      </div>
      <Progress value={progress * 100} aria-label="XP progress to next level" />
      <p className="text-muted-foreground text-xs">
        {xpIntoLevel} / {xpForNextLevel} XP to level {level + 1}
      </p>
    </Card>
  );
}
