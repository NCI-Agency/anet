import Page from './page'

// TODO: do not use a hard coded url, but search the position by name or by type
const Page_URL = '/positions/39/edit'
const ADVISOR_ORG = 'EF 2.2 -'

class EditPosition extends Page {
    get form()                  { return browser.element('form') }
    get typeAdvisorButton()     { return browser.element('#typeAdvisorButton') }
    get typePrincipalButton()   { return browser.element('#typePrincipalButton') }
    get organization()          { return browser.element('#organization') }
    get orgAutocomplete()       { return browser.element('#react-autowhatever-1--item-0') }
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

    waitForOrgAutoCompleteToChange() {
        return browser.waitUntil( () => {
            return this.orgAutocomplete.getText() ===  ADVISOR_ORG
          }, 5000, 'Expected autocomplete to containt the advisor org after 5s')
    }

    submitForm() {
        this.submitButton.click()
    }
}

export default new EditPosition()
