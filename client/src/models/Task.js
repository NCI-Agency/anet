import React from 'react'

import Model from 'components/Model'
import Settings from 'Settings'

export default class Task extends Model {
	static resourceName = 'Task'
	static listName = 'taskList'
	static getInstanceName = 'task'
	static displayName() {
		return Settings.fields.task.shortLabel
	}

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static schema = {
		shortName: '',
		longName: '',
		category: '',
		responsibleOrg: {},
		customFieldRef1: {},
		customFieldEnum1: '',
		customFieldEnum2: '',
		customField: '',
		projectedCompletion: null,
		plannedCompletion: null,
		get status() { return Task.STATUS.ACTIVE },
		...Model.schema,
	}

	static autocompleteQuery = "uuid, shortName, longName"

	static autocompleteTemplate(task) {
		return <span>{[task.shortName, task.longName].join(' - ')}</span>
	}

	toString() {
		return this.longName || this.shortName || 'Unnamed'
	}
}
