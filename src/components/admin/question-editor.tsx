'use client';

import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploader } from '@/components/admin/image-uploader';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'image_choice', label: 'Image choice' },
  { value: 'ordering', label: 'Ordering' },
  { value: 'matching', label: 'Matching' },
  { value: 'drag_drop', label: 'Drag & drop' },
  { value: 'fill_blank', label: 'Fill in the blank' },
  { value: 'typing', label: 'Typing (free text)' },
] as const;

// These types all just render "answers" as a generic list of options
// (content + is_correct + sort_order) — the schema doesn't distinguish
// them at the answers-table level, so one editor UI covers all five.
// fill_blank/typing instead take one or more *accepted* answer strings
// (every row is implicitly correct), with an optional match pattern for
// alternate phrasings.
const OPTION_BASED_TYPES = new Set([
  'multiple_choice',
  'image_choice',
  'ordering',
  'matching',
  'drag_drop',
]);

// Base UI's <Select.Value> only resolves a label when given an explicit
// items/itemToStringLabel map — without one it falls back to rendering the
// raw field value, which is wrong whenever label !== value (as here).
function questionTypeLabel(value: string): string {
  return QUESTION_TYPES.find((t) => t.value === value)?.label ?? value;
}

// Reusable across a lesson's interactive_exercise section and a quiz's
// question list (docs/07-folder-structure.md's QuestionEditor) — `control`/
// `register`/etc. come from whichever parent form (LessonForm/QuizForm) via
// useFormContext, with `namePrefix` pointing at this question's slice of
// the form (e.g. "sections.2.question" or "questions.0").
export function QuestionEditor({ namePrefix }: { namePrefix: string }) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${namePrefix}.answers`,
  });
  const questionType: string = watch(`${namePrefix}.type`);
  const isOptionBased = OPTION_BASED_TYPES.has(questionType);
  const isNumericGradable = questionType === 'fill_blank' || questionType === 'typing';

  const answersError = errors?.answers?.message as string | undefined;

  return (
    <div className="border-border/60 space-y-4 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Question type</Label>
          <Controller
            control={control}
            name={`${namePrefix}.type`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => questionTypeLabel(value)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Points</Label>
          <Input
            type="number"
            min={1}
            {...register(`${namePrefix}.points`, { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Prompt</Label>
        <Textarea rows={2} {...register(`${namePrefix}.prompt`)} placeholder="What is…" />
      </div>

      <div className="space-y-1.5">
        <Label>Explanation (shown after answering)</Label>
        <Textarea rows={2} {...register(`${namePrefix}.explanation`)} />
      </div>

      <div className="space-y-1.5">
        <Label>Prompt image (optional)</Label>
        <Controller
          control={control}
          name={`${namePrefix}.promptMediaUrl`}
          render={({ field }) => (
            <ImageUploader value={field.value ?? null} onChange={field.onChange} />
          )}
        />
      </div>

      {isNumericGradable && (
        <Controller
          control={control}
          name={`${namePrefix}.metadata`}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${namePrefix.replace(/\./g, '-')}-numeric-grading`}
                checked={field.value?.grading === 'numeric'}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? { grading: 'numeric', tolerance: 0.01 } : {})
                }
              />
              <Label
                htmlFor={`${namePrefix.replace(/\./g, '-')}-numeric-grading`}
                className="text-muted-foreground text-sm font-normal"
              >
                Accept equivalent numeric answers (e.g. &ldquo;0.5&rdquo; and
                &ldquo;1/2&rdquo;)
              </Label>
            </div>
          )}
        />
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{isOptionBased ? 'Answer options' : 'Accepted answer(s)'}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ content: '', isCorrect: !isOptionBased, matchPattern: null })
            }
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            {isOptionBased && (
              <Controller
                control={control}
                name={`${namePrefix}.answers.${index}.isCorrect`}
                render={({ field: checkField }) => (
                  <Checkbox
                    checked={checkField.value}
                    onCheckedChange={checkField.onChange}
                    aria-label="Correct answer"
                    className="mt-2.5"
                  />
                )}
              />
            )}
            <div className="flex-1 space-y-1.5">
              <Input
                {...register(`${namePrefix}.answers.${index}.content`)}
                placeholder={isOptionBased ? 'Option text' : 'Accepted answer'}
              />
              {!isOptionBased && (
                <Input
                  {...register(`${namePrefix}.answers.${index}.matchPattern`)}
                  placeholder="Alternate phrasings separated by | (optional)"
                  className="text-muted-foreground text-xs"
                />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(index)}
              aria-label="Remove answer"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {answersError && <p className="text-destructive text-sm">{answersError}</p>}
      </div>
    </div>
  );
}
