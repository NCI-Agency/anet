import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Admin from "../pages/admin.page.js"
import Help from "../pages/help.page.js"
import { test } from "../support.js"

const ERIN_SUPERUSERS = ["CTR Rebecca Beccabon", "CIV Jacob Jacobson"]
const ERIN_ADMINS = ["CIV Arthur Dmin", "CIV Michael Scott"]
const HELP_TEXT = "This is a help text"
test.describe("When checking the help page", () => {
  test("Should see of the user superusers and administrators", async () => {
    await Help.open()
    const superusers = await Help.getSuperusers()
    expect(superusers).to.include.members(ERIN_SUPERUSERS)
    const administrators = await Help.getAdministrators()
    expect(administrators).to.include.members(ERIN_ADMINS)
  })
  test("Should have no help text", async () => {
    await Help.open()

    // eslint-disable-next-line no-unused-expressions
    expect(await Help.hasHelpText()).to.be.false
    await Help.logout()
  })
  test("Should have text in the help text field", async () => {
    await Admin.openAsAdminUser()
    await Admin.updateHelpText(HELP_TEXT)
    await Admin.logout()
    await Help.open()
    // eslint-disable-next-line no-unused-expressions
    expect(await Help.hasHelpText()).to.be.true
    await pwExpect.poll(async () => await Help.getHelpText()).toEqual(HELP_TEXT)
  })
})
