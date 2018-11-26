import Model from 'components/Model'

import * as yup from 'yup'

export default class Location extends Model {
	static resourceName = 'Location'
	static listName = 'locationList'
	static getInstanceName = 'location'

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static yupSchema = yup.object().shape({
		name: yup.string().required().default(''),
		status: yup.string().required().default(() => Location.STATUS.ACTIVE),
		lat: yup.number().nullable().default(null),
		lng: yup.number().nullable().default(null),
	})
	// FIXME: merge with Model.yupSchema (notes!)

	static autocompleteQuery = "uuid, name"

	static hasCoordinates(location) {
		return location && typeof location.lat === 'number' && typeof location.lng === 'number'
	}

	constructor(props) {
		super(Model.fillObject(props, Location.yupSchema))
	}

	toString() {
		return this.name
	}
}
