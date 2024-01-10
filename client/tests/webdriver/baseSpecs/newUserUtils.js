import moment from "moment"
import CreatePerson from "../pages/createNewPerson.page"
import Home from "../pages/home.page"
import OnboardPage from "../pages/onboard.page"

// Only required fields in onboarding/edit page
export const examplePersonDetails = {
  lastName: "BONNSDOTTIR",
  firstName: "Bonnie",
  emailAddress: "bonny@cmil.mil",
  rank: "CIV",
  gender: "FEMALE",
  country: "Albania",
  endOfTourDate: moment().add(1, "days").format("DD-MM-YYYY")
}

// need uniqueName to run tests without resetting DB
// because previous names are saved as normal user
export async function createOnboardingNewPerson(
  personDetails = examplePersonDetails
) {
  await (await OnboardPage.getCreateYourAccountBtn()).waitForExist()
  await (await OnboardPage.getCreateYourAccountBtn()).waitForDisplayed()
  await (await OnboardPage.getCreateYourAccountBtn()).click()
  await (await CreatePerson.getLastName()).setValue(personDetails.lastName)
  await (await CreatePerson.getFirstName()).setValue(personDetails.firstName)
  await (
    await CreatePerson.getEmailAddress()
  ).setValue(personDetails.emailAddress)
  await (
    await CreatePerson.getRank()
  ).selectByAttribute("value", personDetails.rank)
  await (
    await CreatePerson.getGender()
  ).selectByAttribute("value", personDetails.gender)
  await (
    await CreatePerson.getCountry()
  ).selectByAttribute("value", personDetails.country)
  await (
    await CreatePerson.getEndOfTourDate()
  ).setValue(personDetails.endOfTourDate)

  await CreatePerson.submitForm()
  await Home.waitForAlertWarningToLoad()
}
