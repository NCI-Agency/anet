import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import SearchPageObject from "../pages/search.page.js"
import ShowOrganizationPageObject from "../pages/showOrganization.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, Search, ShowOrganization
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    Search = new SearchPageObject(page)
    ShowOrganization = new ShowOrganizationPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
  test.describe("For the annual organization assessments", () => {
    test.describe("As a superuser assigned to the organization", () => {
      test("Should first search, find and open the organization's page", async () => {
        await Home.openAsSuperuser()
        await (
          await Home.getSearchBar()
        ).fill(String(ORGANIZATION_SEARCH_STRING))
        await (await Home.getSubmitSearch()).click()
        await (
          await Search.getFoundOrganizationTable()
        ).waitFor({
          state: "attached",
          timeout: 20000
        })
        await (
          await Search.getFoundOrganizationTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await Search.linkOfOrganizationFound(ORGANIZATION_SEARCH_STRING)
        ).click()
      })
      test("Should allow superuser to successfully add an assessment", async () => {
        await (
          await ShowOrganization.getAssessmentsTable(
            "organizationAnnually",
            "annually"
          )
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
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
          getExpectedAssessmentDetails(SUPERUSER_ASSESSMENT_CREATE_DETAILS)
        )
      })
      test("Should show the same assessment details with the details just created", async () => {
        await assertAssessmentDetails(
          "organizationAnnually",
          "annually",
          SUPERUSER_ASSESSMENT_CREATE_DETAILS
        )
      })
      test("Should allow the author of the assessment to successfully edit it", async () => {
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
          getExpectedAssessmentDetails(SUPERUSER_ASSESSMENT_EDIT_DETAILS)
        )
      })
      test("Should show the same assessment details with the details just edited", async () => {
        await assertAssessmentDetails(
          "organizationAnnually",
          "annually",
          SUPERUSER_ASSESSMENT_EDIT_DETAILS
        )
        await ShowOrganization.logout()
      })
    })
    test.describe("As an admin", () => {
      test("Should first search, find and open the organization's page", async () => {
        await Home.openAsAdminUser()
        await (
          await Home.getSearchBar()
        ).fill(String(ORGANIZATION_SEARCH_STRING))
        await (await Home.getSubmitSearch()).click()
        await (
          await Search.getFoundOrganizationTable()
        ).waitFor({
          state: "attached",
          timeout: 20000
        })
        await (
          await Search.getFoundOrganizationTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await Search.linkOfOrganizationFound(ORGANIZATION_SEARCH_STRING)
        ).click()
      })
      test("Should not show make assessment button when there is an assessment on that period", async () => {
        await expect(
          await ShowOrganization.getAddAssessmentButton(
            "organizationAnnually",
            "annually"
          )
        ).toHaveCount(0)
      })
      test("Should allow admins to successfully edit existing assessment", async () => {
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
          getExpectedAssessmentDetails(ADMIN_ASSESSMENT_EDIT_DETAILS)
        )
      })
      test("Should show the same assessment details with the details just edited", async () => {
        await assertAssessmentDetails(
          "organizationAnnually",
          "annually",
          ADMIN_ASSESSMENT_EDIT_DETAILS
        )
      })
      test("Should allow an admin to delete the assessment", async () => {
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

  // @assertionMethod
  const assertAssessmentDetails = async (
    assessmentKey,
    recurrence,
    assessmentDetails
  ) => {
    const details = await ShowOrganization.getShownAssessmentDetails(
      assessmentKey,
      recurrence
    )
    await expect(details).toHaveText(
      getExpectedAssessmentDetails(assessmentDetails)
    )
  }
  const getExpectedAssessmentDetails = assessmentDetails =>
    assessmentDetails.map(
      value =>
        VALUE_TO_TEXT_FOR_PRIORITY[value] ||
        VALUE_TO_TEXT_FOR_INTERACTION[value] ||
        value
    )
})
