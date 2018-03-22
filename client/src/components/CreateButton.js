import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {DropdownButton, MenuItem, Button} from 'react-bootstrap'
import * as Models from 'models'

import { withRouter } from 'react-router-dom'

const DEFAULT_ACTIONS = [
	Models.Report,
]

const SUPER_USER_ACTIONS = [
	Models.Person,
	Models.Position,
	Models.Location,
]

const ADMIN_ACTIONS = [
	Models.Organization,
	Models.Task,
	Models.AuthorizationGroup
]

class CreateButton extends Component {
	static contextTypes = {
		currentUser: PropTypes.object,
	}

	render() {
		const currentUser = this.context.currentUser

		const modelClasses = DEFAULT_ACTIONS.concat(
			currentUser.isSuperUser() && SUPER_USER_ACTIONS,
			currentUser.isAdmin() && ADMIN_ACTIONS,
		).filter(value => !!value)

		if (modelClasses.length > 1) {
			return (
				<DropdownButton title="Create" bsStyle="primary" id="createButton" onSelect={this.onSelect}>
					{modelClasses.map((modelClass, i) =>
						<MenuItem key={modelClass.resourceName} eventKey={modelClass}>New {modelClass.displayName() || modelClass.resourceName}</MenuItem>
					)}
				</DropdownButton>
			)
		} else if (modelClasses.length) {
			let modelClass = modelClasses[0]
			return (
				<Button bsStyle="primary" onClick={this.onSelect.bind(this, modelClass)} id="createButton">
					New {(modelClass.displayName() || modelClass.resourceName).toLowerCase()}
				</Button>
			)
		}
	}

	onSelect(modelClass) {
		this.props.history.push(modelClass.pathForNew()) // FIXME React16
	}
}

export default withRouter(CreateButton)
