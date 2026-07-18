-- subjects: the two top-level containers (English, Mathematics). Public
-- read (even signed-out visitors can browse what's on offer) — no sensitive
-- content lives at this level, just names/descriptions/icons.
create table subjects (
  id uuid primary key default gen_random_uuid(),
  slug subject_slug unique not null,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- topics: the 15 English / 14 Math topics from docs/01-features.md, each
-- belonging to one subject.
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
-- No separate subject_id index: unique(subject_id, slug) already serves
-- "topics for subject X" as a leftmost-prefix lookup.

-- lessons: "levels" per topic are not a separate table — a level is a
-- difficulty tier of lessons within a topic (see `difficulty`). Modeling it
-- as a column keeps the curriculum a flat, queryable list instead of an
-- extra join for something that's really just a filter/grouping.
create table lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  difficulty difficulty_level not null default 'beginner',
  xp_reward integer not null default 10 check (xp_reward >= 0),
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);
create index lessons_published_idx on lessons(is_published);

create trigger lessons_set_updated_at
before update on lessons
for each row execute function set_updated_at();

-- lesson_prerequisites: makes the curriculum a DAG. Drives locked/unlocked
-- lesson state (a lesson is unlocked once every row here pointing at it as
-- `lesson_id` has a completed lesson_progress row for the prerequisite).
create table lesson_prerequisites (
  lesson_id uuid not null references lessons(id) on delete cascade,
  prerequisite_lesson_id uuid not null references lessons(id) on delete cascade,
  primary key (lesson_id, prerequisite_lesson_id),
  check (lesson_id <> prerequisite_lesson_id)
);
-- Reverse lookup: "what does completing lesson Y unlock" (needed to compute
-- newly-unlocked lessons after a completion) isn't served by the primary
-- key's leftmost prefix, since prerequisite_lesson_id is the second column.
create index lesson_prerequisites_prereq_idx
  on lesson_prerequisites(prerequisite_lesson_id);

alter table subjects enable row level security;
alter table topics enable row level security;
alter table lessons enable row level security;
alter table lesson_prerequisites enable row level security;

grant select on public.subjects to anon, authenticated;
grant insert, update, delete on public.subjects to authenticated;
grant select on public.topics to anon, authenticated;
grant insert, update, delete on public.topics to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.lesson_prerequisites to authenticated;

create policy "subjects_select_public" on subjects
  for select using (true);
create policy "subjects_write_admin_only" on subjects
  for all using (is_admin()) with check (is_admin());

create policy "topics_select_public" on topics
  for select using (true);
create policy "topics_write_admin_only" on topics
  for all using (is_admin()) with check (is_admin());

create policy "lessons_select_published_or_admin" on lessons
  for select using ((is_published and auth.uid() is not null) or is_admin());
create policy "lessons_write_admin_only" on lessons
  for all using (is_admin()) with check (is_admin());

create policy "lesson_prerequisites_select_authenticated" on lesson_prerequisites
  for select using (auth.uid() is not null or is_admin());
create policy "lesson_prerequisites_write_admin_only" on lesson_prerequisites
  for all using (is_admin()) with check (is_admin());
