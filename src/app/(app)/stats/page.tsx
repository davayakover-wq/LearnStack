import type { Metadata } from 'next';
import { getCurrentProfile } from '@/lib/data/profile';
import { getStatsPageData } from '@/lib/data/stats';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarHeatmap } from '@/components/dashboard/calendar-heatmap';
import { ActivityPeriodChart } from '@/components/stats/activity-period-chart';
import { AccuracyTrendChart } from '@/components/stats/accuracy-trend-chart';
import { TopicAccuracyList } from '@/components/stats/topic-accuracy-list';

export const metadata: Metadata = { title: 'Statistics — LearnStack' };

export default async function StatsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
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

  const data = await getStatsPageData(profile.id);

  // Weakest-first for the "weak topics" card; the same list reversed for
  // "strong topics" rather than a second query — see TopicAccuracyList.
  const weakestTopics = data.topicAccuracy.slice(0, 5);
  const strongestTopics = [...data.topicAccuracy].reverse().slice(0, 5);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your learning activity, accuracy, and streak history over time.
        </p>
      </div>

      <ActivityPeriodChart
        daily={data.daily}
        weekly={data.weekly}
        monthly={data.monthly}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AccuracyTrendChart
          daily={data.daily}
          weekly={data.weekly}
          monthly={data.monthly}
        />
        <CalendarHeatmap activeDates={data.streakDates} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopicAccuracyList
          title="Topics to review"
          topics={weakestTopics}
          emptyMessage="Answer some questions across a few topics to see where you need practice."
        />
        <TopicAccuracyList
          title="Strongest topics"
          topics={strongestTopics}
          emptyMessage="Answer some questions across a few topics to see your strengths."
        />
      </div>
    </div>
  );
}
