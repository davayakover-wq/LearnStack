import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export const metadata: Metadata = { title: 'Profile — LearnStack' };

export default function ProfilePage() {
  return (
    <ComingSoon
      icon={UserRound}
      title="Profile settings are coming"
      description="Editing your name, avatar, learning goal, and preferences will live here."
    />
  );
}
