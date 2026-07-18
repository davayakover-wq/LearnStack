'use client';

import { useState } from 'react';
import { Plus, Trophy, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AchievementForm } from '@/components/admin/achievement-form';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete-button';
import { deleteAchievement } from '@/lib/actions/admin';
import type { AdminAchievement } from '@/lib/data/admin';

function criteriaLabel(criteria: AdminAchievement['criteria']): string {
  const c = criteria as { type?: string; value?: number };
  switch (c.type) {
    case 'lessons_completed':
      return `${c.value} lessons completed`;
    case 'streak':
      return `${c.value}-day streak`;
    case 'quiz_score':
      return `${c.value}% quiz score`;
    default:
      return 'Unknown criteria';
  }
}

export function AchievementsManager({
  achievements,
}: {
  achievements: AdminAchievement[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAchievement | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(achievement: AdminAchievement) {
    setEditing(achievement);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          New achievement
        </Button>
      </div>

      {achievements.length === 0 ? (
        <Card className="border-border/60 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No achievements yet — create the first one.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="border-border/60 gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="text-primary size-5 shrink-0" />
                  <p className="font-medium">{achievement.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(achievement)}
                    aria-label="Edit achievement"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <ConfirmDeleteButton
                    confirmMessage={`Delete "${achievement.name}"? This can't be undone.`}
                    action={deleteAchievement.bind(null, achievement.id)}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete achievement"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </ConfirmDeleteButton>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{achievement.description}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary">{criteriaLabel(achievement.criteria)}</Badge>
                <Badge variant="outline">+{achievement.xpBonus} XP</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AchievementForm open={formOpen} onOpenChange={setFormOpen} achievement={editing} />
    </div>
  );
}
