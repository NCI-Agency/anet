import { expect } from "chai"
import Home from "../pages/home.page"
import MergeOrganizations from "../pages/mergeOrganizations.page"
import Search from "../pages/search.page"
import ShowOrganization from "../pages/showOrganization.page"
import ShowTask from "../pages/showTask.page"

const EF1_ORGANIZATION_UUID = "9a35caa7-a095-4963-ac7b-b784fde4d583" // EF 1
const EF1_1_ORGANIZATION_UUID = "04614b0f-7e8e-4bf1-8bc5-13abaffeab8a" // EF 1.1
const EF2_2_ORGANIZATION_UUID = "ccbee4bb-08b8-42df-8cb5-65e8172f657b" // EF 2.2
const ORGANIZATION_WITH_AG_UUID = "7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf" // EF 5.1
const ORGANIZATION_EF2_SEARCH_STRING = "EF 2"
const EF1_ASSIGNED_TASKS = [
  "EF 1 » 1.1 » 1.1.A",
  "EF 1 » 1.1 » 1.1.B",
  "EF 1 » 1.1 » 1.1.C",
  "EF 1 » EF 1.2 » 1.2.A",
  "EF 1 » EF 1.2 » 1.2.B",
  "EF 1 » EF 1.2 » 1.2.C",
  "EF 1 » EF 1.2"
]
const EF1_1_ASSIGNED_TASKS = [
  "EF 1 » 1.1 » 1.1.A",
  "EF 1 » 1.1 » 1.1.B",
  "EF 1 » 1.1 » 1.1.C"
]
const EF2_ASSIGNED_TASKS = [
  "EF 2 » 2.A",
  "EF 2 » 2.B",
  "EF 2 » 2.C",
  "EF 2 » 2.D"
]
const ORGANIZATION_EF22_SEARCH_STRING = "EF 2.2"
const LEADER_POSITION_TEXT = "EF 2.2 Final Reviewer"
const LEADER_PERSON_TEXT = "CTR BECCABON, Rebecca"
const DEPUTY_POSITION_TEXT = "EF 2.2 Superuser"
const DEPUTY_PERSON_TEXT = "CIV JACOBSON, Jacob"

describe("Show organization page", () => {
  describe("As an admin", () => {
    it("Should first search, find and open the organization page", async () => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).setValue(ORGANIZATION_EF2_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundOrganizationTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundOrganizationTable()).waitForDisplayed()
      await (
        await Search.linkOfOrganizationFound(ORGANIZATION_EF2_SEARCH_STRING)
      ).click()
    })
    it("Should see leader&deputy fields are not listed", async () => {
      // Organization longName should be there
      const longNameField = await ShowOrganization.getLongName()
      await longNameField.waitForExist()
      await longNameField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await longNameField.isExisting()).to.be.true

      // Organization leaders should not be there
      const leaderField = await ShowOrganization.getLeaders()
      // eslint-disable-next-line no-unused-expressions
      expect(await leaderField.isExisting()).to.be.false

      // Organization deputies should not be there
      const deputyField = await ShowOrganization.getDeputies()
      // eslint-disable-next-line no-unused-expressions
      expect(await deputyField.isExisting()).to.be.false
    })
    it("Should see assigned tasks on the Show page", async () => {
      const tasks = await ShowOrganization.getTasks()
      await tasks.waitForExist()
      await tasks.waitForDisplayed()
      const assignedTasks = await ShowOrganization.getAssignedTasks()
      const assignedTasksShortNames = await assignedTasks.map(
        async at => await at.getText()
      )
      expect(assignedTasksShortNames).to.have.members(EF2_ASSIGNED_TASKS)
    })
    it("Should see sync matrix on the EF2 Show page", async () => {
      const syncMatrix = await ShowOrganization.getSyncMatrix()
      await syncMatrix.waitForExist()
      await syncMatrix.waitForDisplayed()

      expect(await (await syncMatrix.$(".legend")).getText()).to.contain(
        "Sync matrix for EF 2"
      )

      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(4)
      const taskPaths = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      expect(taskPaths).to.deep.equal(EF2_ASSIGNED_TASKS)
    })
    it("Should see assigned tasks on the Edit page", async () => {
      await (await ShowOrganization.getEditOrganizationButton()).click()
      const editableTasks = await ShowOrganization.getEditableTasks()
      await editableTasks.waitForExist()
      await editableTasks.waitForDisplayed()
      const editableAssignedTasks =
        await ShowOrganization.getEditableAssignedTasks()
      const editableAssignedTasksShortNames = await editableAssignedTasks.map(
        async at => await at.getText()
      )
      expect(editableAssignedTasksShortNames).to.have.members(
        EF2_ASSIGNED_TASKS
      )

      // Log out
      await ShowOrganization.logout()
    })

    it("Should see sync matrix on the EF1 Show page", async () => {
      await ShowOrganization.openAsAdminUser(EF1_ORGANIZATION_UUID)
      const syncMatrix = await ShowOrganization.getSyncMatrix()
      await syncMatrix.waitForExist()
      await syncMatrix.waitForDisplayed()

      expect(await (await syncMatrix.$(".legend")).getText()).to.contain(
        "Sync matrix for EF 1"
      )

      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(7)
      const taskPaths = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      expect(taskPaths).to.deep.equal(EF1_ASSIGNED_TASKS)
    })
    it("Should see sync matrix on the EF1.1 Show page", async () => {
      await ShowOrganization.openAsAdminUser(EF1_1_ORGANIZATION_UUID)
      const syncMatrix = await ShowOrganization.getSyncMatrix()
      await syncMatrix.waitForExist()
      await syncMatrix.waitForDisplayed()

      expect(await (await syncMatrix.$(".legend")).getText()).to.contain(
        "Sync matrix for EF 1.1"
      )

      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(3)
      const taskPaths = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      expect(taskPaths).to.deep.equal(EF1_1_ASSIGNED_TASKS)
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the organization page", async () => {
      await Home.openAsAdminUser()
      await (
        await Home.getSearchBar()
      ).setValue(ORGANIZATION_EF22_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundOrganizationTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundOrganizationTable()).waitForDisplayed()
      await (
        await Search.linkOfOrganizationFound(ORGANIZATION_EF22_SEARCH_STRING)
      ).click()
    })
    it("Should see leader&deputy fields are listed", async () => {
      // Organization longName should be there
      const longNameField = await ShowOrganization.getLongName()
      await longNameField.waitForExist()
      await longNameField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await longNameField.isExisting()).to.be.true

      // Organization leaders should be there
      const leaderField = await ShowOrganization.getLeaders()
      await leaderField.waitForExist({ timeout: 5000 })
      await leaderField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await leaderField.isExisting()).to.be.true
      expect(
        await (await ShowOrganization.getLeaderPosition()).getText()
      ).to.equal(LEADER_POSITION_TEXT)
      expect(
        await (await ShowOrganization.getLeaderPositionPerson()).getText()
      ).to.equal(LEADER_PERSON_TEXT)

      // Organization deputies should be there
      const deputyField = await ShowOrganization.getDeputies()
      await deputyField.waitForExist({ timeout: 5000 })
      await deputyField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await deputyField.isExisting()).to.be.true
      expect(
        await (await ShowOrganization.getDeputyPosition()).getText()
      ).to.equal(DEPUTY_POSITION_TEXT)
      expect(
        await (await ShowOrganization.getDeputyPositionPerson()).getText()
      ).to.equal(DEPUTY_PERSON_TEXT)

      // Log out
      await ShowOrganization.logout()
    })
  })

  describe("When on the show page of an organization with communities", () => {
    it("We should see a table with communities", async () => {
      await ShowOrganization.openAsAdminUser(ORGANIZATION_WITH_AG_UUID)
      await (
        await ShowOrganization.getAuthorizationGroupsTable()
      ).waitForExist()
      await (
        await ShowOrganization.getAuthorizationGroupsTable()
      ).waitForDisplayed()
      expect(
        await (await ShowOrganization.getAuthorizationGroupsTable()).getText()
      ).to.contain("EF 5")
    })
    it("We can go to the show page of a community", async () => {
      await (await ShowOrganization.getAuthorizationGroup(1)).click()
      await expect(await browser.getUrl()).to.include(
        "/communities/ab1a7d99-4529-44b1-a118-bdee3ca8296b"
      )
    })
  })

  describe("When on the show page of an organization with attachment(s)", () => {
    it("We should see a container for Attachment List", async () => {
      await ShowOrganization.open(EF2_2_ORGANIZATION_UUID)
      await (await ShowOrganization.getAttachments()).waitForExist()
      await (await ShowOrganization.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async () => {
      await (await ShowOrganization.getCard()).waitForExist()
      await (await ShowOrganization.getCard()).waitForDisplayed()
      expect(await ShowOrganization.getCaption()).to.be.equal("EF 2.2")
    })
    it("We should be able to edit the attachments", async () => {
      const editAttachmentsButton =
        await ShowOrganization.getEditAttachmentsButton()
      expect(await editAttachmentsButton.getText()).to.be.equal(
        "Edit attachments"
      )
      await editAttachmentsButton.click()
      expect(await editAttachmentsButton.getText()).to.be.equal(
        "View attachments"
      )

      const editButton = await browser.$(".attachment-card .button-line a")
      await expect(await editButton.getAttribute("href")).to.include(
        "/attachments/9ac41246-25ac-457c-b7d6-946c5f625f1f/edit"
      )
      await editAttachmentsButton.click()
    })
    it("We can go to the show page of Attachment", async () => {
      await (await ShowOrganization.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/9ac41246-25ac-457c-b7d6-946c5f625f1f"
      )

      await ShowOrganization.logout()
    })
  })

  describe("When on the show page of an organization as admin", () => {
    it("We can select to merge it with another organization", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      await (await ShowOrganization.getMergeButton()).click()
      await browser.pause(500) // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergeOrganizations.getTitle()).to.exist
      expect(
        await (await MergeOrganizations.getLeftOrganizationField()).getValue()
      ).to.contain("EF 2.2")
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await MergeOrganizations.getLeftOrganizationField()).isEnabled()
      ).to.be.false
    })
    it("Should open and close the Edit Engagement planning approvals modal correctly", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      const editButton =
        await ShowOrganization.getEditEngagementPlanningApprovalsButton()
      await editButton.waitForExist()
      await editButton.waitForDisplayed()
      await editButton.click()
      const modal = await ShowOrganization.getEditApprovalsModal()
      await modal.waitForExist()
      await modal.waitForDisplayed()
      const modalTitle = await modal.$(".modal-title")
      expect(await modalTitle.getText()).to.equal(
        "Edit Engagement planning approval process"
      )
      const closeButton = await ShowOrganization.getModalCloseButton()
      await closeButton.click()
      await modal.waitForExist({ reverse: true })
    })
    it("Should open and close the Edit Report publication approvals modal correctly", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      const editButton =
        await ShowOrganization.getEditReportPublicationApprovalsButton()
      await editButton.waitForExist()
      await editButton.waitForDisplayed()
      await editButton.click()
      const modal = await ShowOrganization.getEditApprovalsModal()
      await modal.waitForExist()
      await modal.waitForDisplayed()
      const modalTitle = await modal.$(".modal-title")
      expect(await modalTitle.getText()).to.equal(
        "Edit Report publication approval process"
      )
      const closeButton = await ShowOrganization.getModalCloseButton()
      await closeButton.click()
      await modal.waitForExist({ reverse: true })
    })
  })

  describe("When on the show page of an organization with entity avatar", () => {
    it("We should see the avatar", async () => {
      await ShowOrganization.open(EF2_2_ORGANIZATION_UUID)
      await (await ShowOrganization.getEntityAvatar()).waitForExist()
      await (await ShowOrganization.getEntityAvatar()).waitForDisplayed()
    })
  })

  describe("When on the show page of an organization with events", () => {
    it("We should see a table with events", async () => {
      await ShowOrganization.open(EF2_2_ORGANIZATION_UUID)
      await (await ShowOrganization.getEventsTable()).waitForExist()
      await (await ShowOrganization.getEventsTable()).waitForDisplayed()
      expect(
        await (await ShowOrganization.getEventsTable()).getText()
      ).to.contain("NMI PDT 2024-01")
    })
    it("We can go to the show page of event", async () => {
      await (await ShowOrganization.getEvent(1)).click()
      await expect(await browser.getUrl()).to.include(
        "/events/e850846e-9741-40e8-bc51-4dccc30cf47f"
      )
    })
  })
})
