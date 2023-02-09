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
export function createOnboardingNewPerson(
  personDetails = examplePersonDetails
) {
  OnboardPage.getCreateYourAccountBtn().waitForExist()
  OnboardPage.getCreateYourAccountBtn().waitForDisplayed()
  OnboardPage.getCreateYourAccountBtn().click()
  CreatePerson.getLastName().setValue(personDetails.lastName)
  CreatePerson.getFirstName().setValue(personDetails.firstName)
  CreatePerson.getEmailAddress().setValue(personDetails.emailAddress)
  CreatePerson.getRank().selectByAttribute("value", personDetails.rank)
  CreatePerson.getGender().selectByAttribute("value", personDetails.gender)
  CreatePerson.getCountry().selectByAttribute("value", personDetails.country)
  CreatePerson.getEndOfTourDate().setValue(personDetails.endOfTourDate)

  CreatePerson.submitForm()
  Home.waitForAlertWarningToLoad()
  Home.getOnboardingPopover().waitForExist()
  Home.getOnboardingPopover().waitForDisplayed()
}
