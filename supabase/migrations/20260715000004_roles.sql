-- roles: append-only audit trail of role grants. `profiles.role` is the
-- fast-read current value used by is_admin(); this table is the history of
-- how it got there ("who granted admin to whom, and when"). Never updated
-- or deleted — no UPDATE/DELETE policy is defined for any role.
create table roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index roles_user_id_idx on roles(user_id);

alter table roles enable row level security;

grant select, insert on public.roles to authenticated;

create policy "roles_select_admin_only" on roles
  for select using (is_admin());

create policy "roles_insert_admin_only" on roles
  for insert with check (is_admin());
