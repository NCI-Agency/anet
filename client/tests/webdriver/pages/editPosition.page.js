import Page from './page'

class EditPosition extends Page {
    get form()                  { return browser.element('form') }
    get typeAdvisorButton()     { return browser.element('#typeAdvisorButton') }
    get typePrincipalButton()   { return browser.element('#typePrincipalButton') }
    get organization()          { return browser.element('#organization') }
    get orgAutocomplete()       { return browser.element('#react-autowhatever-1--item-0') }
    get alertSuccess()          { return browser.element('.alert-success') }
    get cancelButton()          { return browser.element('div.submit-buttons').element('button=Cancel') }
    get submitButton()          { return browser.element('#formBottomSubmit') }

    open() {
        super.openAsSuperUser(`/positions/new`)
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
