import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Button, DropdownButton, MenuItem, Row, Col, Form, FormGroup, FormControl, ControlLabel} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'

import Settings from 'Settings'
import ButtonToggleGroup from 'components/ButtonToggleGroup'

import ReportStateSearch from 'components/advancedSearch/ReportStateSearch'
import DateRangeSearch from 'components/advancedSearch/DateRangeSearch'
import AutocompleteFilter from 'components/advancedSearch/AutocompleteFilter'
import OrganizationFilter from 'components/advancedSearch/OrganizationFilter'
import PositionTypeSearchFilter from 'components/advancedSearch/PositionTypeSearchFilter'
import SelectSearchFilter from 'components/advancedSearch/SelectSearchFilter'
import TextInputFilter from 'components/advancedSearch/TextInputFilter'

import {Location, Person, Task, Position, Organization} from 'models'

import REMOVE_ICON from 'resources/delete.png'

import { withRouter } from 'react-router-dom'
import _isEqual from 'lodash/isEqual'
import _cloneDeepWith from 'lodash/cloneDeepWith'

const taskFilters = props => {
	const taskFiltersObj = {
		Organization: <OrganizationFilter
						queryKey="responsibleOrgId"
						queryIncludeChildOrgsKey="includeChildrenOrgs"/>,
		Status: <SelectSearchFilter
						queryKey="status"
						values={[Task.STATUS.ACTIVE, Task.STATUS.INACTIVE]}
						labels={["Active", "Inactive"]}/>
	}
	const projectedCompletion = Settings.fields.task.projectedCompletion
	if (projectedCompletion)
		taskFiltersObj[projectedCompletion.label] = <DateRangeSearch
			queryKey="projectedCompletion" />
	const plannedCompletion = Settings.fields.task.plannedCompletion
	if (plannedCompletion)
		taskFiltersObj[plannedCompletion.label] = <DateRangeSearch
			queryKey="plannedCompletion" />
	const customEnum1 = Settings.fields.task.customFieldEnum1
	if (customEnum1)
		taskFiltersObj[customEnum1.label] = <SelectSearchFilter
			queryKey="projectStatus"
			values={Object.keys(customEnum1.enum)}
			labels={Object.values(customEnum1.enum)} />
	const customField = Settings.fields.task.customField
	if (customField)
		taskFiltersObj[customField.label] = <TextInputFilter
			queryKey="customField" />

	return taskFiltersObj
}

class AdvancedSearch extends Component {
	static propTypes = {
		onSearch: PropTypes.func,
	}

	@autobind
	setOrganizationFilter(el) {
		this.setState({organizationFilter: el})
	}

	@autobind
	getFilters() {
		const filters = {}
		filters.Reports = {
			filters: {
				Author: <AutocompleteFilter
					queryKey="authorId"
					objectType={Person}
					valueKey="name"
					fields={Person.autocompleteQuery}
					template={Person.autocompleteTemplate}
					queryParams={{role: Person.ROLE.ADVISOR}}
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
				"Author Position": <AutocompleteFilter
					queryKey="authorPositionId"
					objectType={Position}
					valueKey="name"
					fields={Position.autocompleteQuery}
					template={Position.autocompleteTemplate}
					queryParams={{type: [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]}}
					placeholder="Filter reports by author position..."
				/>,
				"Attendee Position": <AutocompleteFilter
					queryKey="attendeePositionId"
					objectType={Position}
					valueKey="name"
					fields={Position.autocompleteQuery}
					template={Position.autocompleteTemplate}
					placeholder="Filter reports by attendee position..."
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
				Atmospherics: <SelectSearchFilter
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

		const taskShortLabel = Settings.fields.task.shortLabel
		filters.Reports.filters[taskShortLabel] =
			<AutocompleteFilter
				queryKey="taskId"
				objectType={Task}
				fields={Task.autocompleteQuery}
				template={Task.autocompleteTemplate}
				valueKey="shortName"
				placeholder={`Filter reports by ${taskShortLabel}...`}
			/>


		const countries = Settings.fields.advisor.person.countries || [] // TODO: make search also work with principal countries
		filters.People = {
			filters: {
				Organization: <OrganizationFilter
					queryKey="orgId"
					queryIncludeChildOrgsKey="includeChildOrgs"
				/>,
				Role: <SelectSearchFilter
					queryKey="role"
					values={[Person.ROLE.ADVISOR,Person.ROLE.PRINCIPAL]}
					labels={[Settings.fields.advisor.person.name, Settings.fields.principal.person.name]}
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Person.STATUS.ACTIVE, Person.STATUS.INACTIVE, Person.STATUS.NEW_USER]}
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
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Organization.STATUS.ACTIVE, Organization.STATUS.INACTIVE]}
				/>,
				"Organization type": <SelectSearchFilter
					queryKey="type"
					values={[Organization.TYPE.ADVISOR_ORG, Organization.TYPE.PRINCIPAL_ORG]}
					labels={[Settings.fields.advisor.org.name, Settings.fields.principal.org.name]}
				  />,
			}
		}

		filters.Positions = {
			filters: {
				"Position type": <PositionTypeSearchFilter
					queryKey="type"
					values={[Position.TYPE.ADVISOR, Position.TYPE.PRINCIPAL]}
					labels={[Settings.fields.advisor.position.name, Settings.fields.principal.position.name]}
				/>,
				Organization: <OrganizationFilter
					queryKey="organizationId"
					queryIncludeChildOrgsKey="includeChildrenOrgs"
					ref={this.setOrganizationFilter}
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Position.STATUS.ACTIVE, Position.STATUS.INACTIVE]}
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

		filters.Locations = {
			filters: {
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Location.STATUS.ACTIVE, Location.STATUS.INACTIVE]}
				/>,
			}
		}

		//Task filters
		filters[pluralize(taskShortLabel)] = {
			filters: taskFilters()
		}

		return filters
	}

	constructor(props) {
		super(props)

		const query = props || {}
		this.ALL_FILTERS = this.getFilters()
		this.state = {
			objectType: query.objectType || "Reports",
			text: query.text || "",
			filters: query.filters || [],
		}
	}

	static getDerivedStateFromProps(props, state) {
		if (props.query) {
			return props.query
		}
		return null
	}

	render() {
		const {objectType, text, filters} = this.state
		//console.log("RENDER AdvancedSearch", objectType, text, filters)
		const filterDefs = this.ALL_FILTERS[this.state.objectType].filters
		const existingKeys = filters.map(f => f.key)
		const moreFiltersAvailable = existingKeys.length < Object.keys(filterDefs).length

		return <div className="advanced-search form-horizontal">
			<Form onSubmit={this.onSubmit}>
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
						<Button bsStyle="primary" type="submit" onClick={this.onSubmit} style={{marginRight: 20}}>Search</Button>
					</div>
				</Row>
			</Form>
		</div>
	}

	@autobind
	changeObjectType(objectType) {
		this.setState({objectType, filters: []}, () => this.addFilter())
	}

	@autobind
	addFilter(filterKey) {
		if (filterKey) {
			let {filters} = this.state
			filters.push({key: filterKey})
			this.setState({filters})
		}
	}

	@autobind
	removeFilter(filter) {
		let {filters} = this.state
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
	resolveToQuery(value) {
		if (typeof value === 'function') {
			return value()
		}
	}

	@autobind
	onSubmit(event) {
		const resolvedFilters = _cloneDeepWith(this.state.filters, this.resolveToQuery)
		const queryState = {objectType: this.state.objectType, filters: resolvedFilters, text: this.state.text}
		if (!this.props.onSearch || this.props.onSearch(queryState) !== false) {
			this.props.history.push({
				pathname: '/search',
				state: {advancedSearch: queryState}
			})
			event.preventDefault()
			event.stopPropagation()
		}
	}
}

export default withRouter(AdvancedSearch)

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
				if (positionType === Position.TYPE.PRINCIPAL) {
					organizationFilter.setState({queryParams: {type: Organization.TYPE.PRINCIPAL_ORG}})
				} else if (positionType === Position.TYPE.ADVISOR) {
					organizationFilter.setState({queryParams: {type: Organization.TYPE.ADVISOR_ORG}})
				} else {
					organizationFilter.setState({queryParams: {}})
				}
			}
		}
	}
}
