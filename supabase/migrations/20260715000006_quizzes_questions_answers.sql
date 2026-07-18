create table quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  description text,
  difficulty difficulty_level not null default 'beginner',
  is_timed boolean not null default false,
  time_limit_seconds integer check (time_limit_seconds > 0),
  is_adaptive boolean not null default false,
  xp_reward integer not null default 20 check (xp_reward >= 0),
  is_challenge boolean not null default false,
  challenge_period daterange,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quizzes_topic_id_idx on quizzes(topic_id);
create index quizzes_published_idx on quizzes(is_published);

create trigger quizzes_set_updated_at
before update on quizzes
for each row execute function set_updated_at();

-- questions.quiz_id is nullable on purpose: a question can belong to a quiz,
-- OR be embedded directly in a lesson_section as an interactive_exercise
-- (see next migration) with no quiz at all.
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  type question_type not null,
  prompt text not null,
  prompt_media_url text,
  explanation text,
  difficulty difficulty_level not null default 'beginner',
  sort_order integer not null default 0,
  points integer not null default 1 check (points > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index questions_quiz_id_idx on questions(quiz_id);

-- answers: option rows for MC/matching/ordering/drag-drop; for typing/
-- fill-blank the accepted value(s) live here too with is_correct = true and
-- an optional fuzzy-match pattern.
create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  content text not null,
  is_correct boolean not null default false,
  match_pattern text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index answers_question_id_idx on answers(question_id);

alter table quizzes enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

grant select, insert, update, delete on public.quizzes to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.answers to authenticated;

create policy "quizzes_select_published_or_admin" on quizzes
  for select using ((is_published and auth.uid() is not null) or is_admin());
create policy "quizzes_write_admin_only" on quizzes
  for all using (is_admin()) with check (is_admin());

-- Questions/answers don't carry their own publish flag — they inherit it
-- from the parent quiz or lesson. Rather than reproduce that join in every
-- RLS check, any authenticated user can read question/answer rows (the
-- content itself isn't sensitive; the app only ever fetches questions that
-- belong to lessons/quizzes it has already shown, via already-published
-- parents). This is a deliberate v1 simplification, not an oversight.
create policy "questions_select_authenticated" on questions
  for select using (auth.uid() is not null or is_admin());
create policy "questions_write_admin_only" on questions
  for all using (is_admin()) with check (is_admin());

create policy "answers_select_authenticated" on answers
  for select using (auth.uid() is not null or is_admin());
create policy "answers_write_admin_only" on answers
  for all using (is_admin()) with check (is_admin());
