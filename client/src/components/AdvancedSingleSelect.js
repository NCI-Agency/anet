import React, { Component } from 'react'

import AdvancedSelect, {propTypes as advancedSelectPropTypes} from 'components/AdvancedSelect'
import {AdvancedSingleSelectOverlayTable} from 'components/AdvancedSelectOverlayTable'
import _cloneDeep from 'lodash/cloneDeep'


export default class AdvancedSingleSelect extends Component {
	static propTypes = {
		...advancedSelectPropTypes
	}

	static defaultProps = {
		overlayTable: AdvancedSingleSelectOverlayTable
	}

	render() {
		return <AdvancedSelect
			{...this.props}
			handleAddItem={this.handleAddItem}
			handleRemoveItem={this.handleRemoveItem}
		/>
	}

	handleAddItem = (newItem) => {
		if (!newItem || !newItem.uuid) {
			return
		}
		this.props.onChange(newItem)
	}

	handleRemoveItem = (oldItem) => {
		this.props.onChange(null)
	}
}
