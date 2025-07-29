import { expect } from "chai"
import Admin from "../pages/admin.page"
import Help from "../pages/help.page"

const ERIN_SUPERUSERS = ["CTR BECCABON, Rebecca", "CIV JACOBSON, Jacob"]
const ERIN_ADMINS = ["CIV DMIN, Arthur", "CIV SCOTT, Michael"]

const HELP_TEXT = "This is a help text"

describe("When checking the help page", () => {
  it("Should see of the user superusers and administrators", async () => {
    await Help.open()

    const superusers = await Help.getSuperusers()
    expect(superusers).to.include.members(ERIN_SUPERUSERS)
    const administrators = await Help.getAdministrators()
    expect(administrators).to.include.members(ERIN_ADMINS)
  })

  it("Should have no help text", async () => {
    await Help.open()

    // eslint-disable-next-line no-unused-expressions
    expect(await Help.hasHelpText()).to.be.false

    await Help.logout()
  })

  it("Should have text in the help text field", async () => {
    await Admin.openAsAdminUser()
    await Admin.updateHelpText(HELP_TEXT)

    await Admin.logout()

    await Help.open()
    // eslint-disable-next-line no-unused-expressions
    expect(await Help.hasHelpText()).to.be.true
    expect(await Help.getHelpText()).to.equal(HELP_TEXT)
  })
})
