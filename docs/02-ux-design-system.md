# 02 — UX & Design System

## Design references and what we take from each
- **Linear** — information density without clutter, keyboard-first
  interactions, fast page transitions, subtle borders over heavy shadows.
- **Notion** — calm typography, generous whitespace in content views, clean
  block-based lesson content rendering.
- **Vercel** — monochrome-first palette with a single accent color doing all
  the work, crisp geometric type, dark mode as the primary brand surface.
- **Raycast** — glassmorphism used sparingly (command palettes, modals),
  snappy micro-interactions, blur + translucency on overlays only.
- **Apple (HIG)** — motion has physical intent (springs, not linear eases),
  restraint — nothing animates without a reason tied to state change.
- **Duolingo** — the *only* place we allow maximalist, playful animation:
  XP gain, streak extension, achievement unlocks, level-up moments.

## Visual language

### Color system
Dark mode is the default and primary-designed surface; light mode is a
first-class alternate, not an afterthought — both are defined as CSS
variables / Tailwind theme tokens so components never hardcode color.

- **Base surfaces (dark):** near-black backgrounds (`#0A0A0B` → `#151517`
  tiers for elevation), not pure `#000` (pure black kills perceived depth).
- **Accent:** one confident brand accent (indigo/violet family, e.g.
  `#6D5DFC`) used for primary actions, active states, and progress fills.
  A secondary accent (emerald/green) is reserved *exclusively* for
  correct-answer/success/streak states, and a third (amber) exclusively for
  XP/coins, so color itself becomes a semantic signal across the whole app.
- **Semantic colors:** success (green), error (red), warning (amber), info
  (blue) — mapped to Tailwind tokens, never inlined as raw hex in components.
- **Elevation via subtle borders + soft shadow**, not flat color blocks —
  cards get a 1px `border-white/10` plus a soft ambient shadow in dark mode.

### Typography
- A single geometric/humanist sans (e.g. Inter or Geist) for UI, with a
  distinct but related display weight for headings/hero numbers (XP counters,
  streak numbers) to give gamified stats visual weight without a second
  typeface family.
- Type scale follows a modular scale (1.25 ratio) driven by Tailwind's
  `text-*` tokens extended in `tailwind.config`, never arbitrary px values in
  components.

### Shape & surface
- Rounded corners throughout (`rounded-xl`/`rounded-2xl` as the default card
  radius) — soft, approachable, matches Duolingo/Linear-era SaaS.
- Glassmorphism reserved for **overlay surfaces only**: modals, command
  palette, toasts, the mobile nav drawer. Never on primary content cards
  (hurts legibility and performance if overused).
- Gradients are subtle: used as background accents (radial glow behind hero
  numbers, a thin gradient border on the "streak" card), never as full-card
  fills.

## Motion system (Framer Motion)
- **Page transitions:** fade + slight y-translate on route change (App Router
  layout-level `AnimatePresence`), <200ms, no exit-animation jank.
- **Micro-interactions:** buttons scale 0.97 on press, cards lift 2-4px on
  hover with shadow transition, form fields get a focus-ring animation.
- **Progress bars/rings:** animate fill via spring physics whenever a value
  changes (lesson completion %, daily goal ring, XP bar) — never an instant
  jump-cut for a value the user just changed.
- **Celebration moments:** XP gain popups (+10 XP floats and fades), streak
  extension (flame icon pulses/scales), achievement unlock (modal with
  confetti-style particle burst using a lightweight canvas or CSS approach,
  not a heavy dependency), level-up (full-screen celebratory overlay,
  skippable).
- **Skeletons over spinners:** every data-dependent view has a matching
  skeleton component; spinners only for sub-second inline actions (button
  loading states).
- **Reduced motion:** all animation respects `prefers-reduced-motion` —
  celebratory/large motion collapses to a simple opacity fade.

## Layout & responsiveness
- **Mobile-first.** Every component is designed at a 375px viewport first,
  then progressively enhanced for tablet/desktop breakpoints.
- App shell: bottom tab bar on mobile (Home, Learn, Review, Stats, Profile),
  collapsible left sidebar on desktop (≥1024px) mirroring the same five
  destinations plus admin entry for admin roles.
- Lesson player is a focused, distraction-free full-screen view on mobile
  (no sidebar/nav chrome while actively in a lesson — matches Duolingo's
  "you can't get distracted mid-lesson" pattern).

## Accessibility
- All interactive components built on Radix primitives via shadcn/ui —
  keyboard navigation, focus management, and ARIA semantics come for free.
- Color is never the sole signal (correct/incorrect states pair color with an
  icon: check / x).
- Minimum AA contrast targets enforced in the token set itself, not
  per-component judgment calls.

## Component inventory (shadcn/ui-based, extended)
Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Card, Dialog,
Sheet (mobile drawer), Tabs, Tooltip, Toast/Sonner, Avatar, Badge, Progress,
Skeleton, DropdownMenu, Command (palette), Separator, Accordion — plus
app-specific composed components: `XPBar`, `StreakFlame`, `LessonCard`,
`TopicTree`, `QuestionRenderer` (polymorphic per question type), `HintPanel`,
`AchievementToast`, `CalendarHeatmap`, `StatChart` (Recharts wrapper),
`ProgressRing`, `LevelUpOverlay`.

## Content rendering
Lesson explanation/example content is authored as structured JSON blocks
(not raw HTML) so the admin panel can render a form-based editor and the
learner-facing renderer can stay a small set of typed React components per
block type (`TextBlock`, `ImageBlock`, `CodeBlock`/`MathBlock`,
`ExerciseBlock`). Math notation renders via KaTeX. This avoids a WYSIWYG/HTML
sanitization problem entirely and keeps content portable.
