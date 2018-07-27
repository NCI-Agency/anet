import Model from 'components/Model'

export default class Tag extends Model {
	static resourceName = 'Tag'
	static listName = 'tagList'
	static getInstanceName = 'tag'

	static schema = {
		name: '',
		description: null
	}

	static autocompleteQuery = "id, name"

	toString() {
		return this.name
	}
}
