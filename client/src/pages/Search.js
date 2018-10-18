import PropTypes from 'prop-types'
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

import SubNav from 'components/SubNav'

import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from 'actions'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import _isEqualWith from 'lodash/isEqualWith'
import utils from 'utils'
import ReactDOM from 'react-dom'
import { jumpToTop } from 'components/Page'

import AppContext from 'components/AppContext'
import Scrollspy from 'react-scrollspy'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'components/reactToastify.css'

const SEARCH_CONFIG = {
	reports : {
		listName : 'reports: reportList',
		sortBy: 'ENGAGEMENT_DATE',
		sortOrder: 'DESC',
		variableType: 'ReportSearchQueryInput',
		fields : ReportCollection.GQL_REPORT_FIELDS
	},
	people : {
		listName : 'people: personList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PersonSearchQueryInput',
		fields: 'id, name, rank, emailAddress, role , position { id, name, organization { id, shortName} }'
	},
	positions : {
		listName: 'positions: positionList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PositionSearchQueryInput',
		fields: 'id , name, code, type, status, organization { id, shortName}, person { id, name, rank }'
	},
	tasks : {
		listName: 'tasks: taskList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'TaskSearchQueryInput',
		fields: 'id, shortName, longName'
	},
	locations : {
		listName: 'locations: locationList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'LocationSearchQueryInput',
		fields : 'id, name, lat, lng'
	},
	organizations : {
		listName: 'organizations: organizationList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'OrganizationSearchQueryInput',
		fields: 'id, shortName, longName, identificationCode, type'
	}
}

class BaseSearch extends Page {

	static propTypes = {
		...pagePropTypes,
		scrollspyOffset: PropTypes.number,
	}

	toastId = null;
	successToastId = 'success-message';
	errorToastId = 'error-message';
	notify = (success) => {
		if (!success) { return }
		toast.success(success, {
			toastId: this.successToastId
		})
	}

	constructor(props) {
		super(props, Object.assign({}, DEFAULT_PAGE_PROPS), Object.assign({}, DEFAULT_SEARCH_PROPS, {clearSearchQuery: false}))

		Object.assign(this.state, {
			success: null,
			error: null,
			didSearch: false,
			query: props.searchQuery.text || null,
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
		})
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
		let query = this.getSearchQuery(props)
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

	componentDidUpdate() {
		const { success } = this.state
		this.notify(success)
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

		const qs = utils.parseQueryString(this.props.location.search)

		const taskShortLabel = Settings.fields.task.shortLabel
		return (
			<div>
				<ToastContainer/>
				<SubNav subnavElemId="search-nav">
					<div><Button onClick={this.props.history.goBack} bsStyle="link">&lt; Return to previous page</Button></div>
					<Nav stacked bsStyle="pills">
						<Scrollspy className="nav" currentClassName="active" offset={this.props.scrollspyOffset}
							items={ ['organizations', 'people', 'positions', 'tasks', 'locations', 'reports'] }>
							<NavItem href="#organizations" disabled={!numOrganizations}>
								<img src={ORGANIZATIONS_ICON} alt="" /> Organizations
								{numOrganizations > 0 && <Badge pullRight>{numOrganizations}</Badge>}
							</NavItem>

							<NavItem href="#people" disabled={!numPeople}>
								<img src={PEOPLE_ICON} alt="" /> People
								{numPeople > 0 && <Badge pullRight>{numPeople}</Badge>}
							</NavItem>

							<NavItem href="#positions" disabled={!numPositions}>
								<img src={POSITIONS_ICON} alt="" /> Positions
								{numPositions > 0 && <Badge pullRight>{numPositions}</Badge>}
							</NavItem>

							<NavItem href="#tasks" disabled={!numTasks}>
								<img src={TASKS_ICON} alt="" /> {pluralize(taskShortLabel)}
								{numTasks > 0 && <Badge pullRight>{numTasks}</Badge>}
							</NavItem>

							<NavItem href="#locations" disabled={!numLocations}>
								<img src={LOCATIONS_ICON} alt="" /> Locations
								{numLocations > 0 && <Badge pullRight>{numLocations}</Badge>}
							</NavItem>

							<NavItem href="#reports" disabled={!numReports}>
								<img src={REPORTS_ICON} alt="" /> Reports
								{numReports > 0 && <Badge pullRight>{numReports}</Badge>}
							</NavItem>
						</Scrollspy>
					</Nav>
				</SubNav>

				<div className="pull-right">
					{!noResults &&
						<Button onClick={this.exportSearchResults} id="exportSearchResultsButton" style={{marginRight: 12}} title="Export search results">
							<img src={DOWNLOAD_ICON} height={16} alt="Export search results" />
						</Button>
					}
					<Button onClick={this.showSaveModal} id="saveSearchButton" style={{marginRight: 12}}>Save search</Button>
				</div>

				<Breadcrumbs items={[['Search results', '']]} />

				<Messages error={error} success={success} />

				{this.state.query && <h2 className="only-show-for-print">Search query: '{this.state.query}'</h2>}

				{this.state.didSearch && noResults &&
					<Alert bsStyle="warning">
						<b>No search results found!</b>
					</Alert>
				}

				{numOrganizations > 0 &&
					<Fieldset id="organizations" title="Organizations">
						{this.renderOrgs()}
					</Fieldset>
				}

				{numPeople > 0 &&
					<Fieldset id="people" title="People" >
						{this.renderPeople()}
					</Fieldset>
				}

				{numPositions > 0 &&
					<Fieldset id="positions" title="Positions">
						{this.renderPositions()}
					</Fieldset>
				}

				{numTasks > 0 &&
					<Fieldset id="tasks" title={pluralize(taskShortLabel)}>
						{this.renderTasks()}
					</Fieldset>
				}

				{numLocations > 0 &&
					<Fieldset id="locations" title="Locations">
						{this.renderLocations()}
					</Fieldset>
				}
				{numReports > 0 &&
					<Fieldset id="reports" title="Reports">
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

		const query = this.getSearchQuery()
		const part = this.getSearchPart(type, query)
		GQL.run([part]).then(data => {
			let results = this.state.results //TODO: @nickjs this feels wrong, help!
			results[type] = data[type]
			this.setState({results})
		}).catch(error =>
			this.setState({success: null, error: error})
		)
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
		let savedSearch = this.state.saveSearch
		this.setState({saveSearch: savedSearch})
	}

	@autobind
	onSubmitSaveSearch(event) {
		event.stopPropagation()
		event.preventDefault()

		const savedSearch = Object.without(this.state.saveSearch, 'show')
		savedSearch.query = JSON.stringify(this.getSearchQuery())
		if (this.props.searchQuery.objectType) {
			savedSearch.objectType = this.props.searchQuery.objectType.toUpperCase()
		}
		const operation = 'createSavedSearch'
		let graphql = operation + '(savedSearch: $savedSearch) { id }'
		const variables = { savedSearch: savedSearch }
		const variableDef = '($savedSearch: SavedSearchInput!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				if (data[operation].id) {
					this.setState({
						success: 'Search saved',
						error: null,
						saveSearch: {show: false}
					})
					jumpToTop()
				}
			}).catch(error => {
				this.setState({
					success: null,
					error: error,
					saveSearch: {show: false}
				})
				jumpToTop()
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
		}).catch(error =>
			this.setState({success: null, error: error})
		)
	}

	@autobind
	exportSearchResults() {
		this._dataFetcher(this.props, this._exportSearchResultsCallback, 0)
	}

	@autobind
	closeSaveModal() {
		this.setState({saveSearch: {show: false}})
	}
}

const mapStateToProps = (state, ownProps) => ({
	searchQuery: state.searchQuery,
})

const Search = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseSearch scrollspyOffset={context.scrollspyOffset} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Search))
