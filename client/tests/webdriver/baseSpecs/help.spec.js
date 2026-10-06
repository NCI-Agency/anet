import { expect } from "chai"
import Admin from "../pages/admin.page"
import Help from "../pages/help.page"

const ERIN_SUPERUSERS = ["CTR Rebecca Beccabon", "CIV Jacob Jacobson"]
const ERIN_TENANT_ADMINS = ["CIV Mads Madsen"]
const ERIN_ADMINS = ["CIV Arthur Dmin", "CIV Michael Scott"]

const HELP_TEXT = "This is a help text"

describe("When checking the help page", () => {
  it("Should see the user superusers, tenant administrators and ANET administrators", async () => {
    await Help.open()

    const superusers = await Help.getSuperusers()
    expect(superusers).to.include.members(ERIN_SUPERUSERS)
    const tenantAdministrators = await Help.getTenantAdministrators()
    expect(tenantAdministrators).to.include.members(ERIN_TENANT_ADMINS)
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
