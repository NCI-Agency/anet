import Page from './page'

const Page_URL = '/people/new'

class CreatePerson extends Page {
    get form()                  { return browser.element('form') }
    get alertSuccess()          { return browser.element('.alert-success') }
    get lastName()              { return browser.element('#lastName') }
    get firstName()             { return browser.element('#firstName') }
    get rolePrincipalButton()   { return browser.element('#rolePrincipalButton') }
    get roleAdvisorButton()     { return browser.element('#roleAdvisorButton') }
    get emailAddress()          { return browser.element('#emailAddress') }
    get phoneNumber()           { return browser.element('#phoneNumber') }
    get rank()                  { return browser.element('select[name="rank"]') }
    get gender()                { return browser.element('select[name="gender"]') }
    get country()               { return browser.element('select[name="country"]') }
    get endOfTourDate()         { return browser.element('#endOfTourDate') }
    get biography()             { return browser.element('.biography .text-editor p') }
    get submitButton()          { return browser.element('#formBottomSubmit') }
    get endOfTourDay()          { return browser.element('.bp3-datepicker-footer button.bp3-button:first-child') }

    openAsSuperUser() {
        super.openAsSuperUser(Page_URL)
    }

    openAsAdmin() {
      super.openAsAdminUser(Page_URL)
    }

    waitForAlertSuccessToLoad() {
        if(!this.alertSuccess.isVisible()) {
            this.alertSuccess.waitForExist()
            this.alertSuccess.waitForVisible()
        }
    }

    submitForm() {
        this.submitButton.click()
    }
}

export default new CreatePerson()
