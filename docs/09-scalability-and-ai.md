# 09 — Future Scalability & AI Architecture

Everything in this document is **design-only** for v1. Nothing here is
implemented in Phases 2-14; it exists so current decisions (schema, module
boundaries) don't have to be undone to support it later.

## AI Tutor (OpenAI integration — future)

### Why it's deferred, not designed carelessly
The brief is explicit: prepare the architecture, don't implement. Bolting AI
onto a finished app usually forces a data-model migration (conversations,
suggestions, generated-content provenance). We avoid that by shaping the
boundary now.

### Planned module boundary
A dedicated `lib/ai/` module (created when this phase starts) that talks to
OpenAI **exclusively through a small set of typed functions** — nothing else
in the app calls the OpenAI SDK directly:
- `explainMistake(questionId, userAnswer): Promise<Explanation>`
- `generateExercise(topicId, difficulty): Promise<GeneratedExercise>`
- `generateQuiz(topicId, difficulty, count): Promise<GeneratedQuiz>`
- `answerQuestion(userId, conversationId, message): Promise<AIMessage>`
- `recommendLessons(userId): Promise<LessonRecommendation[]>`
- `identifyWeaknesses(userId): Promise<WeaknessReport>`
- `generateStudyPlan(userId, goal): Promise<StudyPlan>`

This means the *rest* of the app (UI, Server Actions) depends on these
function signatures, not on OpenAI — swapping providers or adding a
fallback model later touches one module.

### Schema additions reserved for this phase (not created now)
```sql
-- future: supabase/migrations/xxxx_ai_tutor.sql
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id),
  created_at timestamptz not null default now()
);
create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create table ai_generated_content (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'exercise' | 'quiz' | 'study_plan'
  topic_id uuid references topics(id),
  generated_for_user_id uuid references auth.users(id),
  content jsonb not null,
  reviewed_by_admin boolean not null default false, -- human-in-the-loop gate before it becomes real `lessons`/`questions` rows
  created_at timestamptz not null default now()
);
```
`ai_generated_content.reviewed_by_admin` is deliberate: AI-generated
exercises/quizzes land in a staging table an admin approves before they
become real, servable `lessons`/`questions` rows — keeps a human editorial
gate on published content, consistent with the admin-log auditability
already in v1.

### Weakness tracking
Already partially derivable in v1 from `question_attempts` +
`review_schedule` (per-topic accuracy). The AI phase adds a synthesis layer
on top of data that already exists — another reason those tables are in the
v1 schema even though the AI feature isn't built yet.

## Leaderboards
`profiles.xp` and a future weekly XP snapshot (derivable from `xp_history`
grouped by week) are sufficient for a friends/global leaderboard. Ship path:
a `leaderboard_snapshots` materialized table refreshed on a schedule (Supabase
cron/Edge Function), plus a `friends`/`follows` join table if social features
are desired. No v1 schema blocks this.

## Daily/weekly challenges automation
v1's `quizzes.is_challenge`/`challenge_period` columns exist; the only future
work is a scheduled job (Supabase Edge Function on a cron trigger) that
rotates which quiz/lesson is flagged active for the current period, plus a
`challenge_completions` table if bonus-reward tracking needs to be distinct
from normal quiz completion.

## Internationalization (if ever needed)
v1 is intentionally English-only with no i18n framework, per the brief. If
this changes: content tables (`lessons.title`, `lesson_sections.content`,
etc.) would need locale-variant rows or a sibling `_translations` table
pattern, and UI strings would move to `next-intl` or similar. Not started
now because premature i18n scaffolding for a single-locale product is exactly
the kind of speculative abstraction the project should avoid.

## Mobile app
The web app is mobile-responsive/mobile-first by design (`02`), which is
deliberately also the foundation for a future React Native/Expo app: keeping
business logic in `lib/data`, `lib/actions`-equivalent, and `lib/gamification`
/`lib/srs` (framework-agnostic where possible) rather than deeply inside React
components means a future native client can reuse the same Supabase schema
and much of the non-UI logic, talking to the same Postgres backend directly
via the Supabase client rather than needing a bespoke REST API layer.

## Public API surface
Not built in v1. If a mobile app or third-party integration needs one, the
existing Route Handlers under `app/api/` are the seed of a versioned public
API (`app/api/v1/...`) — the data-access layer (`lib/data`) is already
decoupled from the Next.js request/response cycle enough to be reused there.

## Scaling the database
- Current design (single Supabase Postgres instance) comfortably handles
  tens of thousands of active users. Growth path if needed: read replicas
  for the statistics/dashboard read path, `daily_activity`/`statistics`
  partitioning by month once history gets long, and moving `question_attempts`
  (highest write volume, append-only) to a partitioned table by month.
- `xp_history` and `question_attempts` are the two highest-growth,
  append-only tables — both are already indexed and structured so a future
  partitioning migration is additive, not a redesign.

## Monetization (future, not v1)
Freemium gate would live at the `topics`/`lessons` level (`is_premium`
boolean, checked in the same place `is_published` is already checked today)
plus a `subscriptions` table synced from a payment provider webhook (Route
Handler). No v1 schema decision blocks adding this column later.
