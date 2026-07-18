-- profiles: one row per auth.users row (1:1), created via the
-- handle_new_user() trigger below, never by the client directly.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role app_role not null default 'user',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  coins integer not null default 0 check (coins >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  last_active_at timestamptz,
  daily_goal_minutes integer not null default 15 check (daily_goal_minutes > 0),
  learning_goal text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on profiles(role);

create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

-- settings: created alongside profiles at signup (same trigger), so it's
-- defined here rather than with notifications later.
create table settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme theme_preference not null default 'dark',
  sound_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  email_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
before update on settings
for each row execute function set_updated_at();

-- Guards against the obvious privilege-escalation / stat-inflation path: an
-- authenticated user issuing `update profiles set role='admin', xp=999999
-- where id = auth.uid()` directly against the Data API. RLS alone can't stop
-- this cheaply (comparing OLD vs NEW column values isn't something a USING/
-- WITH CHECK clause does well), so these columns are pinned back to their
-- previous value unless the caller is an admin or the trusted service role.
-- `current_user = 'service_role'` (not auth.role()/JWT) because PostgREST
-- switches the actual Postgres role per request, and triggers still fire for
-- BYPASSRLS roles even though RLS policies themselves are skipped for them.
create or replace function protect_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if not (is_admin() or current_user = 'service_role') then
    new.role := old.role;
    new.xp := old.xp;
    new.level := old.level;
    new.coins := old.coins;
    new.current_streak := old.current_streak;
    new.longest_streak := old.longest_streak;
    new.last_activity_date := old.last_activity_date;
    new.last_active_at := old.last_active_at;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_columns
before update on profiles
for each row execute function protect_profile_privileged_columns();

-- Signup provisioning. SECURITY DEFINER: this fires as part of the
-- auth.users insert performed by Supabase Auth (GoTrue), which has no
-- meaningful `auth.uid()` of its own yet — RLS on profiles/settings would
-- otherwise block the very insert that creates the user's first rows.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_username text;
begin
  v_username := coalesce(nullif(split_part(new.email, '@', 1), ''), 'user')
    || '_' || substr(new.id::text, 1, 8);

  insert into public.profiles (id, username) values (new.id, v_username);
  insert into public.settings (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- RLS + grants. See migration 0001 for why both are required.
alter table profiles enable row level security;
alter table settings enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.settings to authenticated;

create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own_or_admin" on profiles
  for update using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

create policy "settings_select_own" on settings
  for select using (auth.uid() = user_id);

create policy "settings_insert_own" on settings
  for insert with check (auth.uid() = user_id);

create policy "settings_update_own" on settings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
