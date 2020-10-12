import moment from "moment"
import CreatePerson from "../pages/createNewPerson.page"
import Home from "../pages/home.page"
import OnboardPage from "../pages/onboard.page"

// Only required fields in onboarding/Edit page
// No lastName, status, role
export const examplePersonDetails = {
  firstName: "Bonnie",
  emailAddress: "bonny@cmil.mil",
  rank: "CIV",
  gender: "FEMALE",
  country: "Albania",
  endOfTourDate: ""
}
// need uniqueName due to saving previous ones as normal user
export function createOnboardingNewPerson(personDetails, uniqueName) {
  OnboardPage.openAsOnboardUser("/", uniqueName)

  OnboardPage.createYourAccountBtn.waitForExist()
  OnboardPage.createYourAccountBtn.waitForDisplayed()
  OnboardPage.createYourAccountBtn.click()
  CreatePerson.firstName.setValue(personDetails.firstName)
  CreatePerson.emailAddress.setValue(personDetails.emailAddress)
  CreatePerson.rank.selectByAttribute("value", personDetails.rank)
  CreatePerson.gender.selectByAttribute("value", personDetails.gender)
  CreatePerson.country.selectByAttribute("value", personDetails.country)
  const tomorrow = moment().add(1, "days").format("DD-MM-YYYY")
  CreatePerson.endOfTourDate.setValue(tomorrow)

  CreatePerson.submitForm()
  Home.onboardingPopover.waitForExist()
  Home.onboardingPopover.waitForDisplayed()
}
