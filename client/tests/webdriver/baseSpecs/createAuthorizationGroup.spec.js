import { expect } from "chai"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page"

const POSITION = "ANET"
const POSITION_COMPLETE = "ANET Administrator"

describe("Create authorization group form page", () => {
  beforeEach("On the create authorization group page...", async() => {
    await CreateAuthorizationGroup.open()
    await (await CreateAuthorizationGroup.getForm()).waitForExist()
    await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()
  })

  afterEach("On the create authorization group page...", async() => {
    await CreateAuthorizationGroup.logout()
  })

  describe("When creating an authorization group", () => {
    it("Should save an authorization group with only a name", async() => {
      await (await CreateAuthorizationGroup.getName()).waitForDisplayed()
      await (
        await CreateAuthorizationGroup.getName()
      ).setValue("authorization group 1")
      await (
        await CreateAuthorizationGroup.getDescription()
      ).setValue("this is just a test authorization group")
      await (
        await CreateAuthorizationGroup.getStatusActiveButton()
      ).waitForDisplayed()
      expect(
        await (await CreateAuthorizationGroup.getStatusActiveInput()).getValue()
      ).to.be.equal("ACTIVE")
      await (
        await CreateAuthorizationGroup.getStatusInactiveButton()
      ).waitForDisplayed()
      expect(
        await (
          await CreateAuthorizationGroup.getStatusInactiveInput()
        ).getValue()
      ).to.not.equal("ACTIVE")
      await (await CreateAuthorizationGroup.getStatusInactiveButton()).click()
      // eslint-disable-next-line no-unused-expressions
      expect(await $(".positions_table").isExisting()).to.be.false
      await (await CreateAuthorizationGroup.getPositionsInput()).click()
      await (
        await CreateAuthorizationGroup.getPositionsInput()
      ).setValue(POSITION)
      await CreateAuthorizationGroup.waitForPositionsAdvancedSelectToChange(
        POSITION_COMPLETE
      )
      expect(
        await (
          await CreateAuthorizationGroup.getPositionsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(POSITION_COMPLETE)
      await (
        await CreateAuthorizationGroup.getPositionsAdvancedSelectFirstItem()
      ).click()
      // Click outside the positions overlay
      await (await CreateAuthorizationGroup.getName()).click()
      // Advanced select input gets empty, the position is added to a table underneath
      expect(
        await (await CreateAuthorizationGroup.getPositionsInput()).getValue()
      ).to.equal("")
      // positions table exists now
      // eslint-disable-next-line no-unused-expressions
      expect(await $(".positions_table").isExisting()).to.be.true
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Authorization Group saved")
    })
  })
})
