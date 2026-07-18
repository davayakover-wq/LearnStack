-- Shared trigger: keeps `updated_at` correct on every UPDATE without relying
-- on the application layer to remember to set it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- is_admin(): the single source of truth for "is the current session an
-- admin" used across every RLS policy in this schema.
--
-- LANGUAGE plpgsql (not sql) deliberately: a LANGUAGE SQL function body is
-- planned/validated against the catalog at CREATE FUNCTION time, which would
-- fail here because `profiles` doesn't exist until the next migration.
-- plpgsql defers name resolution of embedded SQL to first execution, so this
-- can be defined once, up front, and referenced by every later migration.
--
-- SECURITY DEFINER + fixed search_path: this function is called from inside
-- RLS policies on `profiles` itself (e.g. "admins can select any profile").
-- Without SECURITY DEFINER, evaluating is_admin() from within a profiles
-- policy would re-trigger RLS on the internal `select ... from profiles`
-- query, which is at best redundant and at worst recursive. Running as the
-- function owner bypasses RLS for this one, tightly-scoped internal check.
create or replace function is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  return exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
end;
$$;
