import Page from './page'

class CreatePerson extends Page {
    get form() { return browser.element('form') }
    get alert() { return browser.element('.alert') }
    get lastName() { return browser.element('#lastName') }
    get firstName() { return browser.element('#firstName') }
    get roleButton() { return browser.element('#rolePrincipalButton') }
    get emailAddress() { return browser.element('#emailAddress') }
    get phoneNumber() { return browser.element('#phoneNumber') }
    get rank() { return browser.element('#rank') }
    get gender() { return browser.element('#gender') }
    get country() { return browser.element('#country') }
    get endOfTourDate() { return browser.element('#endOfTourDate') }
    get biography() { return browser.element('.biography .text-editor p') }
    get submitButton() { return browser.element('.form-top-submit > button[type="submit"]') }


    open() {
        super.open('/people/new')
    }

    waitForFormToLoad() {
        if(!this.form.isVisible())  {
            this.form.waitForVisible()
        }
    }

    submit(user) {
        this.waitForFormToLoad()
        this.lastName.setValue(user.lastName)
        this.firstName.setValue(user.firstName)
        this.submitButton.click()
    }
}

export default new CreatePerson()
