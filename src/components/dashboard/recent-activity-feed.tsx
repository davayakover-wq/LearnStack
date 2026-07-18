import { Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityFeedItem } from '@/lib/data/dashboard';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="border-border/60 gap-3 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing here yet — complete a lesson to start building your history.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <div
                  className={
                    item.type === 'achievement'
                      ? 'bg-warning/15 text-warning flex size-7 shrink-0 items-center justify-center rounded-full'
                      : 'bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-full'
                  }
                >
                  {item.type === 'achievement' ? (
                    <Award className="size-3.5" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.detail}</p>
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelativeTime(item.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
