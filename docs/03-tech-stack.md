# 03 — Tech Stack

## Core
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server Components for data-heavy dashboard/stat views, Server Actions for mutations without hand-rolled API boilerplate, file-based routing matches our folder structure, best-in-class Vercel deploy story. |
| Language | **TypeScript, strict mode** | Non-negotiable for a schema-heavy app — DB row types, question-type unions, and form schemas all benefit from exhaustive type checking. |
| UI library | **React 19** | Ships with Next 15; Server/Client Component model. |
| Styling | **Tailwind CSS v4** | Token-driven design system (see `02`), fastest iteration for a UI this animation/state-heavy. |
| Component primitives | **shadcn/ui (Radix-based)** | Accessible, unstyled-by-default primitives we own the code for (not a black-box dependency) — critical since we're doing a heavily customized dark-mode design system. |
| Motion | **Framer Motion** | Spring-based physics for the celebratory/gamified motion system in `02`. |
| Backend platform | **Supabase** (Postgres + Auth + Storage + Realtime-ready) | One platform for DB, auth, RLS-secured data access, and file storage (avatars, admin-uploaded lesson images) — avoids standing up a separate backend service for an MVP of this scope. |
| Data fetching/cache | **TanStack Query (React Query) v5** | Client-side cache for interactive views (lesson player, quiz attempts) that need optimistic updates and background refetch; pairs with Server Components for initial load + RQ for client-driven mutations. |
| Server state mutations | **Next.js Server Actions** | Primary mutation path (progress writes, lesson completion, admin CRUD) — colocated, typed, no separate REST layer needed for first-party mutations. |
| Validation | **Zod** | Single source of truth for form validation, Server Action input validation, and (optionally) typed Supabase row parsing at the edges. |
| Forms | **React Hook Form** + `@hookform/resolvers/zod` | Performant forms for auth, profile, and the content-heavy admin panel. |
| Icons | **Lucide React** | Matches shadcn/ui's default icon set, tree-shakeable. |
| Charts | **Recharts** | Statistics dashboard (`01-features.md`) — daily/weekly/monthly charts, accuracy trends. |
| Math rendering | **KaTeX** (`react-katex` or custom wrapper) | Needed for Mathematics lesson content (`01`). |
| Deployment | **Vercel** | First-party Next.js hosting, edge network, preview deployments per PR. |
| Lint/format | **ESLint + Prettier** (+ `eslint-plugin-tailwindcss`) | Enforced in CI, pre-commit via `husky` + `lint-staged`. |

## Supporting choices
- **Supabase JS client**: `@supabase/ssr` for cookie-based session handling
  across Server Components, Server Actions, and Route Handlers (replaces the
  deprecated auth-helpers package).
- **State management**: no global client store (Redux/Zustand) in v1 —
  Server Components + React Query cover server state; local UI state
  (modals, active tab) stays in component state or React Context where truly
  cross-cutting (e.g. a `LessonSessionContext` for in-progress lesson state).
  Zustand is the pre-approved escape hatch if a cross-cutting client state
  need emerges (e.g. a persistent mini-player-style "continue lesson" widget)
  — not adopted preemptively.
- **Testing**: Vitest + React Testing Library for unit/component tests,
  Playwright for E2E (auth flow, lesson completion, quiz submission) — wired
  in Phase 13 per the roadmap, not before.
- **Package manager**: `pnpm` — faster installs, strict dependency graph
  (surfaces phantom dependencies that npm/yarn would hide), good Vercel
  support.

## Explicitly rejected alternatives (and why)
- **Remix** — Next.js has stronger first-party Supabase + Vercel integration
  docs and a larger shadcn/ui ecosystem fit.
- **Prisma as the DB access layer** — Supabase's generated types
  (`supabase gen types typescript`) plus the Supabase JS client give us typed
  queries with RLS enforced at the Postgres layer; adding Prisma on top would
  mean maintaining two schema sources of truth and would bypass/duplicate RLS
  reasoning. We use raw SQL migrations + Supabase's type generator instead.
- **NextAuth/Auth.js** — Supabase Auth is already the platform we're using
  for the database; using its native auth keeps RLS's `auth.uid()` working
  without a bridging layer.
- **Redux/Zustand as default** — see above; avoided until a concrete
  cross-cutting client-state need appears, per the "no premature abstraction"
  principle.
- **A separate Express/Nest API service** — Server Actions + Route Handlers
  inside the Next.js app are sufficient for this scope and keep one
  deployable unit; a separate API service is a `09-scalability-and-ai.md`
  future path if/when a dedicated AI service or mobile app needs a stable
  public API surface.

## Environment/config
- `.env.local` (git-ignored) for `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only,
  never exposed to the client bundle — used only in admin Server Actions and
  trusted server contexts), plus a `.env.example` committed to the repo.
- Supabase project has separate **local dev** (Supabase CLI + Docker) and
  **hosted staging/production** projects; migrations are files in
  `supabase/migrations`, applied via the Supabase CLI, never hand-edited
  directly on the hosted dashboard.
