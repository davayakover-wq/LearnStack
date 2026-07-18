import type { Metadata } from 'next';
import { AchievementsManager } from '@/components/admin/achievements-manager';
import { getAdminAchievements } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Manage Achievements — LearnStack Admin' };

export default async function AdminAchievementsPage() {
  const achievements = await getAdminAchievements();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold">Achievements</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Define unlock criteria and XP bonuses for platform achievements.
        </p>
      </div>
      <AchievementsManager achievements={achievements} />
    </div>
  );
}
