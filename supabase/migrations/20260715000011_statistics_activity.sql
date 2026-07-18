create table daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  minutes_spent integer not null default 0 check (minutes_spent >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  quizzes_completed integer not null default 0 check (quizzes_completed >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  incorrect_answers integer not null default 0 check (incorrect_answers >= 0),
  unique (user_id, activity_date)
);
-- No separate user_id index: unique(user_id, activity_date) covers it.

-- statistics: precomputed weekly/monthly rollups over daily_activity, so the
-- stats dashboard never scans day-by-day for long ranges. Written by
-- application logic whenever daily_activity changes for the current period
-- (see docs/06-api-architecture.md); a scheduled job is a documented
-- alternative in docs/09 if this needs to move fully server-side later.
create table statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type stats_period not null,
  period_start date not null,
  total_minutes integer not null default 0 check (total_minutes >= 0),
  total_xp integer not null default 0 check (total_xp >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  quizzes_completed integer not null default 0 check (quizzes_completed >= 0),
  accuracy_percent numeric(5,2) check (accuracy_percent between 0 and 100),
  unique (user_id, period_type, period_start)
);
-- No separate user_id index: unique(user_id, period_type, period_start)
-- covers it.

alter table daily_activity enable row level security;
alter table statistics enable row level security;

grant select, insert, update on public.daily_activity to authenticated;
grant select, insert, update on public.statistics to authenticated;

create policy "daily_activity_select_own_or_admin" on daily_activity
  for select using (auth.uid() = user_id or is_admin());
create policy "daily_activity_insert_own" on daily_activity
  for insert with check (auth.uid() = user_id);
create policy "daily_activity_update_own" on daily_activity
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "statistics_select_own_or_admin" on statistics
  for select using (auth.uid() = user_id or is_admin());
create policy "statistics_insert_own" on statistics
  for insert with check (auth.uid() = user_id);
create policy "statistics_update_own" on statistics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
