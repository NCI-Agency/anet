import Model from 'components/Model'

export default class Location extends Model {
	static resourceName = 'Location'
	static listName = 'locationList'

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static schema = {
		name: '',
		get status() { return Location.STATUS.ACTIVE },
		lat: null,
		lng: null
	}

	static hasCoordinates(location) {
		return location && typeof location.lat === 'number' && typeof location.lng === 'number'
	}

	toString() {
		return this.name
	}
}
