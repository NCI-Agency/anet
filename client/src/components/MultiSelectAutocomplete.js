import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Button } from 'react-bootstrap'

import LinkTo from 'components/LinkTo'
import NewAutocomplete from 'components/NewAutocomplete'
import { Field } from 'formik'
import { renderSpecialField } from 'components/FieldHelper'

export default class MultiSelectAutocomplete extends Component {
	static propTypes = {
		addFieldName: PropTypes.string.isRequired, // name of the autocomplete field
		addFieldLabel: PropTypes.string, // label of the autocomplete field
		items: PropTypes.array.isRequired,
		renderSelected: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired, // how to render the selected items
		onAddItem: PropTypes.func.isRequired,
		onRemoveItem: PropTypes.func,
		shortcuts: PropTypes.array,
		shortcutsTitle: PropTypes.string,
		renderExtraCol: PropTypes.bool, // set to false if you want this column completely removed
		addon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),

		//Needed for the autocomplete widget
		//Required: ANET Object Type (Person, Report, etc) to search for.
		objectType: PropTypes.func.isRequired,
		//Optional: The property of the selected object to display.
		valueKey: PropTypes.string,
		//Optional: A function to render each item in the list of suggestions.
		template: PropTypes.func,
		//Optional: Parameters to pass to search function.
		queryParams: PropTypes.object,
		//Optional: GraphQL string of fields to return from search.
		fields: PropTypes.string,
	}

	static defaultProps = {
		addFieldLabel: 'Add item',
		shortcuts: [],
		shortcutsTitle: 'Recents',
		renderExtraCol: true,
	}

	render() {
		const {addFieldName, addFieldLabel, renderSelected, items, onAddItem, onRemoveItem, shortcuts, shortcutsTitle, renderExtraCol, addon, ...autocompleteProps} = this.props
		const renderSelectedWithDelete = React.cloneElement(renderSelected, {onDelete: this.removeItem})
		return (
			<Field
				name={addFieldName}
				label={addFieldLabel}
				component={renderSpecialField}
				excludeValues={items}
				onChange={this.addItem}
				addon={addon}
				extraColElem={renderExtraCol ? this.renderShortcuts() : null}
				widget={
					<NewAutocomplete
						clearOnSelect={true}
						{...autocompleteProps}
					/>
				}
			>
				{renderSelectedWithDelete}
			</Field>
		)
	}

	renderShortcuts = () => {
		const shortcuts = this.props.shortcuts
		return (shortcuts && shortcuts.length > 0 &&
			<div className="shortcut-list">
				<h5>{this.props.shortcutsTitle}</h5>
				{shortcuts.map(shortcut => {
					const shortcutLinkProps = {
						[this.props.objectType.getModelNameLinkTo]: shortcut,
						isLink: false,
						forShortcut: true
					}
					return <Button key={shortcut.uuid} bsStyle="link" onClick={() => this.addItem(shortcut)}>Add <LinkTo {...shortcutLinkProps} /></Button>
				})}
			</div>
		)
	}

	addItem = (newItem) => {
		if (!newItem || !newItem.uuid) {
			return
		}
		if (!this.props.items.find(obj => obj.uuid === newItem.uuid)) {
			this.props.onAddItem(newItem)
		}
	}

	removeItem = (oldItem) => {
		if (this.props.items.find(obj => obj.uuid === oldItem.uuid)) {
			this.props.onRemoveItem(oldItem)
		}
	}
}
