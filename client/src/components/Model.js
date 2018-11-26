import PropTypes from 'prop-types'

import encodeQuery from 'querystring/encode'
import _forEach from 'lodash/forEach'
import utils from 'utils'

export const GRAPHQL_NOTE_FIELDS = /* GraphQL */`
	uuid createdAt updatedAt text author { uuid name rank } noteRelatedObjects { noteUuid relatedObjectType relatedObjectUuid }
`
export const GRAPHQL_NOTES_FIELDS = /* GraphQL */`
	notes { ${GRAPHQL_NOTE_FIELDS} }
`

export default class Model {
	static schema = {
		notes: [],
	}

	static fillObject(props, yupSchema) {
		const obj = yupSchema.cast(props)
		_forEach(yupSchema.fields, (value, key) => {
			if (!obj.hasOwnProperty(key) || obj[key] === null || obj[key] === undefined) {
				obj[key] = value.default()
			}
		})
		return obj
	}

	static notePropTypes = PropTypes.shape({
		uuid: PropTypes.string,
		createdAt: PropTypes.number,
		text: PropTypes.string,
		author: PropTypes.shape({
			uuid: PropTypes.string,
			name: PropTypes.string,
			rank: PropTypes.string,
		}),
		noteRelatedObjects: PropTypes.arrayOf(PropTypes.shape({
			noteUuid: PropTypes.string,
			relatedObjectType: PropTypes.string,
			relatedObjectUuid: PropTypes.string,
		})),
	})

	static resourceName = null
	static displayName(appSettings)  { return null }
	static listName = null

	static fromArray(array) {
		if (!array)
			return []

		return array.map(object =>
			object instanceof this
				? object
				: new this(object)
		)
	}

	static map(array, func) {
		if (!array)
			return []

		return array.map((object, idx) =>
			object instanceof this
				? func(object, idx)
				: func(new this(object), idx)
		)
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
		let url = ['', resourceName, uuid].join('/')

		if (query) {
			url += '?' + encodeQuery(query)
		}

		return url
	}

	static pathForNew(query) {
		let resourceName = utils.resourceize(this.resourceName)
		let url = ['', resourceName, 'new'].join('/')

		if (query) {
			url += '?' + encodeQuery(query)
		}

		return url
	}

	static pathForEdit(instance, query) {
		let url = this.pathFor(instance) + '/edit'

		if (query) {
			url += '?' + encodeQuery(query)
		}

		return url
	}

	static isEqual(a, b) {
		return a && b && a.uuid === b.uuid
	}

	constructor(props) {
		Object.forEach(this.constructor.schema, (key, value) => {
			if (Array.isArray(value) && value.length === 0) {
				this[key] = []
			} else if (value && typeof value === 'object' && Object.keys(value).length === 0) {
				this[key] = {}
			} else {
				this[key] = value
			}
		})

		if (props) {
			this.setState(props)
		}
	}

	setState(props) {
		Object.forEach(props, (key, value) => {
			if (value !== null)
				this[key] = value
		})

		return this
	}

	toPath(query) {
		return this.uuid ? this.constructor.pathFor(this, query) : this.constructor.pathForNew(query)
	}

	toString() {
		return this.name || this.uuid
	}
}
