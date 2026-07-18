# LearnStack

A premium, gamified web app for learning English and Mathematics — built with
Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, and
Supabase.

Full project specification lives in [`SPECIFICATION.md`](./SPECIFICATION.md)
and [`docs/`](./docs). Read that before touching code — it's the source of
truth for scope, schema, and architecture decisions.

## Status

Phase 2 (Architecture) — project scaffold, tooling, and design tokens are in
place. No feature code yet; see [`docs/08-roadmap.md`](./docs/08-roadmap.md)
for what's next.

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

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Framer Motion · Supabase (Postgres, Auth, Storage) · React Query · Zod ·
React Hook Form · Recharts · pnpm. Rationale for each choice is in
[`docs/03-tech-stack.md`](./docs/03-tech-stack.md).
