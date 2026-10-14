import { defineConfig } from "@playwright/test"

const noCustomFields = process.env.TEST_PLAYWRIGHT_SUITE === "noCustomFields"
export default defineConfig({
  testDir: "../tests/playwright",
  testMatch: [
    "baseSpecs/**/*.spec.js",
    `${noCustomFields ? "noCustomFieldsSpecs" : "customFieldsSpecs"}/**/*.spec.js`
  ],
  // Existing scenarios mutate seeded records and retain data between test cases.
  // Preserve file-level parallelism; do not parallelize cases within a file.
  fullyParallel: false,
  workers: Number(process.env.PLAYWRIGHT_WORKERS || 5),
  retries: 0,
  timeout: 360000,
  expect: { timeout: 10000 },
  outputDir: "../build/test-results/playwright-artifacts",
  reporter: [
    ["list"],
    [
      "junit",
      {
        outputFile: `../build/test-results/playwright${noCustomFields ? "-noCF" : ""}-junit-test-results.xml`
      }
    ],
    ["html", { outputFolder: "../build/playwright-report", open: "never" }]
  ],
  use: {
    browserName: "chromium",
    baseURL: process.env.SERVER_URL || "http://localhost:8180",
    viewport: { width: 1600, height: 1200 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
})
