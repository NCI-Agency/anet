import PropTypes from 'prop-types'
import React, { Component } from 'react'

import MultiSelectAutocomplete from 'components/MultiSelectAutocomplete'
import PositionTable from 'components/PositionTable'

import {Position} from 'models'

import POSITIONS_ICON from 'resources/positions.png'

export default class PositionsSelector extends Component {
	static propTypes = {
		positions: PropTypes.array.isRequired,
		onChange: PropTypes.func.isRequired,
		shortcuts: PropTypes.array,
	}

	static defaultProps = {
		queryParams: {status: Position.STATUS.ACTIVE}
	}

	render() {
		const { positions, shortcuts } = this.props
		return (
			<MultiSelectAutocomplete
				addFieldName="positions"
				addFieldLabel="Positions"
				items={positions}
				renderSelected={
					<PositionTable
						positions={positions}
						showDelete={true}
					/>
				}
				onAddItem={this.addPosition}
				onRemoveItem={this.removePosition}
				shortcuts={shortcuts}
				addon={POSITIONS_ICON}
				objectType={Position}
				fields={Position.autocompleteQuery}
				queryParams={this.props.queryParams}
				template={Position.autocompleteTemplate}
				placeholder="Start typing to search for a position..."
			/>
		)
	}

	addPosition = (newPosition) => {
		const { positions } = this.props
		positions.push(newPosition)
		this.props.onChange(positions)
	}

	removePosition = (oldPosition) => {
		const { positions } = this.props
		const index = positions.findIndex(position => position.uuid === oldPosition.uuid)
		positions.splice(index, 1)
		this.props.onChange(positions)
	}
}
