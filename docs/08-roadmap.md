# 08 — Development Roadmap

Fourteen phases, executed in order. Each phase has an explicit **exit
criteria** — the next phase does not start until the current one is met.
This mirrors the phase list given in the project brief exactly.

## Phase 1 — Planning *(this document set)*
Deliverables: `00`–`09` in `docs/`.
**Exit criteria:** all docs reviewed and approved by the user.

## Phase 2 — Architecture
- Scaffold the Next.js 15 + TypeScript project, folder structure from `07`.
- Install and configure Tailwind, shadcn/ui (init + base primitives), Framer
  Motion, ESLint/Prettier, husky + lint-staged.
- Set up `pnpm` workspace, `.env.example`, base `tailwind.config.ts` with the
  design tokens from `02`.
- Root layout, theming (dark default), font loading.
- No feature pages beyond a placeholder home route.
**Exit criteria:** `pnpm dev` runs a themed, empty shell; lint/format/CI green.

## Phase 3 — Database
- Supabase project created (local via CLI/Docker + hosted staging).
- All migrations from `04-database-schema.md` written and applied in order.
- RLS policies applied and manually verified (one test user cannot read
  another's `lesson_progress`; non-admin cannot write `lessons`).
- `supabase gen types typescript` wired into `types/supabase.ts`, checked
  into a `pnpm db:types` script.
- `supabase/seed.sql` with a realistic sample of subjects/topics/lessons/
  quizzes/questions/answers for both English and Mathematics so later phases
  have real content to build against (not lorem ipsum).
**Exit criteria:** fresh `supabase db reset` produces a fully migrated +
seeded local DB; RLS verified via manual policy tests.

## Phase 4 — Authentication
- Implement the full flow from `05-auth-flow.md`: signup, login, logout,
  forgot/reset password, email verification, middleware route protection.
- `profiles` auto-creation trigger verified end-to-end.
- Auth UI (forms, validation, error states) matches the design system.
**Exit criteria:** a real user can sign up, verify email, log out, log back
in on a different browser session, and reset a forgotten password —
end-to-end, manually tested.

## Phase 5 — Dashboard
- Build `(app)` shell (sidebar/tab bar), and the dashboard page: daily goal,
  streak, XP, weekly chart, continue-learning card, recommended lessons,
  recent activity, achievements shelf, calendar heatmap, stats summary.
- Data is real (queried from Phase 3's seeded tables) — no mock data left in
  the shipped component.
**Exit criteria:** logged-in user sees a fully data-driven dashboard with
correct empty-states for a brand-new user (zero XP, zero streak).

## Phase 6 — English learning
- Topic tree + lesson list UI for the English subject.
- Lesson player (all section types from `01-features.md`) working end-to-end
  for real English lesson content, all three modes (practice/challenge/
  review — review depends on Phase 8's schedule existing, so review mode UI
  can ship now but functionally activates once Phase 8 lands).
- Quiz player supporting the question types relevant to English content in
  the seed set.
**Exit criteria:** a user can complete a real English lesson and an English
quiz start-to-finish, with progress persisted (verified by reloading and
confirming state, and by checking the DB row directly).

## Phase 7 — Mathematics learning
- Same lesson/quiz player infrastructure reused (this phase should require
  near-zero new player code if Phase 6's `QuestionRenderer`/`SectionRenderer`
  abstractions were built generically) — new work is content, KaTeX math
  rendering, and any math-specific question metadata (e.g. numeric tolerance
  matching for typed answers).
**Exit criteria:** a user can complete a real Math lesson with rendered
equations and a Math quiz, same persistence verification as Phase 6.

## Phase 8 — Progress system
- `lesson_progress`/`quiz_progress`/`user_progress` rollups fully wired
  (mastery_percent recalculation, topic locking based on
  `lesson_prerequisites`).
- Spaced repetition (`review_schedule`, SM-2 logic in `lib/srs/sm2.ts`) live:
  wrong answers resurface, review session pulls due items.
- Cross-device continuity manually verified (start a lesson on one session,
  resume on another).
**Exit criteria:** locking/unlocking works correctly across the seeded
curriculum DAG; a deliberately-wrong quiz answer reappears in the Review tab
on schedule.

## Phase 9 — Gamification
- XP awarding wired to lesson/quiz completion (`xp_history`), level
  computation + level-up celebration UI, streak computation + freeze logic,
  achievements (criteria evaluation + unlock toast), coins awarded.
**Exit criteria:** completing content visibly grants XP with the celebratory
motion from `02`, streak increments correctly across simulated day
boundaries (tested by manipulating `activity_date` in a test scenario), and
at least the "first lesson," "7-day streak," and "50 lessons completed"
achievements unlock correctly.

## Phase 10 — Statistics
- Stats dashboard: daily/weekly/monthly charts (Recharts), accuracy trend,
  weak/strong topics, time spent, XP over time — backed by `statistics` and
  `daily_activity`.
- Rollup computation job/logic (writes to `statistics` on relevant activity).
**Exit criteria:** stats page reflects real activity generated in Phases
6-9's manual testing, charts render correctly for both sparse (new user) and
populated data.

## Phase 11 — Admin panel
- Role-gated `(admin)` routes: lesson CRUD, quiz/question CRUD, image
  upload to Supabase Storage, user management (view/role-change), platform
  statistics, achievement management, `admin_logs` write-through on every
  mutation.
**Exit criteria:** an admin can create a brand-new lesson with sections and a
linked quiz through the UI alone (no direct DB edits) and immediately see it
appear in the learner-facing `/learn` flow.

## Phase 12 — Optimization
- Performance pass: bundle analysis, image optimization (`next/image`
  everywhere), Server Component/Client Component boundary audit (minimize
  `"use client"` surface area), font loading strategy, Lighthouse pass
  (target: 90+ mobile performance on dashboard and lesson player).
- Accessibility audit (keyboard nav, screen reader labels, contrast).
- SEO pass on the public marketing route (`(marketing)`).
**Exit criteria:** Lighthouse scores and a written accessibility checklist
meet the targets above; no obvious layout shift or hydration warnings.

## Phase 13 — Testing
- Vitest unit tests for `lib/gamification`, `lib/srs`, and Zod schemas.
- React Testing Library component tests for `QuestionRenderer` variants and
  key gamification components.
- Playwright E2E: signup→verify→login, complete-a-lesson, submit-a-quiz,
  admin-creates-lesson.
**Exit criteria:** CI runs unit + E2E suites on every PR; critical user
journeys (the four E2E flows above) are green.

## Phase 14 — Deployment
- Vercel project connected, environment variables configured for
  staging/production, Supabase hosted project promoted from staging config,
  custom domain (if applicable), preview deployments verified on a real PR.
**Exit criteria:** production URL is live, a smoke test of signup → complete
a lesson → see dashboard update passes against the deployed environment.

## Rule for all phases
No phase begins before the previous phase's exit criteria is explicitly
confirmed. If a later phase reveals a gap in an earlier phase (e.g. Phase 8
needs a schema tweak not in Phase 3's migrations), that's a new migration
file added in sequence — never a retroactive edit to an already-applied
migration.
