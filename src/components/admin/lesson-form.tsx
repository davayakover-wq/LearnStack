'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SectionContentFields } from '@/components/admin/section-content-fields';
import { QuestionEditor } from '@/components/admin/question-editor';
import { createLesson, updateLesson } from '@/lib/actions/admin';
import { lessonFormSchema, type LessonFormInput } from '@/lib/validations/admin';
import type { Tables } from '@/types/supabase';
import type { AdminLessonDetail } from '@/lib/data/admin';

const DIFFICULTIES = [
  'beginner',
  'elementary',
  'intermediate',
  'advanced',
  'expert',
] as const;
const SECTION_TYPES = [
  'explanation',
  'example',
  'interactive_exercise',
  'hint',
  'summary',
] as const;

function emptyQuestion() {
  return {
    type: 'multiple_choice' as const,
    prompt: '',
    promptMediaUrl: null,
    explanation: null,
    difficulty: 'beginner' as const,
    points: 1,
    metadata: {},
    answers: [{ content: '', isCorrect: true, matchPattern: null }],
  };
}

// Lazily fills in a default question the moment a section becomes (or
// starts as) interactive_exercise — a plain state setter would violate the
// project's react-hooks/set-state-in-effect rule, but this is RHF's own
// imperative setValue API, not React state, so an effect is the right tool.
function QuestionEditorGate({ namePrefix }: { namePrefix: string }) {
  const { watch, setValue } = useFormContext();
  const question = watch(`${namePrefix}.question`);

  useEffect(() => {
    if (!question) {
      setValue(`${namePrefix}.question`, emptyQuestion());
    }
  }, [question, namePrefix, setValue]);

  if (!question) return null;
  return <QuestionEditor namePrefix={`${namePrefix}.question`} />;
}

export function LessonForm({
  subjects,
  topics,
  lesson,
}: {
  subjects: Tables<'subjects'>[];
  topics: Tables<'topics'>[];
  lesson?: AdminLessonDetail;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LessonFormInput>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: lesson
      ? {
          topicId: lesson.topicId,
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          difficulty: lesson.difficulty,
          xpReward: lesson.xpReward,
          estimatedMinutes: lesson.estimatedMinutes,
          sortOrder: lesson.sortOrder,
          isPublished: lesson.isPublished,
          sections: lesson.sections.map((section) => ({
            id: section.id,
            sectionType: section.sectionType,
            // Json -> Record<string, unknown>: the form only ever treats
            // this as a plain object bag of fields (see
            // SectionContentFields), never as an arbitrary JSON scalar.
            content: (section.content ?? {}) as Record<string, unknown>,
            question: section.question
              ? {
                  id: section.question.id,
                  type: section.question.type,
                  prompt: section.question.prompt,
                  promptMediaUrl: section.question.promptMediaUrl,
                  explanation: section.question.explanation,
                  difficulty: section.question.difficulty,
                  points: section.question.points,
                  metadata: (section.question.metadata ?? {}) as Record<string, unknown>,
                  answers: section.question.answers,
                }
              : null,
          })),
        }
      : {
          topicId: topics[0]?.id ?? '',
          slug: '',
          title: '',
          description: null,
          difficulty: 'beginner',
          xpReward: 10,
          estimatedMinutes: 5,
          sortOrder: 0,
          isPublished: false,
          sections: [],
        },
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'sections' });

  async function onSubmit(data: LessonFormInput) {
    setFormError(null);
    const result = lesson
      ? await updateLesson(lesson.id, data)
      : await createLesson(data);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    router.push('/admin/lessons');
    router.refresh();
  }

  const topicsBySubject = new Map<string, Tables<'topics'>[]>();
  for (const topic of topics) {
    const list = topicsBySubject.get(topic.subject_id) ?? [];
    list.push(topic);
    topicsBySubject.set(topic.subject_id, list);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Lesson details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Topic</Label>
              <Controller
                control={control}
                name="topicId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string) =>
                          topics.find((t) => t.id === value)?.name ?? 'Select a topic'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectGroup key={subject.id}>
                          <SelectLabel>{subject.name}</SelectLabel>
                          {(topicsBySubject.get(subject.id) ?? []).map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.topicId && (
                <p className="text-destructive text-sm">{errors.topicId.message}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input {...register('title')} />
                {errors.title && (
                  <p className="text-destructive text-sm">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input {...register('slug')} placeholder="e.g. adding-fractions" />
                {errors.slug && (
                  <p className="text-destructive text-sm">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} {...register('description')} />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Controller
                  control={control}
                  name="difficulty"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>XP reward</Label>
                <Input
                  type="number"
                  min={0}
                  {...register('xpReward', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Est. minutes</Label>
                <Input
                  type="number"
                  min={1}
                  {...register('estimatedMinutes', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  min={0}
                  {...register('sortOrder', { valueAsNumber: true })}
                />
              </div>
            </div>

            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="lesson-is-published"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="lesson-is-published">
                    Published (visible to learners)
                  </Label>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sections</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ sectionType: 'explanation', content: {}, question: null })
              }
            >
              <Plus className="size-3.5" />
              Add section
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No sections yet — add at least one.
              </p>
            )}
            {fields.map((field, index) => {
              const sectionType = watch(`sections.${index}.sectionType`);
              return (
                <div
                  key={field.id}
                  className="border-border/60 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label>Section type</Label>
                      <Controller
                        control={control}
                        name={`sections.${index}.sectionType`}
                        render={({ field: typeField }) => (
                          <Select
                            value={typeField.value}
                            onValueChange={typeField.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SECTION_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className="capitalize">
                                  {t.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex gap-1 pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        aria-label="Remove section"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <SectionContentFields
                    namePrefix={`sections.${index}`}
                    sectionType={sectionType}
                  />
                  {sectionType === 'interactive_exercise' && (
                    <QuestionEditorGate namePrefix={`sections.${index}`} />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/lessons')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {lesson ? 'Save changes' : 'Create lesson'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
