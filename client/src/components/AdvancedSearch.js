import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Button, DropdownButton, MenuItem, Row, Col, Form, FormGroup, FormControl, ControlLabel} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Settings from 'Settings'
import ButtonToggleGroup from 'components/ButtonToggleGroup'

import searchFilters from 'components/SearchFilters'

import REMOVE_ICON from 'resources/delete.png'

import { setSearchQuery } from 'actions'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import _isEqual from 'lodash/isEqual'
import _isEqualWith from 'lodash/isEqualWith'
import _cloneDeepWith from 'lodash/cloneDeepWith'
import utils from 'utils'

import {Position, Organization} from 'models'

class AdvancedSearch extends Component {
	static propTypes = {
		onSearch: PropTypes.func,
		onCancel: PropTypes.func,
		setSearchQuery: PropTypes.func.isRequired,
		query: PropTypes.shape({
			text: PropTypes.string,
			filters: PropTypes.any,
			objectType: PropTypes.string
		}),
		onSearchGoToSearchPage: PropTypes.bool,
		searchObjectTypes: PropTypes.array,
		text: PropTypes.string,
	}

	@autobind
	setOrganizationFilter(el) {
		this.setState({organizationFilter: el})
	}

	constructor(props) {
		super(props)

		const query = props || {}
		this.ALL_FILTERS = searchFilters.searchFilters()
		this.state = {
			objectType: "",
			text: "",
			filters: [],
		}
	}

	componentDidMount() {
		this.setState({
			objectType: this.props.query.objectType,
			text: this.props.text,
			filters: this.props.query.filters ? this.props.query.filters.slice() : [],
		})
	}

	componentDidUpdate(prevProps, prevState) {
		if (!_isEqualWith(prevProps.query, this.props.query, utils.equalFunction)) {
			this.setState(this.props.query)
		}
		if (!_isEqual(prevProps.text, this.props.text)) {
			this.setState({text: this.props.text})
		}
	}

	render() {
		const {objectType, text, filters} = this.state
		//console.log("RENDER AdvancedSearch", objectType, text, filters)
		const filterDefs = this.state.objectType ? this.ALL_FILTERS[this.state.objectType].filters : {}
		const existingKeys = filters.map(f => f.key)
		const moreFiltersAvailable = existingKeys.length < Object.keys(filterDefs).length
		return <div className="advanced-search form-horizontal">
			<Form onSubmit={this.onSubmit}>
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

				<FormControl defaultValue={this.props.text} className="hidden" />

				{filters.map(filter =>
					filterDefs[filter.key] && <SearchFilter key={filter.key} query={this.state} filter={filter} onRemove={this.removeFilter} element={filterDefs[filter.key]} organizationFilter={this.state.organizationFilter} />
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
		if (typeof this.props.onSearch === 'function') {
			this.props.onSearch()
		}
		const resolvedFilters = _cloneDeepWith(this.state.filters, this.resolveToQuery)
		const queryState = {objectType: this.state.objectType, filters: resolvedFilters, text: this.state.text}
		// We only update the Redux state on submit
		this.props.setSearchQuery(queryState)
		if (this.props.onSearchGoToSearchPage) {
			this.props.history.push({
				pathname: '/search'
			})
		}
		event.preventDefault()
		event.stopPropagation()
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		query: state.searchQuery,
		onSearchGoToSearchPage: state.searchProps.onSearchGoToSearchPage,
		searchObjectTypes: state.searchProps.searchObjectTypes
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setSearchQuery: advancedSearchQuery => dispatch(setSearchQuery(advancedSearchQuery))
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(AdvancedSearch))


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
