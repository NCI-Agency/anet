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
  afterEach("On the form page...", () => {
    CreateReport.logout()
  })

  it("Should see that report form successfully loads", () => {
    CreateReport.open()
    CreateReport.getForm().waitForExist()
    CreateReport.getForm().waitForDisplayed()
  })
  it("Should see that person form successfully loads", () => {
    CreatePerson.openAsSuperUser()
    CreatePerson.getForm().waitForExist()
    CreatePerson.getForm().waitForDisplayed()
  })
  it("Should see that task form successfully loads", () => {
    CreateTask.openAsAdmin()
    CreateTask.getForm().waitForExist()
    CreateTask.getForm().waitForDisplayed()
  })
  it("Should see that authorization groups form successfully loads", () => {
    CreateAuthorizationGroup.open()
    CreateAuthorizationGroup.getForm().waitForExist()
    CreateAuthorizationGroup.getForm().waitForDisplayed()
  })
  it("Should see that location form successfully loads", () => {
    CreateNewLocation.open()
    CreateNewLocation.getCreateButton().click()
    CreateNewLocation.getNameRequiredError().waitForExist()
    CreateNewLocation.getNameRequiredError().waitForDisplayed()
  })
  it("Should see that position form successfully loads", () => {
    CreatePosition.open()
    CreatePosition.getForm().waitForExist()
    CreatePosition.getForm().waitForDisplayed()
  })
  it("Should see that organization form successfully loads", () => {
    CreateOrganization.openAsAdmin()
    CreateOrganization.getForm().waitForExist()
    CreateOrganization.getForm().waitForDisplayed()
  })
})
