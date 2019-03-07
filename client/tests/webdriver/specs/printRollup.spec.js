import Rollup from '../pages/rollup.page'
import { expect } from 'chai'

describe('Print rollup page', () => {

	beforeEach('Open the rollup page', () => {
		Rollup.open()
	})

	describe('When clicking the print button, the daily rollup should be generated', () => {
		it('Should show the correct header for the rollup', () => {
			Rollup.printButton.waitForVisible(5000)
			Rollup.printButton.click()

			const handles = browser.windowHandles().value
			const switchHandle = handles.pop()
			browser.switchTab(switchHandle)

			const rollupClassification = 'p:nth-of-type(1) i'
			browser.waitForText(rollupClassification, 3000)
			const title = browser.getText(rollupClassification)
			
			expect(title).to.equal("Classification: DEMO USE ONLY")
		})
	})

})
