import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'

import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import PositionTable from 'components/PositionTable'
import {Button, HelpBlock} from 'react-bootstrap'

import {Position} from 'models'

import WARNING_ICON from 'resources/warning.png'

export default class PositionsSelector extends Component {
	static propTypes = {
		positions: PropTypes.array.isRequired,
		onChange: PropTypes.func.isRequired,
		onErrorChange: PropTypes.func,
		validationState: PropTypes.string,
		shortcuts: PropTypes.array,
	}

	static defaultProps = {
		queryParams: {status: Position.STATUS.ACTIVE}
	}

	render() {
		let {positions, shortcuts, validationState} = this.props

		return <Form.Field id="positions" validationState={validationState}>
			<Autocomplete
				objectType={Position}
				fields={Position.autocompleteQuery}
				queryParams={this.props.queryParams}
				placeholder="Start typing to search for a position..."
				template={Position.autocompleteTemplate}
				onChange={this.addPosition}
				onErrorChange={this.props.onErrorChange}
				clearOnSelect={true} />

			{validationState && <HelpBlock>
				<img src={WARNING_ICON} alt="" height="20px" />
				Position not found in Database
			</HelpBlock>}
			<PositionTable
				positions={positions}
				showDelete={true}
				onDelete={this.removePosition}
			/>

			{ shortcuts && shortcuts.length > 0 && this.renderShortcuts() }
		</Form.Field>
	}

	renderShortcuts() {
		let shortcuts = this.props.shortcuts || []
		return <Form.Field.ExtraCol className="shortcut-list">
			<h5>Recent positions</h5>
			{shortcuts.map(position =>
				<Button key={position.uuid} bsStyle="link" onClick={this.addPosition.bind(this, position)}>Add {position.name}</Button>
			)}
		</Form.Field.ExtraCol>
	}

	@autobind
	addPosition(newPosition) {
		if (!newPosition || !newPosition.uuid) {
			return
		}

		let positions = this.props.positions

		if (!positions.find(position => position.uuid === newPosition.uuid)) {
			positions.push(newPosition)
		}

		this.props.onChange()
	}

	@autobind
	removePosition(oldPosition) {
		let positions = this.props.positions
		let index = positions.findIndex(position => position.uuid === oldPosition.uuid)

		if (index !== -1) {
			positions.splice(index, 1)
			this.props.onChange()
		}
	}
}
