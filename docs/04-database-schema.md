# 04 — Database Schema (Supabase / PostgreSQL)

> This was the pre-implementation design. It's been built and verified — see
> [`10-database-explained.md`](10-database-explained.md) for the as-built
> version, including a few security refinements (privilege-escalation guard,
> append-only policies, index audit) added while implementing and testing
> this design against a real Postgres instance.

This is the authoritative schema design for Phase 3. It will be implemented as
ordered SQL files under `supabase/migrations/`. Types shown are Postgres
types; `uuid` PKs default to `gen_random_uuid()` (via `pgcrypto`, enabled by
default on Supabase). All tables have `created_at timestamptz default now()`
and, where mutable, `updated_at timestamptz default now()` maintained by a
shared `set_updated_at()` trigger.

## Conventions
- Every user-owned table has a `user_id uuid references auth.users(id) on
  delete cascade` column, indexed, and an RLS policy scoping
  `auth.uid() = user_id`.
- Content tables (subjects/topics/lessons/quizzes/questions/answers) are
  publicly **readable** by any authenticated user, but only **writable** by
  admins (checked via `profiles.role = 'admin'`).
- Enumerated values use Postgres `enum` types, not free-text, so the app's
  Zod schemas and the DB constraint stay in lockstep.

```sql
create type app_role as enum ('user', 'admin');
create type subject_slug as enum ('english', 'mathematics');
create type difficulty_level as enum ('beginner', 'elementary', 'intermediate', 'advanced', 'expert');
create type question_type as enum (
  'multiple_choice', 'fill_blank', 'drag_drop', 'matching',
  'ordering', 'typing', 'image_choice'
);
create type lesson_mode as enum ('practice', 'challenge', 'review');
create type progress_status as enum ('not_started', 'in_progress', 'completed');
```

## Tables

### `profiles`
One row per `auth.users` row (1:1), created via trigger on signup.
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role app_role not null default 'user',
  xp integer not null default 0,
  level integer not null default 1,
  coins integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  daily_goal_minutes integer not null default 15,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on profiles(role);
```
RLS: `select` where `id = auth.uid()` **or** the row is being read for a
public-facing leaderboard-safe subset — v1 keeps this simple: users can only
select/update their own row; admins bypass via a `is_admin()` security
definer function used across policies.

### `roles`
Kept separate from `profiles.role` for auditability of role *changes*
(profiles.role is the fast-read current value; this is the history).
```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index roles_user_id_idx on roles(user_id);
```

### `subjects`
```sql
create table subjects (
  id uuid primary key default gen_random_uuid(),
  slug subject_slug unique not null,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
```

### `topics`
```sql
create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, slug)
);
create index topics_subject_id_idx on topics(subject_id);
```

### `lessons`
```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  difficulty difficulty_level not null default 'beginner',
  xp_reward integer not null default 10,
  estimated_minutes integer not null default 5,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);
create index lessons_topic_id_idx on lessons(topic_id);
create index lessons_published_idx on lessons(is_published);
```

### `lesson_prerequisites`
Join table making the curriculum a DAG (drives locked/unlocked lesson state).
```sql
create table lesson_prerequisites (
  lesson_id uuid not null references lessons(id) on delete cascade,
  prerequisite_lesson_id uuid not null references lessons(id) on delete cascade,
  primary key (lesson_id, prerequisite_lesson_id)
);
```

### `lesson_sections`
```sql
create table lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  section_type text not null check (section_type in
    ('explanation','example','interactive_exercise','hint','summary')),
  sort_order integer not null default 0,
  content jsonb not null default '{}'::jsonb, -- structured block content, see 02-ux-design-system.md
  question_id uuid references questions(id), -- set when section_type = 'interactive_exercise'
  created_at timestamptz not null default now()
);
create index lesson_sections_lesson_id_idx on lesson_sections(lesson_id);
```
> Note: `question_id` FK requires `questions` to exist first; the actual
> migration file orders table creation accordingly (questions before
> lesson_sections) or adds this FK via a follow-up `alter table`.

### `quizzes`
```sql
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  description text,
  difficulty difficulty_level not null default 'beginner',
  is_timed boolean not null default false,
  time_limit_seconds integer,
  is_adaptive boolean not null default false,
  xp_reward integer not null default 20,
  is_challenge boolean not null default false,
  challenge_period daterange,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quizzes_topic_id_idx on quizzes(topic_id);
```

### `questions`
```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  type question_type not null,
  prompt text not null,
  prompt_media_url text,
  explanation text,
  difficulty difficulty_level not null default 'beginner',
  sort_order integer not null default 0,
  points integer not null default 1,
  metadata jsonb not null default '{}'::jsonb, -- per-type config: blanks, drag targets, ordering key, etc.
  created_at timestamptz not null default now()
);
create index questions_quiz_id_idx on questions(quiz_id);
```

### `answers`
Stores answer **options** for a question (for MC/matching/ordering/drag-drop);
for typing/fill-blank the accepted answer(s) live here too with
`is_correct = true` and optional `match_pattern` for fuzzy matching.
```sql
create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  content text not null,
  is_correct boolean not null default false,
  match_pattern text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index answers_question_id_idx on answers(question_id);
```

### `user_progress`
Top-level per-user, per-topic mastery rollup (denormalized for fast dashboard
reads; source of truth for detail is `lesson_progress`/`quiz_progress`).
```sql
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  status progress_status not null default 'not_started',
  mastery_percent numeric(5,2) not null default 0,
  lessons_completed integer not null default 0,
  lessons_total integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);
create index user_progress_user_id_idx on user_progress(user_id);
```

### `lesson_progress`
```sql
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  mode lesson_mode not null default 'practice',
  status progress_status not null default 'not_started',
  completion_percent numeric(5,2) not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  time_spent_seconds integer not null default 0,
  last_section_id uuid references lesson_sections(id),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id, mode)
);
create index lesson_progress_user_id_idx on lesson_progress(user_id);
create index lesson_progress_lesson_id_idx on lesson_progress(lesson_id);
```
The `last_section_id` column is precisely what makes "continue exactly where
you stopped, on any device" work — every section transition writes here.

### `quiz_progress`
```sql
create table quiz_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  status progress_status not null default 'not_started',
  score numeric(5,2),
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  time_spent_seconds integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index quiz_progress_user_id_idx on quiz_progress(user_id);
create index quiz_progress_quiz_id_idx on quiz_progress(quiz_id);
```

### `question_attempts`
Individual answer submissions (needed for spaced repetition + accuracy
analytics; not explicitly named in the original list but required to make
`review_schedule` and `statistics` actually derivable — documented here for
transparency since it's an addition beyond the requested table list).
```sql
create table question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  quiz_progress_id uuid references quiz_progress(id) on delete cascade,
  lesson_progress_id uuid references lesson_progress(id) on delete cascade,
  is_correct boolean not null,
  response jsonb not null,
  time_spent_seconds integer,
  created_at timestamptz not null default now()
);
create index question_attempts_user_id_idx on question_attempts(user_id);
create index question_attempts_question_id_idx on question_attempts(question_id);
```

### `xp_history`
```sql
create table xp_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null, -- 'lesson_complete' | 'quiz_complete' | 'streak_bonus' | 'achievement' | 'daily_challenge'
  source_id uuid, -- polymorphic pointer to lesson/quiz/achievement id
  created_at timestamptz not null default now()
);
create index xp_history_user_id_idx on xp_history(user_id);
create index xp_history_created_at_idx on xp_history(created_at);
```

### `streaks`
Append-only daily streak ledger (in addition to the fast-read
`profiles.current_streak`/`longest_streak`); enables the calendar heatmap.
```sql
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  streak_count_at_date integer not null,
  freeze_used boolean not null default false,
  unique (user_id, activity_date)
);
create index streaks_user_id_idx on streaks(user_id);
```

### `daily_activity`
```sql
create table daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  minutes_spent integer not null default 0,
  lessons_completed integer not null default 0,
  quizzes_completed integer not null default 0,
  xp_earned integer not null default 0,
  correct_answers integer not null default 0,
  incorrect_answers integer not null default 0,
  unique (user_id, activity_date)
);
create index daily_activity_user_id_idx on daily_activity(user_id);
```

### `statistics`
Precomputed weekly/monthly rollups (materialized on write or via a scheduled
job) so the stats dashboard never has to scan `daily_activity` row-by-row for
long ranges.
```sql
create table statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly','monthly')),
  period_start date not null,
  total_minutes integer not null default 0,
  total_xp integer not null default 0,
  lessons_completed integer not null default 0,
  quizzes_completed integer not null default 0,
  accuracy_percent numeric(5,2),
  unique (user_id, period_type, period_start)
);
create index statistics_user_id_idx on statistics(user_id);
```

### `achievements`
```sql
create table achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  icon text,
  criteria jsonb not null, -- e.g. {"type":"streak","value":7} | {"type":"lessons_completed","value":50}
  xp_bonus integer not null default 0,
  created_at timestamptz not null default now()
);
```

### `user_achievements`
```sql
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
create index user_achievements_user_id_idx on user_achievements(user_id);
```

### `review_schedule`
Spaced-repetition state per user/question (SM-2-inspired).
```sql
create table review_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  ease_factor numeric(4,2) not null default 2.5,
  interval_days integer not null default 1,
  repetitions integer not null default 0,
  memory_strength numeric(5,2) not null default 0,
  due_at date not null default current_date,
  last_reviewed_at timestamptz,
  unique (user_id, question_id)
);
create index review_schedule_due_idx on review_schedule(user_id, due_at);
```

### `avatars`
Curated selectable avatars (in addition to user-uploaded `profiles.avatar_url`
via Supabase Storage).
```sql
create table avatars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  is_premium boolean not null default false,
  sort_order integer not null default 0
);
```

### `notifications`
```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'streak_reminder' | 'achievement_unlocked' | 'admin_announcement' | ...
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications(user_id, is_read);
```

### `settings`
```sql
create table settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light','system')),
  sound_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  email_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);
```

### `admin_logs`
```sql
create table admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  action text not null, -- 'lesson.create' | 'lesson.update' | 'quiz.delete' | 'user.role_change' | ...
  target_table text not null,
  target_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index admin_logs_admin_id_idx on admin_logs(admin_id);
```

## Row Level Security — pattern

```sql
create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Example: user-owned table
alter table lesson_progress enable row level security;
create policy "select own lesson_progress"
  on lesson_progress for select using (auth.uid() = user_id);
create policy "modify own lesson_progress"
  on lesson_progress for insert with check (auth.uid() = user_id);
create policy "update own lesson_progress"
  on lesson_progress for update using (auth.uid() = user_id);

-- Example: content table (public read, admin write)
alter table lessons enable row level security;
create policy "anyone authenticated can read published lessons"
  on lessons for select using (is_published = true or is_admin());
create policy "admins can write lessons"
  on lessons for all using (is_admin()) with check (is_admin());
```

Every table above gets `enable row level security` plus policies following
one of these two patterns: **user-owned** (profiles, progress, xp_history,
streaks, daily_activity, statistics, user_achievements, review_schedule,
notifications, settings) or **content** (subjects, topics, lessons,
lesson_sections, quizzes, questions, answers, achievements, avatars). Admin
tables (`admin_logs`, `roles`) are admin-only for both read and write.

## Indexing strategy summary
- Every foreign key gets a btree index (listed inline above) — this is what
  keeps dashboard queries (`where user_id = auth.uid()`) fast at scale.
- Composite `unique` constraints double as the natural lookup index for
  upsert-style writes (`lesson_progress(user_id, lesson_id, mode)`,
  `review_schedule(user_id, question_id)`).
- `review_schedule_due_idx` and `notifications_user_id_idx` are compound
  indexes tuned to the exact query pattern the UI needs ("due items for this
  user, ordered by date" / "unread notifications for this user").

## Derived values, not columns
`profiles.level` is written by application logic whenever `xp` changes (via a
shared `xpToLevel()` function used both client- and server-side for display
consistency) rather than recomputed by a DB trigger in v1 — keeps the
leveling curve easy to tune without a migration. `mastery_percent` in
`user_progress` is recalculated via a Server Action whenever
`lesson_progress` changes for that topic, not via a heavy DB trigger — a
scheduled job path is documented as an alternative in `09` if this needs to
move server-side for consistency guarantees later.
