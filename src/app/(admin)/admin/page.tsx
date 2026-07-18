import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ListChecks, Users, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCurrentProfile } from '@/lib/data/profile';
import { getPlatformStats } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Admin — LearnStack' };

function StatTile({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: number;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 hover:border-primary/40 gap-1 p-4 transition-colors">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums">
        {value.toLocaleString('en-US')}
      </p>
      {sublabel && <p className="text-muted-foreground text-xs">{sublabel}</p>}
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const [profile, stats] = await Promise.all([getCurrentProfile(), getPlatformStats()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Signed in as {profile?.username} — platform-wide stats at a glance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Users" value={stats.totalUsers} icon={Users} />
        <Link href="/admin/lessons">
          <StatTile
            label="Lessons"
            value={stats.totalLessons}
            sublabel={`${stats.publishedLessons} published`}
            icon={BookOpen}
          />
        </Link>
        <Link href="/admin/quizzes">
          <StatTile
            label="Quizzes"
            value={stats.totalQuizzes}
            sublabel={`${stats.publishedQuizzes} published`}
            icon={ListChecks}
          />
        </Link>
        <Link href="/admin/achievements">
          <StatTile
            label="Achievements unlocked"
            value={stats.totalAchievementsUnlocked}
            icon={Trophy}
          />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/60 gap-1 p-4">
          <p className="text-muted-foreground text-sm">Lessons completed</p>
          <p className="text-2xl font-semibold tabular-nums">
            {stats.totalLessonsCompleted.toLocaleString('en-US')}
          </p>
        </Card>
        <Card className="border-border/60 gap-1 p-4">
          <p className="text-muted-foreground text-sm">Quizzes completed</p>
          <p className="text-2xl font-semibold tabular-nums">
            {stats.totalQuizzesCompleted.toLocaleString('en-US')}
          </p>
        </Card>
      </div>
    </div>
  );
}
