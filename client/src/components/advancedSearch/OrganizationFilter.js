import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'
import {Checkbox} from 'react-bootstrap'
import 'utils'

import Autocomplete from 'components/Autocomplete'

import {Organization} from 'models'

export default class OrganizationFilter extends Component {
	static propTypes = {
		//An Autocomplete filter allows users to search the ANET database
		// for existing records and use that records ID as the search term.
		// the filterKey property tells this filter what property to set on the
		// search query. (ie authorId, organizationId, etc)
		queryKey: PropTypes.string.isRequired,
		queryIncludeChildOrgsKey: PropTypes.string.isRequired,

		//Passed by the SearchFilter row
		value: PropTypes.any,
		onChange: PropTypes.func,

		//All other properties are passed directly to the Autocomplete.

	}

	constructor(props) {
		super(props)

		this.state = {
			value: props.value || {},
			includeChildOrgs: props.value.includeChildOrgs || false,
			queryParams: props.queryParams || {},
		}

		this.updateFilter()
	}

	componentDidUpdate() {
		this.updateFilter()
	}

	render() {
		let autocompleteProps = Object.without(this.props, 'value', 'queryKey', 'queryIncludeChildOrgsKey', 'queryParams')

		return <div>
			<Autocomplete
				objectType={Organization}
				valueKey="shortName"
				url="/api/organizations/search"
				placeholder="Filter by organization..."
				queryParams={this.state.queryParams}
				{...autocompleteProps}
				onChange={this.onAutocomplete}
				value={this.state.value}
			/>

			<Checkbox inline checked={this.state.includeChildOrgs} onChange={this.changeIncludeChildren}>
				Include sub-organizations
			</Checkbox>
		</div>
	}

	@autobind
	changeIncludeChildren(event) {
		this.setState({includeChildOrgs: event.target.checked}, this.updateFilter)
	}

	@autobind
	onAutocomplete(event) {
		this.setState({value: event}, this.updateFilter)
	}

	@autobind
	toQuery() {
		return {
			[this.props.queryKey]: this.state.value.id,
			[this.props.queryIncludeChildOrgsKey]: this.state.includeChildOrgs,
		}
	}

	@autobind
	updateFilter() {
		let value = this.state.value
		value.includeChildOrgs = this.state.includeChildOrgs
		value.toQuery = this.toQuery
		this.props.onChange(value)
	}
}
