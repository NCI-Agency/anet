import PropTypes from 'prop-types'
import React, { Component } from 'react'

import MultiSelectAutocomplete from 'components/MultiSelectAutocomplete'

export default class MultiSelector extends Component {
	static propTypes = {
		items: PropTypes.array.isRequired,
		objectType: PropTypes.func.isRequired,
		onChange: PropTypes.func.isRequired,
		shortcuts: PropTypes.array,
		shortcutsTitle: PropTypes.string,
		queryParams: PropTypes.object,
		addFieldName: PropTypes.string,
		addFieldLabel: PropTypes.string,
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
		placeholder: PropTypes.string,
		addon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
		fields: PropTypes.string.isRequired,
		template: PropTypes.func,
		renderExtraCol: PropTypes.bool,
	}

	static defaultProps = {
		queryParams: {},
		addFieldName: 'items',
		addFieldLabel: 'Items',
		placeholder: 'Start typing to search for an item…',
	}

	render() {
		const { items, objectType, shortcuts, shortcutsTitle, queryParams, addFieldName, addFieldLabel, renderSelected, placeholder, addon, fields, template, renderExtraCol } = this.props
		return (
			<MultiSelectAutocomplete
				addFieldName={addFieldName}
				addFieldLabel={addFieldLabel}
				items={items}
				renderSelected={renderSelected}
				onAddItem={this.addItem}
				onRemoveItem={this.removeItem}
				shortcuts={shortcuts}
				shortcutsTitle={shortcutsTitle}
				renderExtraCol={renderExtraCol}
				addon={addon}
				objectType={objectType}
				fields={fields}
				queryParams={queryParams}
				template={template}
				placeholder={placeholder}
			/>
		)
	}

	addItem = (newItem) => {
		const { items } = this.props
		items.push(newItem)
		this.props.onChange(items)
	}

	removeItem = (oldItem) => {
		const { items } = this.props
		const index = items.findIndex(item => item.uuid === oldItem.uuid)
		items.splice(index, 1)
		this.props.onChange(items)
	}
}
