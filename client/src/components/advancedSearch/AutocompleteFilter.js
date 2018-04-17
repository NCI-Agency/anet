import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import 'utils'
import Autocomplete from 'components/Autocomplete'

export default class AutocompleteFilter extends Component {
	static propTypes = {
		//An Autocomplete filter allows users to search the ANET database
		// for existing records and use that records ID as the search term.
		// the filterKey property tells this filter what property to set on the
		// search query. (ie authorUuid, organizationUuid, etc)
		queryKey: PropTypes.string.isRequired,

		//Passed by the SearchFilter row
		//queryParams: PropTypes.any,
		onChange: PropTypes.func,

		//All other properties are passed directly to the Autocomplete.

	}

	constructor(props) {
		super(props)

		this.state = {
			value: props.value || {}
		}

		this.updateFilter()
	}

	componentDidUpdate() {
		this.updateFilter()
	}

	render() {
		let autocompleteProps = Object.without(this.props, 'value', 'queryKey')

		return <Autocomplete
			{...autocompleteProps}
			onChange={this.onChange}
			value={this.state.value}
		/>
	}

	@autobind
	onChange(event) {
		this.setState({value: event}, this.updateFilter)
	}

	@autobind
	toQuery() {
		return {[this.props.queryKey]: this.state.value && this.state.value.uuid}
	}

	@autobind
	updateFilter() {
		let value = this.state.value
		value.toQuery = this.toQuery
		this.props.onChange(value)
	}
}
