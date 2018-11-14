import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Button, DropdownButton, MenuItem, Row, Col, Form, FormGroup, FormControl, ControlLabel} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import _isEqual from 'lodash/isEqual'
import _isEqualWith from 'lodash/isEqualWith'
import _cloneDeepWith from 'lodash/cloneDeepWith'
import _clone from 'lodash/clone'

import ButtonToggleGroup from 'components/ButtonToggleGroup'
import searchFilters , { POSTITION_POSITION_TYPE_FILTER_KEY, POSTITION_ORGANIZATION_FILTER_KEY } from 'components/SearchFilters'

import REMOVE_ICON from 'resources/delete.png'

import {Position, Organization} from 'models'
import Settings from 'Settings'
import utils from 'utils'

function updateOrganizationFilterState(organizationFilter, positionType) {
	if (organizationFilter) {
		if (positionType === Position.TYPE.PRINCIPAL) {
			organizationFilter.setState({queryParams: {type: Organization.TYPE.PRINCIPAL_ORG}})
		} else if (positionType === Position.TYPE.ADVISOR) {
			organizationFilter.setState({queryParams: {type: Organization.TYPE.ADVISOR_ORG}})
		} else {
			organizationFilter.setState({queryParams: {}})
		}
	}
}

export default class AdvancedSearchForm extends Component {
	static propTypes = {
		onSearchCallback: PropTypes.func.isRequired,
		onCancel: PropTypes.func,
		query: PropTypes.shape({
			text: PropTypes.string,
			filters: PropTypes.any,
			objectType: PropTypes.string
		}),
		searchObjectTypes: PropTypes.array,
		text: PropTypes.string,
		hideObjectType: PropTypes.bool,
		hideTextField: PropTypes.bool,
	}

	static defaultProps = {
		hideObjectType: false,
		hideTextField: true,
	}

	constructor(props) {
		super(props)

		this.ALL_FILTERS = searchFilters.searchFilters(this.setPositionTypeFilter, this.setOrganizationFilter)
		this.state = {
			objectType: "",
			text: "",
			filters: [],
		}
	}

	@autobind
	setPositionTypeFilter(positionTypeFilter) {
		this.updateOrganizationFilter(positionTypeFilter, this.state.organizationFilter)
		this.setState({positionTypeFilter: positionTypeFilter})
	}

	@autobind
	setOrganizationFilter(organizationFilter) {
		this.updateOrganizationFilter(this.state.positionTypeFilter, organizationFilter)
		this.setState({organizationFilter: organizationFilter})
	}

	@autobind
	updateOrganizationFilter(positionTypeFilter, organizationFilter) {
		const positionType = positionTypeFilter ? positionTypeFilter.state.value.value : ""
		updateOrganizationFilterState(organizationFilter, positionType)
	}

	componentDidMount() {
		this.setState({
			objectType: this.props.query.objectType,
			text: this.props.text,
			filters: this.props.query.filters ? this.props.query.filters.slice() : [],
		})
	}

	componentDidUpdate(prevProps, prevState) {
		if (!_isEqualWith(prevProps.query, this.props.query, utils.treatFunctionsAsEqual)) {
			this.setState(this.props.query)
		}
		if (!_isEqual(prevProps.text, this.props.text)) {
			this.setState({text: this.props.text})
		}
	}

	render() {
		const {objectType, text, filters} = this.state
		const filterDefs = this.state.objectType ? this.ALL_FILTERS[this.state.objectType].filters : {}
		const existingKeys = filters.map(f => f.key)
		const moreFiltersAvailable = existingKeys.length < Object.keys(filterDefs).length
		return <div className="advanced-search form-horizontal">
			<Form onSubmit={this.onSubmit}>
			{this.props.hideObjectType ?
				<FormControl defaultValue={this.state.objectType} className="hidden" /> :
				<FormGroup>
					<Col xs={11} style={{textAlign: "center"}}>
						<ButtonToggleGroup value={objectType} onChange={this.changeObjectType}>
							{Object.keys(this.ALL_FILTERS).map(type =>
							this.props.searchObjectTypes.indexOf(type) !== -1 && <Button key={type} value={type}>{type}</Button>
							)}
						</ButtonToggleGroup>
					</Col>
					<Col xs={1}>
						<Button bsStyle="link" onClick={this.clearObjectType}>
							<img src={REMOVE_ICON} height={14} alt="Clear type" />
						</Button>
					</Col>
				</FormGroup>
			}

				{this.props.hideTextField ?
					<FormControl defaultValue={this.props.text} className="hidden" /> :
					<FormGroup>
						<Col xs={3}></Col>
						<Col xs={8}>
							<FormControl placeholder="Search terms" onChange={this.onChangeText} />
						</Col>
						<Col xs={1}></Col>
					</FormGroup>
				}

				{filters.map(filter =>
					filterDefs[filter.key] && <SearchFilter key={filter.key} filter={filter} onRemove={this.removeFilter} element={filterDefs[filter.key]} organizationFilter={this.state.organizationFilter} />
				)}

				<Row>
					<Col xs={6} xsOffset={3}>
					{!this.state.objectType ? "To add filters, first pick a type above" :
						!moreFiltersAvailable ? "No additional filters available" :
							<DropdownButton bsStyle="link" title="+ Add another filter" onSelect={this.addFilter} id="addFilterDropdown">
								{Object.keys(filterDefs).map(filterKey =>
									<MenuItem disabled={existingKeys.indexOf(filterKey) > -1} eventKey={filterKey} key={filterKey} >{filterKey}</MenuItem>
								)}
							</DropdownButton>
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
	onChangeText(event) {
		this.setState({text: event.target.value})
	}

	@autobind
	onSubmit(event) {
		const resolvedFilters = _cloneDeepWith(this.state.filters, this.resolveToQuery)
		const queryState = {objectType: this.state.objectType, filters: resolvedFilters, text: this.state.text}
		// Use the search queryState
		this.props.onSearchCallback(queryState)
		event.preventDefault()
		event.stopPropagation()
	}

	@autobind
	changeObjectType(objectType) {
		this.setState({objectType, filters: []}, () => this.addFilter())
	}

	@autobind
	clearObjectType() {
		this.changeObjectType("")
	}

	@autobind
	addFilter(filterKey) {
		if (filterKey) {
			let {filters} = this.state
			const newFilters = filters.slice()
			newFilters.push({key: filterKey})
			this.setState({filters: newFilters})
		}
	}

	@autobind
	removeFilter(filter) {
		let {filters} = this.state
		const newFilters = filters.slice()
		newFilters.splice(newFilters.indexOf(filter), 1)
		this.setState({filters: newFilters})

		if (filter.key === POSTITION_ORGANIZATION_FILTER_KEY) {
			this.setOrganizationFilter(null)
		} else if (filter.key === POSTITION_POSITION_TYPE_FILTER_KEY) {
			this.setPositionTypeFilter(null)
		}
	}

	@autobind
	setText(event) {
		this.setState({text: event.target.value})
	}

	@autobind
	resolveToQuery(value) {
		if (typeof value === 'function') {
			return _clone(value())
		}
	}


}


class SearchFilter extends Component {
	static propTypes = {
		onRemove: PropTypes.func,
		filter: PropTypes.object,
		organizationFilter: PropTypes.object,
		element: PropTypes.shape({
			component: PropTypes.func.isRequired,
			props: PropTypes.object,
		})
	}

	render() {
		const {onRemove, filter, element} = this.props
		const label = filter.key
		const ChildComponent = element.component

		return <FormGroup>
			<Col xs={3}><ControlLabel>{label}</ControlLabel></Col>
			<Col xs={8}>
				<ChildComponent
					value={filter.value || ""}
					onChange={this.onChange}
					{...element.props}
				/>
			</Col>
			<Col xs={1}>
				<Button bsStyle="link" onClick={() => onRemove(this.props.filter)}>
					<img src={REMOVE_ICON} height={14} alt="Remove this filter" />
				</Button>
			</Col>
		</FormGroup>
	}

	@autobind
	onChange(value) {
		const filter = this.props.filter
		filter.value = value

		if (filter.key === POSTITION_POSITION_TYPE_FILTER_KEY) {
			updateOrganizationFilterState(this.props.organizationFilter, filter.value.value || "")
		}
	}
}
