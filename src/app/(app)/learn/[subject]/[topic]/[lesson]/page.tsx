import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getLessonDetail, getLessonUnlockState } from '@/lib/data/lessons';
import { getLessonProgress } from '@/lib/data/progress';
import { getQuizByLessonId } from '@/lib/data/quizzes';
import { getCurrentUser } from '@/lib/data/profile';
import { LessonPlayerShell } from '@/components/lesson-player/lesson-player-shell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; topic: string; lesson: string }>;
}): Promise<Metadata> {
  const { subject, topic, lesson } = await params;
  const detail = await getLessonDetail(subject, topic, lesson);
  return { title: detail ? `${detail.title} — LearnStack` : 'Lesson — LearnStack' };
}

export default async function LessonPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string; topic: string; lesson: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { subject, topic, lesson } = await params;
  const { mode: modeParam } = await searchParams;
  const mode =
    modeParam === 'challenge' || modeParam === 'review'
      ? modeParam
      : ('practice' as const);

  const detail = await getLessonDetail(subject, topic, lesson);
  if (!detail) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const [existingProgress, associatedQuiz, unlockState] = await Promise.all([
    getLessonProgress(user.id, detail.id, mode),
    getQuizByLessonId(detail.id),
    getLessonUnlockState(user.id),
  ]);

  // The lesson list only ever *links* to unlocked lessons, but that's a UI
  // affordance, not enforcement — a locked lesson's URL is still guessable/
  // bookmarkable. Block direct access here too, unless the user already has
  // a progress row (they started it before, or completed it — don't
  // re-lock a lesson someone is legitimately revisiting).
  if (!existingProgress && !unlockState.isUnlocked(detail.id)) {
    redirect(`/learn/${detail.subjectSlug}/${detail.topicSlug}`);
  }

  let initialSectionIndex = 0;
  if (existingProgress?.status === 'in_progress' && existingProgress.last_section_id) {
    const lastIndex = detail.sections.findIndex(
      (s) => s.id === existingProgress.last_section_id,
    );
    if (lastIndex !== -1) {
      initialSectionIndex = Math.min(lastIndex + 1, detail.sections.length - 1);
    }
  }

  return (
    <LessonPlayerShell
      lesson={detail}
      initialSectionIndex={initialSectionIndex}
      mode={mode}
      associatedQuiz={associatedQuiz}
    />
  );
}
