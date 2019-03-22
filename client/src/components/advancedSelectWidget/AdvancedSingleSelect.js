import React, { Component } from 'react'
import PropTypes from 'prop-types'

import AdvancedSelect, {propTypes as advancedSelectPropTypes} from 'components/advancedSelectWidget/AdvancedSelect'
import {AdvancedSingleSelectOverlayTable} from 'components/advancedSelectWidget/AdvancedSelectOverlayTable'
import _cloneDeep from 'lodash/cloneDeep'


export default class AdvancedSingleSelect extends Component {
	static propTypes = {
		...advancedSelectPropTypes,
		value: PropTypes.object
	}

	static defaultProps = {
		overlayTable: AdvancedSingleSelectOverlayTable
	}

	render() {
		return <AdvancedSelect
			{...this.props}
			handleAddItem={this.handleAddItem}
			handleRemoveItem={this.handleRemoveItem}
			closeOverlayOnAdd={true}
			searchTerms={this.props.value[this.props.valueKey]}
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
