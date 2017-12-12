import Page from './page'

// TODO: do not use a hard coded url, but search the position by name or by type
const Page_URL = '/positions/39/edit'

class EditPosition extends Page {
    get form()                  { return browser.element('form') }
    get typeAdvisorButton()     { return browser.element('#typeAdvisorButton') }
    get typePrincipalButton()   { return browser.element('#typePrincipalButton') }
    get organization()          { return browser.element('#organization') }
    get organizationAutocomplete()          { return browser.element('#react-autowhatever-1--item-0') }
    get alertSuccess()          { return browser.element('.alert-success') }
    get submitButton()          { return browser.element('form .form-top-submit > button[type="submit"]') }

    open() {
        super.openAsSuperUser(Page_URL)
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

export default new EditPosition()
