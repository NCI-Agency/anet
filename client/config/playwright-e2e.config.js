import { defineConfig } from "@playwright/test"
import { getCommonConfig } from "./playwright-common.config.js"

const testName = "e2e"
const commonConfig = getCommonConfig(testName)

export default defineConfig({
  ...commonConfig,
  testDir: "../tests/e2e",
  // Scenarios declare serial when needed.
  fullyParallel: true
})
