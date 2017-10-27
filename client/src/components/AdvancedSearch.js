import React, {Component, PropTypes} from 'react'
import {Button, DropdownButton, MenuItem, Row, Col, FormGroup, FormControl, ControlLabel} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import _isequal from 'lodash.isequal'
import dict from 'dictionary'

import ButtonToggleGroup from 'components/ButtonToggleGroup'
import History from 'components/History'

import ReportStateSearch from 'components/advancedSearch/ReportStateSearch'
import DateRangeSearch from 'components/advancedSearch/DateRangeSearch'
import AutocompleteFilter from 'components/advancedSearch/AutocompleteFilter'
import OrganizationFilter from 'components/advancedSearch/OrganizationFilter'
import SelectSearchFilter from 'components/advancedSearch/SelectSearchFilter'

import {Person, Poam} from 'models'

import REMOVE_ICON from 'resources/delete.png'

export default class AdvancedSearch extends Component {
	static propTypes = {
		onSearch: PropTypes.func,
	}

	@autobind
	setOrganizationFilter(el) {
		this.setState({organizationFilter: el})
	}

	@autobind
	getFilters(context) {
		let filters = {}
		filters.Reports = {
			filters: {
				Author: <AutocompleteFilter
					queryKey="authorId"
					objectType={Person}
					valueKey="name"
					fields={Person.autocompleteQuery}
					template={Person.autocompleteTemplate}
					queryParams={{role: 'ADVISOR'}}
					placeholder="Filter reports by author..."
				/>,
				Attendee: <AutocompleteFilter
					queryKey="attendeeId"
					objectType={Person}
					valueKey="name"
					fields={Person.autocompleteQuery}
					template={Person.autocompleteTemplate}
					placeholder="Filter reports by attendee..."
				/>,
				Organization: <OrganizationFilter
					queryKey="orgId"
					queryIncludeChildOrgsKey="includeOrgChildren"
				/>,
				"Engagement Date": <DateRangeSearch queryKey="engagementDate" />,
				"Release Date": <DateRangeSearch queryKey="releasedAt" />,
				Location: <AutocompleteFilter
					queryKey="locationId"
					valueKey="name"
					placeholder="Filter reports by location..."
					url="/api/locations/search"
				/>,
				State: <ReportStateSearch />,
				Atmosphere: <SelectSearchFilter
					queryKey="atmosphere"
					values={["POSITIVE","NEUTRAL","NEGATIVE"]}
				/>,
				Tag: <AutocompleteFilter
					queryKey="tagId"
					valueKey="name"
					placeholder="Filter reports by tag..."
					url="/api/tags/search"
				/>,
			}
		}

		let poamShortName = dict.lookup('POAM_SHORT_NAME')
		filters.Reports.filters[poamShortName] =
			<AutocompleteFilter
				queryKey="poamId"
				objectType={Poam}
				fields={Poam.autocompleteQuery}
				template={Poam.autocompleteTemplate}
				valueKey="shortName"
				placeholder={`Filter reports by ${poamShortName}...`}
			/>


		let countries = dict.lookup('countries')
		filters.People = {
			filters: {
				Organization: <OrganizationFilter
					queryKey="orgId"
					queryIncludeChildOrgsKey="includeChildOrgs"
				/>,
				Role: <SelectSearchFilter
					queryKey="role"
					values={["ADVISOR","PRINCIPAL"]}
					labels={[dict.lookup('ADVISOR_PERSON_TITLE'), dict.lookup('PRINCIPAL_PERSON_TITLE')]}
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={["ACTIVE","INACTIVE","NEW_USER"]}
				/>,
				Location: <AutocompleteFilter
					queryKey="locationId"
					valueKey="name"
					placeholder="Filter by location..."
					url="/api/locations/search"
				/>,
				Nationality: <SelectSearchFilter
					queryKey="country"
					values={countries}
					labels={countries}
				/>,
			}
		}

		filters.Organizations = {
			filters: {
				"Organization type": <SelectSearchFilter
					queryKey="type"
					values={["ADVISOR_ORG", "PRINCIPAL_ORG"]}
					labels={[dict.lookup('ADVISOR_ORG_NAME'), dict.lookup('PRINCIPAL_ORG_NAME')]}
				  />,
			}
		}

		filters.Positions = {
			filters: {
				"Position type": <SelectSearchFilter
					queryKey="type"
					values={["ADVISOR", "PRINCIPAL"]}
					labels={[dict.lookup('ADVISOR_POSITION_NAME'), dict.lookup('PRINCIPAL_POSITION_NAME')]}
				/>,
				Organization: <OrganizationFilter
					queryKey="organizationId"
					queryIncludeChildOrgsKey="includeChildrenOrgs"
					ref={this.setOrganizationFilter}
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={["ACTIVE","INACTIVE"]}
				/>,
				Location: <AutocompleteFilter
					queryKey="locationId"
					valueKey="name"
					placeholder="Filter by location..."
					url="/api/locations/search"
				/>,
				"Is filled?": <SelectSearchFilter
					queryKey="isFilled"
					values={["true","false"]}
					labels={["Yes","No"]}
				/>,
			}
		}

		//No filters on Location
		filters.Locations = {filters: {}}

		//Poam filters
		filters[poamShortName + 's'] = {
			filters: {
				Organization: <OrganizationFilter
					queryKey="responsibleOrgId"
					queryIncludeChildOrgsKey="includeChildrenOrgs"
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={["ACTIVE", "INACTIVE"]}
					labels={["Active", "Inactive"]}
				/>,
			}
		}
		return filters
	}

	constructor(props, context) {
		super(props, context)

		let query = props || {}
		this.ALL_FILTERS = this.getFilters(context)
		this.state = {
			objectType: query.objectType || "Reports",
			text: query.text || "",
			filters: query.filters || [],
		}
	}

	componentWillReceiveProps(props, nextContext) {
		if (props.query) {
			this.setState(props.query)
		}
		if (nextContext !== this.context) {
			this.ALL_FILTERS = this.getFilters(nextContext)
		}
	}

	render() {
		let {objectType, text, filters} = this.state
		//console.log("RENDER AdvancedSearch", objectType, text, filters)
		let filterDefs = this.ALL_FILTERS[this.state.objectType].filters
		let existingKeys = filters.map(f => f.key)
		let moreFiltersAvailable = existingKeys.length < Object.keys(filterDefs).length

		return <div className="advanced-search form-horizontal">
			<FormGroup style={{textAlign: "center"}}>
				<ButtonToggleGroup value={objectType} onChange={this.changeObjectType}>
					{Object.keys(this.ALL_FILTERS).map(type =>
						<Button key={type} value={type}>{type}</Button>
					)}
				</ButtonToggleGroup>
			</FormGroup>

			<SearchFilter label="Search term" onRemove={() => this.setState({text: ""})}>
				<FormControl value={text} onChange={this.setText} />
			</SearchFilter>

			{filters.map(filter =>
				<SearchFilter key={filter.key} query={this.state} filter={filter} onRemove={this.removeFilter} element={filterDefs[filter.key]} organizationFilter={this.state.organizationFilter} />
			)}

			<Row>
				<Col xs={5} xsOffset={3}>
					{moreFiltersAvailable ?
						<DropdownButton bsStyle="link" title="+ Add another filter" onSelect={this.addFilter} id="addFilterDropdown">
							{Object.keys(filterDefs).map(filterKey =>
								<MenuItem disabled={existingKeys.indexOf(filterKey) > -1} eventKey={filterKey} key={filterKey} >{filterKey}</MenuItem>
							)}
						</DropdownButton>
						:
						"No additional filters available"
					}
				</Col>
			</Row>

			<Row>
				<div className="pull-right">
					<Button onClick={this.props.onCancel} style={{marginRight: 20}}>Cancel</Button>
					<Button bsStyle="primary" onClick={this.performSearch} style={{marginRight: 20}}>Search</Button>
				</div>
			</Row>
		</div>
	}

	@autobind
	changeObjectType(objectType) {
		this.setState({objectType, filters: []}, () => this.addFilter())
	}

	@autobind
	addFilter(filterKey) {
		let filters = this.state.filters
		let filterDefs = this.ALL_FILTERS[this.state.objectType].filters
		if (!filterKey) {
			filterKey = Object.keys(filterDefs)[0]
		}

		if (filterKey) {
			filters.push({key: filterKey})
			this.setState({filters})
		}
	}

	@autobind
	removeFilter(filter) {
		let filters = this.state.filters
		filters.splice(filters.indexOf(filter), 1)
		this.setState({filters})

		if (filter.key === "Organization") {
			this.setOrganizationFilter(null)
		} else if (filter.key === "Position type") {
			let organizationFilter = this.state.organizationFilter
			if (organizationFilter) {
				organizationFilter.setState({queryParams: {}})
			}
		}
	}

	@autobind
	setText(event) {
		this.setState({text: event.target.value})
	}

	@autobind
	performSearch() {
		let queryState = {objectType: this.state.objectType, filters: this.state.filters, text: this.state.text}
		if (!this.props.onSearch || this.props.onSearch(queryState) !== false) {
			History.push('/search', {advancedSearch: queryState})
		}
	}
}

class SearchFilter extends Component {
	static propTypes = {
		label: PropTypes.string,
		onRemove: PropTypes.func,

		query: PropTypes.object,
		filter: PropTypes.object,
	}

	render() {
		let {label, onRemove, query, filter, children, element} = this.props

		if (query) {
			label = filter.key
			children = React.cloneElement(
				element,
				{value: filter.value || "", onChange: this.onChange}
			)
		}


		return <FormGroup>
			<Col xs={3}><ControlLabel>{label}</ControlLabel></Col>
			<Col xs={8}>{children}</Col>
			<Col xs={1}>
				<Button bsStyle="link" onClick={() => onRemove(this.props.filter)}>
					<img src={REMOVE_ICON} height={14} alt="Remove this filter" />
				</Button>
			</Col>
		</FormGroup>
	}

	@autobind
	onChange(value) {
		let filter = this.props.filter
		filter.value = value

		if (filter.key === "Position type") {
			let organizationFilter = this.props.organizationFilter
			if (organizationFilter) {
				let positionType = filter.value.value || ""
				if (positionType === "PRINCIPAL") {
					organizationFilter.setState({queryParams: {type: "PRINCIPAL_ORG"}})
				} else if (positionType === "ADVISOR") {
					organizationFilter.setState({queryParams: {type: "ADVISOR_ORG"}})
				} else {
					organizationFilter.setState({queryParams: {}})
				}
			}
		}
	}
}
