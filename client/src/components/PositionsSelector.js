import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'

import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import {Table, Button, HelpBlock} from 'react-bootstrap'

import {Position} from 'models'

import REMOVE_ICON from 'resources/delete.png'
import WARNING_ICON from 'resources/warning.png'

export default class PositionsSelector extends Component {
	static propTypes = {
		positions: PropTypes.array.isRequired,
		onChange: PropTypes.func.isRequired,
		onErrorChange: PropTypes.func,
		validationState: PropTypes.string,
		shortcuts: PropTypes.array,
	}

	static contextTypes = {
		app: PropTypes.object.isRequired
	}

	render() {
		let {positions, shortcuts, validationState} = this.props

		return <Form.Field id="positions" validationState={validationState}>
			<Autocomplete
				objectType={Position}
				fields={Position.autocompleteQuery}
				queryParams={{status: 'ACTIVE'}}
				placeholder="Start typing to search for a position..."
				template={Position.autocompleteTemplate}
				onChange={this.addPosition}
				onErrorChange={this.props.onErrorChange}
				clearOnSelect={true} />

			{validationState && <HelpBlock>
				<img src={WARNING_ICON} role="presentation" height="20px" />
				Position not found in Database
			</HelpBlock>}

			<Table condensed id="positionsTable" className="borderless">
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{positions.map((ag, idx) =>
						<tr key={ag.id}>
							<td>{ag.name}</td>
							<td>{ag.description}</td>
							<td onClick={this.removePosition.bind(this, ag)} id={'positionDelete_' + idx} >
								<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove position" /></span>
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
			<h5>Recent positions</h5>
			{shortcuts.map(position =>
				<Button key={position.id} bsStyle="link" onClick={this.addPosition.bind(this, position)}>Add {position.name}</Button>
			)}
		</Form.Field.ExtraCol>
	}

	@autobind
	addPosition(newGroup) {
		if (!newGroup || !newGroup.id) {
			return
		}

		let positions = this.props.positions

		if (!positions.find(position => position.id === newGroup.id)) {
			positions.push(newGroup)
		}

		this.props.onChange()
	}

	@autobind
	removePosition(oldGroup) {
		let positions = this.props.positions
		let index = positions.findIndex(position => position.id === oldGroup.id)

		if (index !== -1) {
			positions.splice(index, 1)
			this.props.onChange()
		}
	}
}
