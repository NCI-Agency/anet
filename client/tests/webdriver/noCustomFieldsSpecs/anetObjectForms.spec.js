// import { expect } from "chai"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page"
import CreateOrganization from "../pages/createNewOrganization.page"
import CreatePerson from "../pages/createNewPerson.page"
import CreateTask from "../pages/createNewTask.page"
import CreateReport from "../pages/createReport.page"
import CreatePosition from "../pages/createNewPosition.page"
import CreateNewLocation from "../pages/location/createNewLocation.page"

// Forms should work just fine without custom fields

describe("When looking at anet object forms with dictionary that doesn't include custom fields", () => {
  afterEach("On the form page...", () => {
    // No Logout link, so just call logout directly
    browser.url("/api/logout")
  })

  it("Should see that report form successfully loads", () => {
    CreateReport.open()
    CreateReport.form.waitForExist()
    CreateReport.form.waitForDisplayed()
  })
  it("Should see that person form successfully loads", () => {
    CreatePerson.openAsSuperUser()
    CreatePerson.form.waitForExist()
    CreatePerson.form.waitForDisplayed()
  })
  it("Should see that task form successfully loads", () => {
    CreateTask.openAsAdmin()
    CreateTask.form.waitForExist()
    CreateTask.form.waitForDisplayed()
  })
  it("Should see that authorization groups form successfully loads", () => {
    CreateAuthorizationGroup.open()
    CreateAuthorizationGroup.form.waitForExist()
    CreateAuthorizationGroup.form.waitForDisplayed()
  })
  it("Should see that location form successfully loads", () => {
    CreateNewLocation.open()
    CreateNewLocation.createButton.click()
    CreateNewLocation.nameRequiredError.waitForExist()
    CreateNewLocation.nameRequiredError.waitForDisplayed()
  })
  it("Should see that position form successfully loads", () => {
    CreatePosition.open()
    CreatePosition.form.waitForExist()
    CreatePosition.form.waitForDisplayed()
  })
  it("Should see that organization form successfully loads", () => {
    CreateOrganization.openAsAdmin()
    CreateOrganization.form.waitForExist()
    CreateOrganization.form.waitForDisplayed()
  })
})
