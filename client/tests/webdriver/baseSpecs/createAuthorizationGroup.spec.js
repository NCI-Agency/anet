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
    it("Should save an authorization group with only a name and description", async() => {
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
      expect(await $(".related_objects_table").isExisting()).to.be.false
      await (await CreateAuthorizationGroup.getRelatedObjectsInput()).click()
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).setValue(POSITION)
      await CreateAuthorizationGroup.waitForRelatedObjectsAdvancedSelectToChange(
        POSITION_COMPLETE
      )
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(POSITION_COMPLETE)
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      // Click outside the overlay
      await (await CreateAuthorizationGroup.getName()).click()
      // Advanced select input does not get empty
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsInput()
        ).getValue()
      ).to.equal(POSITION)
      // The position is added to a table underneath, so relatedObjects table exists now
      // eslint-disable-next-line no-unused-expressions
      expect(await $(".related_objects_table").isExisting()).to.be.true
      // FIXME: assert that the position is added to the relatedObjects table
      // FIXME: add tests for adding people and organizations
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Authorization Group saved")
    })
  })
})
