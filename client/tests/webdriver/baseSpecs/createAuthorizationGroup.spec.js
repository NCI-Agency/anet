import { expect } from "chai"
import { v4 as uuidv4 } from "uuid"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page"

const AUTHORIZATION_GROUP_NAME_PREFIX = "test community"
const AUTHORIZATION_GROUP_DESCRIPTION_PREFIX = "this is just a"
let authorizationGroupName
let authorizationGroupDescription

const POSITION = "anet"
const POSITION_COMPLETE = "ANET Administrator"
const ORGANIZATION = "moi"
const ORGANIZATION_COMPLETE = "MoI | Ministry of Interior"
const PERSON = "jacob"
const PERSON_COMPLETE = "CIV JACOBSON, Jacob"
const ADMINISTRATIVE_POSITION_1 = "rebecca"
const ADMINISTRATIVE_POSITION_1_COMPLETE = "EF 2.2 Final Reviewer"
const ADMINISTRATIVE_POSITION_2 = "jacob"
const ADMINISTRATIVE_POSITION_2_COMPLETE = "EF 2.2 Superuser"
const POSITION2 = "jack"
const POSITION2_COMPLETE = "EF 2.1 Advisor B"

const SHORT_WAIT_MS = 200

describe("When creating/editing a community", () => {
  describe("When creating a community as admin", () => {
    it("Should navigate to the create community page", async() => {
      await CreateAuthorizationGroup.open()
      await (await CreateAuthorizationGroup.getForm()).waitForExist()
      await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()
    })
    it("Should save a community with only a name and description", async() => {
      authorizationGroupName = `${AUTHORIZATION_GROUP_NAME_PREFIX} ${uuidv4()}`
      authorizationGroupDescription = `${AUTHORIZATION_GROUP_DESCRIPTION_PREFIX} ${authorizationGroupName}`
      await (await CreateAuthorizationGroup.getName()).waitForDisplayed()
      await (
        await CreateAuthorizationGroup.getName()
      ).setValue(authorizationGroupName)
      await (
        await CreateAuthorizationGroup.getDescription()
      ).setValue(authorizationGroupDescription)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTable()
        ).isExisting()
      ).to.be.false
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTable()
        ).isExisting()
      ).to.be.false
      await (
        await CreateAuthorizationGroup.getStatusActiveButton()
      ).waitForDisplayed()
      expect(
        await (await CreateAuthorizationGroup.getStatusActiveInput()).getValue()
      ).to.be.equal("ACTIVE")
      await (
        await CreateAuthorizationGroup.getStatusInactiveButton()
      ).waitForDisplayed()
      expect(
        await (
          await CreateAuthorizationGroup.getStatusInactiveInput()
        ).getValue()
      ).to.not.equal("ACTIVE")
      await (await CreateAuthorizationGroup.getStatusInactiveButton()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Community saved")
    })
    it("Should save the community with some members", async() => {
      await (await CreateAuthorizationGroup.getEditButton()).waitForExist()
      await (await CreateAuthorizationGroup.getEditButton()).waitForDisplayed()
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await (await CreateAuthorizationGroup.getForm()).waitForExist()
      await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()
      await (await CreateAuthorizationGroup.getRelatedObjectsInput()).click()

      // Add a position
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).setValue(POSITION)
      await CreateAuthorizationGroup.waitForAdvancedSelectToChange(
        POSITION_COMPLETE,
        CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(POSITION_COMPLETE)
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // The position is added to a table underneath, so relatedObjects table exists now
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTable()
        ).isExisting()
      ).to.be.true
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            POSITION_COMPLETE
          )
        ).isExisting()
      ).to.be.true

      // Add an organization
      await (
        await CreateAuthorizationGroup.getMemberTypeButton("Organizations")
      ).click()
      await CreateAuthorizationGroup.deleteInput(
        CreateAuthorizationGroup.getRelatedObjectsInput()
      )
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).setValue(ORGANIZATION)
      await CreateAuthorizationGroup.waitForAdvancedSelectToChange(
        ORGANIZATION_COMPLETE,
        CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(ORGANIZATION_COMPLETE)
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            ORGANIZATION_COMPLETE
          )
        ).isExisting()
      ).to.be.true

      // Add a person
      await (
        await CreateAuthorizationGroup.getMemberTypeButton("People")
      ).click()
      await CreateAuthorizationGroup.deleteInput(
        CreateAuthorizationGroup.getRelatedObjectsInput()
      )
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).setValue(PERSON)
      await CreateAuthorizationGroup.waitForAdvancedSelectToChange(
        PERSON_COMPLETE,
        CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(PERSON_COMPLETE)
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            PERSON_COMPLETE
          )
        ).isExisting()
      ).to.be.true

      // Click outside the overlay
      await (await CreateAuthorizationGroup.getName()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Community saved")
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            POSITION_COMPLETE
          )
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            ORGANIZATION_COMPLETE
          )
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            PERSON_COMPLETE
          )
        ).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
    })
    it("Should save the community with assigned superusers", async() => {
      await (await CreateAuthorizationGroup.getEditButton()).waitForExist()
      await (await CreateAuthorizationGroup.getEditButton()).waitForDisplayed()
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await (await CreateAuthorizationGroup.getForm()).waitForExist()
      await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).click()

      // Add a position
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).setValue(ADMINISTRATIVE_POSITION_1)
      await CreateAuthorizationGroup.waitForAdvancedSelectToChange(
        ADMINISTRATIVE_POSITION_1_COMPLETE,
        CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(ADMINISTRATIVE_POSITION_1_COMPLETE)
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
      ).click()
      // The position is added to a table underneath, so administrativePositions table exists now
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTable()
        ).isExisting()
      ).to.be.true
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
            ADMINISTRATIVE_POSITION_1_COMPLETE
          )
        ).isExisting()
      ).to.be.true

      // Add another position
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).setValue(ADMINISTRATIVE_POSITION_2)
      await CreateAuthorizationGroup.waitForAdvancedSelectToChange(
        ADMINISTRATIVE_POSITION_2_COMPLETE,
        CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(ADMINISTRATIVE_POSITION_2_COMPLETE)
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
      ).click()
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
            ADMINISTRATIVE_POSITION_2_COMPLETE
          )
        ).isExisting()
      ).to.be.true

      // Click outside the overlay
      await (await CreateAuthorizationGroup.getName()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Community saved")
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
            ADMINISTRATIVE_POSITION_1_COMPLETE
          )
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
            ADMINISTRATIVE_POSITION_2_COMPLETE
          )
        ).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
    })
    it("Should logout again", async() => {
      await CreateAuthorizationGroup.logout()
    })
  })

  describe("When editing a community as assigned superuser", () => {
    it("Should navigate to the my communities page", async() => {
      await CreateAuthorizationGroup.openAsSuperuser("/communities/mine")
      await (
        await CreateAuthorizationGroup.getMyAuthorizationGroups()
      ).waitForExist()
      await (
        await CreateAuthorizationGroup.getMyAuthorizationGroups()
      ).waitForDisplayed()
      await (
        await CreateAuthorizationGroup.getAuthorizationGroupLink(
          authorizationGroupName
        )
      ).click()
    })
    it("Should be able to save the community with a changed name and description", async() => {
      await (await CreateAuthorizationGroup.getEditButton()).waitForExist()
      await (await CreateAuthorizationGroup.getEditButton()).waitForDisplayed()
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await (await CreateAuthorizationGroup.getForm()).waitForExist()
      await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()
      await (await CreateAuthorizationGroup.getName()).setValue("-edited")
      await (
        await CreateAuthorizationGroup.getDescription()
      ).setValue("-edited")
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Community saved")
      expect(
        await (await CreateAuthorizationGroup.getNameDisplay()).getText()
      ).to.equal(`Community ${authorizationGroupName}-edited`)
      expect(
        await (await CreateAuthorizationGroup.getDescription()).getText()
      ).to.equal(`${authorizationGroupDescription}-edited`)
    })
    it("Should not be able to change the community's assigned superusers", async() => {
      await (await CreateAuthorizationGroup.getEditButton()).waitForExist()
      await (await CreateAuthorizationGroup.getEditButton()).waitForDisplayed()
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await (await CreateAuthorizationGroup.getForm()).waitForExist()
      await (await CreateAuthorizationGroup.getForm()).waitForDisplayed()

      // Should not be able to add administrative positions
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsInput()
        ).isExisting()
      ).to.be.false
      // Should not be able to remove administrative positions
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await (
            await CreateAuthorizationGroup.getAdministrativePositionsTable()
          ).$("button")
        ).isExisting()
      ).to.be.false
    })
    it("Should be able to save the community with changed members", async() => {
      // Add a position
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).setValue(POSITION2)
      await CreateAuthorizationGroup.waitForAdvancedSelectToChange(
        POSITION2_COMPLETE,
        CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(POSITION2_COMPLETE)
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            POSITION2_COMPLETE
          )
        ).isExisting()
      ).to.be.true

      // Remove a position
      const adminPosition =
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION_COMPLETE
        )
      await (await adminPosition.$("../../../td/button")).click()
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            POSITION_COMPLETE
          )
        ).isExisting()
      ).to.be.false

      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreateAuthorizationGroup.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Community saved")
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            POSITION2_COMPLETE
          )
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
            POSITION_COMPLETE
          )
        ).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
    })
    it("Should logout again", async() => {
      await CreateAuthorizationGroup.logout()
    })
  })
})
