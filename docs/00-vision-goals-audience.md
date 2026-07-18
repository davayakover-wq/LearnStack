# 00 — Vision, Goals, Target Audience

## Vision

Build the single best place on the internet to learn English and Mathematics —
a product where the daily habit of showing up feels as compelling as Duolingo,
the depth of understanding feels as rigorous as Brilliant and Khan Academy, the
recall system feels as effective as Quizlet, and the day-to-day *feel* of the
software (speed, layout, information density, keyboard-friendliness) feels as
premium as Notion, Linear, and Vercel's own products.

The product is not a clone of any single competitor. It borrows the *mechanic*
that each does best and unifies them under one account, one progress graph, and
one design language:

| Borrowed from | Mechanic taken |
|---|---|
| Duolingo | Daily streaks, bite-sized lessons, XP loop, mascot-free but playful gamification |
| Brilliant | Interactive, visual problem-solving; "learn by doing" over "learn by reading" |
| Khan Academy | Deep, structured curriculum trees with mastery levels per topic |
| Quizlet | Spaced-repetition flashcard-style review of anything previously gotten wrong |
| Notion | Clean, calm, content-dense UI; the app gets out of the way of the content |

## Product principles (non-negotiable)

1. **Progress is sacred.** Nothing the user does in a lesson or quiz is ever
   lost. If it happened, it's in Postgres before the UI confirms it.
2. **Cross-device continuity.** Log in on a phone mid-lesson, finish on a
   laptop. This is a hard requirement of the data model, not a nice-to-have.
3. **English-only product.** All copy, content, and UI strings are English.
   No i18n framework needed for v1 (see `09-scalability-and-ai.md` for the
   future path if this changes).
4. **Dark mode is the default and the flagship experience.** Light mode exists
   but every design decision is made dark-first.
5. **Every screen must justify its own motion.** Animation is used to
   communicate state change (XP gained, streak extended, lesson unlocked), not
   decoration for its own sake. See `02-ux-design-system.md`.
6. **No placeholder architecture.** Every table, endpoint, and component
   built in this project is meant to hold real production traffic, not a demo.

## Goals

### Business goals
- Ship a production-grade MVP that could plausibly be the seed of a real
  subscription SaaS (freemium: English + Math intro topics free, full
  curriculum + AI tutor behind a paid tier — monetization is a **future**
  phase, not part of MVP scope, but the schema must not block it).
- Every phase in the roadmap ends in something demoable, not a half-finished
  slice.

### Product goals (v1 / MVP scope)
- A user can sign up, verify their email, and land on a working dashboard.
- A user can complete real English and Math lessons with interactive
  exercises and get instant, explained feedback.
- A user's XP, streak, completed lessons, and quiz results persist and are
  visible in a statistics view with real charts.
- Items answered incorrectly resurface later via a working spaced-repetition
  schedule.
- An admin (role-gated) can create/edit/delete lessons and quizzes through a
  real admin UI backed by the same database — not a separate CMS.

### Explicit non-goals for v1
- No AI tutor implementation (architecture only — see `09`).
- No payments/subscriptions.
- No public leaderboards (schema supports it; UI ships later).
- No native mobile app (the web app is mobile-responsive/mobile-first, but no
  React Native/Expo build in this phase).
- No multi-language UI.

## Target audience

### Primary persona — "The Self-Improver" (Maya, 27)
Works full-time, wants to improve conversational/business English and refresh
math fundamentals for a career pivot (e.g., into a data-adjacent role). Has 10
-20 minutes a day, usually on a phone during commute or before bed. Motivated
by visible progress (streaks, XP) more than grades. Churns fast if the app
feels slow, cluttered, or condescending.

### Secondary persona — "The Student" (Diego, 16)
Uses the app to supplement school coursework — drilling algebra, geometry, and
grammar rules ahead of exams. Wants clear explanations and lots of practice
reps, not long reading passages. Cares about level/rank progress and doing
better than his last attempt (personal-best framing, not necessarily social
leaderboards in v1).

### Tertiary persona — "The Admin/Content Author" (internal, or a hired tutor)
Needs to author and maintain lesson and quiz content without touching code —
a structured, form-based admin panel over the same Postgres tables the app
reads from.

## Success metrics (product, not vanity)
- **D1/D7/D30 retention** driven by streak mechanics and the daily-goal
  dashboard widget.
- **Lesson completion rate** (started vs. finished) — signals whether lesson
  length/difficulty pacing is right.
- **Review accuracy over time** — spaced repetition should show accuracy on
  previously-missed items trending up per user.
- **Time-to-first-completed-lesson** after signup — the shorter, the better
  the onboarding.
