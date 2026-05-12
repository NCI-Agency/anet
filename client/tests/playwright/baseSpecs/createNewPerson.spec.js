import { expect } from "@playwright/test"
import moment from "moment"
import CreatePerson from "../pages/createNewPerson.page.js"
import { currentPage, test, waitFor } from "../support.js"

const VALID_PERSON_INTERLOCUTOR = {
  familyName: "Doe",
  country: "Denmark"
}
const VALID_PERSON_ADVISOR = {
  familyName: "Roe",
  givenName: "Jane",
  country: "Canada",
  emailAddresses: ["", "test@NATO.INT"]
}
const NOT_SIMILAR_PERSON_ADVISOR = {
  familyName: "XXX",
  givenName: "XXX"
}
const SIMILAR_PERSON_ADVISOR = {
  familyName: "Erinson",
  givenName: "Erin"
}
test.describe("Create new Person form page", () => {
  test.describe("When creating a non-user", () => {
    test.beforeEach("On the create person page…", async () => {
      await CreatePerson.openAsSuperuser()
      await waitFor(await CreatePerson.getForm(), "visible")
    })
    test.afterEach("On the create person page…", async () => {
      await CreatePerson.logout()
    })
    test("Should not save a person without gender being filled in", async () => {
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(VALID_PERSON_INTERLOCUTOR.familyName))
      await (await CreatePerson.getGender()).click()
      await (await CreatePerson.getFamilyName()).click()
      const errorMessage = await currentPage()
        .locator('select[name="gender"] + div.invalid-feedback')
        .first()
      await waitFor(errorMessage, "visible")
      await expect(errorMessage).toHaveText("You must provide the Gender", {
        useInnerText: true
      })
      await (
        await CreatePerson.getGender()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (
        await CreatePerson.getRank()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).fill(String(VALID_PERSON_INTERLOCUTOR.country))
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_INTERLOCUTOR.country
      )
      await expect(
        await CreatePerson.getCountryAdvancedSelectFirstItem()
      ).toContainText(VALID_PERSON_INTERLOCUTOR.country, {
        useInnerText: true
      })
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getCountryHelpBlock(), "attached", {
        reverse: true
      })
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await expect(await CreatePerson.getAlertSuccess()).toHaveText(
        "Person saved",
        { useInnerText: true }
      )
    })
    test("Should save a person without first name", async () => {
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(VALID_PERSON_INTERLOCUTOR.familyName))
      await (
        await CreatePerson.getRank()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).fill(String(VALID_PERSON_INTERLOCUTOR.country))
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_INTERLOCUTOR.country
      )
      await expect(
        await CreatePerson.getCountryAdvancedSelectFirstItem()
      ).toContainText(VALID_PERSON_INTERLOCUTOR.country, {
        useInnerText: true
      })
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getCountryHelpBlock(), "attached", {
        reverse: true
      })
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await expect(await CreatePerson.getAlertSuccess()).toHaveText(
        "Person saved",
        { useInnerText: true }
      )
    })
    test("Should not save a person without a valid email address", async () => {
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(VALID_PERSON_INTERLOCUTOR.familyName))
      await (
        await CreatePerson.getRank()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).fill(String(VALID_PERSON_INTERLOCUTOR.country))
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_INTERLOCUTOR.country
      )
      await expect(
        await CreatePerson.getCountryAdvancedSelectFirstItem()
      ).toContainText(VALID_PERSON_INTERLOCUTOR.country, {
        useInnerText: true
      })
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getCountryHelpBlock(), "attached", {
        reverse: true
      })
      await (await CreatePerson.getEmailAddress(0)).fill("notValidEmail@")
      await (await CreatePerson.getFamilyName()).click()
      const errorMessage = await CreatePerson.getEmailAddressMessage(0)
      await waitFor(errorMessage, "visible")
      await expect(errorMessage).toHaveText("Address must be a valid email", {
        useInnerText: true
      })

      // perform submit form to prevent warning dialog
      await CreatePerson.deleteInput(CreatePerson.getEmailAddress(0))
      await (await CreatePerson.getEmailAddress(0)).fill("test@example.com")
      await (await CreatePerson.getFamilyName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await expect(await CreatePerson.getAlertSuccess()).toHaveText(
        "Person saved",
        { useInnerText: true }
      )
    })
  })
  test.describe("When creating a user", () => {
    test("Should display possible duplicates with similar names", async () => {
      await CreatePerson.openAsAdmin()
      await waitFor(await CreatePerson.getForm(), "visible")
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(SIMILAR_PERSON_ADVISOR.familyName))
      await (
        await CreatePerson.getGivenName()
      ).fill(String(SIMILAR_PERSON_ADVISOR.givenName))
      await (await CreatePerson.getDuplicatesButton()).click()
      await waitFor(await CreatePerson.getModalContent(), "visible")
      await waitFor(await CreatePerson.getSimilarPerson(), "visible")
      await expect(await CreatePerson.getSimilarPerson()).toHaveText(
        "CIV Erin Erinson",
        { useInnerText: true }
      )
      await (await CreatePerson.getModalCloseButton()).click()
      await waitFor(await CreatePerson.getModalContent(), "visible", {
        reverse: true
      })
    })
    test("Should display a warning message specific for duplicate accounts", async () => {
      // Only admin users can create an advisor user
      await CreatePerson.openAsAdmin()
      await waitFor(await CreatePerson.getForm(), "visible")
      await (await CreatePerson.getUserTrueButton()).click()
      await waitFor(await CreatePerson.getAlertWarning(), "attached")
      await waitFor(await CreatePerson.getAlertWarning(), "visible")
      await expect(await CreatePerson.getAlertWarning()).toHaveText(
        "Creating a user in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts you should take action.",
        {
          useInnerText: true
        }
      )
      // Don't logout, next test continues…
    })
    test("Should not save a user without a tenant", async () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(VALID_PERSON_ADVISOR.familyName))
      await (
        await CreatePerson.getGivenName()
      ).fill(String(VALID_PERSON_ADVISOR.givenName))
      await (await CreatePerson.getUserTrueButton()).click()
      await expect(await CreatePerson.getNoTenantWarning()).not.toHaveCount(0)
      for (const [
        index,
        address
      ] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        await CreatePerson.deleteInput(CreatePerson.getEmailAddress(index))
        await (await CreatePerson.getEmailAddress(index)).fill(String(address))
      }
      await (
        await CreatePerson.getRank()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectOption(
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).fill(String(VALID_PERSON_ADVISOR.country))
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_ADVISOR.country
      )
      await expect(
        await CreatePerson.getCountryAdvancedSelectFirstItem()
      ).toContainText(VALID_PERSON_ADVISOR.country, {
        useInnerText: true
      })
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getCountryHelpBlock(), "attached", {
        reverse: true
      })
      await CreatePerson.submitForm()
      await expect(await CreatePerson.getAlertSuccess()).toHaveCount(0)
      await waitFor(await CreatePerson.getTenantsError(), "attached")
      await waitFor(await CreatePerson.getTenantsError(), "visible")
      await expect(await CreatePerson.getTenantsError()).toHaveText(
        "An active user must be a member of at least one active Tenant",
        {
          useInnerText: true
        }
      )
      await (await CreatePerson.getTenantsInput()).scrollIntoViewIfNeeded()
      await (await CreatePerson.getTenantsInput()).click()
      await waitFor(
        await CreatePerson.getTenantsAdvancedSelectFirstItem(),
        "attached"
      )
      await waitFor(
        await CreatePerson.getTenantsAdvancedSelectFirstItem(),
        "visible"
      )
      await (await CreatePerson.getTenantsAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getTenantsError(), "attached", {
        timeout: 1000,
        reverse: true
      })
      await expect(await CreatePerson.getNoTenantWarning()).toHaveCount(0)
      // Don't logout, next test continues…
    })
    test("Should save even if endOfTourDate is not filled in", async () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      await (await CreatePerson.getEndOfTourDate()).fill("")
      await (await CreatePerson.getFamilyName()).click()
      for (const [index] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        const errorMessage = await CreatePerson.getEmailAddressMessage(index)
        // element should *not* be visible!
        await waitFor(errorMessage, "visible", {
          timeout: 1000,
          reverse: true
        })
      }
      // Don't logout, next test continues…
    })
    test("Should save with a valid email address in uppercase", async () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      for (const [
        index,
        address
      ] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        await CreatePerson.deleteInput(CreatePerson.getEmailAddress(index))
        await (await CreatePerson.getEmailAddress(index)).fill(String(address))
      }
      await (await CreatePerson.getFamilyName()).click()
      for (const [index] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        const errorMessage = await CreatePerson.getEmailAddressMessage(index)
        // element should *not* be visible!
        await waitFor(errorMessage, "visible", {
          timeout: 1000,
          reverse: true
        })
      }
      const tomorrow = moment().add(1, "days").format("DD-MM-YYYY")
      await CreatePerson.deleteInput(CreatePerson.getEndOfTourDate())
      await (await CreatePerson.getEndOfTourDate()).fill(String(tomorrow))
      await (await CreatePerson.getFamilyName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await expect(await CreatePerson.getAlertSuccess()).toHaveText(
        "Person saved",
        { useInnerText: true }
      )
      await CreatePerson.logout()
    })
    test("Should not display possible duplicates button", async () => {
      await CreatePerson.openAsAdmin()
      await waitFor(await CreatePerson.getForm(), "visible")
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(NOT_SIMILAR_PERSON_ADVISOR.familyName))
      await (
        await CreatePerson.getGivenName()
      ).fill(String(NOT_SIMILAR_PERSON_ADVISOR.givenName))
      await expect(await CreatePerson.getDuplicatesButton()).toHaveCount(0)
    })
  })
})
