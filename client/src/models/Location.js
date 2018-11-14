import Model from 'components/Model'

export default class Location extends Model {
	static resourceName = 'Location'
	static listName = 'locationList'
	static getInstanceName = 'location'
	static searchObjectType= 'Locations'

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static schema = {
		name: '',
		get status() { return Location.STATUS.ACTIVE },
		lat: null,
		lng: null,
		...Model.schema,
	}

	static autocompleteQuery = "uuid, name"

	static hasCoordinates(location) {
		return location && typeof location.lat === 'number' && typeof location.lng === 'number'
	}

	toString() {
		return this.name
	}
}
