-- admin_logs: append-only audit trail for every admin mutation (lesson/quiz
-- CRUD, role changes, etc.). `action`/`target_table` are free text rather
-- than enums on purpose — this log needs to accept new action types as the
-- admin panel grows without a migration every time.
create table admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index admin_logs_admin_id_idx on admin_logs(admin_id);
create index admin_logs_created_at_idx on admin_logs(created_at desc);

alter table admin_logs enable row level security;

-- Insert + select only, admin-gated both ways — not even an admin can
-- update or delete an existing audit entry via the API, so the log stays a
-- reliable record of what actually happened.
grant select, insert on public.admin_logs to authenticated;

create policy "admin_logs_select_admin_only" on admin_logs
  for select using (is_admin());
create policy "admin_logs_insert_admin_only" on admin_logs
  for insert with check (is_admin() and admin_id = auth.uid());
