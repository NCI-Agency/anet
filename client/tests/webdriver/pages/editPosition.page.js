import Page from './page'

const Search_URL = '/api/positions/search?text=MOI-Pol-HQ-00001'
const ADVISOR_ORG = 'EF 2.2 -'

class EditPosition extends Page {
    get form()                  { return browser.element('form') }
    get typeAdvisorButton()     { return browser.element('#typeAdvisorButton') }
    get typePrincipalButton()   { return browser.element('#typePrincipalButton') }
    get organization()          { return browser.element('#organization') }
    get orgAutocomplete()       { return browser.element('#react-autowhatever-1--item-0') }
    get alertSuccess()          { return browser.element('.alert-success') }
    get submitButton()          { return browser.element('#formBottomSubmit') }

    open() {
        browser.url(super._buildUrl(Search_URL, Page.DEFAULT_CREDENTIALS.superUser))
        const searchRaw = browser.getText('pre')
        const searchJson = JSON.parse(searchRaw)
        const uuid = searchJson.list[0].uuid
        super.openAsSuperUser(`/positions/${uuid}/edit`)
    }

    waitForAlertSuccessToLoad() {
        if(!this.alertSuccess.isVisible()) {
            this.alertSuccess.waitForExist()
            this.alertSuccess.waitForVisible()
        }
    }

    waitForOrgAutoCompleteToChange() {
        this.orgAutocomplete.waitForExist()
        return browser.waitUntil( () => {
            return this.orgAutocomplete.getText() === ADVISOR_ORG
          }, 5000, 'Expected autocomplete to contain "' + ADVISOR_ORG +'" after 5s')
    }

    submitForm() {
        this.submitButton.click()
    }
}

export default new EditPosition()
