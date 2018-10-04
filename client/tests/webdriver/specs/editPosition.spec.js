import EditPosition from '../pages/editPosition.page'
import { expect } from 'chai'

const ADVISOR_ORG = 'EF 2.2'
const PRINCIPAL_ORG = 'MoI'

describe('Edit position page', () => {

  beforeEach('Open the edit position page', () => {
    EditPosition.open()
    EditPosition.form.waitForExist()
    EditPosition.form.waitForVisible()
  })

  describe('When changing the position type from principal to advisor, saving, and putting back', () => {
    it('Should update the position type to advisor and back to principal', () => {
        EditPosition.typeAdvisorButton.waitForVisible()
        expect(EditPosition.typeAdvisorButton.getAttribute('class')).to.not.include('active')
        expect(EditPosition.typePrincipalButton.getAttribute('class')).to.include('active')
        const principalOrg = EditPosition.organization.getValue()
        expect(principalOrg).to.not.equal('')
        EditPosition.typeAdvisorButton.click()
        expect(EditPosition.organization.getValue()).to.equal('')

        EditPosition.organization.setValue(principalOrg)
        EditPosition.orgAutocomplete.waitForExist()
        expect(EditPosition.orgAutocomplete.getText()).to.include('No suggestions found')
        EditPosition.orgAutocomplete.click()
        expect(EditPosition.organization.getValue()).to.equal('')

        EditPosition.organization.setValue(ADVISOR_ORG)
        EditPosition.waitForOrgAutoCompleteToChange()
        expect(EditPosition.orgAutocomplete.getText()).to.include(ADVISOR_ORG)
        EditPosition.orgAutocomplete.click()
        expect(EditPosition.organization.getValue()).to.equal(ADVISOR_ORG)

        EditPosition.submitForm()
        EditPosition.waitForAlertSuccessToLoad()
        const alertMessage = EditPosition.alertSuccess.getText()
        expect(alertMessage).to.equal('Position saved')

        EditPosition.open()
        EditPosition.form.waitForExist()
        EditPosition.form.waitForVisible()
        EditPosition.typeAdvisorButton.waitForVisible()
        expect(EditPosition.typeAdvisorButton.getAttribute('class')).to.include('active')
        EditPosition.typePrincipalButton.waitForVisible()
        expect(EditPosition.typePrincipalButton.getAttribute('class')).to.not.include('active')
        expect(EditPosition.organization.getValue()).to.equal(ADVISOR_ORG)

        // clean up database by restoring advisor role to principal
        EditPosition.typePrincipalButton.click()
        EditPosition.organization.setValue(principalOrg)
        EditPosition.orgAutocomplete.waitForExist()
        expect(EditPosition.orgAutocomplete.getText()).to.include(principalOrg)
        EditPosition.orgAutocomplete.click()
        EditPosition.submitForm()
        EditPosition.waitForAlertSuccessToLoad()
        expect(EditPosition.alertSuccess.getText()).to.equal('Position saved')
    })
  })

})
