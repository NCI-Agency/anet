import { test } from "@playwright/test"
import CreateAuthorizationGroupPageObject from "../pages/createAuthorizationGroup.page.js"
import CreateOrganizationPageObject from "../pages/createNewOrganization.page.js"
import CreatePersonPageObject from "../pages/createNewPerson.page.js"
import CreatePositionPageObject from "../pages/createNewPosition.page.js"
import CreateTaskPageObject from "../pages/createNewTask.page.js"
import CreateReportPageObject from "../pages/createReport.page.js"
import CreateNewLocationPageObject from "../pages/location/createNewLocation.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context,
    page,
    CreateAuthorizationGroup,
    CreateOrganization,
    CreatePerson,
    CreatePosition,
    CreateTask,
    CreateReport,
    CreateNewLocation
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    CreateAuthorizationGroup = new CreateAuthorizationGroupPageObject(page)
    CreateOrganization = new CreateOrganizationPageObject(page)
    CreatePerson = new CreatePersonPageObject(page)
    CreatePosition = new CreatePositionPageObject(page)
    CreateTask = new CreateTaskPageObject(page)
    CreateReport = new CreateReportPageObject(page)
    CreateNewLocation = new CreateNewLocationPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  // Forms should work just fine without custom fields

  test.describe("When looking at anet object forms with dictionary that doesn't include custom fields", () => {
    test.afterEach("On the form page…", async () => {
      await CreateReport.logout()
    })
    test("Should see that report form successfully loads", async () => {
      await CreateReport.open()
      await (
        await CreateReport.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should see that person form successfully loads", async () => {
      await CreatePerson.openAsSuperuser()
      await (
        await CreatePerson.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should see that task form successfully loads", async () => {
      await CreateTask.openAsAdmin()
      await (
        await CreateTask.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should see that communities form successfully loads", async () => {
      await CreateAuthorizationGroup.open()
      await (
        await CreateAuthorizationGroup.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should see that location form successfully loads", async () => {
      await CreateNewLocation.open()
      await (await CreateNewLocation.getCreateButton()).click()
      await (
        await CreateNewLocation.getNameRequiredError()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should see that position form successfully loads", async () => {
      await CreatePosition.open()
      await (
        await CreatePosition.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should see that organization form successfully loads", async () => {
      await CreateOrganization.openAsAdmin()
      await (
        await CreateOrganization.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
  })
})
