import React from 'react'

import Model, { yupDate } from 'components/Model'
import utils from 'utils'
import Settings from 'Settings'

import * as yup from 'yup'

export const {
	shortLabel,
	longLabel,
	customFieldRef1,
	customField,
	customFieldEnum1,
	customFieldEnum2,
	plannedCompletion,
	projectedCompletion,
} = Settings.fields.task

export const fieldLabels = {
	shortName: `${shortLabel} number`,
	longName: `${shortLabel} description`,
	responsibleOrg: 'Responsible organization',
}

export default class Task extends Model {
	static resourceName = 'Task'
	static listName = 'taskList'
	static getInstanceName = 'task'
	static getModelNameLinkTo = 'task'

	static displayName() {
		return shortLabel
	}

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static yupSchema = yup.object().shape({
		shortName: yup.string().required().default('')
			.label(fieldLabels.shortName),
		longName: yup.string().required().default('')
			.label(fieldLabels.longName),
		category: yup.string().nullable().default(''),
		responsibleOrg: yup.object().nullable().default({})
			.label(fieldLabels.responsibleOrg),
		customFieldRef1: yup.object().nullable().default({})
			.label(customFieldRef1.label),
		customFieldEnum1: yup.string().nullable().default('')
			.label(customFieldEnum1.label),
		customFieldEnum2: yup.string().nullable().default('')
			.label(customFieldEnum2.label),
		customField: yup.string().nullable().default('')
			.label(customField.label),
		projectedCompletion: yupDate.nullable().default(null)
			.label(projectedCompletion.label),
		plannedCompletion: yupDate.nullable().default(null)
			.label(plannedCompletion.label),
		status: yup.string().required().default(() => Task.STATUS.ACTIVE),
	}).concat(Model.yupSchema)

	static autocompleteQuery = "uuid, shortName, longName"

	static autocompleteTemplate(task) {
		return <span>{[task.shortName, task.longName].join(' - ')}</span>
	}

	static humanNameOfStatus(status) {
		return utils.sentenceCase(status)
	}

	constructor(props) {
		super(Model.fillObject(props, Task.yupSchema))
	}

	toString() {
		return `${this.shortName} ${this.longName.substr(0, 80)}${this.longName.length > 80 ? '...' : ''}`
	}
}
