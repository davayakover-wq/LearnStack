create table lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  section_type lesson_section_type not null,
  sort_order integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  question_id uuid references questions(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (section_type = 'interactive_exercise' and question_id is not null)
    or (section_type <> 'interactive_exercise')
  )
);
create index lesson_sections_lesson_id_idx on lesson_sections(lesson_id);

alter table lesson_sections enable row level security;

grant select, insert, update, delete on public.lesson_sections to authenticated;

create policy "lesson_sections_select_authenticated" on lesson_sections
  for select using (auth.uid() is not null or is_admin());
create policy "lesson_sections_write_admin_only" on lesson_sections
  for all using (is_admin()) with check (is_admin());
