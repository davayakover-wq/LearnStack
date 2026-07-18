-- Extensions
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Base API grants. Table-level GRANTs are the coarse gate ("can this role
-- touch the table at all"); RLS policies added in later migrations are the
-- fine-grained gate ("which rows"). Both are required — a correct RLS policy
-- with no GRANT still returns "permission denied", and a GRANT with no RLS
-- policy (on a table with RLS enabled) returns zero rows. See docs/04.
grant usage on schema public to anon, authenticated;

-- Enums. Kept as real Postgres types (not free-text + CHECK) so the Zod
-- schemas in lib/validations/*.ts and the DB constraint can never drift.
create type app_role as enum ('user', 'admin');
create type subject_slug as enum ('english', 'mathematics');
create type difficulty_level as enum (
  'beginner', 'elementary', 'intermediate', 'advanced', 'expert'
);
create type question_type as enum (
  'multiple_choice', 'fill_blank', 'drag_drop', 'matching',
  'ordering', 'typing', 'image_choice'
);
create type lesson_mode as enum ('practice', 'challenge', 'review');
create type progress_status as enum ('not_started', 'in_progress', 'completed');
create type lesson_section_type as enum (
  'explanation', 'example', 'interactive_exercise', 'hint', 'summary'
);
create type xp_reason as enum (
  'lesson_complete', 'quiz_complete', 'streak_bonus', 'achievement', 'daily_challenge'
);
create type stats_period as enum ('weekly', 'monthly');
create type theme_preference as enum ('dark', 'light', 'system');
create type notification_type as enum (
  'streak_reminder', 'achievement_unlocked', 'admin_announcement',
  'lesson_recommendation', 'review_due'
);
