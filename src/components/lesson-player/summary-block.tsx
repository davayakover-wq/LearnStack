import { MathText } from '@/components/shared/math-text';
import type { Json } from '@/types/supabase';

interface SummaryContent {
  recap?: string;
}

export function SummaryBlock({ content }: { content: Json }) {
  const data = (content ?? {}) as SummaryContent;
  return (
    <p className="text-sm leading-relaxed">
      <MathText text={data.recap} />
    </p>
  );
}
