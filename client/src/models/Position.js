import React from 'react'

import Model from 'components/Model'
import Settings from 'Settings'

import * as yup from 'yup'

import RS_ICON from 'resources/rs_small.png'
import AFG_ICON from 'resources/afg_small.png'

export const advisorPosition = Settings.fields.advisor.position
export const principalPosition = Settings.fields.principal.position
export const administratorPosition = Settings.fields.administrator.position
export const superUserPosition = Settings.fields.superUser.position

export const fieldLabels = {
	name: 'Position Name',
}

export default class Position extends Model {
	static resourceName = 'Position'
	static listName = 'positionList'
	static getInstanceName = 'position'

	static STATUS = {
		ACTIVE: 'ACTIVE',
		INACTIVE: 'INACTIVE'
	}

	static TYPE = {
		ADVISOR: 'ADVISOR',
		PRINCIPAL: 'PRINCIPAL',
		SUPER_USER: 'SUPER_USER',
		ADMINISTRATOR: 'ADMINISTRATOR'
	}

	static yupSchema = yup.object().shape({
		name: yup.string().required().default('')
			.label(fieldLabels.name),
		type: yup.string().required().default(() => Position.TYPE.ADVISOR),
		code: yup.string().nullable().default(''),
		status: yup.string().required().default(() => Position.STATUS.ACTIVE),
		associatedPositions: yup.array().nullable().default([]),
		previousPeople: yup.array().nullable().default([]),
		organization: yup.object().nullable().default({})
			.test('required-object', '${path} is required', value => value && value.uuid),
		person: yup.object().nullable().default({}),
		location: yup.object().nullable().default({}),
	})
	// FIXME: merge with Model.yupSchema (notes!)

	static autocompleteQuery = "uuid, name, code, type, status, organization { uuid, shortName}, person { uuid, name }"

	static autocompleteTemplate(position) {
		return <span>
			<img src={(new Position(position)).iconUrl()} alt={position.type} height={20} className="position-icon" />
			{position.name}
		</span>
	}

	static humanNameOfType(type) {
		if (type === Position.TYPE.PRINCIPAL) {
			return principalPosition.type
		} else if (type === Position.TYPE.ADVISOR) {
			return advisorPosition.type
		} else if (type === Position.TYPE.SUPER_USER) {
			return superUserPosition.type
		} else if (type === Position.TYPE.ADMINISTRATOR) {
			return administratorPosition.type
		}
	}

	constructor(props) {
		super(Model.fillObject(props, Position.yupSchema))
	}

	humanNameOfType() {
		return Position.humanNameOfType(this.type)
	}

	isPrincipal() {
		return this.type === Position.TYPE.PRINCIPAL
	}

	toString() {
		return this.name
	}

	iconUrl() {
		if (this.type === Position.TYPE.PRINCIPAL) {
			return AFG_ICON
		}

		return RS_ICON
	}
}
