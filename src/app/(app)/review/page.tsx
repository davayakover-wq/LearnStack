import type { Metadata } from 'next';
import { ReviewSessionShell } from '@/components/review/review-session-shell';

export const metadata: Metadata = { title: 'Review — LearnStack' };

export default function ReviewPage() {
  return <ReviewSessionShell />;
}
