export const getCommonConfig = testName => ({
  workers: Number(process.env.PLAYWRIGHT_WORKERS || (process.env.CI ? 5 : 10)),
  retries: 0,
  maxFailures: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 180000,
  expect: { timeout: 10000 },
  outputDir: `../build/test-results/${testName}-artifacts`,
  reporter: [
    ["list"],
    [
      "junit",
      { outputFile: `../build/test-results/${testName}-test-results.xml` }
    ],
    ["html", { outputFolder: `../build/${testName}-report`, open: "never" }]
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
