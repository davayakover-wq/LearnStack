'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// One mini-form per lesson_sections.section_type, matching exactly the
// fields each learner-facing block component reads (ExplanationBlock,
// ExampleBlock, HintPanel, SummaryBlock — see components/lesson-player/) —
// not a generic raw-JSON editor, since the content shape is fixed per type.
export function SectionContentFields({
  namePrefix,
  sectionType,
}: {
  namePrefix: string;
  sectionType: string;
}) {
  const { register } = useFormContext();

  if (sectionType === 'explanation') {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Heading</Label>
          <Input {...register(`${namePrefix}.content.heading`)} />
        </div>
        <div className="space-y-1.5">
          <Label>Body</Label>
          <Textarea
            rows={3}
            {...register(`${namePrefix}.content.body`)}
            placeholder="Use $...$ for inline math, $$...$$ for block math"
          />
        </div>
      </div>
    );
  }

  if (sectionType === 'example') {
    return <ExampleListFields namePrefix={namePrefix} />;
  }

  if (sectionType === 'hint') {
    return (
      <div className="space-y-1.5">
        <Label>Hint text</Label>
        <Textarea rows={2} {...register(`${namePrefix}.content.text`)} />
      </div>
    );
  }

  if (sectionType === 'summary') {
    return (
      <div className="space-y-1.5">
        <Label>Recap</Label>
        <Textarea rows={2} {...register(`${namePrefix}.content.recap`)} />
      </div>
    );
  }

  // interactive_exercise: just an optional intro line; the question itself
  // is edited via QuestionEditor, rendered alongside this by the caller.
  return (
    <div className="space-y-1.5">
      <Label>Intro text (optional)</Label>
      <Input
        {...register(`${namePrefix}.content.prompt`)}
        placeholder="Try it yourself:"
      />
    </div>
  );
}

function ExampleListFields({ namePrefix }: { namePrefix: string }) {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${namePrefix}.content.examples`,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Examples</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ text: '', note: '' })}
        >
          <Plus className="size-3.5" />
          Add example
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <Input
              {...register(`${namePrefix}.content.examples.${index}.text`)}
              placeholder="Example text"
            />
            <Input
              {...register(`${namePrefix}.content.examples.${index}.note`)}
              placeholder="Note (optional)"
              className="text-xs"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(index)}
            aria-label="Remove example"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
