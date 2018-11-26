import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import { Field, FieldArray } from 'redux-form'
import { Button } from 'react-bootstrap'

import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import NewAutocomplete from 'components/NewAutocomplete'
import { renderSpecialField } from 'components/FieldHelper'

export default class MultiSelectAutocomplete extends Component {
	static propTypes = {
		addFieldName: PropTypes.string.isRequired, // name of the autocomplete field
		addFieldLabel: PropTypes.string, // label of the autocomplete field
		arrayFieldName: PropTypes.string.isRequired, // name of the field to contain the array of items
		arrayFieldProps: PropTypes.object,
		items: PropTypes.array.isRequired,
		onAddItem: PropTypes.func.isRequired,
		onRemoveItem: PropTypes.func,
		shortcuts: PropTypes.array,
		shortcutsTitle: PropTypes.string,

		//Needed for the autocomplete widget
		//Optional: ANET Object Type (Person, Report, etc) to search for.
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
		arrayFieldProps: {},
		shortcuts: [],
		shortcutsTitle: 'Recents',
	}

	render() {
		const {addFieldName, addFieldLabel, arrayFieldName, arrayFieldProps, items, onAddItem, onRemoveItem, shortcuts, shortcutsTitle, ...autocompleteProps} = this.props

		return <React.Fragment>
			<Field
				name={addFieldName}
				label={addFieldLabel}
				component={renderSpecialField}
				excludeValues={items}
				onChange={this.addItem}
				extraColElem={this.renderShortcuts()}>
				<NewAutocomplete
					clearOnSelect={true}
					{...autocompleteProps}
				/>
			</Field>
			<FieldArray
				name={arrayFieldName}
				component={this.renderArrayField}
				{...arrayFieldProps}
				/>
		</React.Fragment>
	}

	@autobind
	renderArrayField(field) {
		return (
			this.props.objectType.renderArrayFieldTemplate(field, this.removeItem)
		)
	}

	@autobind
	renderShortcuts() {
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

	@autobind
	addItem(newItem) {
		if (!newItem || !newItem.uuid) {
			return
		}
		if (!this.props.items.find(obj => obj.uuid === newItem.uuid)) {
			this.props.onAddItem(newItem)
		}
	}

	@autobind
	removeItem(item, index) {
		if(this.props.items[index] !== 'undefined') {
			this.props.onRemoveItem(item, index)
		}
	}
}
