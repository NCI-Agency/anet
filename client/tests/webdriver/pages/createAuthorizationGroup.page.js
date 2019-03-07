import Page from './page'

const Page_URL = '/admin/authorizationGroups/new'

class CreateAuthorizationGroup extends Page {
    get form()                   { return browser.$('form') }
    get alertSuccess()           { return browser.$('.alert-success') }
    get name()                   { return browser.$('#name') }
    get description()            { return browser.$('#description') }
    get statusActiveButton()     { return browser.$('#statusActiveButton') }
    get statusInactiveButton()   { return browser.$('#statusInactiveButton') }
    get positions()              { return browser.$('#positions') }
    get positionsAutocomplete()  { return browser.$('#react-autowhatever-1--item-0') }
    get submitButton()           { return browser.$('#formBottomSubmit') }

    open() {
        // Only admin users can create authorization groups
        super.openAsAdminUser(Page_URL)
    }

    waitForAlertSuccessToLoad() {
        if(!this.alertSuccess.isDisplayed()) {
            this.alertSuccess.waitForExist()
            this.alertSuccess.waitForDisplayed()
        }
    }

    waitForPositionsAutoCompleteToChange(value) {
      this.positionsAutocomplete.waitForExist()
      return browser.waitUntil( () => {
          return this.positionsAutocomplete.getText() === value
        }, 5000, 'Expected autocomplete to contain "' + value +'" after 5s')
  }

    submitForm() {
        this.submitButton.click()
    }
}

export default new CreateAuthorizationGroup()
