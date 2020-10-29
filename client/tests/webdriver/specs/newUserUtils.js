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
  OnboardPage.createYourAccountBtn.waitForExist()
  OnboardPage.createYourAccountBtn.waitForDisplayed()
  OnboardPage.createYourAccountBtn.click()
  CreatePerson.lastName.setValue(personDetails.lastName)
  CreatePerson.firstName.setValue(personDetails.firstName)
  CreatePerson.emailAddress.setValue(personDetails.emailAddress)
  CreatePerson.rank.selectByAttribute("value", personDetails.rank)
  CreatePerson.gender.selectByAttribute("value", personDetails.gender)
  CreatePerson.country.selectByAttribute("value", personDetails.country)
  CreatePerson.endOfTourDate.setValue(personDetails.endOfTourDate)

  CreatePerson.submitForm()
  Home.onboardingPopover.waitForExist()
  Home.onboardingPopover.waitForDisplayed()
}
