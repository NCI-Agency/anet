// import { expect } from "chai"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page"
import CreateOrganization from "../pages/createNewOrganization.page"
import CreatePerson from "../pages/createNewPerson.page"
import CreatePosition from "../pages/createNewPosition.page"
import CreateTask from "../pages/createNewTask.page"
import CreateReport from "../pages/createReport.page"
import CreateNewLocation from "../pages/location/createNewLocation.page"

// Forms should work just fine without custom fields

describe("When looking at anet object forms with dictionary that doesn't include custom fields", () => {
  afterEach("On the form page…", async() => {
    await CreateReport.logout()
  })

  it("Should see that report form successfully loads", async() => {
    await CreateReport.open()
    await (await CreateReport.getForm()).waitForExist()
    await (await CreateReport.getForm()).waitForDisplayed()
  })
  it("Should see that person form successfully loads", async() => {
    await CreatePerson.openAsSuperuser()
    await (await CreatePerson.getForm()).waitForExist()
    await (await CreatePerson.getForm()).waitForDisplayed()
  })
  it("Should see that task form successfully loads", async() => {
    await CreateTask.openAsAdmin()
    await (await CreateTask.getForm()).waitForExist()
    await (await CreateTask.getForm()).waitForDisplayed()
  })
  it("Should see that communities form successfully loads", async() => {
    await CreateAuthorizationGroup.open()
    await (await CreateAuthorizationGroup.getForm()).waitForExist()
    await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()
  })
  it("Should see that location form successfully loads", async() => {
    await CreateNewLocation.open()
    await (await CreateNewLocation.getCreateButton()).click()
    await (await CreateNewLocation.getNameRequiredError()).waitForExist()
    await (await CreateNewLocation.getNameRequiredError()).waitForDisplayed()
  })
  it("Should see that position form successfully loads", async() => {
    await CreatePosition.open()
    await (await CreatePosition.getForm()).waitForExist()
    await (await CreatePosition.getForm()).waitForDisplayed()
  })
  it("Should see that organization form successfully loads", async() => {
    await CreateOrganization.openAsAdmin()
    await (await CreateOrganization.getForm()).waitForExist()
    await (await CreateOrganization.getForm()).waitForDisplayed()
  })
})
