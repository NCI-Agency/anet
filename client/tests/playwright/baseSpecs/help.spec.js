import { expect, test } from "@playwright/test"
import AdminPageObject from "../pages/admin.page.js"
import HelpPageObject from "../pages/help.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Admin, Help
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Admin = new AdminPageObject(page)
    Help = new HelpPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const ERIN_SUPERUSERS = ["CTR Rebecca Beccabon", "CIV Jacob Jacobson"]
  const ERIN_ADMINS = ["CIV Arthur Dmin", "CIV Michael Scott"]
  const HELP_TEXT = "This is a help text"
  test.describe("When checking the help page", () => {
    test("Should see of the user superusers and administrators", async () => {
      await Help.open()
      const superusers = await Help.getSuperusers()
      expect(superusers).toEqual(expect.arrayContaining(ERIN_SUPERUSERS))
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
})
