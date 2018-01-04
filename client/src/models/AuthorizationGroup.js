import React, {PropTypes} from 'react'

import Model from 'components/Model'

export default class AuthorizationGroup extends Model {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	static resourceName = 'AuthorizationGroup'
	static listName = 'authorizationGroupList'

	static schema = {
		name: '',
		description: '',
	}

	static autocompleteQuery = "id, name, description"
	static autocompleteTemplate(group) {
		return <span>{[group.name, group.description].join(' - ')}</span>
	}

	toString() {
		return this.name || this.description || 'Unnamed'
	}
}
