'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/shared/math-text';
import type { Json } from '@/types/supabase';

interface HintContent {
  text?: string;
}

export function HintPanel({ content }: { content: Json }) {
  const [revealed, setRevealed] = useState(false);
  const data = (content ?? {}) as HintContent;

  if (revealed) {
    return (
      <div className="border-warning/30 bg-warning/10 flex items-start gap-2 rounded-lg border p-3 text-sm">
        <Lightbulb className="text-warning mt-0.5 size-4 shrink-0" />
        <p>
          <MathText text={data.text} />
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setRevealed(true)}
    >
      <Lightbulb className="size-4" />
      Show hint
    </Button>
  );
}
