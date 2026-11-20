import { defineConfig } from "@playwright/test"
import { getCommonConfig } from "./playwright-common.config.js"

// Browser-only locator contracts; no application or seeded database is required.
export default defineConfig({
  ...getCommonConfig("playwright-page-objects"),
  testDir: "../tests/playwright/pageObjects",
  fullyParallel: true
})
