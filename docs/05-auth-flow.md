# 05 — Authentication Flow

## Provider
**Supabase Auth**, email/password provider for v1 (OAuth providers like
Google are a trivial config addition later — the flow below doesn't change).

## Session handling
- `@supabase/ssr` manages cookie-based sessions so the same session is valid
  across Server Components, Server Actions, Route Handlers, and the client.
- Middleware (`middleware.ts`) refreshes the session cookie on every request
  and redirects unauthenticated users away from protected routes before the
  page even renders (no flash-of-protected-content).
- Sessions persist via Supabase's refresh-token rotation — "persistent
  sessions" means the browser stays logged in across restarts until the user
  explicitly logs out or the refresh token is revoked; this is Supabase Auth
  default behavior, not custom code.

## Flows

### Sign up
1. User submits email + password (Zod-validated client + server).
2. `supabase.auth.signUp()` creates the `auth.users` row and sends a
   verification email (Supabase-hosted template, customized to match brand).
3. A Postgres trigger (`on_auth_user_created`) inserts the matching
   `profiles` row (default `username` derived from email local-part +
   random suffix, editable later) and a default `settings` row — this
   guarantees `profiles` and `auth.users` never drift out of sync.
4. User lands on a "check your email" screen. Unverified users can log in
   (Supabase allows this by default) but see a persistent "verify your
   email" banner and are blocked from XP-earning actions until verified —
   enforced by a Server Action check (`profile.email_confirmed_at`), not
   just a UI banner.

### Email verification
- User clicks the emailed link → Supabase verifies and redirects to
  `/auth/callback`, which exchanges the code for a session and redirects to
  `/dashboard`.

### Login
1. `supabase.auth.signInWithPassword()`.
2. On success, middleware-managed cookies are set; redirect to `/dashboard`
   (or the originally-requested protected route via a `next` query param).
3. On failure, inline form error via React Hook Form + Zod — no full page
   reload, no leaking whether the email exists vs. password is wrong (generic
   "invalid email or password" message).

### Forgot / reset password
1. User requests reset from `/forgot-password` → `supabase.auth
   .resetPasswordForEmail()`.
2. Emailed link routes to `/auth/callback?type=recovery` → exchanged for a
   temporary recovery session → `/reset-password` form → `supabase.auth
   .updateUser({ password })`.

### Logout
`supabase.auth.signOut()` from a Server Action, clearing cookies, redirect to
`/login`.

## Route protection
- `middleware.ts` matcher covers `/dashboard/*`, `/learn/*`, `/review/*`,
  `/stats/*`, `/profile/*`, `/admin/*` — unauthenticated → redirect to
  `/login?next=<path>`.
- `/admin/*` has a second gate: middleware checks the session exists, but the
  **role** check (`profiles.role === 'admin'`) happens in the admin layout's
  Server Component (fetched fresh from the DB, never trusted from a client
  token/claim) — redirects non-admins to `/dashboard`. This is defense in
  depth: even if middleware's role check were stale/cached, the layout query
  is the real gate, and RLS is the gate underneath *that* (admin-only writes
  are enforced at the Postgres level regardless of what the app layer does).

## Authorization model
- **RLS is the actual security boundary**, not app-layer checks — every
  policy in `04-database-schema.md` holds even if a Server Action had a bug.
  App-layer role checks exist for UX (don't show the admin nav to non-admins)
  not as the security guarantee.
- `SUPABASE_SERVICE_ROLE_KEY` (which bypasses RLS) is used **only** in a
  small, explicit set of trusted server-only operations (e.g. the
  admin-audit-log writer, scheduled jobs) — never imported into any code path
  reachable from a client request without an explicit admin check first.

## Multi-device continuity
Because progress writes (`lesson_progress`, `xp_history`, `streaks`, etc.)
are Server Actions hitting Postgres directly — not local storage — logging in
from a second device reads the same rows. There is no client-side cache that
needs "syncing"; React Query's cache is just a read-through cache over the
same server truth, invalidated on every mutation.
