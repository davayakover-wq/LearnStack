# LearnStack — Master Specification (Phase 1: Planning)

> Status: Phase 1 (planning), Phase 2 (architecture scaffold), and Phase 3
> (database) are complete. See `docs/08-roadmap.md` for what's next.

This is the index. Each section below is its own document in `docs/` so it can be
reviewed, commented on, and revised independently without re-reading everything.

| # | Document | Covers |
|---|----------|--------|
| 00 | [docs/00-vision-goals-audience.md](docs/00-vision-goals-audience.md) | Vision, mission, goals, target audience, personas, success metrics |
| 01 | [docs/01-features.md](docs/01-features.md) | Full feature inventory — English, Math, gamification, quizzes, spaced repetition, admin |
| 02 | [docs/02-ux-design-system.md](docs/02-ux-design-system.md) | UX principles, visual language, design tokens, motion system, component inventory |
| 03 | [docs/03-tech-stack.md](docs/03-tech-stack.md) | Full stack with rationale, versions, and rejected alternatives |
| 04 | [docs/04-database-schema.md](docs/04-database-schema.md) | Complete PostgreSQL/Supabase schema, FKs, indexes, RLS policies |
| 05 | [docs/05-auth-flow.md](docs/05-auth-flow.md) | Supabase Auth flows, session handling, route protection, admin roles |
| 06 | [docs/06-api-architecture.md](docs/06-api-architecture.md) | Server Actions vs Route Handlers, data layer, caching, validation |
| 07 | [docs/07-folder-structure.md](docs/07-folder-structure.md) | Full enterprise Next.js App Router folder tree with explanations |
| 08 | [docs/08-roadmap.md](docs/08-roadmap.md) | 14-phase development roadmap with exit criteria per phase |
| 09 | [docs/09-scalability-and-ai.md](docs/09-scalability-and-ai.md) | AI tutor architecture (design-only), leaderboards, i18n, mobile, scaling path |
| 10 | [docs/10-database-explained.md](docs/10-database-explained.md) | Phase 3 as-built: table-by-table rationale, verification method, security decisions made during implementation |

## One-paragraph summary

**LearnStack** is a premium, dark-mode-first, mobile-responsive learning SaaS that
teaches **English** and **Mathematics** through bite-sized, gamified lessons —
combining Duolingo's habit loop, Brilliant's interactive problem-solving, Khan
Academy's curriculum depth, Quizlet's spaced-repetition drilling, and Notion's
clean information density. Built on **Next.js 15 (App Router) + TypeScript +
Supabase (Postgres, Auth, Storage, RLS)**, styled with **Tailwind CSS + shadcn/ui
+ Framer Motion**, deployed on **Vercel**. Every unit of progress (XP, streaks,
lesson/quiz completion, review schedule, achievements) is persisted server-side
in Postgres and synced across devices via the authenticated session — there is no
client-only state that isn't durable. AI tutoring is **architected but not
implemented** in this phase: the schema and service boundaries are shaped so an
OpenAI-backed tutor can be dropped in later without a data-model migration.

## How to use this document set

1. Read `00` → `09` in order once, end to end.
2. Approve or request changes per-document (they're independent files — feedback
   on `04-database-schema.md` doesn't block `02-ux-design-system.md`).
3. Once all docs are approved, we start **Phase 2 — Architecture** (repo
   scaffolding, tooling, CI, no feature code) per `08-roadmap.md`. We do not
   write feature code before Phase 2 is scaffolded and Phase 3's schema is
   migrated into a real Supabase project.
