import { defineConfig, devices } from '@playwright/test';

// Production build, not `next dev` — matches "production-ready code only"
// (docs/08-roadmap.md) and avoids dev-server HMR/compile-on-request timing
// noise in the E2E suite. Single chromium project: Phase 13 asks for the
// four critical-journey E2E flows, not cross-browser coverage.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run build && pnpm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
