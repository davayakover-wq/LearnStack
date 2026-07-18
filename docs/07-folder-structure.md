# 07 — Folder Structure

Enterprise Next.js App Router layout. Route groups separate marketing/auth
(public), the authenticated app shell, and admin — each can have its own
layout without leaking nav chrome across boundaries (per `02`'s "lesson
player is chrome-free" and "admin is role-gated" requirements).

```
learn-platform/
├── app/
│   ├── (marketing)/                 # public, unauthenticated
│   │   ├── page.tsx                 # landing page
│   │   └── layout.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── auth/callback/route.ts   # code exchange for email verify/recovery
│   │   └── layout.tsx               # centered auth-card layout
│   │
│   ├── (app)/                       # authenticated app shell (sidebar/tab bar)
│   │   ├── layout.tsx               # fetches profile, renders nav shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── learn/
│   │   │   ├── page.tsx             # subject picker (English / Mathematics)
│   │   │   ├── [subject]/
│   │   │   │   ├── page.tsx         # topic tree for the subject
│   │   │   │   └── [topic]/
│   │   │   │       ├── page.tsx     # lesson list within topic, levels
│   │   │   │       └── [lesson]/
│   │   │   │           ├── page.tsx # chrome-free lesson player (own layout)
│   │   │   │           └── layout.tsx
│   │   ├── quiz/
│   │   │   └── [quizId]/page.tsx    # chrome-free quiz player
│   │   ├── review/
│   │   │   └── page.tsx             # spaced-repetition session
│   │   ├── stats/
│   │   │   └── page.tsx
│   │   ├── achievements/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       ├── page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── (admin)/
│   │   ├── layout.tsx               # role gate + admin nav
│   │   └── admin/
│   │       ├── page.tsx             # admin overview / platform stats
│   │       ├── lessons/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [lessonId]/edit/page.tsx
│   │       ├── quizzes/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [quizId]/edit/page.tsx
│   │       ├── users/page.tsx
│   │       └── achievements/page.tsx
│   │
│   ├── api/
│   │   ├── lessons/[lessonId]/sections/[sectionId]/complete/route.ts
│   │   ├── quizzes/[quizId]/attempts/route.ts
│   │   ├── review/next/route.ts
│   │   └── upload/route.ts
│   │
│   ├── layout.tsx                   # root layout: fonts, ThemeProvider, Toaster
│   └── globals.css
│
├── proxy.ts                          # route protection (Next.js 16 renamed `middleware.ts`)
│
├── components/
│   ├── ui/                          # shadcn/ui primitives (owned, generated code)
│   ├── shared/                      # AppShell, Sidebar, TabBar, ThemeToggle
│   ├── dashboard/                   # DailyGoalRing, StreakFlame, WeeklyChart, ...
│   ├── learn/                       # TopicTree, LessonCard, LevelBadge
│   ├── lesson-player/               # SectionRenderer, ExplanationBlock, HintPanel
│   ├── quiz/                        # QuestionRenderer/* (one per question_type), Timer
│   ├── gamification/                # XPBar, AchievementToast, LevelUpOverlay, CoinCounter
│   ├── stats/                       # StatChart, CalendarHeatmap, AccuracyTrend
│   └── admin/                       # LessonForm, QuestionEditor, ImageUploader, UserTable
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client (createBrowserClient)
│   │   ├── server.ts                # server client (createServerClient, cookies())
│   │   └── middleware.ts            # session refresh helper used by proxy.ts
│   ├── data/                        # data-access layer, see 06-api-architecture.md
│   │   ├── lessons.ts
│   │   ├── quizzes.ts
│   │   ├── progress.ts
│   │   ├── gamification.ts
│   │   ├── stats.ts
│   │   ├── review.ts
│   │   └── admin.ts
│   ├── actions/                     # Server Actions, see 06-api-architecture.md
│   │   ├── auth.ts
│   │   ├── lessons.ts
│   │   ├── quizzes.ts
│   │   ├── profile.ts
│   │   └── admin.ts
│   ├── validations/                 # Zod schemas, shared client+server
│   │   ├── auth.ts
│   │   ├── lesson.ts
│   │   ├── quiz.ts
│   │   └── profile.ts
│   ├── gamification/
│   │   ├── xp.ts                    # xpToLevel(), level curve
│   │   └── streaks.ts               # streak calc, freeze logic
│   ├── srs/
│   │   └── sm2.ts                   # spaced-repetition scheduling algorithm
│   ├── hooks/                       # useLessonSession, useQuizAttempt, useReviewQueue
│   ├── query/                       # React Query client + query key factories
│   └── utils.ts                     # cn(), formatters
│
├── types/
│   ├── supabase.ts                  # generated via `supabase gen types typescript`
│   └── domain.ts                    # app-level types built on top of generated rows
│
├── supabase/
│   ├── migrations/                  # ordered SQL files, see 04-database-schema.md
│   ├── seed.sql                     # dev seed data (sample lessons/quizzes)
│   └── config.toml
│
├── styles/ (or tailwind config inline)
│   └── tailwind.config.ts           # design tokens from 02-ux-design-system.md
│
├── tests/
│   ├── unit/                        # Vitest
│   └── e2e/                         # Playwright
│
├── docs/                            # this specification set
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .env.example
└── package.json
```

## Rationale for key decisions
- **Route groups `(marketing)`/`(auth)`/`(app)`/`(admin)`** — each gets a
  distinct root layout without affecting the URL path, and lets the lesson
  player render with zero nav chrome while still living under `(app)` for
  auth-gating via the shared middleware matcher.
- **`lib/data` vs `lib/actions` split** — reads/queries vs. writes/mutations
  are physically separate so it's always obvious, from the import alone,
  whether a piece of code can mutate state.
- **`components/` grouped by feature domain, not by type** — avoids a
  generic dumping-ground `components/common` that grows unbounded; `ui/` is
  the one type-based exception because shadcn/ui's CLI generates directly
  into it.
- **`lib/gamification` and `lib/srs` isolated** — these contain the two
  pieces of actual "business logic" (leveling curve, spaced-repetition
  algorithm) that deserve unit tests independent of any UI or DB call,
  matching the Phase 13 testing plan in `08-roadmap.md`.
