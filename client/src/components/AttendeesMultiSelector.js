import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Person, Organization, Task} from 'models'
import AttendeesMultiSelect from 'components/AttendeesMultiSelect'

import _cloneDeep from 'lodash/cloneDeep'

export default class AttendeesMultiSelector extends Component {
	static propTypes = {
		selectedItems: PropTypes.array.isRequired,
		objectType: PropTypes.func.isRequired,
		onChange: PropTypes.func.isRequired,
		filterDefs: PropTypes.object,
		queryParams: PropTypes.object,
		addFieldName: PropTypes.string,
		addFieldLabel: PropTypes.string,
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
		placeholder: PropTypes.string,
		addon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
		fields: PropTypes.string.isRequired,
		template: PropTypes.func,
		renderExtraCol: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		queryParams: {},
		addFieldName: 'items',
		addFieldLabel: 'Items',
		placeholder: 'Start typing to search for an item…',
	}

	render() {
		const { selectedItems, objectType, filterDefs, queryParams, addFieldName, addFieldLabel, renderSelected, placeholder, addon, fields, template, renderExtraCol } = this.props
		return (
			<AttendeesMultiSelect
				addFieldName={addFieldName}
				addFieldLabel={addFieldLabel}
				selectedItems={selectedItems}
				renderSelected={renderSelected}
				onAddItem={this.addItem}
				onRemoveItem={this.removeItem}
				filterDefs={filterDefs}
				renderExtraCol={renderExtraCol}
				addon={addon}
				objectType={objectType}
				fields={fields}
				queryParams={queryParams}
				template={template}
				placeholder={placeholder}
				currentUser={this.props.currentUser}
			/>
		)
	}

	addItem = (newItem) => {
		const selectedItems = _cloneDeep(this.props.selectedItems)
		selectedItems.push(newItem)
		this.props.onChange(selectedItems)
	}

	removeItem = (oldItem) => {
		const selectedItems = _cloneDeep(this.props.selectedItems)
		const index = selectedItems.findIndex(item => item.uuid === oldItem.uuid)
		selectedItems.splice(index, 1)
		this.props.onChange(selectedItems)
	}
}
