import Home from '../pages/home.page'
import CreatePerson from '../pages/createNewPerson.page'

import { expect } from 'chai'

describe('Anet user login', () => {
	it('Default user Erin is logged in"', () => {
		Home.open()
		Home.securityBanner.waitForExist()
		Home.securityBanner.waitForVisible()
		const securityText = Home.securityBanner.getText()
		expect(securityText).to.equal('DEMO USE ONLY || ERINSON, Erin (edit)')
	})

	it('Super user Arthur is logged in"', () => {
		Home.openAsSuperUser()
		Home.securityBanner.waitForExist()
		Home.securityBanner.waitForVisible()
		const securityText = Home.securityBanner.getText()
		expect(securityText).to.equal('DEMO USE ONLY || DMIN, Arthur (edit)')
	})

	it('Super user Arthur is logged in"', () => {
		Home.openAsSuperUser()
		Home.searchBar.waitForExist()
		Home.searchBar.waitForVisible()
		Home.searchBar.setValue('report')
		Home.submitSearch.click()
		// const securityText = Home.searchBar.getText()
		// expect(securityText).to.equal('DEMO USE ONLY || DMIN, Arthur (edit)')
	})
	describe('When creating a Principle user', () => {
		beforeEach('On the create a new user page...', () => {
			CreatePerson.open()
			CreatePerson.waitForFormToLoad()
		})
		it('Should save a principle with only a last name', () => {
			CreatePerson.lastName.setValue('valid last name')
			CreatePerson.submitForm()
			CreatePerson.waitForAlertSuccessToLoad()
			const alertMessage = CreatePerson.alertSuccess.getText()
			expect(alertMessage).to.equal('Person saved successfully')
		})
		it('Should not save a principle without a valid email address', () => {
			CreatePerson.lastName.setValue("VALID_PERSON_PRINCIPAL.lastName")
			CreatePerson.emailAddress.setValue('notValidEmail@')
			CreatePerson.submitForm()
			const errorMessage = browser.element('input#emailAddress + span.help-block')
			errorMessage.waitForExist(5000)
			errorMessage.waitForVisible()
			expect(errorMessage.getText()).to.equal('Valid email address is required')

			// perform submit form to prevent warning dialog
			CreatePerson.emailAddress.clearElement()
			CreatePerson.emailAddress.setValue('valid@example.com')
			CreatePerson.submitForm()
			CreatePerson.waitForAlertSuccess()
			const alertMessage = CreatePerson.alertSuccess.getText()
			expect(alertMessage).to.equal('Person saved successfully')
		})
	})

})
