import { expect } from "@playwright/test"
import Admin from "../pages/admin.page.js"
import Help from "../pages/help.page.js"
import { test } from "../support.js"

const ERIN_SUPERUSERS = ["CTR Rebecca Beccabon", "CIV Jacob Jacobson"]
const ERIN_TENANT_ADMINS = ["CIV Mads Madsen"]
const ERIN_ADMINS = ["CIV Arthur Dmin", "CIV Michael Scott"]
const HELP_TEXT = "This is a help text"
test.describe("When checking the help page", () => {
  test("Should see the user superusers, tenant administrators and ANET administrators", async () => {
    await Help.open()
    const superusers = await Help.getSuperusers()
    expect(superusers).toEqual(expect.arrayContaining(ERIN_SUPERUSERS))
    const tenantAdministrators = await Help.getTenantAdministrators()
    expect(tenantAdministrators).toEqual(
      expect.arrayContaining(ERIN_TENANT_ADMINS)
    )
    const administrators = await Help.getAdministrators()
    expect(administrators).toEqual(expect.arrayContaining(ERIN_ADMINS))
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
