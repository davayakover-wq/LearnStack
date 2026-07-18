import Link from 'next/link';
import { Languages, Sigma, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Tables } from '@/types/supabase';

const SUBJECT_ICONS = {
  english: Languages,
  mathematics: Sigma,
} as const;

export function SubjectCard({ subject }: { subject: Tables<'subjects'> }) {
  const Icon = SUBJECT_ICONS[subject.slug] ?? Languages;

  return (
    <Link href={`/learn/${subject.slug}`}>
      <Card className="border-border/60 hover:border-primary/40 hover:bg-muted/40 group gap-3 p-6 transition-colors">
        <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full">
          <Icon className="size-5" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{subject.name}</h2>
          <ArrowRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
        </div>
        {subject.description && (
          <p className="text-muted-foreground text-sm">{subject.description}</p>
        )}
      </Card>
    </Link>
  );
}
