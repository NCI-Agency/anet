import { expect } from "chai"
import MergePeople from "../pages/mergePeople.page"
import ShowPerson from "../pages/showPerson.page"

const PERSON_UUID = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"
const PERSON_WITH_AG_UUID = "31cba227-f6c6-49e9-9483-fce441bea624" // CIV BRATTON, Creed

describe("Show person page", () => {
  describe("When on the show page of a person with authorizationGroup(s)", () => {
    it("We should see a table with authorizationGroups", async() => {
      await ShowPerson.open(PERSON_WITH_AG_UUID)
      await (await ShowPerson.getAuthorizationGroupsTable()).waitForExist()
      await (await ShowPerson.getAuthorizationGroupsTable()).waitForDisplayed()
      expect(
        await (await ShowPerson.getAuthorizationGroupsTable()).getText()
      ).to.contain("EF 5")
    })
    it("We can go to the show page of authorizationGroup", async() => {
      await (await ShowPerson.getAuthorizationGroup(1)).click()
      await expect(await browser.getUrl()).to.include(
        "/authorizationGroups/ab1a7d99-4529-44b1-a118-bdee3ca8296b"
      )
    })
  })

  describe("When on the show page of a person with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      await ShowPerson.open(PERSON_UUID)
      await (await ShowPerson.getAttachments()).waitForExist()
      await (await ShowPerson.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      await (await ShowPerson.getCard()).waitForExist()
      await (await ShowPerson.getCard()).waitForDisplayed()
      expect(await ShowPerson.getCaption()).to.be.equal("Erin")
    })
    it("We can go to the show page of Attachment", async() => {
      await (await ShowPerson.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/13318e42-a0a3-438f-8ed5-dc16b1ef17bc"
      )

      await ShowPerson.logout()
    })
  })

  describe("When on the show page of a person as admin", () => {
    it("We can select to merge them with another person", async() => {
      await ShowPerson.openAsAdminUser(PERSON_WITH_AG_UUID)
      await (await ShowPerson.getMergeButton()).click()
      await browser.pause(500) // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergePeople.getTitle()).to.exist
      expect(
        await (await MergePeople.getLeftPersonField()).getValue()
      ).to.contain("BRATTON, Creed")
      // eslint-disable-next-line no-unused-expressions
      expect(await (await MergePeople.getLeftPersonField()).isEnabled()).to.be
        .false
    })
  })
})
