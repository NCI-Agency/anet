import Rollup from '../pages/rollup.page'
import { expect } from 'chai'

describe('Print rollup page', () => {

	beforeEach('Open the rollup page', () => {
		Rollup.open()
	})

	describe('When clicking the print button, the daily rollup should be generated', () => {
		it('Should show the correct header for the rollup', () => {
			Rollup.printButton.waitForDisplayed(5000)
			Rollup.printButton.click()

			const handles = browser.getWindowHandles()
			const switchHandle = handles.pop()
			browser.switchToWindow(switchHandle)

			browser.waitUntil(() => {
				return $('p:nth-of-type(1) i').getText() === "Classification: DEMO USE ONLY"
			}, 3000, 'Expected classification')
		})
	})

})
