import React from 'react'

import Model from 'components/Model'
import Settings from 'Settings'

export default class Organization extends Model {
	static resourceName = 'Organization'
	static listName = 'organizationList'
	static getInstanceName = 'organization'
	static searchObjectType= 'Organizations'

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static TYPE = {
		ADVISOR_ORG: 'ADVISOR_ORG',
		PRINCIPAL_ORG: 'PRINCIPAL_ORG'
	}

	static schema = {
		shortName: '',
		longName: '',
		get status() { return Organization.STATUS.ACTIVE },
		identificationCode: null,
		type: '',
		parentOrg: null,
		childrenOrgs: [],
		approvalSteps: [],
		positions: [],
		tasks: [],
		...Model.schema,
	}

	static autocompleteQuery = "uuid, shortName, longName, identificationCode"

	isAdvisorOrg() {
		return this.type === Organization.TYPE.ADVISOR_ORG
	}

	isTaskEnabled() {
		return !Settings.tasking_ORGs || Settings.tasking_ORGs.includes(this.shortName)
	}

	static humanNameOfType(type) {

		if (type === Organization.TYPE.PRINCIPAL_ORG) {
			return Settings.fields.principal.org.name
		}
		else {
			return Settings.fields.advisor.org.name
		} // TODO do not assume that if not of type TYPE.PRINCIPAL_ORG it is an advisor
	}

	humanNameOfType(type) {
		return Organization.humanNameOfType(this.type)
	}

	toString() {
		return this.shortName || this.longName || this.identificationCode
	}
}
