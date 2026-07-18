import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const previewCards = [
  {
    title: 'English',
    detail: 'Grammar · Vocabulary · Conversation',
    accent: 'text-primary',
  },
  {
    title: 'Mathematics',
    detail: 'Algebra · Geometry · Calculus',
    accent: 'text-success',
  },
  {
    title: 'Daily streak',
    detail: '7 days and counting',
    accent: 'text-xp',
  },
];

// A Server Component: the entrance animation is pure CSS (tw-animate-css's
// animate-in/slide-in-from-* utilities, the same package already used for
// Dialog/Select) so this page ships zero client JS for what was previously
// a framer-motion-only Client Component — framer-motion stays a dependency
// for the gamification components that need real interactive triggers,
// just not for a one-shot page-load animation.
//
// Deliberately no `fade-in`: that utility starts every element at
// opacity:0, and a real headless Chrome run (`node phase12-debug-root-
// only.mjs` during this phase's Lighthouse pass) showed that hides all
// above-the-fold content from paint-detection long enough to fail with
// NO_FCP — a real risk for link-preview scrapers and crawler bots too, not
// just this project's own tooling. `slide-in-from-*` alone still gives the
// same subtle motion without ever putting content at zero opacity.
export function LandingHero() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
      <div
        aria-hidden
        className="bg-primary/20 pointer-events-none absolute top-1/3 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="border-border bg-card/60 text-muted-foreground animate-in slide-in-from-bottom-3 fill-mode-both mb-6 flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur duration-500 ease-out">
          <Sparkles className="text-xp h-4 w-4" />
          English &amp; Mathematics, done right
        </div>

        <h1 className="animate-in slide-in-from-bottom-4 fill-mode-both text-4xl font-semibold tracking-tight text-balance delay-[50ms] duration-500 ease-out sm:text-6xl">
          Learn like it&apos;s the only app that matters.
        </h1>

        <p className="text-muted-foreground animate-in slide-in-from-bottom-4 fill-mode-both mt-5 max-w-xl text-lg text-balance delay-100 duration-500 ease-out">
          Bite-sized lessons, real progress tracking, and spaced repetition — built to
          make English and Math stick.
        </p>

        <div className="animate-in slide-in-from-bottom-4 fill-mode-both mt-8 flex flex-col gap-3 delay-150 duration-500 ease-out sm:flex-row">
          <Button
            size="lg"
            className="gap-2"
            nativeButton={false}
            render={<Link href="/signup" />}
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Log in
          </Button>
        </div>

        <div className="animate-in slide-in-from-bottom-4 fill-mode-both mt-16 grid w-full gap-4 delay-[250ms] duration-500 ease-out sm:grid-cols-3">
          {previewCards.map((card) => (
            <Card
              key={card.title}
              className="border-border/60 bg-card/60 items-start gap-1 p-5 text-left backdrop-blur"
            >
              <p className={`text-sm font-medium ${card.accent}`}>{card.title}</p>
              <p className="text-muted-foreground text-sm">{card.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
