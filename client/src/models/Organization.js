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
		poams: []
	}

	isAdvisorOrg() {
		return this.type === 'ADVISOR_ORG'
	}

	humanNameOfType() {
		if (this.type === 'PRINCIPAL_ORG') {
			return dict.lookup('PRINCIPAL_ORG_NAME')
		} else {
			return dict.lookup('ADVISOR_ORG_NAME')
		}
	}

	toString() {
		return this.shortName || this.longName || this.identificationCode
	}
}
