import { expect, test } from "@playwright/test"
import moment from "moment"
import CreatePersonPageObject from "../pages/createNewPerson.page.js"

test.describe(() => {
  let page, CreatePerson
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    CreatePerson = new CreatePersonPageObject(page)
  })
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
  test("Create new Person form page", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 8)

    await test.step("When creating a non-user", async () => {
      const beforeStep1 = async () => {
        await CreatePerson.openAsSuperuser()
        await (
          await CreatePerson.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      }
      const afterStep2 = async () => {
        await CreatePerson.logout()
      }
      await test.step(
        "Should not save a person without gender being filled in",
        async () => {
          try {
            await test.step("On the create person page…", beforeStep1)

            await (
              await CreatePerson.getFamilyName()
            ).fill(String(VALID_PERSON_INTERLOCUTOR.familyName))
            await (await CreatePerson.getGender()).click()
            await (await CreatePerson.getFamilyName()).click()
            const errorMessage = await page
              .locator('select[name="gender"] + div.invalid-feedback')
              .first()
            await errorMessage.waitFor({
              state: "visible",
              timeout: 10000
            })
            await expect(errorMessage).toHaveText(
              "You must provide the Gender",
              {
                useInnerText: true
              }
            )
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
            await (
              await CreatePerson.getCountryAdvancedSelectFirstItem()
            ).click()
            await (
              await CreatePerson.getCountryHelpBlock()
            ).waitFor({
              state: "detached",
              timeout: 10000
            })
            await CreatePerson.submitForm()
            await CreatePerson.waitForAlertSuccessToLoad()
            await expect(await CreatePerson.getAlertSuccess()).toHaveText(
              "Person saved",
              {
                useInnerText: true
              }
            )
          } finally {
            await test.step("On the create person page…", afterStep2)
          }
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should save a person without first name",
        async () => {
          try {
            await test.step("On the create person page…", beforeStep1)

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
            await (
              await CreatePerson.getCountryAdvancedSelectFirstItem()
            ).click()
            await (
              await CreatePerson.getCountryHelpBlock()
            ).waitFor({
              state: "detached",
              timeout: 10000
            })
            await CreatePerson.submitForm()
            await CreatePerson.waitForAlertSuccessToLoad()
            await expect(await CreatePerson.getAlertSuccess()).toHaveText(
              "Person saved",
              {
                useInnerText: true
              }
            )
          } finally {
            await test.step("On the create person page…", afterStep2)
          }
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not save a person without a valid email address",
        async () => {
          try {
            await test.step("On the create person page…", beforeStep1)

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
            await (
              await CreatePerson.getCountryAdvancedSelectFirstItem()
            ).click()
            await (
              await CreatePerson.getCountryHelpBlock()
            ).waitFor({
              state: "detached",
              timeout: 10000
            })
            await (await CreatePerson.getEmailAddress(0)).fill("notValidEmail@")
            await (await CreatePerson.getFamilyName()).click()
            const errorMessage = await CreatePerson.getEmailAddressMessage(0)
            await errorMessage.waitFor({
              state: "visible",
              timeout: 10000
            })
            await expect(errorMessage).toHaveText(
              "Address must be a valid email",
              {
                useInnerText: true
              }
            )

            // perform submit form to prevent warning dialog
            await CreatePerson.deleteInput(CreatePerson.getEmailAddress(0))
            await (
              await CreatePerson.getEmailAddress(0)
            ).fill("test@example.com")
            await (await CreatePerson.getFamilyName()).click()
            await CreatePerson.submitForm()
            await CreatePerson.waitForAlertSuccessToLoad()
            await expect(await CreatePerson.getAlertSuccess()).toHaveText(
              "Person saved",
              {
                useInnerText: true
              }
            )
          } finally {
            await test.step("On the create person page…", afterStep2)
          }
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When creating a user", async () => {
      await test.step(
        "Should display possible duplicates with similar names",
        async () => {
          await CreatePerson.openAsAdmin()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreatePerson.getFamilyName()
          ).fill(String(SIMILAR_PERSON_ADVISOR.familyName))
          await (
            await CreatePerson.getGivenName()
          ).fill(String(SIMILAR_PERSON_ADVISOR.givenName))
          await (await CreatePerson.getDuplicatesButton()).click()
          await (
            await CreatePerson.getModalContent()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreatePerson.getSimilarPerson()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(await CreatePerson.getSimilarPerson()).toHaveText(
            "CIV Erin Erinson",
            {
              useInnerText: true
            }
          )
          await (await CreatePerson.getModalCloseButton()).click()
          await (
            await CreatePerson.getModalContent()
          ).waitFor({
            state: "hidden",
            timeout: 10000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should display a warning message specific for duplicate accounts",
        async () => {
          // Only admin users can create an advisor user
          await CreatePerson.openAsAdmin()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (await CreatePerson.getUserTrueButton()).click()
          const warningMessage = await page
            .locator(".alert.alert-warning")
            .first()
          await warningMessage.waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(warningMessage).toHaveText(
            "Creating a user in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts you should take action.",
            {
              useInnerText: true
            }
          )
          // Don't logout, next step continues…
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should save even if endOfTourDate is not filled in",
        async () => {
          // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
          await (
            await CreatePerson.getFamilyName()
          ).fill(String(VALID_PERSON_ADVISOR.familyName))
          await (
            await CreatePerson.getGivenName()
          ).fill(String(VALID_PERSON_ADVISOR.givenName))
          await (await CreatePerson.getUserTrueButton()).click()
          for (const [
            index,
            address
          ] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
            await CreatePerson.deleteInput(CreatePerson.getEmailAddress(index))
            await (
              await CreatePerson.getEmailAddress(index)
            ).fill(String(address))
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
          await (
            await CreatePerson.getCountryHelpBlock()
          ).waitFor({
            state: "detached",
            timeout: 10000
          })
          await (await CreatePerson.getEndOfTourDate()).fill("")
          await (await CreatePerson.getFamilyName()).click()
          for (const [index] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
            const errorMessage =
              await CreatePerson.getEmailAddressMessage(index)
            // element should *not* be visible!
            await errorMessage.waitFor({
              state: "hidden",
              timeout: 1000
            })
          }
          // Don't logout, next step continues…
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should save with a valid email address in uppercase",
        async () => {
          // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
          for (const [
            index,
            address
          ] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
            await CreatePerson.deleteInput(CreatePerson.getEmailAddress(index))
            await (
              await CreatePerson.getEmailAddress(index)
            ).fill(String(address))
          }
          await (await CreatePerson.getFamilyName()).click()
          for (const [index] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
            const errorMessage =
              await CreatePerson.getEmailAddressMessage(index)
            // element should *not* be visible!
            await errorMessage.waitFor({
              state: "hidden",
              timeout: 1000
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
            {
              useInnerText: true
            }
          )
          await CreatePerson.logout()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not display possible duplicates button",
        async () => {
          await CreatePerson.openAsAdmin()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreatePerson.getFamilyName()
          ).fill(String(NOT_SIMILAR_PERSON_ADVISOR.familyName))
          await (
            await CreatePerson.getGivenName()
          ).fill(String(NOT_SIMILAR_PERSON_ADVISOR.givenName))
          await expect(await CreatePerson.getDuplicatesButton()).toHaveCount(0)
        },
        { timeout: stepTimeout }
      )
    })
  })
})
