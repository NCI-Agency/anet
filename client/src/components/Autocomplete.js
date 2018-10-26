import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {FormControl} from 'react-bootstrap'
import Autosuggest from 'react-autosuggest-ie11-compatible'
import autobind from 'autobind-decorator'
import _debounce from 'lodash/debounce'
import _isEqual from 'lodash/isEqual'
import _isEmpty from 'lodash/isEmpty'

import API from 'api'

import './Autocomplete.css'

import SEARCH_ICON from 'resources/search.png'

export default class Autocomplete extends Component {
	static propTypes = {
		value: PropTypes.oneOfType([
			PropTypes.object,
			PropTypes.array,
			PropTypes.string,
		]),

		//The property of the selected object to display.
		valueKey: PropTypes.string,

		//If this Autocomplete should clear the text area after a valid selection.
		clearOnSelect: PropTypes.bool,

		//Optional: A function to render each item in the list of suggestions.
		template: PropTypes.func,

		//Function to call when a selection is made.
		onChange: PropTypes.func,

		//Optional: Function to call when the error state changes.
		// Specifically if the user leaves invalid text in the component.
		onErrorChange: PropTypes.func,

		//Optional: Parameters to pass to search function.
		queryParams: PropTypes.object,

		//Optional: ANET Object Type (Person, Report, etc) to search for.
		objectType: PropTypes.func,

		//GraphQL string of fields to return from search.
		fields: PropTypes.string,
	}

	constructor(props) {
		super(props)

		this.fetchSuggestionsDebounced = _debounce(this.fetchSuggestions, 200)
		this.noSuggestions = <span><i>No suggestions found</i></span>

		const selectedIds = this._getSelectedIds(props)
		const value = this._getValue(props)
		const stringValue = this.getStringValue(value, props.valueKey)

		this.state = {
			suggestions: [],
			selectedIds: selectedIds,
			stringValue: stringValue,
			originalStringValue: stringValue,
		}
	}

	@autobind
	_getValue(props) {
		const {value} = props
		if (Array.isArray(value)) {
			return {}
		}

		return value
	}

	@autobind
	_getSelectedIds(props) {
		const {value} = props
		if (Array.isArray(value)) {
			return value.map(object => object.id)
		}

		return []
	}

	componentDidUpdate(prevProps, prevState) {
		//Ensure that we update the stringValue if we get an updated value
		if (!_isEqual(prevProps.value, this.props.value)) {
			const selectedIds = this._getSelectedIds(this.props)
			const value = this._getValue(this.props)
			const stringValue = this.getStringValue(value, this.props.valueKey)
			this.setState({
				selectedIds: selectedIds,
				stringValue: stringValue,
				originalStringValue: stringValue
			})
		}
	}

	render() {
		let inputProps = Object.without(this.props, 'clearOnSelect', 'valueKey', 'template', 'queryParams', 'objectType', 'fields', 'onErrorChange')
		inputProps.value = this.state.stringValue
		inputProps.onChange = this.onInputChange
		inputProps.onBlur = this.onInputBlur
		const { valueKey } = this.props
		const renderSuggestion = this.props.template ? this.renderSuggestionTemplate : this.renderSuggestion

		return <div style={{position: 'relative'}} ref={(el) => this.container = el}>
			<img src={SEARCH_ICON} className="form-control-icon" alt="" onClick={this.focus} />

			<Autosuggest
				suggestions={this.state.suggestions}
				onSuggestionsFetchRequested={this.fetchSuggestionsDebounced}
				onSuggestionsClearRequested={this.clearSuggestions}
				onSuggestionSelected={this.onSuggestionSelected}
				getSuggestionValue={this.getStringValue.bind(this, valueKey)}
				inputProps={inputProps}
				renderInputComponent={this.renderInputComponent}
				renderSuggestion={renderSuggestion}
				focusInputOnSuggestionClick={false}
			/>
		</div>
	}

	@autobind
	renderSuggestion(suggestion) {
		return _isEmpty(suggestion)
				? this.noSuggestions
				: <span>{this.getStringValue(suggestion, this.props.valueKey)}</span>
	}

	@autobind
	renderSuggestionTemplate(suggestion) {
		return _isEmpty(suggestion)
				? this.noSuggestions
				: this.props.template(suggestion)
	}

	@autobind
	renderInputComponent(inputProps) {
		return <FormControl {...inputProps} />
	}

	@autobind
	getStringValue(suggestion, valueKey) {
		if (typeof suggestion === 'object') {
			return suggestion[valueKey] || ''
		}
		return suggestion
	}

	@autobind
	_setFilteredSuggestions(list) {
		if (this.state.selectedIds) {
			list = list.filter(suggestion => suggestion && suggestion.id && this.state.selectedIds.indexOf(suggestion.id) === -1)
		}
		if (!list.length) {
			list = [{}] // use an empty object so we render the 'noSuggestions' text
		}
		this.setState({suggestions: list})
	}

	@autobind
	fetchSuggestions(value) {
		let resourceName = this.props.objectType.resourceName
		let listName = this.props.objectType.listName
		let graphQlQuery = listName + ' (query: $query) { '
				+ 'list { ' + this.props.fields + '}'
				+ '}'
		let variableDef = '($query: ' + resourceName + 'SearchQueryInput)'
		let queryVars = {text: value.value + "*", pageNum: 0, pageSize: 25}
		if (this.props.queryParams) {
			Object.assign(queryVars, this.props.queryParams)
		}
		API.query(graphQlQuery, {query: queryVars}, variableDef, {disableSubmits: false}).then(data => {
			this._setFilteredSuggestions(data[listName].list)
		})
	}

	@autobind
	clearSuggestions() {
		this.setState({suggestions: []})
	}

	@autobind
	onSuggestionSelected(event, {suggestion, suggestionValue}) {
		event.stopPropagation()
		event.preventDefault()

		let stringValue = this.props.clearOnSelect ? '' : suggestionValue
		this.currentSelected = suggestion
		this.setState({stringValue: stringValue})

		if (this.props.onChange) {
			this.props.onChange(suggestion)
		}

		if (this.props.onErrorChange) {
			//Clear any error state.
			this.props.onErrorChange(false)
		}
	}

	@autobind
	onInputChange(event) {
		if (!event.target.value) {
			if (!this.props.clearOnSelect) {
				//If the component had a value, and the user just cleared the input
				// then set the selection to an empty object. We need to do this because we need to
				// tell the server that value was cleared, rather than that there was no change.
				//This is so the server sees that the value is not-null, but that id is NULL.
				//Which tells the server specifically that the id should be set to NULL on the foreignKey
				this.onSuggestionSelected(event, {suggestion: {}, suggestionValue: ''})
			}
			if (this.props.onErrorChange) {
				this.props.onErrorChange(false) //clear any errors.
			}
		}

		//The user is typing!
		this.currentSelected = null
		this.setState({stringValue: event.target.value})
		event.stopPropagation()
	}

	@autobind
	onInputBlur(event) {
		if (this.currentSelected) { return }
		// If the user clicks off this Autocomplete with a value left in the Input Box
		// Send that up to the parent. The user probably thinks they just 'set' this value
		// so we should oblige, _unless_ the value is the original string value that was
		// passed in. In this case, they probably tabbed past the field, so we should
		// do nothing.
		let val = this.state.stringValue
		if (val) {
			if (val === this.state.originalStringValue) { return }

			this.setState({stringValue: val})
			if (this.props.onErrorChange) {
				this.props.onErrorChange(true, val)
			} else if (this.props.onChange) {
				this.props.onChange(val)
			}
		}
	}

	@autobind
	focus() {
		if (!this.container) { return }
		this.container.querySelector('input').focus()
	}
}
