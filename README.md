# LearnStack

A premium, gamified web app for learning English and Mathematics — built with
Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, and
Supabase.

Full project specification lives in [`SPECIFICATION.md`](./SPECIFICATION.md)
and [`docs/`](./docs). Read that before touching code — it's the source of
truth for scope, schema, and architecture decisions.

## Status

Phases 1–13 complete per [`docs/08-roadmap.md`](./docs/08-roadmap.md): full
lesson/quiz players, spaced repetition, gamification, stats, admin CMS,
performance/accessibility pass, and a Vitest + Playwright test suite with CI.
Phase 14 (Deployment) in progress.

Live: https://learn-stack-5zjo.vercel.app

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start the dev server (Turbopack) |
| `pnpm build`        | Production build                 |
| `pnpm lint`         | ESLint                           |
| `pnpm format`       | Prettier — write                 |
| `pnpm format:check` | Prettier — check only            |
| `pnpm test`         | Vitest unit/component tests      |
| `pnpm test:e2e`     | Playwright E2E tests             |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Framer Motion · Supabase (Postgres, Auth, Storage) · React Query · Zod ·
React Hook Form · Recharts · pnpm. Rationale for each choice is in
[`docs/03-tech-stack.md`](./docs/03-tech-stack.md).
