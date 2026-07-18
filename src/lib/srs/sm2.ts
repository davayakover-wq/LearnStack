// SM-2-inspired spaced-repetition scheduler (docs/01-features.md: "Classic
// Leitner/SM-2-inspired scheduler"). Pure and framework-agnostic per
// docs/07-folder-structure.md's rationale for isolating lib/srs — no
// Supabase/DB/React import here, so it's independently unit-testable
// (Phase 13) and portable to a future native client (docs/09).

export interface ReviewCardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface ReviewCardUpdate extends ReviewCardState {
  dueAt: string; // YYYY-MM-DD
  memoryStrength: number; // 0-100, auxiliary display metric — see below
}

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

// Textbook SM-2 expects a self-rated 0-5 recall quality; our grading is only
// ever binary (correct/incorrect), so it's mapped onto SM-2's quality scale
// rather than asking the learner to rate their own recall. Quality 4 is the
// scale's neutral point (its ease-factor delta is exactly zero), so a
// correct answer lengthens the review interval — via the repetitions/
// interval branch below — without inflating ease factor indefinitely.
// Quality 1 is a clear "forgot it" signal, sharply lowering ease and
// resetting the interval. This matches docs/01's description exactly:
// "Wrong answers shorten the interval and lower ease; correct answers
// lengthen the interval."
const QUALITY_CORRECT = 4;
const QUALITY_INCORRECT = 1;

export function createInitialReviewState(): ReviewCardState {
  return { easeFactor: DEFAULT_EASE_FACTOR, intervalDays: 1, repetitions: 0 };
}

export function sm2(
  state: ReviewCardState,
  isCorrect: boolean,
  today: Date = new Date(),
): ReviewCardUpdate {
  const quality = isCorrect ? QUALITY_CORRECT : QUALITY_INCORRECT;
  let { easeFactor } = state;
  let { intervalDays, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );
  easeFactor = Math.round(easeFactor * 100) / 100;

  const dueDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  dueDate.setUTCDate(dueDate.getUTCDate() + intervalDays);

  // Not part of classic SM-2 — a simple 0-100 "how well-known is this"
  // indicator docs/01 names explicitly ("...and a memory strength score"),
  // blending ease factor headroom with repetition depth so it still rises
  // across consecutive correct reviews even though ease factor itself
  // holds steady at the neutral quality above.
  const easeHeadroom =
    (easeFactor - MIN_EASE_FACTOR) / (DEFAULT_EASE_FACTOR - MIN_EASE_FACTOR);
  const memoryStrength = Math.round(
    Math.min(100, Math.max(0, easeHeadroom * 60 + Math.min(repetitions, 8) * 5)),
  );

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: dueDate.toISOString().slice(0, 10),
    memoryStrength,
  };
}
