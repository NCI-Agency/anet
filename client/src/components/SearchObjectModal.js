import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'
import {Alert, Modal, Grid, Row, Col, Table, FormControl, Button} from 'react-bootstrap'

import _isEmpty from 'lodash/isEmpty'

import AdvancedSearchForm from 'components/AdvancedSearchForm'
import Autocomplete from 'components/Autocomplete'
import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import Messages from 'components/Messages'
import PositionTable from 'components/PositionTable'
import ReportCollection from 'components/ReportCollection'

import API from 'api'
import GQL from 'graphqlapi'
import {Organization, Person, Position, Task} from 'models'
import {SEARCH_CONFIG, searchFormToQuery} from 'searchUtils'
import Settings from 'Settings'

export default class SearchObjectModal extends Component {
	static propTypes = {
		//Optional: ANET Search Object Type (People, Reports, etc) to search for.
		objectType: PropTypes.string,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props)
		this.defaultState = {
			success: null,
			error: null,
			didSearch: false,
			pageNum: {
				reports: 0,
				people: 0,
				organizations: 0,
				positions: 0,
				locations: 0,
				tasks: 0,
			},
			results: {
				reports: null,
				people: null,
				organizations: null,
				positions: null,
				locations: null,
				tasks: null,
			},
		}
		this.state = this.defaultState
	}

	render() {
		const { results, success, error } = this.state
		const numReports = results.reports ? results.reports.totalCount : 0
		const numPeople = results.people ? results.people.totalCount : 0
		const numPositions = results.positions ? results.positions.totalCount : 0
		const numTasks = results.tasks ? results.tasks.totalCount : 0
		const numLocations = results.locations ? results.locations.totalCount : 0
		const numOrganizations = results.organizations ? results.organizations.totalCount : 0
		const numResults = numReports + numPeople + numPositions + numLocations + numOrganizations + numTasks
		const noResults = numResults === 0
		const taskShortLabel = Settings.fields.task.shortLabel
		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Add {this.props.objectType}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Grid fluid>
						<Row>
							<Col md={2}>
								<b>Search for</b>
							</Col>
							<Col md={10}>
								<AdvancedSearchForm
									query={{objectType: this.props.objectType}}
									searchObjectTypes={[this.props.objectType]}
									onSearchCallback={this.onSearchCallback}
									externalTextField={false}
									onCancel={this.close} />
							</Col>
						</Row>
						{this.state.didSearch && noResults &&
							<Alert bsStyle="warning">
								<b>No search results found!</b>
							</Alert>
						}
						{numOrganizations > 0 &&
							this.renderOrgs()
						}
						{numPeople > 0 &&
							this.renderPeople()
						}
						{numPositions > 0 &&
							this.renderPositions()
						}
						{numTasks > 0 &&
							this.renderTasks()
						}
						{numLocations > 0 &&
							this.renderLocations()
						}
						{numReports > 0 &&
							<ReportCollection paginatedReports={results.reports} goToPage={this.goToPage.bind(this, 'reports')} />
						}
						<Messages error={this.state.error} />
					</Grid>
				</Modal.Body>
			</Modal>
		)
	}

	@autobind
	onSearchCallback(queryState) {
		this.fetchData({searchQuery: queryState})
	}

	getSearchPart(type, query, pageSize) {
		type = type.toLowerCase()
		let subQuery = Object.assign({}, query)
		subQuery.pageSize = (pageSize === undefined) ? 10 : pageSize
		subQuery.pageNum = this.state.pageNum[type]

		let config = SEARCH_CONFIG[type]
		if (config.sortBy) {
			subQuery.sortBy = config.sortBy
		}
		if (config.sortOrder) {
			subQuery.sortOrder = config.sortOrder
		}
		let part = new GQL.Part(/* GraphQL */`
			${config.listName} (query:$${type}Query) {
				pageNum, pageSize, totalCount, list { ${config.fields} }
			}
			`).addVariable(type + "Query", config.variableType, subQuery)
		return part
	}

	@autobind
	_dataFetcher(props, callback, pageSize) {

		let {searchQuery} = props
		let query = searchFormToQuery(searchQuery)
		let parts = []
		if (searchQuery.objectType) {
			parts.push(this.getSearchPart(searchQuery.objectType, query, pageSize))
		} else {
			Object.keys(SEARCH_CONFIG).forEach(key => {
				parts.push(this.getSearchPart(key, query, pageSize))
			})
		}
		return callback(parts)
	}

	@autobind
	_fetchDataCallback(parts) {
		return GQL.run(parts).then(data => {
			this.setState({success: null, error: null, results: data, didSearch: true})
		}).catch(error =>
			this.setState({success: null, error: error, didSearch: true})
		)
	}

	fetchData(props) {
		return this._dataFetcher(props, this._fetchDataCallback)
	}

	@autobind
	resetState() {
		this.setState(this.defaultState)
	}

	@autobind
	close() {
		// Reset state before closing (cancel)
		this.resetState()
		this.props.onCancel()
	}

	@autobind
	onAddObject(obj) {
		this.props.onAddObject(obj)
		// Reset state after adding a result
		this.resetState()
		this.props.onSuccess()
	}

	@autobind
	paginationFor(type) {
		return null
	}

	renderPeople() {
		return <div>
			{this.paginationFor('people')}
			<Table responsive hover striped className="people-search-results">
				<thead>
				<tr>
						<th>Name</th>
						<th>Position</th>
						<th>Location</th>
						<th>Org</th>
					</tr>
				</thead>
				<tbody>
					{Person.map(this.state.results.people.list, person =>
						<tr key={person.uuid}>
							<td>
								<Button key={person.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, person)}><img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" /><LinkTo person={person} isLink={false} /></Button>
							</td>
							<td>{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
							<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} isLink={false} /></td>
							<td>{person.position && person.position.organization && <LinkTo organization={person.position.organization} isLink={false} />}</td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}

	renderOrgs() {
		return <div>
			{this.paginationFor('organizations')}
			<Table responsive hover striped id="organizations-search-results">
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
						<th>Code</th>
						<th>Type</th>
					</tr>
				</thead>
				<tbody>
					{Organization.map(this.state.results.organizations.list, org =>
						<tr key={org.uuid}>
							<td><Button key={org.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, org)}><LinkTo organization={org} isLink={false} /></Button></td>
							<td>{org.longName}</td>
							<td>{org.identificationCode}</td>
							<td>{org.humanNameOfType()}</td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}

	renderPositions() {
		return <div>
		{this.paginationFor('positions')}
		<PositionTable positions={this.state.results.positions.list} />
		</div>
	}

	renderLocations() {
		return <div>
			{this.paginationFor('locations')}
			<Table responsive hover striped>
				<thead>
					<tr>
						<th>Name</th>
					</tr>
				</thead>
				<tbody>
					{this.state.results.locations.list.map(loc =>
						<tr key={loc.uuid}>
							<td><Button key={loc.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, loc)}><LinkTo anetLocation={loc} isLink={false} /></Button></td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}

	renderTasks() {
		return <div>
			{this.paginationFor('tasks')}
			<Table responsive hover striped>
				<thead>
					<tr>
						<th>Name</th>
					</tr>
				</thead>
				<tbody>
					{Task.map(this.state.results.tasks.list, task =>
						<tr key={task.uuid}>
							<td><Button key={task.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, task)}>{task.shortName} {task.longName}</Button></td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}
}
