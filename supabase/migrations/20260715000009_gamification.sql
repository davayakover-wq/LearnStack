-- xp_history: append-only ledger. profiles.xp is the fast-read running
-- total; this is how it got there, and what the "XP gained today/this week"
-- dashboard widgets and statistics rollups are computed from.
create table xp_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason xp_reason not null,
  source_id uuid, -- polymorphic pointer to the lesson/quiz/achievement id
  created_at timestamptz not null default now()
);
-- (user_id, created_at desc) instead of two single-column indexes: the only
-- real query pattern is "this user's XP events, most recent first".
create index xp_history_user_id_created_at_idx
  on xp_history(user_id, created_at desc);

-- streaks: append-only daily ledger backing the calendar heatmap. Weekly and
-- monthly "streaks" (docs/01-features.md) are not separate tracked counters
-- here — modeling them as their own mutable columns risks drifting from
-- this ledger. They're derived views over it: a weekly streak is N
-- consecutive ISO weeks with >=1 row here, computed at query time (or
-- materialized into `statistics`, see that migration) rather than stored.
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  streak_count_at_date integer not null check (streak_count_at_date >= 0),
  freeze_used boolean not null default false,
  unique (user_id, activity_date)
);
-- No separate user_id index: unique(user_id, activity_date) covers it.

create table achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  icon text,
  criteria jsonb not null,
  xp_bonus integer not null default 0 check (xp_bonus >= 0),
  created_at timestamptz not null default now()
);

-- user_achievements: append-only unlock log — no update (an unlock can't be
-- partially achieved) and no delete (achievements aren't revocable via the
-- API).
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
-- No separate user_id index: unique(user_id, achievement_id) covers it.

-- avatars: curated, selectable avatar catalog (distinct from a user's own
-- uploaded avatar_url via Supabase Storage — see the storage migration).
create table avatars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  is_premium boolean not null default false,
  sort_order integer not null default 0
);

alter table xp_history enable row level security;
alter table streaks enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table avatars enable row level security;

grant select, insert on public.xp_history to authenticated;
grant select, insert on public.streaks to authenticated;
grant select, insert, update, delete on public.achievements to authenticated;
grant select, insert on public.user_achievements to authenticated;
grant select, insert, update, delete on public.avatars to authenticated;

create policy "xp_history_select_own_or_admin" on xp_history
  for select using (auth.uid() = user_id or is_admin());
create policy "xp_history_insert_own" on xp_history
  for insert with check (auth.uid() = user_id);

create policy "streaks_select_own_or_admin" on streaks
  for select using (auth.uid() = user_id or is_admin());
create policy "streaks_insert_own" on streaks
  for insert with check (auth.uid() = user_id);

create policy "achievements_select_authenticated" on achievements
  for select using (auth.uid() is not null or is_admin());
create policy "achievements_write_admin_only" on achievements
  for all using (is_admin()) with check (is_admin());

create policy "user_achievements_select_own_or_admin" on user_achievements
  for select using (auth.uid() = user_id or is_admin());
create policy "user_achievements_insert_own" on user_achievements
  for insert with check (auth.uid() = user_id);

create policy "avatars_select_authenticated" on avatars
  for select using (auth.uid() is not null or is_admin());
create policy "avatars_write_admin_only" on avatars
  for all using (is_admin()) with check (is_admin());
