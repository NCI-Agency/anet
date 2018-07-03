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
		// search query. (ie authorId, organizationId, etc)
		queryKey: PropTypes.string.isRequired,

		//Passed by the SearchFilter row
		//queryParams: PropTypes.any,
		onChange: PropTypes.func,

		//Passed by the SearchFilterDisplay row
		asFormField: PropTypes.bool,

		//All other properties are passed directly to the Autocomplete.

	}

	static defaultProps = {
		asFormField: true
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
		let autocompleteProps = Object.without(this.props, 'value', 'queryKey', 'asFormField')
		console.log('autocompletefilter', this.props)
		return (
			!this.props.asFormField ?
				<React.Fragment>{this.props.value[this.props.valueKey]}</React.Fragment>
			:
				<Autocomplete
					{...autocompleteProps}
					onChange={this.onChange}
					value={this.state.value}
				/>
		)
	}

	@autobind
	onChange(event) {
		if (typeof event === 'object') {
			this.setState({value: event}, this.updateFilter)
		}
	}

	@autobind
	toQuery() {
		return {[this.props.queryKey]: this.state.value && this.state.value.id}
	}

	@autobind
	updateFilter() {
		if (this.props.asFormField) {
			let {value} = this.state
			value.toQuery = this.toQuery
			this.props.onChange(value)
		}
	}
}
