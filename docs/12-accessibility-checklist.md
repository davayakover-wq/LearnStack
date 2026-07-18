# 12 — Accessibility Checklist (Phase 12)

Produced during Phase 12's accessibility audit. Covers automated (Lighthouse/
axe-core) and manual (keyboard, screen-reader-label, contrast) verification
against the dashboard, lesson player, and marketing pages, plus fixes applied.

## Automated audit (Lighthouse, mobile, real Chrome)

| Route | Accessibility score |
| --- | --- |
| `/dashboard` | 100 |
| `/learn/[subject]/[topic]/[lesson]` | 100 |
| `/` (marketing) | 100 |

All three routes started below 100 before this phase's fixes. Findings and
fixes:

- **Missing accessible names on progress bars** (`aria-progressbar-name`,
  axe/WCAG 4.1.2). Every `<Progress>` usage (daily goal, XP, lesson/quiz
  in-player progress, topic/lesson completion, topic accuracy) rendered
  `role="progressbar"` with no `aria-label`/`aria-labelledby`. Fixed by
  adding a descriptive `aria-label` at each of the 8 call sites (e.g. "Daily
  goal progress", "Lesson progress", "{topic} accuracy").
- **Color contrast below 4.5:1** (`color-contrast`, WCAG 1.4.3). The single
  `--primary` purple couldn't clear 4.5:1 in both directions it was used —
  as small colored text on the dark page background (4.46:1) and as a solid
  button/badge fill behind near-white text (4.08:1). Introduced a second
  token, `--primary-solid`, tuned darker (oklch L 0.52 vs 0.62) specifically
  for solid-fill-plus-light-text surfaces (`Button`'s default variant,
  `Badge`'s default variant); `--primary` itself was nudged lighter and
  stays the token for text/icon/ring/opacity-tint usage. Both pairings now
  clear 4.5:1 (measured ~4.75:1 and ~5.9:1 respectively — see
  `phase12-contrast-check.mjs` in this phase's working notes for the exact
  OKLCH→sRGB→WCAG-ratio derivation).
- **Missing `<main>` landmark** (`landmark-one-main`, WCAG 1.3.1) on the
  lesson/quiz player routes. `AppShell`'s "chrome-free" branch (used for the
  distraction-free lesson/quiz player views) rendered a plain `<div>`
  instead of `<main>` — the normal branch already used `<main>` correctly.
  Fixed in `components/shared/app-shell.tsx`.

## Manual keyboard navigation

- Tabbed through the login form (`/login`) with real keyboard focus
  (not simulated clicks): Email → Forgot password → Password → Log in →
  Sign up. Order matches visual/DOM order; every stop has an inferable
  accessible name (input type, link text); no keyboard trap encountered.
- All interactive exercise options (multiple-choice, etc.) are real
  `<button>` elements (`lesson-player`/`quiz` components), not
  `<div onClick>` — this guarantees native Tab-focusability and native
  Enter/Space activation semantics per the HTML spec, independent of any
  custom JS.
- **Testing limitation, not a product defect**: this session's browser
  automation tool can focus an element and dispatch a `keydown`/`keyup`
  pair, but the synthesized event carries an empty `key` property (verified
  by attaching a real listener and logging `event.key`), so the browser's
  native "Enter activates the focused button" behavior doesn't fire from
  this tool. This could not be worked around within this session — a real
  keyboard in a real browser sends a well-formed `key: "Enter"`/`" "` and is
  unaffected, since that behavior is native HTML `<button>` semantics, not
  app code. Recommend a quick manual real-keyboard smoke test of the lesson
  player and quiz player before relying solely on this checklist.

## Screen reader labels

- Icon-only buttons across the app carry `aria-label` (spot-checked:
  "Exit lesson", "Exit quiz", "Remove image", "Remove answer", "Delete
  achievement", the admin delete-confirm buttons, dialog close button).
- Form inputs use associated `<Label>` elements (shadcn `Label` +
  `htmlFor`/implicit wrapping) throughout auth and admin forms.
- Images: the two remaining `<img>`-turned-`next/image` usages
  (question prompt image, admin upload preview) use `alt=""` deliberately —
  both are decorative/supplementary to text content that already describes
  the question, not information conveyed only by the image.

## Not covered / out of scope for this pass

- Full screen-reader (NVDA/VoiceOver) walkthrough — this session has no
  screen reader available; Lighthouse's axe-core rules plus the manual
  label/landmark spot checks above are the closest available substitute.
- Light theme contrast — the app defaults to dark theme
  (`ThemeProvider defaultTheme="dark"`) and Lighthouse audited dark-rendered
  pages; light theme's `--primary` (near-black) already has very high
  contrast against its white-ish foreground pairs, so it wasn't a flagged
  risk, but wasn't independently re-audited pixel-by-pixel.
