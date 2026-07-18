'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
import { QuestionEditor } from '@/components/admin/question-editor';
import { createQuiz, updateQuiz } from '@/lib/actions/admin';
import { quizFormSchema, type QuizFormInput } from '@/lib/validations/admin';
import type { Tables } from '@/types/supabase';
import type { AdminQuizDetail } from '@/lib/data/admin';

const DIFFICULTIES = [
  'beginner',
  'elementary',
  'intermediate',
  'advanced',
  'expert',
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

export function QuizForm({
  subjects,
  topics,
  lessons,
  quiz,
}: {
  subjects: Tables<'subjects'>[];
  topics: Tables<'topics'>[];
  lessons: Pick<Tables<'lessons'>, 'id' | 'title' | 'topic_id'>[];
  quiz?: AdminQuizDetail;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<QuizFormInput>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: quiz
      ? {
          topicId: quiz.topicId,
          lessonId: quiz.lessonId,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          isTimed: quiz.isTimed,
          timeLimitSeconds: quiz.timeLimitSeconds,
          xpReward: quiz.xpReward,
          isPublished: quiz.isPublished,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            promptMediaUrl: q.promptMediaUrl,
            explanation: q.explanation,
            difficulty: q.difficulty,
            points: q.points,
            metadata: (q.metadata ?? {}) as Record<string, unknown>,
            answers: q.answers,
          })),
        }
      : {
          topicId: topics[0]?.id ?? '',
          lessonId: null,
          title: '',
          description: null,
          difficulty: 'beginner',
          isTimed: false,
          timeLimitSeconds: null,
          xpReward: 20,
          isPublished: false,
          questions: [emptyQuestion()],
        },
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  const topicId = watch('topicId');
  const isTimed = watch('isTimed');
  const lessonsForTopic = lessons.filter((l) => l.topic_id === topicId);

  async function onSubmit(data: QuizFormInput) {
    setFormError(null);
    const result = quiz ? await updateQuiz(quiz.id, data) : await createQuiz(data);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    router.push('/admin/quizzes');
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
            <CardTitle>Quiz details</CardTitle>
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

            <div className="space-y-1.5">
              <Label>Linked lesson (optional)</Label>
              <Controller
                control={control}
                name="lessonId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string) =>
                          value === 'none'
                            ? 'No linked lesson'
                            : (lessonsForTopic.find((l) => l.id === value)?.title ??
                              'No linked lesson')
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked lesson</SelectItem>
                      {lessonsForTopic.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...register('title')} />
              {errors.title && (
                <p className="text-destructive text-sm">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} {...register('description')} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
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
                <Label>Time limit (seconds)</Label>
                <Input
                  type="number"
                  min={30}
                  disabled={!isTimed}
                  {...register('timeLimitSeconds', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Controller
                control={control}
                name="isTimed"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="quiz-is-timed"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="quiz-is-timed">Timed quiz</Label>
                  </div>
                )}
              />
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="quiz-is-published"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="quiz-is-published">
                      Published (visible to learners)
                    </Label>
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyQuestion())}
            >
              <Plus className="size-3.5" />
              Add question
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.questions?.message && (
              <p className="text-destructive text-sm">{errors.questions.message}</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs font-medium">
                    Question {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    aria-label="Remove question"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <QuestionEditor namePrefix={`questions.${index}`} />
              </div>
            ))}
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
            onClick={() => router.push('/admin/quizzes')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {quiz ? 'Save changes' : 'Create quiz'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
