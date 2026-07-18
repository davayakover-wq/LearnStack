# 06 — API Architecture

## Guiding principle
Prefer **Server Components for reads** and **Server Actions for writes**.
Route Handlers (`app/api/**/route.ts`) are reserved for the specific cases
that actually need a stable HTTP endpoint: webhooks (future Supabase Storage
hooks, future payment provider), and any client fetch that isn't a form
submission/mutation triggered from within a Server Component tree (e.g. a
polling endpoint, or a future public API for a mobile client).

## Layers

```
UI (Server/Client Components)
   │
   ├─ read path  → Server Component fetches directly via lib/supabase/server.ts
   │                (or React Query + a thin client fetcher for
   │                 interactive/optimistic views like the lesson player)
   │
   └─ write path → Server Action (lib/actions/*.ts)
                     → Zod-validates input
                     → calls a function in lib/data/*.ts (the data-access layer)
                     → data-access layer runs the Supabase query
                     → RLS enforces ownership at the DB
                     → Server Action revalidates affected paths/tags
                     → React Query cache (if used) invalidated on the client
```

## Data-access layer (`lib/data/*.ts`)
All Supabase queries live here, grouped by domain (`lessons.ts`,
`progress.ts`, `quizzes.ts`, `gamification.ts`, `stats.ts`, `admin.ts`).
Server Components and Server Actions both call into this layer — there is
exactly one place a given query is written, so a schema change touches one
file. Every function here is fully typed against the generated Supabase
types (`types/supabase.ts`, produced by `supabase gen types typescript`).

## Server Actions (`lib/actions/*.ts`)
Each action:
1. Validates input with a Zod schema (shared with the corresponding React
   Hook Form resolver where applicable — one schema, two call sites).
2. Confirms the acting user via the server Supabase client (never trusts a
   client-passed `user_id`).
3. Delegates the actual query to `lib/data/*.ts`.
4. Calls `revalidatePath`/`revalidateTag` for affected Server Component
   routes (e.g. completing a lesson revalidates `/dashboard` and
   `/learn/[topic]`).
5. Returns a discriminated-union result (`{ success: true, data }` |
   `{ success: false, error }`) — never throws across the server/client
   boundary; React Hook Form and toast handlers pattern-match on this.

Examples: `completeLessonSection`, `submitQuizAnswer`, `startLesson`,
`claimDailyChallenge`, `updateProfile`, `updateSettings` (user domain);
`createLesson`, `updateLesson`, `deleteLesson`, `createQuiz`, `addQuestion`,
`uploadLessonImage`, `setUserRole` (admin domain, each wrapped with an
`assertAdmin()` guard at the top before touching the data layer).

## Client-side data fetching (React Query)
Used specifically where a view needs optimistic UI or client-driven
background refetch that a plain Server Component re-render doesn't fit well:
- The **lesson player** (submitting an answer needs instant visual feedback
  before the server round-trip completes — optimistic `+XP` animation, then
  reconciled).
- The **quiz attempt** flow (timed quizzes, adaptive difficulty stepping).
- The **review/spaced-repetition session** (pulling the next due card without
  a full page navigation).

React Query's `queryClient` wraps thin client fetchers that call **Route
Handlers** (`app/api/lessons/[id]/progress/route.ts` style) for these
specific interactive loops, since Server Actions are better suited to
form-style, one-shot submissions than a rapid sequence of
fetch-mutate-fetch calls inside a single-page session. This is the one place
Route Handlers carry real feature traffic; everywhere else, Server Actions
are the default.

## Route Handlers inventory (v1)
- `app/api/lessons/[lessonId]/sections/[sectionId]/complete/route.ts` (POST)
- `app/api/quizzes/[quizId]/attempts/route.ts` (POST start, PATCH submit answer)
- `app/api/review/next/route.ts` (GET next due review item)
- `app/api/upload/route.ts` (POST, admin-only, proxies to Supabase Storage
  with server-side file-type/size validation before accepting)

All Route Handlers re-run the same auth + Zod validation discipline as Server
Actions — there is no "trusted" internal endpoint.

## Caching strategy
- Content tables (lessons, quizzes, topics) are largely static — fetched via
  Server Components with Next.js `fetch`/Supabase query results tagged for
  `revalidateTag('lessons')`-style invalidation, so admin edits show up
  immediately without a full redeploy.
- User-specific data (progress, XP, streaks) is never cached across users
  (no shared cache key); Server Component fetches for these are
  request-scoped, React Query cache is keyed by `user.id` + resource.
- Statistics rollups (`statistics` table) are precomputed on write (see
  `04-database-schema.md`) specifically so the stats dashboard doesn't need
  an expensive aggregate query on every load.

## Error handling
- Data-access layer throws typed errors (`NotFoundError`,
  `ForbiddenError`, `ValidationError`); Server Actions catch and map to the
  discriminated-union result; Route Handlers catch and map to proper HTTP
  status codes (404/403/400/500) with a consistent `{ error: { code,
  message } }` JSON shape.
- Every route/layout tree has an `error.tsx` boundary and a matching
  `loading.tsx` skeleton (per `02-ux-design-system.md`'s "skeletons over
  spinners" rule).

## Validation
Zod schemas live in `lib/validations/*.ts`, one file per domain, imported by
both the Server Action (server-side enforcement — the actual security
boundary) and the corresponding React Hook Form resolver (client-side UX).
Never validated client-side only.
