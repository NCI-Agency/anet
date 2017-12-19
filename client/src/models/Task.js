import React, {PropTypes} from 'react'

import Model from 'components/Model'
import dict from 'dictionary'

export default class Task extends Model {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	static resourceName = 'Task'
	static displayName() {
		return dict.lookup('TASK_SHORT_NAME')
	}

	static listName = 'taskList'

	static schema = {
		shortName: '',
		longName: '',
		category: '',
		responsibleOrg: {},
		parentTask: {},
		childrenTasks: [],
		customFieldEnum: '',
		customField: '',
		projectedCompletion: null,
		plannedCompletion: null,
	}

	static autocompleteQuery = "id, shortName, longName"

	static autocompleteTemplate(task) {
		return <span>{[task.shortName, task.longName].join(' - ')}</span>
	}

	toString() {
		return this.longName || this.shortName || 'Unnamed'
	}
}
