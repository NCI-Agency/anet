import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'

import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import {Table, Button, HelpBlock} from 'react-bootstrap'

import {AuthorizationGroup} from 'models'

import REMOVE_ICON from 'resources/delete.png'
import WARNING_ICON from 'resources/warning.png'

export default class AuthorizationGroupsSelector extends Component {
	static propTypes = {
		groups: PropTypes.array.isRequired,
		onChange: PropTypes.func.isRequired,
		onErrorChange: PropTypes.func,
		validationState: PropTypes.string,
		shortcuts: PropTypes.array,
	}

	render() {
		let {groups, shortcuts, validationState} = this.props

		return <Form.Field id="authorizationGroups" validationState={validationState}>
			<Autocomplete
				objectType={AuthorizationGroup}
				fields={AuthorizationGroup.autocompleteQuery}
				queryParams={{status: AuthorizationGroup.STATUS.ACTIVE}}
				placeholder="Start typing to search for a group..."
				template={AuthorizationGroup.autocompleteTemplate}
				onChange={this.addAuthorizationGroup}
				onErrorChange={this.props.onErrorChange}
				clearOnSelect={true} />

			{validationState && <HelpBlock>
				<img src={WARNING_ICON} alt="" height="20px" />
				Authorization group not found in Database
			</HelpBlock>}

			<Table condensed id="authorizationGroupsTable" className="borderless">
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{groups.map((ag, idx) =>
						<tr key={ag.uuid}>
							<td>{ag.name}</td>
							<td>{ag.description}</td>
							<td onClick={this.removeAuthorizationGroup.bind(this, ag)} id={'authorizationGroupDelete_' + idx} >
								<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove group" /></span>
							</td>
						</tr>
					)}
				</tbody>
			</Table>

			{ shortcuts && shortcuts.length > 0 && this.renderShortcuts() }
		</Form.Field>
	}

	renderShortcuts() {
		let shortcuts = this.props.shortcuts || []
		return <Form.Field.ExtraCol className="shortcut-list">
			<h5>Recent groups</h5>
			{shortcuts.map(group =>
				<Button key={group.uuid} bsStyle="link" onClick={this.addAuthorizationGroup.bind(this, group)}>Add {group.name}</Button>
			)}
		</Form.Field.ExtraCol>
	}

	@autobind
	addAuthorizationGroup(newGroup) {
		if (!newGroup || !newGroup.uuid) {
			return
		}

		let groups = this.props.groups

		if (!groups.find(group => group.uuid === newGroup.uuid)) {
			groups.push(newGroup)
		}

		this.props.onChange()
	}

	@autobind
	removeAuthorizationGroup(oldGroup) {
		let groups = this.props.groups
		let index = groups.findIndex(group => group.uuid === oldGroup.uuid)

		if (index !== -1) {
			groups.splice(index, 1)
			this.props.onChange()
		}
	}
}
