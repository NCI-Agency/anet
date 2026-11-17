import { defineConfig } from "@playwright/test"
import { getCommonConfig } from "./playwright-common.config.js"

// Standalone inventory/DOM contracts: no application or database is required.
export default defineConfig({
  ...getCommonConfig("playwright-location-inventory"),
  testDir: "../tests/playwright/pageObjects",
  testMatch: "locationInventory.spec.js",
  fullyParallel: true
})
