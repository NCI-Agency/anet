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

	toString() {
		return this.name
	}
}
