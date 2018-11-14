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
import UltimatePagination from 'components/UltimatePagination'

import API from 'api'
import GQL from 'graphqlapi'
import {Organization, Person, Position, Task} from 'models'
import {SEARCH_CONFIG, searchFormToQuery} from 'searchUtils'
import Settings from 'Settings'

export default class SearchObjectModal extends Component {
	static propTypes = {
		//Optional: ANET Search Object Type (People, Locations, etc) to search for.
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
			pageNum: 0,
			results: null,
		}
		this.state = this.defaultState
	}

	render() {
		const { results, success, error } = this.state
		const numResults = results ? results.totalCount : 0
		const noResults = numResults === 0
		const taskShortLabel = Settings.fields.task.shortLabel
		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Add {this.props.objectType}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<AdvancedSearchForm
						query={{objectType: this.props.objectType}}
						searchObjectTypes={[this.props.objectType]}
						onSearchCallback={this.onSearchCallback}
						hideObjectType={true}
						hideTextField={false}
						onCancel={this.close} />
					{this.state.didSearch && noResults &&
						<Alert bsStyle="warning" style={{clear: 'both', marginTop: 10}}>
							<b>No search results found!</b>
						</Alert>
					}
					{numResults > 0 && <Fieldset id="searchObjectResults" title=" ">
						{this.pagination()}
						{this.renderResults()}
						</Fieldset>}
					<Messages error={this.state.error} />
				</Modal.Body>
			</Modal>
		)
	}

	//FIXME: a lot of the fetch data code here is the same as the one on the search page
	@autobind
	onSearchCallback(queryState) {
		this.setState({searchQuery: queryState}, () => this.fetchData())
	}

	getSearchPart(type, query, pageSize) {
		type = type.toLowerCase()
		let subQuery = Object.assign({}, query)
		subQuery.pageSize = (pageSize === undefined) ? 10 : pageSize
		subQuery.pageNum = this.state.pageNum

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
	_dataFetcher(callback, pageSize) {
		let type = this.props.objectType.toLowerCase()
		let config = SEARCH_CONFIG[type]
		let {searchQuery} = this.state
		let query = searchFormToQuery(searchQuery)
		return callback([this.getSearchPart(this.props.objectType, query, pageSize)], config.dataKey)
	}

	@autobind
	_fetchDataCallback(parts, resultsListName) {
		return GQL.run(parts).then(data => {
			this.setState({success: null, error: null, results: data[resultsListName], didSearch: true})
		}).catch(error =>
			this.setState({success: null, error: error, didSearch: true})
		)
	}

	fetchData() {
		return this._dataFetcher(this._fetchDataCallback)
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
	pagination() {
		const {pageSize, pageNum, totalCount} = this.state.results
		const numPages = (pageSize <= 0) ? 1 : Math.ceil(totalCount / pageSize)
		if (numPages === 1) { return }
		return <header className="searchPagination">
			<UltimatePagination
				className="pull-right"
				currentPage={pageNum + 1}
				totalPages={numPages}
				boundaryPagesRange={1}
				siblingPagesRange={2}
				hideEllipsis={false}
				hidePreviousAndNextPageLinks={false}
				hideFirstAndLastPageLinks={true}
				onChange={(value) => this.goToPage(value - 1)}
			/>
		</header>
	}

	@autobind
	goToPage(pageNum) {
		this.setState({pageNum}, () => this.fetchData())
	}

	renderResults() {
		return (
			this.props.objectType === 'Organizations' ? this.renderOrgs() :
			this.props.objectType === 'People' ? this.renderPeople() :
			this.props.objectType === 'Positions'? this.renderPositions() :
			this.props.objectType === 'Tasks' ? this.renderTasks() :
			this.props.objectType === 'Locations' ? this.renderLocations() :
				null
		)
	}

	//FIXME: a lot of the render objecttype functions are almost the same as the
	//render functions on the Search page
	renderPeople() {
		return <Table responsive hover striped className="people-search-results">
			<thead>
			<tr>
					<th>Name</th>
					<th>Position</th>
					<th>Location</th>
					<th>Org</th>
				</tr>
			</thead>
			<tbody>
				{Person.map(this.state.results.list, person =>
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
	}

	renderOrgs() {
		return <Table responsive hover striped id="organizations-search-results">
			<thead>
				<tr>
					<th>Name</th>
					<th>Description</th>
					<th>Code</th>
					<th>Type</th>
				</tr>
			</thead>
			<tbody>
				{Organization.map(this.state.results.list, org =>
					<tr key={org.uuid}>
						<td><Button key={org.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, org)}><LinkTo organization={org} isLink={false} /></Button></td>
						<td>{org.longName}</td>
						<td>{org.identificationCode}</td>
						<td>{org.humanNameOfType()}</td>
					</tr>
				)}
			</tbody>
		</Table>
	}

	renderPositions() {
		return <PositionTable positions={this.state.results.list} />
	}

	renderLocations() {
		return <Table responsive hover striped>
			<thead>
				<tr>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				{this.state.results.list.map(loc =>
					<tr key={loc.uuid}>
						<td><Button key={loc.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, loc)}><LinkTo anetLocation={loc} isLink={false} /></Button></td>
					</tr>
				)}
			</tbody>
		</Table>
	}

	renderTasks() {
		return <Table responsive hover striped>
			<thead>
				<tr>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				{Task.map(this.state.results.list, task =>
					<tr key={task.uuid}>
						<td><Button key={task.uuid} className="list-item" bsStyle="link" onClick={this.onAddObject.bind(this, task)}>{task.shortName} {task.longName}</Button></td>
					</tr>
				)}
			</tbody>
		</Table>
	}
}
