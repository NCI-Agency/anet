import React, {PropTypes} from 'react'

import Model from 'components/Model'
import dict from 'dictionary'

export default class Poam extends Model {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	static resourceName = 'Poam'
	static displayName() {
		return dict.lookup('POAM_SHORT_NAME')
	}

	static listName = 'poamList'

	static schema = {
		shortName: '',
		longName: '',
		category: '',
		responsibleOrg: {},
		parentPoam: {},
		childrenPoams: [],
	}

	static autocompleteQuery = "id, shortName, longName"

	static autocompleteTemplate(poam) {
		return <span>{[poam.shortName, poam.longName].join(' - ')}</span>
	}

	toString() {
		return this.longName || this.shortName || 'Unnamed'
	}
}
