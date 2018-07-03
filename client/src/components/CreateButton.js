import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {DropdownButton, MenuItem, Button} from 'react-bootstrap'
import * as Models from 'models'
import autobind from 'autobind-decorator'

import AppContext from 'components/AppContext'
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

class BaseCreateButton extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Models.Person),
	}

	render() {
		const { currentUser } = this.props

		const modelClasses = DEFAULT_ACTIONS.concat(
			currentUser.isSuperUser() && SUPER_USER_ACTIONS,
			currentUser.isAdmin() && ADMIN_ACTIONS,
		).filter(value => !!value)

		if (modelClasses.length > 1) {
			return (
				<DropdownButton title="Create" pullRight bsStyle="primary" id="createButton" onSelect={this.onSelect}>
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

	@autobind
	onSelect(modelClass) {
		this.props.history.push(modelClass.pathForNew())
	}
}

const CreateButton = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseCreateButton currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(CreateButton)
