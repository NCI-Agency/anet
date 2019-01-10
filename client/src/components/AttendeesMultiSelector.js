import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Person, Organization, Task} from 'models'
import AttendeesMultiSelect from 'components/AttendeesMultiSelect'

import _cloneDeep from 'lodash/cloneDeep'

export default class AttendeesMultiSelector extends Component {
	static propTypes = {
		items: PropTypes.array.isRequired,
		objectType: PropTypes.func.isRequired,
		onChange: PropTypes.func.isRequired,
		shortcutDefs: PropTypes.object,
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
		const { items, objectType, shortcutDefs, queryParams, addFieldName, addFieldLabel, renderSelected, placeholder, addon, fields, template, renderExtraCol } = this.props
		return (
			<AttendeesMultiSelect
				addFieldName={addFieldName}
				addFieldLabel={addFieldLabel}
				items={items}
				renderSelected={renderSelected}
				onAddItem={this.addItem}
				onRemoveItem={this.removeItem}
				shortcutDefs={shortcutDefs}
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
		const items = _cloneDeep(this.props.items)
		items.push(newItem)
		this.props.onChange(items)
	}

	removeItem = (oldItem) => {
		const items = _cloneDeep(this.props.items)
		const index = items.findIndex(item => item.uuid === oldItem.uuid)
		items.splice(index, 1)
		this.props.onChange(items)
	}
}
