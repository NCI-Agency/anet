import React from 'react'

import Model from 'components/Model'
import LinkTo from 'components/LinkTo'
import utils from 'utils'
import Settings from 'Settings'

import {Position, Organization} from 'models'

import RS_ICON from 'resources/rs_small.png'
import AFG_ICON from 'resources/afg_small.png'

import _isEmpty from 'lodash/isEmpty'

export default class Person extends Model {
	static resourceName = 'Person'
	static listName = 'personList'

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

	static schema = {
		name: '',
		get status() { return Person.STATUS.ACTIVE },
		country: '',
		rank: '',
		gender: 'MALE',
		phoneNumber: '',
		endOfTourDate: '',
		biography: '',
		get role() { return Person.ROLE.PRINCIPAL },
		position: {},
	}

	static autocompleteQuery = "id, name, role, rank, position { id, name, organization { id, shortName } }"

	static autocompleteTemplate(person) {
		return <span>
			<img src={(new Person(person)).iconUrl()} alt={person.role} height={20} className="person-icon" />
			<LinkTo person={person} isLink={false}/> - {person.position && `(${person.position.name})`}
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

	humanNameOfRole() {
		return Person.humanNameOfRole(this.role)
	}

	humanNameOfStatus() {
		return utils.sentenceCase(this.status)
	}

	isNewUser() {
		return this.status === Person.STATUS.NEW_USER
	}

	isAdvisor() {
		return this.role === Person.ROLE.ADVISOR
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
		// has a non-empty position with a non-zero id
		return !_isEmpty(this.position) && !!this.position.id
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
		let orgIds = orgs.map(o => o.id)

		return orgIds.includes(org.id)
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
			return this.name || this.id
		}
	}

	static fullName(person) {
		if (person.lastName && person.firstName) {
			return(`${Person.formattedLastName(person.lastName)}${Person.nameDelimiter} ${Person.formattedFirstName(person.firstName)}`)
		}
		else if (person.lastName) {
			return Person.formattedLastName(person.lastName)
		}
		else {
			return ''
		}
	}

	static formattedLastName(lastName) {
		return lastName.toUpperCase().trim()
	}

	static formattedFirstName(firstName) {
		return firstName.trim()
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
