# 10 — Database, Table by Table

This is the Phase 3 companion to [`04-database-schema.md`](04-database-schema.md):
what actually got migrated, why each table exists, and the security decisions
made while implementing it that go beyond the original draft schema. The
migrations themselves live in `supabase/migrations/`, numbered
`20260715000001` → `20260715000014`, applied in that order.

## How this was verified

There is no Docker on this machine, so the Supabase CLI's local dev stack
(`supabase start`) wasn't available. Instead, all 14 migrations plus
`supabase/seed.sql` were applied to a **real, throwaway Postgres 18 instance**
(via the `embedded-postgres` npm package, no system install, no admin
rights), against a small shim of the parts of Supabase's Postgres image that
migrations depend on but vanilla Postgres doesn't ship (`auth.users`,
`auth.uid()`, the `anon`/`authenticated`/`service_role` roles,
`storage.buckets`/`storage.objects`). Six behavioral tests then actually
exercised RLS as different simulated users (not just "does the SQL run") —
all passed:

1. The signup trigger provisions `profiles` + `settings` automatically.
2. A user can read their own profile.
3. A user **cannot** read another user's `lesson_progress`.
4. A user **cannot** grant themselves `admin` or inflate their own `xp` via
   a direct `UPDATE` — the protection trigger silently reverts it.
5. A non-admin **cannot** insert a `lessons` row; an admin can.
6. An anonymous (logged-out) request can read `subjects` but not `lessons`.

The harness is disposable (lives outside the repo, in the session scratch
directory) and was torn down after the run — it's not part of the project.

## Tables

### Identity & profile
- **`profiles`** — one row per user, created automatically by the
  `handle_new_user()` trigger on `auth.users` insert. Holds everything the
  dashboard/profile screen needs to read in one query: XP, level, coins,
  streaks, daily goal, learning goal, timezone. A `BEFORE UPDATE` trigger
  (`protect_profile_privileged_columns`) locks `role`, `xp`, `level`,
  `coins`, `current_streak`, `longest_streak`, and the activity timestamps
  to admin/service-role writers only — RLS alone can't cheaply stop a user
  from `UPDATE profiles SET role='admin' WHERE id=auth.uid()`, so this is a
  trigger, not a policy.
- **`settings`** — per-user preferences (theme, sound, reduced motion, email
  reminders). Split from `profiles` because it's a different concern
  (display/UX prefs vs. gamification state) and because gamification and
  settings tend to change at very different rates.
- **`roles`** — append-only history of role grants ("who made whom an
  admin, and when"). `profiles.role` is the fast-read current value used by
  every `is_admin()` check; this table is the audit trail behind it.

### Curriculum (content)
- **`subjects`** — the two top-level containers, English and Mathematics.
  Publicly readable, even to signed-out visitors.
- **`topics`** — the 15 English / 14 Math topics from the spec, each scoped
  to a subject. Also public.
- **`lessons`** — the actual learning units. "Levels" from the brief
  ("every topic has multiple levels") are **not** a separate table — a
  level is just `lessons.difficulty` (a 5-tier enum) grouped within a
  topic. A dedicated `levels` table would be a join for something that's
  really a filter.
- **`lesson_prerequisites`** — makes the curriculum a DAG. A lesson is
  locked until every row here pointing at it (as `lesson_id`) has a
  completed `lesson_progress` row for the `prerequisite_lesson_id`.
- **`lesson_sections`** — the ordered blocks inside a lesson
  (explanation/example/interactive_exercise/hint/summary). A CHECK
  constraint enforces that `interactive_exercise` sections always carry a
  `question_id`.

### Assessment (content)
- **`quizzes`** — standalone or lesson-attached; carries timing,
  adaptive-difficulty, and challenge-period flags.
- **`questions`** — `quiz_id` is nullable on purpose: a question can belong
  to a quiz, or be embedded directly in a `lesson_sections` row as an
  interactive exercise with no quiz at all.
- **`answers`** — option rows for MC/matching/ordering/drag-drop; for
  typing/fill-blank questions, the accepted value(s) live here too
  (`is_correct = true`, optional `match_pattern` for fuzzy matching).

### Progress (user-owned)
- **`user_progress`** — per-user, per-topic mastery rollup. Denormalized on
  purpose, for a single fast query on the dashboard; the real source of
  truth is `lesson_progress` below.
- **`lesson_progress`** — the table that makes "resume exactly where you
  left off, on any device" work: `last_section_id` updates on every section
  transition, not just at lesson completion. One row per
  `(user, lesson, mode)` — practice/challenge/review are tracked
  separately.
- **`quiz_progress`** — one row **per attempt** (re-taking a quiz creates a
  new row), unlike `lesson_progress` which upserts.
- **`question_attempts`** — append-only log of individual answer
  submissions. Not in the original table list — added because
  `review_schedule` (spaced repetition) and per-topic accuracy in
  `statistics` aren't actually derivable without a record of each attempt,
  only the rolled-up counts.

### Gamification (user-owned)
- **`xp_history`** — append-only ledger; `profiles.xp` is the running
  total, this is how it got there. What "XP gained today" widgets and
  weekly rollups are computed from.
- **`streaks`** — append-only daily ledger backing the calendar heatmap.
  **Design decision:** weekly and monthly "streaks" from the brief are
  *not* separate tracked counters — modeling them as their own mutable
  columns risks drifting from this ledger. They're derived views over it
  (N consecutive weeks/months with ≥1 row here), computed at query time or
  materialized into `statistics`.
- **`achievements`** / **`user_achievements`** — catalog + append-only
  unlock log. "Badges" from the brief are treated as a visual property of
  an achievement (its `icon`), not a separate table.
- **`avatars`** — curated, selectable avatar catalog, distinct from a
  user's own uploaded avatar (`profiles.avatar_url`, via the `avatars`
  Storage bucket — confusingly similar name, different thing: one's a
  table, one's a Storage bucket).

### Spaced repetition
- **`review_schedule`** — SM-2-inspired state per `(user, question)`:
  `ease_factor`, `interval_days`, `due_at`. The Review lesson mode is just
  "give me this user's due rows, ordered by `due_at`."

### Analytics (user-owned)
- **`daily_activity`** — one row per user per day, the raw material for
  every chart.
- **`statistics`** — precomputed weekly/monthly rollups over
  `daily_activity`, so the stats dashboard never scans day-by-day for long
  ranges. Written by application logic when `daily_activity` changes (see
  `06-api-architecture.md`); a scheduled job is a documented fallback in
  `09-scalability-and-ai.md`.

### Platform
- **`notifications`** — in-app notifications; admins can insert into other
  users' rows (for `admin_announcement`), users can only read/update/delete
  their own.
- **`admin_logs`** — append-only audit trail for every admin mutation.
  Even admins can't update or delete an existing entry via the API — insert
  and select only.
- **Storage buckets** (`avatars`, `lesson-media`) — not relational tables,
  but part of the Phase 3 deliverable since "upload images" needs
  somewhere to land. `avatars` is self-service, scoped so a user can only
  write inside a folder named after their own uid
  (`storage.foldername(name)[1] = auth.uid()`). `lesson-media` is
  admin-write, publicly readable.

## Security decisions made during implementation

A few things in the migrations go beyond the original `04` draft, caught
while actually building and testing this:

1. **Privilege-escalation guard.** `profiles` RLS alone ("update your own
   row") would let a user set their own `role`/`xp`/`level`/streaks to
   anything. Fixed with a `BEFORE UPDATE` trigger that pins those columns
   back to their old value unless the caller is an admin or `service_role`.
   Verified directly (test #4 above).
2. **Append-only tables have no UPDATE/DELETE policy at all**, for anyone —
   not "restricted", *absent*. Applies to `xp_history`, `streaks`,
   `question_attempts`, `user_achievements`, `roles`, `admin_logs`. History
   that can be silently rewritten isn't history.
3. **GRANT + RLS, not RLS alone.** Recent Supabase projects no longer
   auto-expose new `public` schema tables to the Data API by default —
   every table needs an explicit `GRANT` to `anon`/`authenticated` in
   addition to its RLS policies. A correct policy with no `GRANT` still
   returns "permission denied"; this is called out in migration `0001` and
   applied consistently through `0014`.
4. **Index audit.** Several indexes in the original draft duplicated a
   unique constraint's leftmost prefix (e.g. `user_progress_user_id_idx`
   was redundant with `unique(user_id, topic_id)`) — dropped. Added a
   reverse-lookup index on `lesson_prerequisites` and a partial index on
   unread `notifications` that the original draft was missing.
5. **CHECK constraints on every gamification/percentage column**
   (`xp >= 0`, `mastery_percent between 0 and 100`, etc.) — cheap insurance
   against bad application logic writing nonsense values, independent of
   RLS.
6. **`LANGUAGE plpgsql`, not `sql`, for `is_admin()`.** A `LANGUAGE SQL`
   function body is validated against the catalog at `CREATE FUNCTION`
   time — which would fail, since `is_admin()` is defined in migration
   `0002`, before `profiles` exists in `0003`. `plpgsql` defers name
   resolution to first execution.

## What's deliberately not here

Per the brief and `09-scalability-and-ai.md`: no `ai_conversations` /
`ai_generated_content` tables (AI tutor is architecture-only, not
implemented), no `subscriptions`/payments tables, no `leaderboard_snapshots`
(derivable from `profiles.xp` + `xp_history` when that UI ships). Adding
these later is a new migration, not a redesign of what's here.
