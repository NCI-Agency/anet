import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {FormControl} from 'react-bootstrap'
import Autosuggest from 'react-autosuggest'
import autobind from 'autobind-decorator'
import _debounce from 'lodash/debounce'
import _isEqual from 'lodash/isEqual'

import API from 'api'
import utils from 'utils'

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

		const selectedIds = this._getSelectedIds(props)
		const value = this._getValue(props)
		const stringValue = this.getStringValue(value, props.valueKey)

		this.state = {
			suggestions: [],
			noSuggestions: false,
			selectedIds: selectedIds,
			value: value,
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
		let inputProps = Object.without(this.props, 'url', 'clearOnSelect', 'valueKey', 'template', 'queryParams', 'objectType', 'fields', 'onErrorChange')
		inputProps.value = this.state.stringValue
		inputProps.onChange = this.onInputChange
		inputProps.onBlur = this.onInputBlur
		const { valueKey } = this.props

		return <div style={{position: 'relative'}} ref={(el) => this.container = el}>
			<img src={SEARCH_ICON} className="form-control-icon" alt="" onClick={this.focus} />

			<Autosuggest
				suggestions={this.state.noSuggestions ? [{}] : this.state.suggestions}
				onSuggestionsFetchRequested={this.fetchSuggestionsDebounced}
				onSuggestionsClearRequested={this.clearSuggestions}
				onSuggestionSelected={this.onSuggestionSelected}
				getSuggestionValue={this.getStringValue.bind(this, valueKey)}
				inputProps={inputProps}
				renderInputComponent={this.renderInputComponent}
				renderSuggestion={this.renderSuggestion}
				focusInputOnSuggestionClick={false}
			/>
		</div>
	}

	@autobind
	renderSuggestion(suggestion) {
		if (this.state.noSuggestions) {
			return <span><i>No suggestions found</i></span>
		}

		let template = this.props.template
		if (template) {
			return template(suggestion)
		} else {
			return <span>{this.getStringValue(suggestion, this.props.valueKey)}</span>
		}
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
		let noSuggestions = list.length === 0
		this.setState({suggestions: list, noSuggestions})
	}

	@autobind
	fetchSuggestions(value) {
		if (this.props.url) {
			let url = this.props.url + '?text=' + value.value + "*"

			let queryParams = this.props.queryParams || {}
			if (!queryParams.pageSize) {
				queryParams.pageSize = 25
			}

			if (queryParams) {
				url += '&' + utils.createUrlParams(queryParams)
			}

			API.fetch(url, {showLoader: false}).then(data => {
				this._setFilteredSuggestions(data.list)
			})
		} else {
			let resourceName = this.props.objectType.resourceName
			let listName = this.props.objectType.listName
			let graphQlQuery = listName + '(f:search, query: $query) { '
					+ 'list { ' + this.props.fields + '}'
					+ '}'
			let variableDef = '($query: ' + resourceName + 'SearchQuery)'
			let queryVars = {text: value.value + "*", pageSize: 25}
			if (this.props.queryParams) {
				Object.assign(queryVars, this.props.queryParams)
			}

			API.query(graphQlQuery, {query: queryVars}, variableDef).then(data => {
				this._setFilteredSuggestions(data[listName].list)
			})
		}
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
//		if (this.state.noSuggestions && stringValue !== ''){
//			return
//		}
		this.currentSelected = suggestion
		this.setState({value: suggestion, stringValue})

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

			this.setState({value: val, stringValue: val})
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
