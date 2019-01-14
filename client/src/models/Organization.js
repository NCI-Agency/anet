import React from 'react'

import Model from 'components/Model'
import utils from 'utils'
import Settings from 'Settings'

import * as yup from 'yup'

import ORGANIZATIONS_ICON from 'resources/organizations.png'

export default class Organization extends Model {
	static resourceName = 'Organization'
	static listName = 'organizationList'
	static getInstanceName = 'organization'
	static getModelNameLinkTo = 'organization'

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static TYPE = {
		ADVISOR_ORG: 'ADVISOR_ORG',
		PRINCIPAL_ORG: 'PRINCIPAL_ORG'
	}

	static yupSchema = yup.object().shape({
		shortName: yup.string().required().default('')
			.label(Settings.fields.organization.shortName),
		longName: yup.string().nullable().default(''),
		status: yup.string().required().default(() => Organization.STATUS.ACTIVE),
		identificationCode: yup.string().nullable().default(''),
		type: yup.string().required().default(() => Organization.TYPE.ADVISOR_ORG),
		parentOrg: yup.object().nullable().default({})
			.label(Settings.fields.organization.parentOrg),
		childrenOrgs: yup.array().nullable().default([]),
		approvalSteps: yup.array().of(yup.object().shape({
			name: yup.string().required().default(''),
			approvers: yup.array().required().default([]),
		})).nullable().default([]),
		positions: yup.array().nullable().default([]),
		tasks: yup.array().nullable().default([]),
	}).concat(Model.yupSchema)

	static autocompleteQuery = "uuid, shortName, longName, identificationCode, type"

	static humanNameOfStatus(status) {
		return utils.sentenceCase(status)
	}

	static humanNameOfType(type) {
		if (type === Organization.TYPE.PRINCIPAL_ORG) {
			return Settings.fields.principal.org.name
		}
		else {
			return Settings.fields.advisor.org.name
		} // TODO do not assume that if not of type TYPE.PRINCIPAL_ORG it is an advisor
	}

	static isTaskEnabled(shortName) {
		return !Settings.tasking_ORGs || Settings.tasking_ORGs.includes(shortName)
	}

	constructor(props) {
		super(Model.fillObject(props, Organization.yupSchema))
	}

	humanNameOfType(type) {
		return Organization.humanNameOfType(this.type)
	}

	isAdvisorOrg() {
		return this.type === Organization.TYPE.ADVISOR_ORG
	}

	isTaskEnabled() {
		return Organization.isTaskEnabled(this.shortName)
	}

	iconUrl() {
		return ORGANIZATIONS_ICON
	}

	toString() {
		return this.shortName || this.longName || this.identificationCode
	}
}
