import { defineConfig } from "@playwright/test"
import { getCommonConfig } from "./playwright-common.config.js"

// Browser-only page-object contracts; these do not require ANET or a seeded database.
export default defineConfig({
  ...getCommonConfig("playwright-page-objects"),
  testDir: "../tests/playwright/pageObjects",
  fullyParallel: true
})
