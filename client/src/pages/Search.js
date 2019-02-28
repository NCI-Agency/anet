import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Alert, Table, Modal, Button, Nav, Badge} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import UltimatePagination from 'components/UltimatePagination'
import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import ReportCollection from 'components/ReportCollection'
import Messages from 'components/Messages'
import PositionTable from 'components/PositionTable'

import API from 'api'
import Settings from 'Settings'
import GQL from 'graphqlapi'
import {Person, Organization, Task} from 'models'

import FileSaver from 'file-saver'

import DOWNLOAD_ICON from 'resources/download.png'
import REPORTS_ICON from 'resources/reports.png'
import PEOPLE_ICON from 'resources/people.png'
import LOCATIONS_ICON from 'resources/locations.png'
import TASKS_ICON from 'resources/tasks.png'
import POSITIONS_ICON from 'resources/positions.png'
import ORGANIZATIONS_ICON from 'resources/organizations.png'

import SubNav from 'components/SubNav'

import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import _isEqualWith from 'lodash/isEqualWith'
import utils from 'utils'
import { jumpToTop } from 'components/Page'

import { AnchorNavItem } from 'components/Nav'
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
		fields: 'uuid, name, rank, role, emailAddress, position { uuid, name, type, code, location { uuid, name }, organization { uuid, shortName} }'
	},
	positions : {
		listName: 'positions: positionList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PositionSearchQueryInput',
		fields: 'uuid , name, code, type, status, location { uuid, name }, organization { uuid, shortName}, person { uuid, name, rank, role }'
	},
	tasks : {
		listName: 'tasks: taskList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'TaskSearchQueryInput',
		fields: 'uuid, shortName, longName'
	},
	locations : {
		listName: 'locations: locationList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'LocationSearchQueryInput',
		fields: 'uuid, name, lat, lng'
	},
	organizations : {
		listName: 'organizations: organizationList',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'OrganizationSearchQueryInput',
		fields: 'uuid, shortName, longName, identificationCode, type'
	}
}

class Search extends Page {

	static propTypes = {
		...pagePropTypes,
		setPagination: PropTypes.func.isRequired,
		pagination: PropTypes.object,
	}

	componentPrefix = 'SEARCH_'
	successToastId = 'success-message';
	errorToastId = 'error-message';
	notify = (success) => {
		if (!success) { return }
		toast.success(success, {
			toastId: this.successToastId
		})
	}
	state = {
		success: null,
		error: null,
		didSearch: false,
		query: this.props.searchQuery.text || null,
		results: {
			reports: null,
			people: null,
			organizations: null,
			positions: null,
			locations: null,
			tasks: null,
		},
		showSaveSearch: false,
	}

	getPaginatedNum = (part, pageNum = 0) => {
		let goToPageNum = pageNum
		if (part !== undefined) {
			goToPageNum = part.pageNum
		}
		return goToPageNum
	}

	getPaginated = type => {
		const { pagination } = this.props
		const typeLower = type.toLowerCase()
		const pageLabel = this.pageLabel(typeLower)
		return  pagination[pageLabel]
	}

	pageLabel = (type, prefix = this.componentPrefix) => {
		return `${prefix}${type}`
	}

	getSearchPart(type, query, pageNum = 0, pageSize = 10) {
		const typeLower = type.toLowerCase()
		let subQuery = Object.assign({}, query)
		subQuery.pageNum = pageNum
		subQuery.pageSize = pageSize
		let config = SEARCH_CONFIG[typeLower]
		if (config.sortBy) {
			subQuery.sortBy = config.sortBy
		}
		if (config.sortOrder) {
			subQuery.sortOrder = config.sortOrder
		}
		let gqlPart = new GQL.Part(/* GraphQL */`
			${config.listName} (query:$${typeLower}Query) {
				pageNum, pageSize, totalCount, list { ${config.fields} }
			}
			`).addVariable(typeLower + "Query", config.variableType, subQuery)
		return gqlPart
	}

	@autobind
	_dataFetcher(props, callback, pageNum, pageSize) {
		const { searchQuery } = props
		const queryTypes = searchQuery.objectType ? { [searchQuery.objectType]: {} } : SEARCH_CONFIG
		const query = this.getSearchQuery(props)
		const parts = Object.keys(queryTypes).map(type => {
			const paginatedPart = this.getPaginated(type)
			const goToPageNum = this.getPaginatedNum(paginatedPart, pageNum)
			return this.getSearchPart(type, query, goToPageNum, pageSize)
		})
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

	componentDidMount() {
		super.componentDidMount()
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
				<ToastContainer />
				<SubNav subnavElemId="search-nav">
					<div><Button onClick={this.props.history.goBack} bsStyle="link">&lt; Return to previous page</Button></div>
					<Nav stacked bsStyle="pills">
						<AnchorNavItem to="organizations" disabled={!numOrganizations}>
							<img src={ORGANIZATIONS_ICON} alt="" /> Organizations
							{numOrganizations > 0 && <Badge pullRight>{numOrganizations}</Badge>}
						</AnchorNavItem>

						<AnchorNavItem to="people" disabled={!numPeople}>
							<img src={PEOPLE_ICON} alt="" /> People
							{numPeople > 0 && <Badge pullRight>{numPeople}</Badge>}
						</AnchorNavItem>

						<AnchorNavItem to="positions" disabled={!numPositions}>
							<img src={POSITIONS_ICON} alt="" /> Positions
							{numPositions > 0 && <Badge pullRight>{numPositions}</Badge>}
						</AnchorNavItem>

						<AnchorNavItem to="tasks" disabled={!numTasks}>
							<img src={TASKS_ICON} alt="" /> {pluralize(taskShortLabel)}
							{numTasks > 0 && <Badge pullRight>{numTasks}</Badge>}
						</AnchorNavItem>

						<AnchorNavItem to="locations" disabled={!numLocations}>
							<img src={LOCATIONS_ICON} alt="" /> Locations
							{numLocations > 0 && <Badge pullRight>{numLocations}</Badge>}
						</AnchorNavItem>

						<AnchorNavItem to="reports" disabled={!numReports}>
							<img src={REPORTS_ICON} alt="" /> Reports
							{numReports > 0 && <Badge pullRight>{numReports}</Badge>}
						</AnchorNavItem>
					</Nav>
				</SubNav>

				<div className="pull-right">
					{!noResults &&
						<Button onClick={this.exportSearchResults} id="exportSearchResultsButton" style={{marginRight: 12}} title="Export search results">
							<img src={DOWNLOAD_ICON} height={16} alt="Export search results" />
						</Button>
					}
					<Button onClick={this.openSaveModal} id="saveSearchButton" style={{marginRight: 12}}>Save search</Button>
				</div>

				<Messages error={error} /> {/* success is shown through toast */}

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
						{this.renderReports()}
					</Fieldset>
				}

				{this.renderSaveModal()}
			</div>
		)
	}


	@autobind
	paginationFor(type) {
		const { pageSize, totalCount } = this.state.results[type]
		const paginatedPart = this.getPaginated(type)
		const goToPage = this.getPaginatedNum(paginatedPart)
		const numPages = (pageSize <= 0) ? 1 : Math.ceil(totalCount / pageSize)
		if (numPages === 1) { return }
		return <header className="searchPagination">
			<UltimatePagination
				className="pull-right"
				currentPage={goToPage + 1}
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
		const { setPagination } = this.props
		const query = this.getSearchQuery()
		const part = this.getSearchPart(type, query, pageNum)
		GQL.run([part]).then(data => {
			let results = this.state.results //TODO: @nickjs this feels wrong, help!
			results[type] = data[type]
			this.setState({results}, () => setPagination(this.pageLabel(type), pageNum))
		}).catch(error =>
			this.setState({success: null, error: error})
		)
	}

	renderReports() {
		const { results } = this.state
		const { pagination } = this.props
		const reports = results.reports
		const paginatedPart = pagination[this.pageLabel('reports')]
		const goToPageNum = this.getPaginatedNum(paginatedPart)
		const paginatedReports = Object.assign(reports, {pageNum: goToPageNum})
		return <ReportCollection paginatedReports={paginatedReports} goToPage={this.goToPage.bind(this, 'reports')} />

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
						<th>Organization</th>
					</tr>
				</thead>
				<tbody>
					{Person.map(this.state.results.people.list, person =>
						<tr key={person.uuid}>
							<td><LinkTo person={person} /></td>
							<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
							<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
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
						<tr key={org.uuid}>
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
						<tr key={loc.uuid}>
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
						<tr key={task.uuid}>
							<td><LinkTo task={task} >{task.shortName} {task.longName}</LinkTo></td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}

	renderSaveModal() {
		return <Modal show={this.state.showSaveSearch} onHide={this.closeSaveModal}>
			<Modal.Header closeButton>
				<Modal.Title>Save search</Modal.Title>
			</Modal.Header>

			<Modal.Body>
				<Formik
					enableReinitialize
					onSubmit={this.onSubmitSaveSearch}
					initialValues={{name: ''}}
				>
				{({
					values,
					submitForm
				}) => {
					return <Form>
						<Field
							name="name"
							component={FieldHelper.renderInputField}
							placeholder="Give this saved search a name"
							vertical={true}
						/>
						<div className="submit-buttons">
							<div>
								<Button id="saveSearchModalSubmitButton" bsStyle="primary" type="button" onClick={submitForm}>Save</Button>
							</div>
						</div>
					</Form>
					}
				}
				</Formik>
			</Modal.Body>
		</Modal>
	}

	onSubmitSaveSearch = (values, form) => {
		this.saveSearch(values, form)
			.then(response => this.onSubmitSaveSearchSuccess(response, values, form))
			.catch(error => {
				this.setState({
					success: null,
					error: error,
					showSaveSearch: false,
				})
				jumpToTop()
			})
	}

	onSubmitSaveSearchSuccess = (response, values, form) => {
		if (response.createSavedSearch.uuid) {
			this.setState({
				success: 'Search saved',
				error: null,
				showSaveSearch: false,
			})
			jumpToTop()
		}
	}

	saveSearch = (values, form) => {
		const savedSearch = {
			name: values.name,
			query: JSON.stringify(this.getSearchQuery())
		}
		if (this.props.searchQuery.objectType) {
			savedSearch.objectType = this.props.searchQuery.objectType.toUpperCase()
		}
		const operation = 'createSavedSearch'
		let graphql = operation + '(savedSearch: $savedSearch) { uuid }'
		const variables = { savedSearch: savedSearch }
		const variableDef = '($savedSearch: SavedSearchInput!)'
		return API.mutation(graphql, variables, variableDef)
	}

	@autobind
	openSaveModal() {
		this.setState({showSaveSearch: true})
	}

	@autobind
	closeSaveModal() {
		this.setState({showSaveSearch: false})
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
		this._dataFetcher(this.props, this._exportSearchResultsCallback, 0, 0)
	}
}

const mapStateToProps = (state, ownProps) => ({
	searchQuery: state.searchQuery,
	pagination: state.pagination,
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Search))
