import { defineConfig } from "@playwright/test"
import { getCommonConfig } from "./playwright-common.config.js"

const noCustomFields = process.env.TEST_PLAYWRIGHT_SUITE === "noCustomFields"
const testName = `playwright${noCustomFields ? "-noCF" : ""}`
const commonConfig = getCommonConfig(testName)

export default defineConfig({
  ...commonConfig,
  testDir: "../tests/playwright",
  testMatch: [
    "baseSpecs/**/*.spec.js",
    `${noCustomFields ? "noCustomFieldsSpecs" : "customFieldsSpecs"}/**/*.spec.js`
  ],
  // Existing scenarios mutate seeded records and retain data between test cases.
  // Preserve file-level parallelism; do not parallelize cases within a file.
  fullyParallel: false
})
