import React from 'react'

import Model from 'components/Model'
import utils from 'utils'
import dict from 'dictionary'

import RS_ICON from 'resources/rs_small.png'
import AFG_ICON from 'resources/afg_small.png'


export default class Person extends Model {
	static resourceName = 'Person'
	static listName = 'personList'

	static ROLE = {
		ADVISOR: 'ADVISOR',
		PRINCIPAL: 'PRINCIPAL'
	}

	static schema = {
		name: '',
		status: 'ACTIVE',
		country: '',
		rank: '',
		gender: 'MALE',
		phoneNumber: '',
		endOfTourDate: '',
		biography: '',
		role: 'PRINCIPAL',
		position: {},
	}

	static autocompleteQuery = "id, name, role, position { id, name, organization { id, shortName } }"

	static autocompleteTemplate(person) {
		return <span>
			<img src={(new Person(person)).iconUrl()} alt={person.role} height={20} className="person-icon" />
			{person.name} {person.rank && person.rank.toUpperCase()} - {person.position && `(${person.position.name})`}
		</span>
	}

	static humanNameOfRole(role) {
		if (role === Person.ROLE.ADVISOR) {
			return dict.lookup('ADVISOR_PERSON_TITLE')
		}
		if (role === Person.ROLE.PRINCIPAL) {
			return dict.lookup('PRINCIPAL_PERSON_TITLE')
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
		return this.status === 'NEW_USER'
	}

	isAdvisor() {
		return this.role === Person.ROLE.ADVISOR
	}

	isPrincipal() {
		return this.role === Person.ROLE.PRINCIPAL
	}

	isAdmin() {
		return this.position && this.position.type === 'ADMINISTRATOR'
	}

	isSuperUser() {
		return this.position && (
			this.position.type === 'SUPER_USER' ||
			this.position.type === 'ADMINISTRATOR'
		)
	}

	hasAssignedPosition() {
		return  typeof this.position !== 'undefined' && this.position !== {}
	}

	//Checks if this user is a valid super user for a particular organization
	//Must be either
	// - An Administrator
	// - A super user and this org is a PRINCIPAL_ORG
	// - A super user for this organization
	// - A super user for this orgs parents.
	isSuperUserForOrg(org) {
		if (!org) { return false }
		if (this.position && this.position.type === 'ADMINISTRATOR') { return true }
		if (this.position && this.position.type !== 'SUPER_USER') { return false }
		if (org.type === 'PRINCIPAL_ORG') { return true }

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

}
