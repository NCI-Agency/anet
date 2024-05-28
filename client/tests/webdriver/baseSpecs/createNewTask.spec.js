import { expect } from "chai"
import CreateTask from "../pages/createNewTask.page"
import ShowTask from "../pages/showTask.page"

const SHORT_NAME = "TO 1"
const LONG_NAME = "To the 1"
const DESCRIPTION = "Test Task 1"

describe("When creating an task", () => {
  it("Should show name to be required when submitting empty form", async() => {
    await CreateTask.openAsAdmin()
    await (await CreateTask.getForm()).waitForExist()
    await (await CreateTask.getForm()).waitForDisplayed()
    await CreateTask.submitForm()
    await (await CreateTask.getShortName()).waitForExist()
    await (await CreateTask.getShortName()).waitForDisplayed()
  })

  it("Should successfully create a task", async() => {
    await (await CreateTask.getShortNameInput()).setValue(SHORT_NAME)
    await (await CreateTask.getLongNameInput()).setValue(LONG_NAME)
    await CreateTask.fillTaskDescription(DESCRIPTION)
    await CreateTask.submitForm()
    await ShowTask.waitForAlertSuccessToLoad()
    expect(await (await ShowTask.getAlertSuccess()).getText()).to.equal(
      "Objective / Effort saved"
    )
  })

  it("Should display the newly created task", async() => {
    expect(await (await ShowTask.getShortName()).getText()).to.equal(
      `Objective ${SHORT_NAME}`
    )
    expect(await (await ShowTask.getLongName()).getText()).to.equal(LONG_NAME)
    expect(await (await ShowTask.getDescription()).getText()).to.equal(
      DESCRIPTION
    )
  })
})
