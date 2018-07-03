import React, { Component } from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Alert, Table, Modal, Button, Nav, NavItem, Badge} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'

import UltimatePagination from 'components/UltimatePagination'
import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import LinkTo from 'components/LinkTo'
import ReportCollection from 'components/ReportCollection'
import Form from 'components/Form'
import Messages from 'components/Messages'
import AdvancedSearch from 'components/AdvancedSearch'
import PositionTable from 'components/PositionTable'

import API from 'api'
import Settings from 'Settings'
import GQL from 'graphqlapi'
import {Person, Organization, Task} from 'models'

import FileSaver from 'file-saver'

import DOWNLOAD_ICON from 'resources/download.png'
import EVERYTHING_ICON from 'resources/search-alt.png'
import REPORTS_ICON from 'resources/reports.png'
import PEOPLE_ICON from 'resources/people.png'
import LOCATIONS_ICON from 'resources/locations.png'
import TASKS_ICON from 'resources/tasks.png'
import POSITIONS_ICON from 'resources/positions.png'
import ORGANIZATIONS_ICON from 'resources/organizations.png'

import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import utils from 'utils'
import ReactDOM from 'react-dom'

const QUERY_STRINGS = {
	reports: {
		pendingApprovalOf: 'reports pending your approval',
		advisorOrgId: 'reports recently authored by your organization',
		authorId: 'reports you recently authored',
	},
	organizations: 'Organizations TODO',
	people: 'People TODO',
}

const SEARCH_CONFIG = {
	reports : {
		listName : 'reports: reportList',
		sortBy: 'ENGAGEMENT_DATE',
		sortOrder: 'DESC',
		variableType: 'ReportSearchQuery',
		fields : ReportCollection.GQL_REPORT_FIELDS
	},
	people : {
		listName : 'people: personList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PersonSearchQuery',
		fields: 'id, name, rank, emailAddress, role , position { id, name, organization { id, shortName} }'
	},
	positions : {
		listName: 'positions: positionList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PositionSearchQuery',
		fields: 'id , name, code, type, status, organization { id, shortName}, person { id, name, rank }'
	},
	tasks : {
		listName: 'tasks: taskList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'TaskSearchQuery',
		fields: 'id, shortName, longName'
	},
	locations : {
		listName: 'locations: locationList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'LocationSearchQuery',
		fields : 'id, name, lat, lng'
	},
	organizations : {
		listName: 'organizations: organizationList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'OrganizationSearchQuery',
		fields: 'id, shortName, longName, identificationCode, type'
	}
}

class SearchNav extends Component {

	constructor(props) {
		super(props)

		this.state = {
			searchNavElem: document.getElementById('search-nav'),
		}
	}

	componentDidMount() {
		const elem = document.getElementById('search-nav')
		if (elem !== this.state.searchNavElem) {
			this.setState({searchNavElem: elem})
		}
	}

	render() {
		return (this.state.searchNavElem &&
			ReactDOM.createPortal(
				this.props.children,
				this.state.searchNavElem
			)
		)
	}

}

class Search extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	constructor(props) {
		super(props)

		const qs = utils.parseQueryString(props.location.search)
		this.state = {
			query: qs.text,
			queryType: null,
			pageNum: {
				reports: 0,
				people: 0,
				organizations: 0,
				positions: 0,
				locations: 0,
				tasks: 0,
			},
			saveSearch: {show: false},
			results: {
				reports: null,
				people: null,
				organizations: null,
				positions: null,
				locations: null,
				tasks: null,
			},
			error: null,
			success: null,
		}

		if (props.location.state && props.location.state.advancedSearch) {
			this.state.advancedSearch = props.location.state.advancedSearch
		}
	}

	static getDerivedStateFromProps(props, state) {
		const newAdvancedSearch = props.location.state && props.location.state.advancedSearch
		if (state.advancedSearch !== newAdvancedSearch) {
			return {advancedSearch: newAdvancedSearch}
		}
		return null
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.advancedSearch !== prevState.advancedSearch) {
			this.loadData()
		}
		else {
			super.componentDidUpdate(prevProps, prevState)
		}
	}

	getSearchPart(type, query, pageSize) {
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
			${config.listName} (f:search, query:$${type}Query) {
				pageNum, pageSize, totalCount, list { ${config.fields} }
			}
			`).addVariable(type + "Query", config.variableType, subQuery)
		return part
	}



	@autobind
	getAdvancedSearchQuery() {
		let {advancedSearch} = this.state
		let query = {text: advancedSearch.text}
		advancedSearch.filters.forEach(filter => {
			if (filter.value) {
				if (filter.value.toQuery) {
					const toQuery = typeof filter.value.toQuery === 'function'
						? filter.value.toQuery()
						: filter.value.toQuery
					Object.assign(query, toQuery)
				} else {
					query[filter.key] = filter.value
				}
			}
		})

		console.log('SEARCH advanced query', query)

		return query
	}

	@autobind
	_dataFetcher(queryDef, callback, pageSize) {
		let {advancedSearch} = this.state

		if (advancedSearch) {
			let query = this.getAdvancedSearchQuery()
			let part = this.getSearchPart(advancedSearch.objectType.toLowerCase(), query, pageSize)
			callback([part])

			return
		}

		let {type, text, ...advQuery} = queryDef
		//Any query with a field other than 'text' and 'type' is an advanced query.
		let isAdvQuery = Object.keys(advQuery).length
		advQuery.text = text

		let parts = []
		if (isAdvQuery) {
			parts.push(this.getSearchPart(type, advQuery, pageSize))
		} else {
			Object.keys(SEARCH_CONFIG).forEach(key => {
				parts.push(this.getSearchPart(key, advQuery, pageSize))
			})
		}
		return callback(parts)
	}

	@autobind
	_fetchDataCallback(parts) {
		return GQL.run(parts).then(data => {
			this.setState({success: null, error: null, results: data})
		}).catch(response =>
			this.setState({success: null, error: response})
		)
	}

	fetchData(props) {
		const qs = utils.parseQueryString(props.location.search)
		return this._dataFetcher(qs, this._fetchDataCallback)
	}

	render() {
		const results = this.state.results
		const error = this.state.error
		const success = this.state.success

		const numReports = results.reports ? results.reports.totalCount : 0
		const numPeople = results.people ? results.people.totalCount : 0
		const numPositions = results.positions ? results.positions.totalCount : 0
		const numTasks = results.tasks ? results.tasks.totalCount : 0
		const numLocations = results.locations ? results.locations.totalCount : 0
		const numOrganizations = results.organizations ? results.organizations.totalCount : 0

		const numResults = numReports + numPeople + numPositions + numLocations + numOrganizations + numTasks
		const noResults = numResults === 0

		const qs = utils.parseQueryString(this.props.location.search)
		let queryString = QUERY_STRINGS[qs.type] || qs.text || 'TODO'
		const queryType = this.state.queryType || qs.type || 'everything'

		const taskShortLabel = Settings.fields.task.shortLabel

		if (typeof queryString === 'object') {
			queryString = queryString[Object.keys(qs)[1]]
		}

		return (
			<div>
				<SearchNav>
					<div><Button onClick={this.props.history.goBack} bsStyle="link">&lt; Return to previous page</Button></div>
					<Nav stacked bsStyle="pills" activeKey={queryType} onSelect={this.onSelectQueryType}>
						<NavItem eventKey="everything" disabled={!numResults}>
							<img src={EVERYTHING_ICON} alt="" /> Everything
							{numResults > 0 && <Badge pullRight>{numResults}</Badge>}
						</NavItem>

						<NavItem eventKey="organizations" disabled={!numOrganizations}>
							<img src={ORGANIZATIONS_ICON} alt="" /> Organizations
							{numOrganizations > 0 && <Badge pullRight>{numOrganizations}</Badge>}
						</NavItem>

						<NavItem eventKey="people" disabled={!numPeople}>
							<img src={PEOPLE_ICON} alt="" /> People
							{numPeople > 0 && <Badge pullRight>{numPeople}</Badge>}
						</NavItem>

						<NavItem eventKey="positions" disabled={!numPositions}>
							<img src={POSITIONS_ICON} alt="" /> Positions
							{numPositions > 0 && <Badge pullRight>{numPositions}</Badge>}
						</NavItem>

						<NavItem eventKey="tasks" disabled={!numTasks}>
							<img src={TASKS_ICON} alt="" /> {pluralize(taskShortLabel)}
							{numTasks > 0 && <Badge pullRight>{numTasks}</Badge>}
						</NavItem>

						<NavItem eventKey="locations" disabled={!numLocations}>
							<img src={LOCATIONS_ICON} alt="" /> Locations
							{numLocations > 0 && <Badge pullRight>{numLocations}</Badge>}
						</NavItem>

						<NavItem eventKey="reports" disabled={!numReports}>
							<img src={REPORTS_ICON} alt="" /> Reports
							{numReports > 0 && <Badge pullRight>{numReports}</Badge>}
						</NavItem>
					</Nav>
				</SearchNav>

				<div className="pull-right">
					{!noResults &&
						<Button onClick={this.exportSearchResults} id="exportSearchResultsButton" style={{marginRight: 12}} title="Export search results">
							<img src={DOWNLOAD_ICON} height={16} alt="Export search results" />
						</Button>
					}
					<Button onClick={this.showSaveModal} id="saveSearchButton" style={{marginRight: 12}}>Save search</Button>
				</div>

				<Breadcrumbs items={[['Search results', '']]} />

				{this.state.advancedSearch && <Fieldset title="Search filters">
					<AdvancedSearch query={this.state.advancedSearch} onCancel={this.cancelAdvancedSearch} />
				</Fieldset>}

				<Messages error={error} success={success} />

				{qs.text && <h2 className="only-show-for-print">Search query: '{qs.text}'</h2>}

				{noResults &&
					<Alert bsStyle="warning">
						<b>No search results found!</b>
					</Alert>
				}

				{numOrganizations > 0 && (queryType === 'everything' || queryType === 'organizations') &&
					<Fieldset title="Organizations">
						{this.renderOrgs()}
					</Fieldset>
				}

				{numPeople > 0 && (queryType === 'everything' || queryType === 'people') &&
					<Fieldset title="People" >
						{this.renderPeople()}
					</Fieldset>
				}

				{numPositions > 0 && (queryType === 'everything' || queryType === 'positions') &&
					<Fieldset title="Positions">
						{this.renderPositions()}
					</Fieldset>
				}

				{numTasks > 0 && (queryType === 'everything' || queryType === 'tasks') &&
					<Fieldset title={pluralize(taskShortLabel)}>
						{this.renderTasks()}
					</Fieldset>
				}

				{numLocations > 0 && (queryType === 'everything' || queryType === 'locations') &&
					<Fieldset title="Locations">
						{this.renderLocations()}
					</Fieldset>
				}
				{numReports > 0 && (queryType === 'everything' || queryType === 'reports') &&
					<Fieldset title="Reports">
						<ReportCollection paginatedReports={results.reports} goToPage={this.goToPage.bind(this, 'reports')} />
					</Fieldset>
				}

				{this.renderSaveModal()}
			</div>
		)
	}

	@autobind
	paginationFor(type) {
		const {pageSize, pageNum, totalCount} = this.state.results[type]
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
				onChange={(value) => this.goToPage(type, value - 1)}
			/>
		</header>
	}

	@autobind
	goToPage(type, pageNum) {
		const pageNums = this.state.pageNum
		pageNums[type] = pageNum

		const qs = utils.parseQueryString(this.props.location.search)
		const query = (this.state.advancedSearch) ? this.getAdvancedSearchQuery() : Object.without(qs, 'type')
		const part = this.getSearchPart(type, query)
		GQL.run([part]).then(data => {
			let results = this.state.results //TODO: @nickjs this feels wrong, help!
			results[type] = data[type]
			this.setState({results})
		}).catch(response =>
			this.setState({error: response})
		)
	}

	@autobind
	showAdvancedSearch() {
		this.setState({advancedSearch: {text: this.state.query}})
	}

	@autobind
	cancelAdvancedSearch() {
		this.props.history.push({
			pathname: '/search',
			search: utils.formatQueryString({text: this.state.advancedSearch ? this.state.advancedSearch.text : ""}),
			state: {advancedSearch: null}
		})
	}

	renderPeople() {
		return <div>
			{this.paginationFor('people')}
			<Table responsive hover striped className="people-search-results">
				<thead>
				<tr>
						<th>Name</th>
						<th>Position</th>
						<th>Org</th>
					</tr>
				</thead>
				<tbody>
					{Person.map(this.state.results.people.list, person =>
						<tr key={person.id}>
							<td>
								<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
								<LinkTo person={person}/>
							</td>
							<td>{person.position && <LinkTo position={person.position} />}</td>
							<td>{person.position && person.position.organization && <LinkTo organization={person.position.organization} />}</td>
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
						<tr key={org.id}>
							<td><LinkTo organization={org} /></td>
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
						<tr key={loc.id}>
							<td><LinkTo anetLocation={loc} /></td>
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
						<tr key={task.id}>
							<td><LinkTo task={task} >{task.shortName} {task.longName}</LinkTo></td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}

	renderSaveModal() {
		return <Modal show={this.state.saveSearch.show} onHide={this.closeSaveModal}>
			<Modal.Header closeButton>
				<Modal.Title>Save search</Modal.Title>
			</Modal.Header>

			<Modal.Body>
				<Form formFor={this.state.saveSearch} onChange={this.onChangeSaveSearch}
					onSubmit={this.onSubmitSaveSearch} submitText={false}>
					<Form.Field id="name" placeholder="Give this saved search a name" />
					<Button type="submit" bsStyle="primary" id="saveSearchModalSubmitButton" >Save</Button>
				</Form>
			</Modal.Body>
		</Modal>
	}


	@autobind
	onChangeSaveSearch() {
		let search = this.state.saveSearch
		this.setState({saveSearch: search})
	}

	@autobind
	onSubmitSaveSearch(event) {
		event.stopPropagation()
		event.preventDefault()

		const search = Object.without(this.state.saveSearch, 'show')
		if (this.state.advancedSearch) {
			search.query = JSON.stringify(this.getAdvancedSearchQuery())
			search.objectType = this.state.advancedSearch.objectType.toUpperCase()
		} else {
			const qs = utils.parseQueryString(this.props.location.search)
			search.query = JSON.stringify({text: qs.text })
		}

		API.send('/api/savedSearches/new', search, {disableSubmits: true})
			.then(response => {
				if (response.code) throw response.code
				this.setState({
					success: 'Search successfully saved!',
					error: null,
					saveSearch: {show: false}
				})
				window.scrollTo(0, 0)
			}).catch(response => {
				this.setState({
					success: null,
					error: response,
					saveSearch: {show: false}
				})
				window.scrollTo(0, 0)
			})
	}

	@autobind
	showSaveModal() {
		this.setState({saveSearch: {show: true, name: ''}})
	}

	@autobind
	_exportSearchResultsCallback(parts) {
		GQL.runExport(parts, "xlsx").then(blob => {
			FileSaver.saveAs(blob, "anet_export.xlsx")
		}).catch(response =>
			this.setState({error: response})
		)
	}

	@autobind
	exportSearchResults() {
		const qs = utils.parseQueryString(this.props.location.search)
		this._dataFetcher(qs, this._exportSearchResultsCallback, 0)
	}

	@autobind
	closeSaveModal() {
		this.setState({saveSearch: {show: false}})
	}

	@autobind
	onSelectQueryType(type) {
		this.setState({queryType: type}, () => this.loadData())
	}

}

export default connect(null, mapDispatchToProps)(withRouter(Search))
