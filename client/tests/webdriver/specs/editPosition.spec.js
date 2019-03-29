import { expect } from "chai"
import EditPosition from "../pages/editPosition.page"

const ADVISOR_ORG = "EF 2.2"
const ADVISOR_ORG_COMPLETE = "EF 2.2 -"
const PRINCIPAL_ORG = "MoI"
const PRINCIPAL_ORG_COMPLETE = "MoI - Ministry of Interior"

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
      expect(EditPosition.organization.getValue()).to.equal("")

      EditPosition.organization.setValue(PRINCIPAL_ORG)
      EditPosition.orgAutocomplete.waitForExist()
      expect(EditPosition.orgAutocomplete.getText()).to.include(
        "No suggestions found"
      )
      EditPosition.orgAutocomplete.click()
      expect(EditPosition.organization.getValue()).to.equal("")

      EditPosition.organization.setValue(ADVISOR_ORG)
      EditPosition.orgAutocomplete.waitForExist()
      expect(EditPosition.orgAutocomplete.getText()).to.include(
        ADVISOR_ORG_COMPLETE
      )
      EditPosition.orgAutocomplete.click()
      expect(EditPosition.organization.getValue()).to.equal(ADVISOR_ORG)

      EditPosition.typePrincipalButton.click()
      expect(EditPosition.organization.getValue()).to.equal("")
      EditPosition.organization.setValue(PRINCIPAL_ORG)
      EditPosition.orgAutocomplete.waitForExist()
      expect(EditPosition.orgAutocomplete.getText()).to.include(
        PRINCIPAL_ORG_COMPLETE
      )
      EditPosition.orgAutocomplete.click()
      expect(EditPosition.organization.getValue()).to.equal(PRINCIPAL_ORG)
      EditPosition.cancelButton.click()
    })
  })
})
