import { MathText } from '@/components/shared/math-text';
import type { Json } from '@/types/supabase';

interface ExampleItem {
  text: string;
  note?: string;
}

interface ExampleContent {
  examples?: ExampleItem[];
}

export function ExampleBlock({ content }: { content: Json }) {
  const data = (content ?? {}) as ExampleContent;
  return (
    <div className="space-y-2">
      {(data.examples ?? []).map((example, i) => (
        <div key={i} className="border-border/60 bg-muted/30 rounded-lg border p-3">
          <p className="text-sm">
            <MathText text={example.text} />
          </p>
          {example.note && (
            <p className="text-muted-foreground mt-1 text-xs italic">
              <MathText text={example.note} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
