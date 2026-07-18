-- notifications: settings was already created alongside profiles in
-- migration 0003 (both are provisioned by the same signup trigger).
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
-- General listing ("this user's notifications, newest first")...
create index notifications_user_id_created_at_idx
  on notifications(user_id, created_at desc);
-- ...and the hot path for the unread badge count, as a partial index so it
-- only ever indexes the (typically small) unread set.
create index notifications_unread_idx
  on notifications(user_id) where is_read = false;

alter table notifications enable row level security;

grant select, insert, update, delete on public.notifications to authenticated;

create policy "notifications_select_own_or_admin" on notifications
  for select using (auth.uid() = user_id or is_admin());
create policy "notifications_insert_own_or_admin" on notifications
  for insert with check (auth.uid() = user_id or is_admin());
create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_own" on notifications
  for delete using (auth.uid() = user_id);
