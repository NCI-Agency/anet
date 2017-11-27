import Model from 'components/Model'

export default class Tag extends Model {
	static resourceName = 'Tag'
	static listName = 'tagList'

	static schema = {
		name: '',
		description: null
	}

	toString() {
		return this.name
	}
}
