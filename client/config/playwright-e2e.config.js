import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "../tests/e2e",
  fullyParallel: false,
  // These scenarios mutate shared seed data and the report tests form a chain.
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 180000,
  expect: { timeout: 9000 },
  outputDir: "../build/test-results/e2e-artifacts",
  reporter: [
    ["list"],
    [
      "junit",
      { outputFile: "../build/test-results/e2e-junit-test-results.xml" }
    ],
    ["html", { outputFolder: "../build/e2e-playwright-report", open: "never" }]
  ],
  use: {
    browserName: "chromium",
    baseURL: process.env.SERVER_URL || "http://localhost:8180",
    viewport: { width: 1600, height: 1200 },
    actionTimeout: 9000,
    navigationTimeout: 30000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
})
