import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowOrganization from "../pages/showOrganization.page"

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
    })
  })
})