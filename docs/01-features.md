# 01 — Feature Inventory

Legend: **[MVP]** ships in the phases defined in `08-roadmap.md`. **[Ready]**
means the data model/architecture supports it in v1, but the UI/feature ships
later. **[Future]** means intentionally deferred, not designed against yet
beyond not blocking it.

## Authentication & Profile — [MVP]
- Sign up (email + password), Login, Logout, Forgot/Reset password, Email
  verification, persistent sessions across browser restarts and devices.
- Profile: display name, avatar, bio/goal, XP, level, current streak, longest
  streak, completed lessons count, completed quizzes count, achievements,
  accuracy %, total time spent learning, last activity timestamp, preferred
  learning goal (e.g. "15 min/day").

## Dashboard — [MVP]
- Daily goal ring/progress.
- Current streak with flame/heat visual and freeze-state if broken.
- XP total + XP gained today.
- Weekly progress chart (7-day activity bars).
- "Continue learning" card — resumes the exact lesson/section the user left.
- Recommended next lessons (rule-based in v1: next incomplete lesson in the
  user's active topics, ordered by prerequisite graph — **not** ML-driven;
  ML/AI-driven recommendation is [Future], see `09`).
- Recent activity feed (last N completed lessons/quizzes/achievements).
- Achievements shelf (recently unlocked).
- Learning calendar (heatmap, GitHub-contribution-graph style).
- Quick statistics summary (accuracy, time spent, lessons this week).

## Subjects, Topics, Lessons — [MVP]

### English topics
Vocabulary, Grammar, Listening, Reading, Speaking, Writing, Idioms, Phrasal
Verbs, Business English, Pronunciation, Verb Tenses, Conditionals, Articles,
Prepositions, Conversation.

### Mathematics topics
Arithmetic, Fractions, Decimals, Percentages, Ratios, Algebra, Geometry,
Trigonometry, Functions, Statistics, Probability, Calculus, Word Problems,
Logic.

Each topic has multiple **levels** (difficulty tiers) and each level contains
an ordered sequence of **lessons**. Lessons declare prerequisite lessons so
the curriculum forms a directed acyclic graph (DAG) — this is what powers
"locked until you finish X" states and the recommendation engine.

### Lesson structure — [MVP]
Every lesson is composed of ordered **lesson_sections**, each one of:
- `explanation` — rich text/markdown + optional media.
- `example` — worked example(s).
- `interactive_exercise` — inline practice tied to a question.
- `hint` — progressive hint content, revealed on request (costs no XP, but
  tracked for analytics on which lessons are "too hard").
- `summary` — end-of-lesson recap + completion percentage.

Lesson modes: **Practice** (untimed, hints on, no XP penalty), **Challenge**
(timed, hints cost, higher XP reward), **Review** (spaced-repetition items
only, pulled from `review_schedule`).

## Quiz System — [MVP]
Question types: multiple choice, fill-in-the-blank, drag-and-drop, matching,
ordering, typing/free-text (exact/fuzzy match), image-based questions.
Quiz modes: standard, timed, adaptive (next question difficulty responds to
running accuracy within the attempt — rule-based difficulty stepping in v1,
not ML). Every answer gets instant feedback + a stored explanation. Every
attempt is persisted (`quiz_progress`, `answers` linked to `user_progress`).

## Gamification — [MVP core / Ready for rest]
- **[MVP]** XP, Levels (computed from XP via a leveling curve), daily streak
  (with a grace/freeze mechanic), weekly and monthly streak rollups,
  Achievements + unlock notifications, Badges.
- **[MVP]** Coins (secondary currency, earned alongside XP) — awarded but not
  yet spendable on anything in v1 (the `unlockables`/shop concept is
  **[Ready]**: schema supports items, UI ships later).
- **[Ready]** Leaderboard — schema (`profiles.xp`, weekly XP snapshots) already
  supports a friends/global leaderboard; UI is a later phase.
- **[Ready]** Daily challenges, weekly challenges — modeled as a special
  `quizzes`/`lessons` row flagged `is_challenge` + a `challenge_period`; the
  generation/rotation job ships later.

## Spaced Repetition — [MVP]
Classic Leitner/SM-2-inspired scheduler: every question a user answers
creates or updates a `review_schedule` row tracking ease factor, interval,
next-due date, and a "memory strength" score. Wrong answers shorten the
interval and lower ease; correct answers lengthen the interval. The Review
lesson mode pulls due items across all topics for that user.

## Statistics — [MVP]
Daily/weekly/monthly learning time and XP charts (Recharts), accuracy over
time, lessons completed, weak topics vs. strong topics (derived from
per-topic accuracy in `statistics`/`daily_activity`), streak history.

## Admin Panel — [MVP]
Role-gated (`roles`/`profiles.role = 'admin'`) area to create/edit/delete
lessons, lesson sections, quizzes, and questions; upload images to Supabase
Storage; manage users (view, change role, deactivate); view aggregate
platform statistics; manage achievements (create/edit unlock criteria). Every
admin mutation is written to `admin_logs` for auditability.

## AI Features — [Architecture only, not implemented — see `09`]
Explain-my-mistake, generate exercises/quizzes, conversational Q&A tutor,
lesson recommendations, weakness tracking, personalized study plans. The data
model reserves the hooks (`ai_conversations`/`ai_suggestions`-style tables are
sketched in `09`, not created in the Phase 3 migration) so this can be added
without breaking changes later.

## Notifications — [Ready]
`notifications` table exists from Phase 3 (streak-about-to-break reminders,
achievement unlocked, admin announcements). In-app notification center ships
in a later phase; email/push delivery is [Future].
