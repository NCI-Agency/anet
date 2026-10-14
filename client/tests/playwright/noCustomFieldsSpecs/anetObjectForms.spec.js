import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page.js"
import CreateOrganization from "../pages/createNewOrganization.page.js"
import CreatePerson from "../pages/createNewPerson.page.js"
import CreatePosition from "../pages/createNewPosition.page.js"
import CreateTask from "../pages/createNewTask.page.js"
import CreateReport from "../pages/createReport.page.js"
import CreateNewLocation from "../pages/location/createNewLocation.page.js"
import { test, waitFor } from "../support.js"

// Forms should work just fine without custom fields

test.describe("When looking at anet object forms with dictionary that doesn't include custom fields", () => {
  test.afterEach("On the form page…", async () => {
    await CreateReport.logout()
  })
  test("Should see that report form successfully loads", async () => {
    await CreateReport.open()
    await waitFor(await CreateReport.getForm(), "attached")
    await waitFor(await CreateReport.getForm(), "visible")
  })
  test("Should see that person form successfully loads", async () => {
    await CreatePerson.openAsSuperuser()
    await waitFor(await CreatePerson.getForm(), "attached")
    await waitFor(await CreatePerson.getForm(), "visible")
  })
  test("Should see that task form successfully loads", async () => {
    await CreateTask.openAsAdmin()
    await waitFor(await CreateTask.getForm(), "attached")
    await waitFor(await CreateTask.getForm(), "visible")
  })
  test("Should see that communities form successfully loads", async () => {
    await CreateAuthorizationGroup.open()
    await waitFor(await CreateAuthorizationGroup.getForm(), "attached")
    await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
  })
  test("Should see that location form successfully loads", async () => {
    await CreateNewLocation.open()
    await (await CreateNewLocation.getCreateButton()).click()
    await waitFor(await CreateNewLocation.getNameRequiredError(), "attached")
    await waitFor(await CreateNewLocation.getNameRequiredError(), "visible")
  })
  test("Should see that position form successfully loads", async () => {
    await CreatePosition.open()
    await waitFor(await CreatePosition.getForm(), "attached")
    await waitFor(await CreatePosition.getForm(), "visible")
  })
  test("Should see that organization form successfully loads", async () => {
    await CreateOrganization.openAsAdmin()
    await waitFor(await CreateOrganization.getForm(), "attached")
    await waitFor(await CreateOrganization.getForm(), "visible")
  })
})
