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

})
