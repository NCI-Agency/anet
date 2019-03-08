import Page from './page'

class EditPosition extends Page {
    get form()                  { return browser.$('form') }
    get typeAdvisorButton()     { return browser.$('#typeAdvisorButton') }
    get typePrincipalButton()   { return browser.$('#typePrincipalButton') }
    get organization()          { return browser.$('#organization') }
    get orgAutocomplete()       { return browser.$('#react-autowhatever-1--item-0') }
    get alertSuccess()          { return browser.$('.alert-success') }
    get cancelButton()          { return browser.$('div.submit-buttons').$('button=Cancel') }
    get submitButton()          { return browser.$('#formBottomSubmit') }

    open() {
        super.openAsSuperUser(`/positions/new`)
    }

    waitForAlertSuccessToLoad() {
        if(!this.alertSuccess.isDisplayed()) {
            this.alertSuccess.waitForExist()
            this.alertSuccess.waitForDisplayed()
        }
    }

    submitForm() {
        this.submitButton.click()
    }
}

export default new EditPosition()
