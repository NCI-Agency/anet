import { expect } from "chai"
import EditPosition from "../pages/editPosition.page"

const ADVISOR_ORG = "EF 2.2"
const ADVISOR_ORG_COMPLETE = "EF 2.2 -"
const PRINCIPAL_ORG = "MoI"
const PRINCIPAL_ORG_COMPLETE = "MoI - Ministry of Interior P12345"

describe("Create position page", () => {
  beforeEach("Open the create position page", () => {
    EditPosition.open()
    EditPosition.form.waitForExist()
    EditPosition.form.waitForDisplayed()
  })

  describe("When changing the position type from principal to advisor and putting back", () => {
    it("Should update the position type to advisor and back to principal", () => {
      EditPosition.typePrincipalButton.waitForDisplayed()
      expect(
        EditPosition.typePrincipalButton.getAttribute("class")
      ).to.not.include("active")
      expect(EditPosition.typeAdvisorButton.getAttribute("class")).to.include(
        "active"
      )
      expect(EditPosition.organizationInput.getValue()).to.equal("")

      EditPosition.organizationInput.click()
      EditPosition.organizationInput.setValue(PRINCIPAL_ORG)
      EditPosition.orgAdvancedSelectFirstItem.waitForExist(2000, true) // element should *not* exist as no suggestion found

      // Click outside the organization overlay to close the overlay
      EditPosition.typeAdvisorButton.click()

      EditPosition.organizationInput.click()
      EditPosition.organizationInput.setValue(ADVISOR_ORG)
      EditPosition.waitForOrgAdvancedSelectToChange(ADVISOR_ORG_COMPLETE)
      expect(EditPosition.orgAdvancedSelectFirstItem.getText()).to.include(
        ADVISOR_ORG_COMPLETE
      )

      EditPosition.orgAdvancedSelectFirstItem.click()
      expect(EditPosition.organizationInput.getValue()).to.equal(ADVISOR_ORG)

      EditPosition.typePrincipalButton.click()
      expect(EditPosition.organizationInput.getValue()).to.equal("")

      EditPosition.organizationInput.click()
      EditPosition.organizationInput.setValue(PRINCIPAL_ORG)
      EditPosition.waitForOrgAdvancedSelectToChange(PRINCIPAL_ORG_COMPLETE)
      expect(EditPosition.orgAdvancedSelectFirstItem.getText()).to.include(
        PRINCIPAL_ORG_COMPLETE
      )

      EditPosition.orgAdvancedSelectFirstItem.click()
      expect(EditPosition.organizationInput.getValue()).to.equal(PRINCIPAL_ORG)
      EditPosition.cancelButton.click()
    })
  })
})
