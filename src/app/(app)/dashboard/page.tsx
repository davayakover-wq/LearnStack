import type { Metadata } from 'next';
import { MailWarning } from 'lucide-react';
import { getCurrentProfile, getCurrentUser } from '@/lib/data/profile';
import { getDashboardData } from '@/lib/data/dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DailyGoalCard } from '@/components/dashboard/daily-goal-card';
import { StreakCard } from '@/components/dashboard/streak-card';
import { XpCard } from '@/components/dashboard/xp-card';
import { WeeklyChart } from '@/components/dashboard/weekly-chart-lazy';
import { ContinueLearningCard } from '@/components/dashboard/continue-learning-card';
import { RecommendedLessons } from '@/components/dashboard/recommended-lessons';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { AchievementsShelf } from '@/components/dashboard/achievements-shelf';
import { CalendarHeatmap } from '@/components/dashboard/calendar-heatmap';
import { StatsSummaryCard } from '@/components/dashboard/stats-summary-card';

export const metadata: Metadata = { title: 'Dashboard — LearnStack' };

export default async function DashboardPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const emailConfirmed = Boolean(user?.email_confirmed_at);

  if (!profile) {
    // Defensive only — the signup trigger always creates this row; a null
    // profile here would mean the trigger failed, not a normal user state.
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Alert variant="destructive">
          <AlertTitle>Profile not found</AlertTitle>
          <AlertDescription>
            Something went wrong provisioning your account. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = await getDashboardData(profile.id);
  const minutesToday = data.weeklyActivity.at(-1)?.minutes ?? 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      {!emailConfirmed && (
        <Alert>
          <MailWarning />
          <AlertTitle>Verify your email</AlertTitle>
          <AlertDescription>
            Check your inbox for a confirmation link to unlock the rest of the app.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {profile.username}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s where you stand today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DailyGoalCard
          goalMinutes={profile.daily_goal_minutes}
          minutesToday={minutesToday}
        />
        <StreakCard
          currentStreak={profile.current_streak}
          longestStreak={profile.longest_streak}
        />
        <XpCard xp={profile.xp} coins={profile.coins} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyChart data={data.weeklyActivity} />
        </div>
        <ContinueLearningCard item={data.continueLearning} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendedLessons lessons={data.recommendedLessons} />
        <RecentActivityFeed items={data.recentActivity} />
      </div>

      <AchievementsShelf achievements={data.achievements} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CalendarHeatmap activeDates={data.streakDates} />
        <StatsSummaryCard stats={data.statsSummary} />
      </div>
    </div>
  );
}
