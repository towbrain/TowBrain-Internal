import { defineConfig } from '@playwright/test'

// Requires a running dev server (`npm run dev`) pointed at a real Supabase test
// project, plus E2E_TEST_EMAIL / E2E_TEST_PASSWORD for an existing team member
// account. See README "Testing" section — this does not run against mock data.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
      },
})
