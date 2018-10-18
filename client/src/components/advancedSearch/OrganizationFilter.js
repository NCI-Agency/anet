import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import {Checkbox} from 'react-bootstrap'
import API from 'api'
import _isEqualWith from 'lodash/isEqualWith'
import utils from 'utils'

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

		//Passed by the SearchFilterDisplay row
		asFormField: PropTypes.bool,

		//All other properties are passed directly to the Autocomplete.

	}

	static defaultProps = {
		asFormField: true
	}

	constructor(props) {
		super(props)

		const value = props.value || {}
		this.state = {
			value: value,
			includeChildOrgs: value.includeChildOrgs || false,
			queryParams: props.queryParams || {},
		}
	}

	componentDidMount() {
		this.updateFilter()
	}

	componentDidUpdate(prevProps, prevState) {
		if (!_isEqualWith(prevProps.value, this.props.value, utils.treatFunctionsAsEqual)) {
			this.setState({
				value: this.props.value,
				includeChildOrgs: this.props.value.includeChildOrgs || false,
			}, this.updateFilter)
		}
	}

	render() {
		let autocompleteProps = Object.without(this.props, 'value', 'queryKey', 'queryIncludeChildOrgsKey', 'queryParams', 'asFormField')
		let msg = this.props.value.shortName
		if (msg && this.state.includeChildOrgs) {
			msg += ", including sub-organizations"
		}

		return (
			!this.props.asFormField ?
				<React.Fragment>{msg}</React.Fragment>
			:
				<div>
					<Autocomplete
						objectType={Organization}
						valueKey="shortName"
						fields={Organization.autocompleteQuery}
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
		)
	}

	@autobind
	changeIncludeChildren(event) {
		this.setState({includeChildOrgs: event.target.checked}, this.updateFilter)
	}

	@autobind
	onAutocomplete(event) {
		if (typeof event === 'object') {
			this.setState({value: event}, this.updateFilter)
		}
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
		if (this.props.asFormField) {
			let {value} = this.state
			if (typeof value === 'object') {
				value.includeChildOrgs = this.state.includeChildOrgs
				value.toQuery = this.toQuery
			}
			this.props.onChange(value)
		}
	}

	@autobind
	deserialize(query, key) {
		if (query[this.props.queryKey]) {
			let getInstanceName = Organization.getInstanceName
			let graphQlQuery = getInstanceName +
				'(id:' + query[this.props.queryKey] + ') { id, shortName }'
			return API.query(graphQlQuery).then(data => {
				if (data[getInstanceName]) {
					const toQueryValue = {[this.props.queryKey]: query[this.props.queryKey]}
					if (query[this.props.queryIncludeChildOrgsKey]) {
						data[getInstanceName].includeChildOrgs = query[this.props.queryIncludeChildOrgsKey]
						toQueryValue[this.props.queryIncludeChildOrgsKey] = query[this.props.queryIncludeChildOrgsKey]
					}
					return {
						key: key,
						value: {
							...data[getInstanceName],
							toQuery: () => toQueryValue
						},
					}
				}
				else {
					return null
				}
			})
		}
		return null
	}

}
