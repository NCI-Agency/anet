import React from 'react'

import Model, { yupDate } from 'components/Model'
import LinkTo from 'components/LinkTo'
import utils from 'utils'
import Settings from 'Settings'

import {Position, Organization} from 'models'

import RS_ICON from 'resources/rs_small.png'
import AFG_ICON from 'resources/afg_small.png'

import _isEmpty from 'lodash/isEmpty'
import * as yup from 'yup'

export const fieldLabels = {
	firstName: 'First name',
	lastName: 'Last name',
	domainUsername: 'Domain username',
	emailAddress: 'Email',
	phoneNumber: 'Phone',
	country: 'Nationality',
	rank: 'Rank',
	gender: 'Gender',
	endOfTourDate: 'End of tour',
}

export default class Person extends Model {
	static resourceName = 'Person'
	static listName = 'personList'
	static getInstanceName = 'person'
	static getModelNameLinkTo = 'person'

	static STATUS = {
		NEW_USER: 'NEW_USER',
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static ROLE = {
		ADVISOR: 'ADVISOR',
		PRINCIPAL: 'PRINCIPAL'
	}

	static nameDelimiter = ','

	static yupSchema = yup.object().shape({
		name: yup.string().nullable().default(''),
		// not actually in the database, but used for validation
		firstName: yup.string().nullable()
			.when('role', (role, schema) => (
				Person.isAdvisor({role}) ? schema.required(`You must provide the ${fieldLabels.firstName}`) : schema.nullable()
			)).default('').label(fieldLabels.firstName),
		// not actually in the database, but used for validation
		lastName: yup.string().nullable().uppercase().required(`You must provide the ${fieldLabels.lastName}`).default('').label(fieldLabels.lastName),
		domainUsername: yup.string().nullable().default('').label(fieldLabels.domainUsername),
		emailAddress: yup.string().nullable().email()
			.when('role', (role, schema) => (
				Person.isAdvisor({role}) ? schema.required(`You must provide the ${fieldLabels.emailAddress}`) : schema.nullable()
			)).default('').label(fieldLabels.emailAddress),
		country: yup.string().nullable().required(`You must provide the ${fieldLabels.country}`).default('').label(fieldLabels.country),
		rank: yup.string().nullable()
			.when('role', (role, schema) => (
				Person.isAdvisor({role}) ? schema.nullable().required(`You must provide the ${fieldLabels.rank}`) : schema.nullable()
			)).default('').label(fieldLabels.rank),
		gender: yup.string().nullable()
			.when('role', (role, schema) => (
				Person.isAdvisor({role}) ? schema.required(`You must provide the ${fieldLabels.gender}`) : schema.nullable()
			)).default('').label(fieldLabels.gender),
		phoneNumber: yup.string().nullable().default('').label(fieldLabels.phoneNumber),
		endOfTourDate: yupDate.nullable()
			.when('role', (role, schema) => (
				Person.isAdvisor({role}) ? schema.nullable().required(`You must provide the ${fieldLabels.endOfTourDate}`) : schema.nullable()
			)).default(null).label(fieldLabels.endOfTourDate),
		biography: yup.string().nullable().default(''),
		position: yup.object().nullable().default({}),
		role: yup.string().nullable().default(() => Person.ROLE.PRINCIPAL),
		status: yup.string().nullable().default(() => Person.STATUS.ACTIVE),
	}).concat(Model.yupSchema)

	static autocompleteQuery = "uuid, name, role, rank, status, endOfTourDate, position { uuid, name, code, status, organization { uuid, shortName }, location {uuid, name} }"

	static autocompleteTemplate(person) {
		return <span>
			<img src={(new Person(person)).iconUrl()} alt={person.role} height={20} className="person-icon" />
			<LinkTo person={person} isLink={false}/> {person.position && (`- (${person.position.name}` + (person.position.code ? `, ${person.position.code}` : ``) + (person.position.location ? `, ${ person.position.location.name}` : ``) + `)` )}
		</span>
	}

	static humanNameOfRole(role) {
		if (role === Person.ROLE.ADVISOR) {
			return Settings.fields.advisor.person.name
		}
		if (role === Person.ROLE.PRINCIPAL) {
			return Settings.fields.principal.person.name
		}
		throw new Error(`Unrecognized role: ${role}`)
	}

	static humanNameOfStatus(status) {
		return utils.sentenceCase(status)
	}

	constructor(props) {
		super(Model.fillObject(props, Person.yupSchema))
	}

	humanNameOfRole() {
		return Person.humanNameOfRole(this.role)
	}

	humanNameOfStatus() {
		return Person.humanNameOfStatus(this.status)
	}

	static isNewUser(person) {
		return person.status === Person.STATUS.NEW_USER
	}

	isNewUser() {
		return Person.isNewUser(this)
	}

	static isAdvisor(person) {
		return person.role === Person.ROLE.ADVISOR
	}

	isAdvisor() {
		return Person.isAdvisor(this)
	}

	isPrincipal() {
		return this.role === Person.ROLE.PRINCIPAL
	}

	isAdmin() {
		return this.position && this.position.type === Position.TYPE.ADMINISTRATOR
	}

	isSuperUser() {
		return this.position && (
			this.position.type === Position.TYPE.SUPER_USER ||
			this.position.type === Position.TYPE.ADMINISTRATOR
		)
	}

	hasAssignedPosition() {
		// has a non-empty position with a non-zero uuid
		return !_isEmpty(this.position) && !!this.position.uuid
	}

	hasActivePosition() {
		return this.hasAssignedPosition() && this.position.status === Position.STATUS.ACTIVE
	}

	//Checks if this user is a valid super user for a particular organization
	//Must be either
	// - An Administrator
	// - A super user and this org is a PRINCIPAL_ORG
	// - A super user for this organization
	// - A super user for this orgs parents.
	isSuperUserForOrg(org) {
		if (!org) { return false }
		if (this.position && this.position.type === Position.TYPE.ADMINISTRATOR) { return true }
		if (this.position && this.position.type !== Position.TYPE.SUPER_USER) { return false }
		if (org.type === Organization.TYPE.PRINCIPAL_ORG) { return true }

		if (!this.position || !this.position.organization) { return false }
		let orgs = this.position.organization.allDescendantOrgs || []
		orgs.push(this.position.organization)
		let orgUuids = orgs.map(o => o.uuid)

		return orgUuids.includes(org.uuid)
	}

	iconUrl() {
		if (this.isAdvisor()) {
			return RS_ICON
		} else if (this.isPrincipal()) {
			return AFG_ICON
		}

		return ''
	}

	toString() {
		if (this.rank) {
			return this.rank + " " + this.name
		} else {
			return this.name || this.uuid
		}
	}

	static fullName(person, doTrim) {
		if (person.lastName && person.firstName) {
			return(`${Person.formattedLastName(person.lastName, doTrim)}${Person.nameDelimiter} ${Person.formattedFirstName(person.firstName, doTrim)}`)
		}
		else if (person.lastName) {
			return Person.formattedLastName(person.lastName)
		}
		else {
			return ''
		}
	}

	static formattedLastName(lastName, doTrim) {
		let r = lastName.toUpperCase()
		if (doTrim) {
			r = r.trim()
		}
		return r
	}

	static formattedFirstName(firstName, doTrim) {
		let r = firstName
		if (doTrim) {
			r = r.trim()
		}
		return r
	}

	static parseFullName(name) {
		const delimiter = name.indexOf(Person.nameDelimiter)
		let lastName = name
		let firstName = ''

		if(delimiter > -1) {
			lastName = name.substring(0, delimiter)
			firstName = name.substring(delimiter + 1, name.length)
		}

		return(
			{
				lastName: lastName.trim().toUpperCase(),
				firstName: firstName.trim()
			}
		)
	}

}
