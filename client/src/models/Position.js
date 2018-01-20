import React from 'react'

import Model from 'components/Model'
import dict from 'dictionary'

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

	humanNameOfType() {
		if (this.type === Position.TYPE.PRINCIPAL) {
			return dict.lookup('PRINCIPAL_POSITION_NAME')
		} else if (this.type === Position.TYPE.ADVISOR) {
			return dict.lookup('ADVISOR_POSITION_TYPE_TITLE')
		} else if (this.type === Position.TYPE.SUPER_USER) {
			return dict.lookup('SUPER_USER_POSITION_TYPE_TITLE')
		} else if (this.type === Position.TYPE.ADMINISTRATOR) {
			return dict.lookup('ADMINISTRATOR_POSITION_TYPE_TITLE')
		}
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
