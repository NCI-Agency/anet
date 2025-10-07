import { expect } from "chai"
import Preferences from "../pages/preferences.page"

describe("When checking the preferences page", () => {
  it("Should see the two preferences that can be edited", async () => {
    await Preferences.open()
    // eslint-disable-next-line no-unused-expressions
    expect(await Preferences.hasReportsEmailsPreference()).to.be.true
    // eslint-disable-next-line no-unused-expressions
    expect(await Preferences.hasSubscriptionsEmailsPreference()).to.be.true
  })
})
