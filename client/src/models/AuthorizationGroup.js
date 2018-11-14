import React from 'react'
import encodeQuery from 'querystring/encode'
import utils from 'utils'

import Model from 'components/Model'

export default class AuthorizationGroup extends Model {
	static resourceName = 'AuthorizationGroup'
	static listName = 'authorizationGroupList'
	static getInstanceName = 'authorizationGroup'

	static displayName() {
		// TODO: Get the display name from the dictionary
		return 'Authorization Group'
	}

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static schema = {
		name: '',
		description: '',
		positions: [],
		get status() { return AuthorizationGroup.STATUS.ACTIVE },
		...Model.schema,
	}

	static autocompleteQuery = "uuid, name, description"
	static autocompleteTemplate(group) {
		return <span>{[group.name, group.description].join(' - ')}</span>
	}

	toString() {
		return this.name || this.description || 'Unnamed'
	}

	static pathFor(instance, query) {
		if (!instance)
			return console.error(`You didn't pass anything to ${this.name}.pathFor. If you want a new route, you can pass null.`)

		if (process.env.NODE_ENV !== 'production') {
			if (!this.resourceName)
				return console.error(`You must specify a resourceName on model ${this.name}.`)
		}

		let resourceName = utils.resourceize(this.resourceName)
		let uuid = instance.uuid
		let url = ['', 'admin', resourceName, uuid].join('/')

		if (query) {
			url += '?' + encodeQuery(query)
		}

		return url
	}

	static pathForNew(query) {
		let resourceName = utils.resourceize(this.resourceName)
		let url = ['', 'admin', resourceName, 'new'].join('/')

		if (query) {
			url += '?' + encodeQuery(query)
		}

		return url
	}

	humanNameOfStatus() {
		return utils.sentenceCase(this.status)
	}
}
