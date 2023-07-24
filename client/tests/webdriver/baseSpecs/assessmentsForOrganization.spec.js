import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowOrganization from "../pages/showOrganization.page"

const ORGANIZATION_SEARCH_STRING = "EF 2.2"
const SUPERUSER_ASSESSMENT_CREATE_DETAILS = [
  "t2",
  "noStatement",
  "Develop relationship",
  "TRJU-1"
]
const SUPERUSER_ASSESSMENT_EDIT_DETAILS = [
  "t2",
  "improve",
  "Improve relationship",
  "TRJU-1 TRJU-2"
]
const ADMIN_ASSESSMENT_EDIT_DETAILS = [
  "t3",
  "maintain",
  "Maintain the connection network",
  "TRJU-1 TRJU-2 JUJA"
]

const VALUE_TO_TEXT_FOR_PRIORITY = {
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
  t5: "T5"
}

const VALUE_TO_TEXT_FOR_INTERACTION = {
  noStatement: "No statement",
  dormant: "Dormant",
  initiate: "Initiate",
  develop: "Develop",
  improve: "Improve",
  maintain: "Maintain"
}

describe("For the annualy organization assessments", () => {
  describe("As a superuser assigned to the organization", () => {
    it("Should first search, find and open the organization's page", async() => {
      await Home.openAsSuperuser()
      await (await Home.getSearchBar()).setValue(ORGANIZATION_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundOrganizationTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundOrganizationTable()).waitForDisplayed()
      await (
        await Search.linkOfOrganizationFound(ORGANIZATION_SEARCH_STRING)
      ).click()
    })

    it("Should allow superuser to successfully add an assessment", async() => {
      await (
        await ShowOrganization.getAssessmentsTable(
          "organizationAnnually",
          "annually"
        )
      ).waitForExist()
      await (
        await ShowOrganization.getAssessmentsTable(
          "organizationAnnually",
          "annually"
        )
      ).waitForDisplayed()

      await (
        await ShowOrganization.getAddAssessmentButton(
          "organizationAnnually",
          "annually"
        )
      ).click()

      // NOTE: assuming assessment question content here, may change in future
      await ShowOrganization.fillAssessmentQuestion(
        SUPERUSER_ASSESSMENT_CREATE_DETAILS
      )
      await ShowOrganization.saveAssessmentAndWaitForModalClose(
        "organizationAnnually",
        "annually",
        VALUE_TO_TEXT_FOR_PRIORITY[SUPERUSER_ASSESSMENT_CREATE_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just created", async() => {
      const details = await ShowOrganization.getShownAssessmentDetails(
        "organizationAnnually",
        "annually"
      )
      for (const [index, detail] of details.entries()) {
        expect((await prefix(index)) + (await detail.getText())).to.equal(
          (await prefix(index)) +
            (VALUE_TO_TEXT_FOR_PRIORITY[
              SUPERUSER_ASSESSMENT_CREATE_DETAILS[index]
            ] ||
              VALUE_TO_TEXT_FOR_INTERACTION[
                SUPERUSER_ASSESSMENT_CREATE_DETAILS[index]
              ] ||
              SUPERUSER_ASSESSMENT_CREATE_DETAILS[index])
        )
      }
    })

    it("Should allow the author of the assessment to successfully edit it", async() => {
      await (await ShowOrganization.getEditAssessmentButton()).waitForExist()
      await (
        await ShowOrganization.getEditAssessmentButton()
      ).waitForDisplayed()

      await (await ShowOrganization.getEditAssessmentButton()).click()
      await ShowOrganization.waitForAssessmentModalForm()

      await ShowOrganization.fillAssessmentQuestion(
        SUPERUSER_ASSESSMENT_EDIT_DETAILS,
        [
          SUPERUSER_ASSESSMENT_CREATE_DETAILS[2],
          SUPERUSER_ASSESSMENT_CREATE_DETAILS[3]
        ]
      )
      await ShowOrganization.saveAssessmentAndWaitForModalClose(
        "organizationAnnually",
        "annually",
        VALUE_TO_TEXT_FOR_PRIORITY[SUPERUSER_ASSESSMENT_EDIT_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just edited", async() => {
      const details = await ShowOrganization.getShownAssessmentDetails(
        "organizationAnnually",
        "annually"
      )
      for (const [index, detail] of details.entries()) {
        expect((await prefix(index)) + (await detail.getText())).to.equal(
          (await prefix(index)) +
            (VALUE_TO_TEXT_FOR_PRIORITY[
              SUPERUSER_ASSESSMENT_EDIT_DETAILS[index]
            ] ||
              VALUE_TO_TEXT_FOR_INTERACTION[
                SUPERUSER_ASSESSMENT_EDIT_DETAILS[index]
              ] ||
              SUPERUSER_ASSESSMENT_EDIT_DETAILS[index])
        )
      }
      await ShowOrganization.logout()
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the organization's page", async() => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).setValue(ORGANIZATION_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundOrganizationTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundOrganizationTable()).waitForDisplayed()
      await (
        await Search.linkOfOrganizationFound(ORGANIZATION_SEARCH_STRING)
      ).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", async() => {
      expect(
        await (
          await ShowOrganization.getAddAssessmentButton(
            "organizationAnnually",
            "annually"
          )
        ).isExisting()
      ).to.equal(false)
    })

    it("Should allow admins to successfully edit existing assessment", async() => {
      await (await ShowOrganization.getEditAssessmentButton()).waitForExist()
      await (
        await ShowOrganization.getEditAssessmentButton()
      ).waitForDisplayed()

      await (await ShowOrganization.getEditAssessmentButton()).click()
      await ShowOrganization.waitForAssessmentModalForm()

      await ShowOrganization.fillAssessmentQuestion(
        ADMIN_ASSESSMENT_EDIT_DETAILS,
        [
          SUPERUSER_ASSESSMENT_EDIT_DETAILS[2],
          SUPERUSER_ASSESSMENT_EDIT_DETAILS[3]
        ]
      )
      await ShowOrganization.saveAssessmentAndWaitForModalClose(
        "organizationAnnually",
        "annually",
        VALUE_TO_TEXT_FOR_PRIORITY[ADMIN_ASSESSMENT_EDIT_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just edited", async() => {
      const details = await ShowOrganization.getShownAssessmentDetails(
        "organizationAnnually",
        "annually"
      )
      for (const [index, detail] of details.entries()) {
        expect((await prefix(index)) + (await detail.getText())).to.equal(
          (await prefix(index)) +
            (VALUE_TO_TEXT_FOR_PRIORITY[ADMIN_ASSESSMENT_EDIT_DETAILS[index]] ||
              VALUE_TO_TEXT_FOR_INTERACTION[
                ADMIN_ASSESSMENT_EDIT_DETAILS[index]
              ] ||
              ADMIN_ASSESSMENT_EDIT_DETAILS[index])
        )
      }
    })

    it("Should allow an admin to delete the assessment", async() => {
      await (await ShowOrganization.getDeleteAssessmentButton()).click()
      await ShowOrganization.confirmDelete()
      await ShowOrganization.waitForDeletedAssessmentToDisappear(
        "organizationAnnually",
        "annually"
      )
      await ShowOrganization.logout()
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = async index => `${index}-) `
