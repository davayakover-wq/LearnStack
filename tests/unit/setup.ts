import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia implementation — framer-motion's useReducedMotion
// (used throughout components/gamification) calls it on every render, so
// without this every gamification component test would throw.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
