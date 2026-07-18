import { MathText } from '@/components/shared/math-text';
import type { Json } from '@/types/supabase';

interface ExplanationContent {
  heading?: string;
  body?: string;
}

export function ExplanationBlock({ content }: { content: Json }) {
  const data = (content ?? {}) as ExplanationContent;
  return (
    <div className="space-y-2">
      {data.heading && <h2 className="text-lg font-semibold">{data.heading}</h2>}
      {data.body && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          <MathText text={data.body} />
        </p>
      )}
    </div>
  );
}
