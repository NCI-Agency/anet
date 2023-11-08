import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowOrganization from "../pages/showOrganization.page"

const ORGANIZATION_UUID = "ccbee4bb-08b8-42df-8cb5-65e8172f657b" // EF 2.2
const ORGANIZATION_EF2_SEARCH_STRING = "EF 2"
const ORGANIZATION_EF22_SEARCH_STRING = "EF 2.2"
const LEADER_POSITION_TEXT = "EF 2.2 Final Reviewer"
const LEADER_PERSON_TEXT = "CTR BECCABON, Rebecca"
const DEPUTY_POSITION_TEXT = "EF 2.2 Superuser"
const DEPUTY_PERSON_TEXT = "CIV JACOBSON, Jacob"

describe("Show organization page", () => {
  describe("As an admin", () => {
    it("Should first search, find and open the organization page", async() => {
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
    it("Should see leader&deputy fields are not listed", async() => {
      // Organization longName should be there
      const longNameField = await ShowOrganization.getLongName()
      await longNameField.waitForExist()
      await longNameField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await longNameField.isExisting()).to.be.true

      // Organization type should be there
      const typeField = await ShowOrganization.getType()
      await typeField.waitForExist()
      await typeField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await typeField.isExisting()).to.be.true

      // Organization leaders should not be there
      const leaderField = await ShowOrganization.getLeaders()
      // eslint-disable-next-line no-unused-expressions
      expect(await leaderField.isExisting()).to.be.false

      // Organization deputies should not be there
      const deputyField = await ShowOrganization.getDeputies()
      // eslint-disable-next-line no-unused-expressions
      expect(await deputyField.isExisting()).to.be.false

      // Log out
      await ShowOrganization.logout()
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the organization page", async() => {
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
    it("Should see leader&deputy fields are listed", async() => {
      // Organization longName should be there
      const longNameField = await ShowOrganization.getLongName()
      await longNameField.waitForExist()
      await longNameField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await longNameField.isExisting()).to.be.true

      // Organization type should be there
      const typeField = await ShowOrganization.getType()
      await typeField.waitForExist()
      await typeField.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await typeField.isExisting()).to.be.true

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

  describe("When on the show page of an organization with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      await ShowOrganization.open(ORGANIZATION_UUID)
      await (await ShowOrganization.getAttachments()).waitForExist()
      await (await ShowOrganization.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      await (await ShowOrganization.getCard()).waitForExist()
      await (await ShowOrganization.getCard()).waitForDisplayed()
      expect(await ShowOrganization.getFileData()).to.be.equal(
        "attachOrganization"
      )
    })
    it("We can go to the show page of Attachment", async() => {
      await (await ShowOrganization.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/9ac41246-25ac-457c-b7d6-946c5f625f1f"
      )
    })
  })
})
