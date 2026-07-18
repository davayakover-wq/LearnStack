'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createAchievement, updateAchievement } from '@/lib/actions/admin';
import {
  achievementFormSchema,
  type AchievementFormInput,
} from '@/lib/validations/admin';
import type { AdminAchievement } from '@/lib/data/admin';

const CRITERIA_TYPES = [
  { value: 'lessons_completed', label: 'Lessons completed' },
  { value: 'streak', label: 'Day streak' },
  { value: 'quiz_score', label: 'Quiz score (%)' },
] as const;

// Base UI's <Select.Value> only resolves a label when given an explicit
// items/itemToStringLabel map — without one it falls back to rendering the
// raw field value, which is wrong whenever label !== value (as here).
function criteriaTypeLabel(value: string): string {
  return CRITERIA_TYPES.find((c) => c.value === value)?.label ?? value;
}

// One dialog-based form handles both create and edit — docs/07-folder-
// structure.md's folder plan gives achievements a single page.tsx (unlike
// lessons/quizzes' new/[id]/edit sub-routes), matching how much simpler an
// achievement's fields are.
export function AchievementForm({
  open,
  onOpenChange,
  achievement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement?: AdminAchievement;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AchievementFormInput>({
    resolver: zodResolver(achievementFormSchema),
    values: achievement
      ? {
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          criteria: achievement.criteria as {
            type: 'lessons_completed' | 'streak' | 'quiz_score';
            value: number;
          },
          xpBonus: achievement.xpBonus,
        }
      : {
          slug: '',
          name: '',
          description: '',
          icon: null,
          criteria: { type: 'lessons_completed', value: 1 },
          xpBonus: 10,
        },
  });

  async function onSubmit(data: AchievementFormInput) {
    setFormError(null);
    const result = achievement
      ? await updateAchievement(achievement.id, data)
      : await createAchievement(data);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    onOpenChange(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>
              {achievement ? 'Edit achievement' : 'New achievement'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input {...register('slug')} placeholder="e.g. first-lesson" />
              {errors.slug && (
                <p className="text-destructive text-sm">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} {...register('description')} />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Unlock criteria</Label>
              <Controller
                control={control}
                name="criteria.type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string) => criteriaTypeLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CRITERIA_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Threshold</Label>
              <Input
                type="number"
                min={1}
                {...register('criteria.value', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>XP bonus</Label>
            <Input
              type="number"
              min={0}
              {...register('xpBonus', { valueAsNumber: true })}
            />
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {achievement ? 'Save changes' : 'Create achievement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
