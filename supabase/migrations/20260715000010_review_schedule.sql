-- review_schedule: SM-2-inspired spaced-repetition state, one row per
-- (user, question). Wrong answers shorten `interval_days` and lower
-- `ease_factor`; correct answers lengthen the interval. `memory_strength` is
-- a derived display value (not part of the SM-2 math itself).
create table review_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  ease_factor numeric(4,2) not null default 2.5 check (ease_factor >= 1.3),
  interval_days integer not null default 1 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  memory_strength numeric(5,2) not null default 0
    check (memory_strength between 0 and 100),
  due_at date not null default current_date,
  last_reviewed_at timestamptz,
  unique (user_id, question_id)
);
-- (user_id, due_at) is the actual query the Review mode runs ("this user's
-- due items, in order") — a separate plain user_id index would be redundant
-- with this one anyway, since user_id is still the leading column.
create index review_schedule_due_idx on review_schedule(user_id, due_at);

alter table review_schedule enable row level security;

grant select, insert, update on public.review_schedule to authenticated;

create policy "review_schedule_select_own_or_admin" on review_schedule
  for select using (auth.uid() = user_id or is_admin());
create policy "review_schedule_insert_own" on review_schedule
  for insert with check (auth.uid() = user_id);
create policy "review_schedule_update_own" on review_schedule
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
