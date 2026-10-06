import { expect } from "@playwright/test"
import Admin from "../pages/admin.page.js"
import Help from "../pages/help.page.js"
import { test } from "../support.js"

const ERIN_SUPERUSERS = ["CTR Rebecca Beccabon", "CIV Jacob Jacobson"]
const ERIN_TENANT_ADMINS = ["CIV Mads Madsen"]
const ERIN_ADMINS = ["CIV Arthur Dmin", "CIV Michael Scott"]
const HELP_TEXT = "This is a help text"
test.describe("When checking the help page", () => {
  test("Should see links to the user's superusers, tenant administrators and administrators", async () => {
    await Help.open()
    const superusers = await Help.getSuperuserLinks()
    for (const name of ERIN_SUPERUSERS) {
      // Match visible text rather than the accessible name, which may include
      // the avatar's alt text.
      const link = superusers.filter({ hasText: name })
      await expect(link).toBeVisible()
      await expect(link).toHaveText(name)
    }
    const tenantAdministrators = await Help.getTenantAdministratorLinks()
    for (const name of ERIN_TENANT_ADMINS) {
      const link = tenantAdministrators.filter({ hasText: name })
      await expect(link).toBeVisible()
      await expect(link).toHaveText(name)
    }
    const administrators = await Help.getAdministratorLinks()
    for (const name of ERIN_ADMINS) {
      const link = administrators.filter({ hasText: name })
      await expect(link).toBeVisible()
      await expect(link).toHaveText(name)
    }
  })
  test("Should have no help text", async () => {
    await Help.open()

    await expect(await Help.getHelpText()).toHaveCount(0)
    await Help.logout()
  })
  test("Should have text in the help text field", async () => {
    await Admin.openAsAdminUser()
    await Admin.updateHelpText(HELP_TEXT)
    await Admin.logout()
    await Help.open()
    await expect(await Help.getHelpText()).toBeVisible()
    await expect(await Help.getHelpText()).toHaveText(HELP_TEXT, {
      useInnerText: true
    })
  })
})
