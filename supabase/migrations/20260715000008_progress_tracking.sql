-- user_progress: per-user, per-topic mastery rollup. Denormalized for fast
-- dashboard reads; the detailed source of truth is lesson_progress below.
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  status progress_status not null default 'not_started',
  mastery_percent numeric(5,2) not null default 0
    check (mastery_percent between 0 and 100),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  lessons_total integer not null default 0 check (lessons_total >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);
-- No separate user_id index: unique(user_id, topic_id) covers it as a
-- leftmost prefix.

create trigger user_progress_set_updated_at
before update on user_progress
for each row execute function set_updated_at();

-- lesson_progress: the row that makes "resume exactly where you left off,
-- on any device" work. `last_section_id` is updated on every section
-- transition, not just on lesson completion.
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  mode lesson_mode not null default 'practice',
  status progress_status not null default 'not_started',
  completion_percent numeric(5,2) not null default 0
    check (completion_percent between 0 and 100),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  last_section_id uuid references lesson_sections(id) on delete set null,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id, mode)
);
-- No separate user_id index: unique(user_id, lesson_id, mode) covers it.
create index lesson_progress_lesson_id_idx on lesson_progress(lesson_id);

create trigger lesson_progress_set_updated_at
before update on lesson_progress
for each row execute function set_updated_at();

-- quiz_progress: one row per attempt (re-taking a quiz is a new row, not an
-- upsert), so — unlike lesson_progress — there's no unique constraint here.
create table quiz_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  status progress_status not null default 'not_started',
  score numeric(5,2) check (score between 0 and 100),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index quiz_progress_user_id_idx on quiz_progress(user_id);
create index quiz_progress_quiz_id_idx on quiz_progress(quiz_id);

-- question_attempts: append-only log of individual answer submissions.
-- Not in the original table list — added because spaced repetition
-- (review_schedule) and per-topic accuracy (statistics) are not actually
-- derivable without a record of each attempt, only the rolled-up counts.
create table question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  quiz_progress_id uuid references quiz_progress(id) on delete cascade,
  lesson_progress_id uuid references lesson_progress(id) on delete cascade,
  is_correct boolean not null,
  response jsonb not null,
  time_spent_seconds integer check (time_spent_seconds >= 0),
  created_at timestamptz not null default now()
);
create index question_attempts_user_id_idx on question_attempts(user_id);
create index question_attempts_question_id_idx on question_attempts(question_id);

alter table user_progress enable row level security;
alter table lesson_progress enable row level security;
alter table quiz_progress enable row level security;
alter table question_attempts enable row level security;

grant select, insert, update on public.user_progress to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert, update on public.quiz_progress to authenticated;
grant select, insert on public.question_attempts to authenticated;

create policy "user_progress_select_own_or_admin" on user_progress
  for select using (auth.uid() = user_id or is_admin());
create policy "user_progress_insert_own" on user_progress
  for insert with check (auth.uid() = user_id);
create policy "user_progress_update_own" on user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lesson_progress_select_own_or_admin" on lesson_progress
  for select using (auth.uid() = user_id or is_admin());
create policy "lesson_progress_insert_own" on lesson_progress
  for insert with check (auth.uid() = user_id);
create policy "lesson_progress_update_own" on lesson_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_progress_select_own_or_admin" on quiz_progress
  for select using (auth.uid() = user_id or is_admin());
create policy "quiz_progress_insert_own" on quiz_progress
  for insert with check (auth.uid() = user_id);
create policy "quiz_progress_update_own" on quiz_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- question_attempts is append-only: select + insert, no update/delete
-- policy for anyone via the API, so a submitted attempt can never be
-- rewritten after the fact.
create policy "question_attempts_select_own_or_admin" on question_attempts
  for select using (auth.uid() = user_id or is_admin());
create policy "question_attempts_insert_own" on question_attempts
  for insert with check (auth.uid() = user_id);
