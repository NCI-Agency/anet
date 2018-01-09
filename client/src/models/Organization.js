import Model from 'components/Model'
import dict from 'dictionary'

export default class Organization extends Model {
	static resourceName = 'Organization'
	static listName = 'organizationList'

	static schema = {
		shortName: '',
		longName: '',
		identificationCode: null,
		type: '',
		parentOrg: null,
		childrenOrgs: [],
		approvalSteps: [],
		positions: [],
		tasks: []
	}

	isAdvisorOrg() {
		return this.type === 'ADVISOR_ORG'
	}

	humanNameOfType() {
		const dictFields = dict.lookup('fields')

		if (this.type === 'PRINCIPAL_ORG') {
			return dictFields ? dictFields.PRINCIPAL_ORG.name : ''
		} else {
			return dictFields ? dictFields.ADVISOR_ORG.name : ''
		}
	}

	toString() {
		return this.shortName || this.longName || this.identificationCode
	}
}
