import { expect } from "chai"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page"

const POSITION = "ANET"
const POSITION_COMPLETE = "ANET Administrator"

describe("Create authorization group form page", () => {
  beforeEach("On the create authorization group page...", () => {
    CreateAuthorizationGroup.open()
    CreateAuthorizationGroup.getForm().waitForExist()
    CreateAuthorizationGroup.getForm().waitForDisplayed()
  })

  afterEach("On the create authorization group page...", () => {
    CreateAuthorizationGroup.logout()
  })

  describe("When creating an authorization group", () => {
    it("Should save an authorization group with only a name", () => {
      CreateAuthorizationGroup.getName().waitForDisplayed()
      CreateAuthorizationGroup.getName().setValue("authorization group 1")
      CreateAuthorizationGroup.getDescription().setValue(
        "this is just a test authorization group"
      )
      CreateAuthorizationGroup.getStatusActiveButton().waitForDisplayed()
      expect(
        CreateAuthorizationGroup.getStatusActiveInput().getValue()
      ).to.be.equal("ACTIVE")
      CreateAuthorizationGroup.getStatusInactiveButton().waitForDisplayed()
      expect(
        CreateAuthorizationGroup.getStatusInactiveInput().getValue()
      ).to.not.equal("ACTIVE")
      CreateAuthorizationGroup.getStatusInactiveButton().click()
      // eslint-disable-next-line no-unused-expressions
      expect($(".positions_table").isExisting()).to.be.false
      CreateAuthorizationGroup.getPositionsInput().click()
      CreateAuthorizationGroup.getPositionsInput().setValue(POSITION)
      CreateAuthorizationGroup.waitForPositionsAdvancedSelectToChange(
        POSITION_COMPLETE
      )
      expect(
        CreateAuthorizationGroup.getPositionsAdvancedSelectFirstItem().getText()
      ).to.include(POSITION_COMPLETE)
      CreateAuthorizationGroup.getPositionsAdvancedSelectFirstItem().click()
      // Click outside the positions overlay
      CreateAuthorizationGroup.getName().click()
      // Advanced select input gets empty, the position is added to a table underneath
      expect(CreateAuthorizationGroup.getPositionsInput().getValue()).to.equal(
        ""
      )
      // positions table exists now
      // eslint-disable-next-line no-unused-expressions
      expect($(".positions_table").isExisting()).to.be.true
      CreateAuthorizationGroup.submitForm()
      CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = CreateAuthorizationGroup.getAlertSuccess().getText()
      expect(alertMessage).to.equal("Authorization Group saved")
    })
  })
})
