import React from 'react'

import Model from 'components/Model'
import Settings from 'Settings'

import RS_ICON from 'resources/rs_small.png'
import AFG_ICON from 'resources/afg_small.png'

export default class Position extends Model {
	static resourceName = 'Position'
	static listName = 'positionList'

	static TYPE = {
		ADVISOR: 'ADVISOR',
		PRINCIPAL: 'PRINCIPAL',
		SUPER_USER: 'SUPER_USER',
		ADMINISTRATOR: 'ADMINISTRATOR'
	}

	static schema = {
		name: '',
		type: '',
		code: '',
		status: 'ACTIVE',
		associatedPositions: [],
		organization: {},
		person: {},
		location: {},
	}

	static autocompleteQuery = "id, code, type, name"

	static autocompleteTemplate(position) {
		return <span>
			<img src={(new Position(position)).iconUrl()} alt={position.type} height={20} className="position-icon" />
			{position.name}
		</span>
	}

	static humanNameOfType(type) {
		if (type === Position.TYPE.PRINCIPAL) {
			return Settings.fields.principal.position.name
		} else if (type === Position.TYPE.ADVISOR) {
			return Settings.fields.advisor.position.name
		} else if (type === Position.TYPE.SUPER_USER) {
			return Settings.fields.superUser.position.name
		} else if (type === Position.TYPE.ADMINISTRATOR) {
			return Settings.fields.administrator.position.name
		}
	}

	humanNameOfType() {
		return Position.humanNameOfType(this.type)
	}

	isPrincipal() {
		return this.type === Position.TYPE.PRINCIPAL
	}

	toString() {
		return this.code || this.name
	}

	iconUrl() {
		if (this.type === Position.TYPE.PRINCIPAL) {
			return AFG_ICON
		}

		return RS_ICON
	}
}
