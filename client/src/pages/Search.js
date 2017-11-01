import React from 'react'
import Page from 'components/Page'
import {Alert, Table, Modal, Button, Nav, NavItem, Badge, Pagination} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import {ContentForNav} from 'components/Nav'
import History from 'components/History'
import Breadcrumbs from 'components/Breadcrumbs'
import LinkTo from 'components/LinkTo'
import ReportCollection from 'components/ReportCollection'
import Form from 'components/Form'
import Messages from 'components/Messages'
import AdvancedSearch from 'components/AdvancedSearch'

import API from 'api'
import dict from 'dictionary'
import GQL from 'graphqlapi'
import {Person, Organization, Position, Poam} from 'models'
import Export from "export"

import EVERYTHING_ICON from 'resources/search-alt.png'
import REPORTS_ICON from 'resources/reports.png'
import PEOPLE_ICON from 'resources/people.png'
import LOCATIONS_ICON from 'resources/locations.png'
import POAMS_ICON from 'resources/poams.png'
import POSITIONS_ICON from 'resources/positions.png'
import ORGANIZATIONS_ICON from 'resources/organizations.png'


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
		variableType: 'ReportSearchQuery',
		fields : ReportCollection.GQL_REPORT_FIELDS
	},
	people : {
		listName : 'people: personList',
		variableType: 'PersonSearchQuery',
		fields: 'id, name, rank, emailAddress, role , position { id, name, organization { id, shortName} }'
	},
	positions : {
		listName: 'positions: positionList',
		variableType: 'PositionSearchQuery',
		fields: 'id , name, type, organization { id, shortName}, person { id, name }'
	},
	poams : {
		listName: 'poams: poamList',
		variableType: 'PoamSearchQuery',
		fields: 'id, shortName, longName'
	},
	locations : {
		listName: 'locations: locationList',
		variableType: 'LocationSearchQuery',
		fields : 'id, name, lat, lng'
	},
	organizations : {
		listName: 'organizations: organizationList',
		variableType: 'OrganizationSearchQuery',
		fields: 'id, shortName, longName, identificationCode, type'
	}
}

export default class Search extends Page {

	constructor(props) {
		super(props)

		this.state = {
			query: props.location.query.text,
			queryType: null,
			pageNum: {
				reports: 0,
				people: 0,
				organizations: 0,
				positions: 0,
				locations: 0,
				poams: 0,
			},
			saveSearch: {show: false},
			results: {
				reports: null,
				people: null,
				organizations: null,
				positions: null,
				locations: null,
				poams: null,
			},
			error: null,
			success: null,
		}

		if (props.location.state && props.location.state.advancedSearch) {
			this.state.advancedSearch = props.location.state.advancedSearch
		}
	}

	componentWillReceiveProps(props, context) {
		let newAdvancedSearch = props.location.state && props.location.state.advancedSearch
		if (this.state.advancedSearch !== newAdvancedSearch) {
			this.setState({advancedSearch: newAdvancedSearch}, () => this.loadData())
		} else {
			super.componentWillReceiveProps(props, context)
		}
	}

	getSearchPart(type, query) {
//		query = Object.without(query, 'type')
		query.pageSize = 10
		query.pageNum = this.state.pageNum[type]

		let config = SEARCH_CONFIG[type]
		let part = new GQL.Part(/* GraphQL */`
			${config.listName} (f:search, query:$${type}Query) {
				pageNum, pageSize, totalCount, list { ${config.fields} }
			}
			`).addVariable(type + "Query", config.variableType, query)
		return part
	}



	@autobind
	getAdvancedSearchQuery() {
		let {advancedSearch} = this.state
		let query = {text: advancedSearch.text}
		advancedSearch.filters.forEach(filter => {
			if (filter.value) {
				if (filter.value.toQuery) {
					Object.assign(query, filter.value.toQuery())
				} else {
					query[filter.key] = filter.value
				}
			}
		})

		console.log('SEARCH advanced query', query)

		return query
	}


	fetchData(props) {
		let {advancedSearch} = this.state

		if (advancedSearch) {
			let query = this.getAdvancedSearchQuery()
			let part = this.getSearchPart(advancedSearch.objectType.toLowerCase(), query)
			GQL.run([part]).then(data => {
				this.setState({results: data})
			})

			return
		}

		let {type, text, ...advQuery} = props.location.query
		//Any query with a field other than 'text' and 'type' is an advanced query.
		let isAdvQuery = Object.keys(advQuery).length
		advQuery.text = text

		let parts = []
		if (isAdvQuery) {
			parts.push(this.getSearchPart(type, advQuery))
		} else {
			Object.keys(SEARCH_CONFIG).forEach(key => {
				parts.push(this.getSearchPart(key, advQuery))
			})
		}
		GQL.run(parts).then(data => {
			this.setState({results: data})
		}).catch(response =>
			this.setState({error: response})
		)
	}

	render() {
		let results = this.state.results
		let error = this.state.error
		let success = this.state.success

		let numReports = results.reports ? results.reports.totalCount : 0
		let numPeople = results.people ? results.people.totalCount : 0
		let numPositions = results.positions ? results.positions.totalCount : 0
		let numPoams = results.poams ? results.poams.totalCount : 0
		let numLocations = results.locations ? results.locations.totalCount : 0
		let numOrganizations = results.organizations ? results.organizations.totalCount : 0

		let numResults = numReports + numPeople + numPositions + numLocations + numOrganizations + numPoams
		let noResults = numResults === 0

		let query = this.props.location.query
		let queryString = QUERY_STRINGS[query.type] || query.text || 'TODO'
		let queryType = this.state.queryType || query.type || 'everything'

		let poamShortTitle = dict.lookup('POAM_SHORT_NAME')

		if (typeof queryString === 'object') {
			queryString = queryString[Object.keys(query)[1]]
		}

		return (
			<div>
				<div className="pull-right">
					<Button onClick={this.showSaveModal} id="saveSearchButton" style={{marginRight: 12}}>Save search</Button>
					{!this.state.advancedSearch && <Button onClick={this.showAdvancedSearch}>Advanced search</Button>}
				</div>

				<Breadcrumbs items={[['Search results', '']]} />

				<ContentForNav>
					<div className="nav-fixed">
						<div><Button onClick={History.goBack} bsStyle="link">&lt; Return to previous page</Button></div>

						<Nav stacked bsStyle="pills" activeKey={queryType} onSelect={this.onSelectQueryType}>
							<NavItem eventKey="everything" disabled={!numResults}>
								<img src={EVERYTHING_ICON} role="presentation" /> Everything
								{numResults > 0 && <Badge pullRight>{numResults}</Badge>}
							</NavItem>

							<NavItem eventKey="organizations" disabled={!numOrganizations}>
								<img src={ORGANIZATIONS_ICON} role="presentation" /> Organizations
								{numOrganizations > 0 && <Badge pullRight>{numOrganizations}</Badge>}
							</NavItem>

							<NavItem eventKey="people" disabled={!numPeople}>
								<img src={PEOPLE_ICON} role="presentation" /> People
								{numPeople > 0 && <Badge pullRight>{numPeople}</Badge>}
							</NavItem>

							<NavItem eventKey="positions" disabled={!numPositions}>
								<img src={POSITIONS_ICON} role="presentation" /> Positions
								{numPositions > 0 && <Badge pullRight>{numPositions}</Badge>}
							</NavItem>

							<NavItem eventKey="poams" disabled={!numPoams}>
								<img src={POAMS_ICON} role="presentation" /> {poamShortTitle}s
								{numPoams > 0 && <Badge pullRight>{numPoams}</Badge>}
							</NavItem>

							<NavItem eventKey="locations" disabled={!numLocations}>
								<img src={LOCATIONS_ICON} role="presentation" /> Locations
								{numLocations > 0 && <Badge pullRight>{numLocations}</Badge>}
							</NavItem>

							<NavItem eventKey="reports" disabled={!numReports}>
								<img src={REPORTS_ICON} role="presentation" /> Reports
								{numReports > 0 && <Badge pullRight>{numReports}</Badge>}
							</NavItem>

						</Nav>
					</div>
				</ContentForNav>

				{this.state.advancedSearch && <Fieldset title="Search filters">
					<AdvancedSearch query={this.state.advancedSearch} onCancel={this.cancelAdvancedSearch} />
				</Fieldset>}

				<Messages error={error} success={success} />

				{this.props.location.query.text && <h2 className="only-show-for-print">Search query: '{this.props.location.query.text}'</h2>}

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

				{numPoams > 0 && (queryType === 'everything' || queryType === 'poams') &&
					<Fieldset title={poamShortTitle + 's'}>
						{this.renderPoams()}
					</Fieldset>
				}

				{numLocations > 0 && (queryType === 'everything' || queryType === 'locations') &&
					<Fieldset title="Locations">
						{this.renderLocations()}
					</Fieldset>
				}

				{numReports > 0 && (queryType === 'everything' || queryType === 'reports') &&
					<Fieldset title="Reports">
						<ReportCollection paginatedReports={results.reports} goToPage={this.goToPage.bind(this, 'reports') } downloadAll={ ((progressfn) => {return this.downloadAll('reports',progressfn) }) }/>
					</Fieldset>
				}

				{this.renderSaveModal()}
			</div>
		)
	}

	@autobind
	paginationFor(type) {
		let {pageSize, pageNum, totalCount} = this.state.results[type]
		let numPages = Math.ceil(totalCount / pageSize)
		if (numPages === 1) { return }
		return <header className="searchPagination" ><Pagination
			className="pull-right"
			prev
			next
			items={numPages}
			ellipsis
			maxButtons={6}
			activePage={pageNum + 1}
			onSelect={(value) => this.goToPage(type, value - 1)}
		/></header>
	}

	@autobind
	goToPage(type, pageNum) {
		let pageNums = this.state.pageNum
		pageNums[type] = pageNum

		let query = (this.state.advancedSearch) ? this.getAdvancedSearchQuery() : Object.without(this.props.location.query, 'type')
		let part = this.getSearchPart(type, query)
		GQL.run([part]).then(data => {
			let results = this.state.results //TODO: @nickjs this feels wrong, help!
			results[type] = data[type]
			this.setState({results})
		}).catch(response =>
			this.setState({error: response})
		)
	}

	@autobind
	downloadAll(type,progressfn) {
		let query = (this.state.advancedSearch) ? this.getAdvancedSearchQuery() : Object.without(this.props.location.query, 'type')
		Export.csvExport.export(type,query,progressfn)
	}

	@autobind
	showAdvancedSearch() {
		this.setState({advancedSearch: {text: this.state.query}})
	}

	@autobind
	cancelAdvancedSearch() {
		History.push({pathname: '/search', query: {text: this.state.advancedSearch ? this.state.advancedSearch.text : ""}, advancedSearch: null})
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
								<LinkTo person={person}>{person.rank} {person.name}</LinkTo>
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
			<Table responsive hover striped>
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
						<th>Type</th>
					</tr>
				</thead>
				<tbody>
					{Organization.map(this.state.results.organizations.list, org =>
						<tr key={org.id}>
							<td><LinkTo organization={org} /></td>
							<td>{org.longName}</td>
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
			<Table responsive hover striped>
				<thead>
					<tr>
						<th>Name</th>
						<th>Org</th>
						<th>Current Occupant</th>
					</tr>
				</thead>
				<tbody>
					{Position.map(this.state.results.positions.list, pos =>
						<tr key={pos.id}>
							<td>
								<img src={pos.iconUrl()} alt={pos.type} height={20} className="person-icon" />
								<LinkTo position={pos} >{pos.code} {pos.name}</LinkTo>
							</td>
							<td>{pos.organization && <LinkTo organization={pos.organization} />}</td>
							<td>{pos.person && <LinkTo person={pos.person} />}</td>
						</tr>
					)}
				</tbody>
			</Table>
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
							<td><LinkTo location={loc} /></td>
						</tr>
					)}
				</tbody>
			</Table>
		</div>
	}

	renderPoams() {
		return <div>
			{this.paginationFor('poams')}
			<Table responsive hover striped>
				<thead>
					<tr>
						<th>Name</th>
					</tr>
				</thead>
				<tbody>
					{Poam.map(this.state.results.poams.list, poam =>
						<tr key={poam.id}>
							<td><LinkTo poam={poam} >{poam.shortName} {poam.longName}</LinkTo></td>
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

		let search = Object.without(this.state.saveSearch, 'show')
		if (this.state.advancedSearch) {
			search.query = JSON.stringify(this.getAdvancedSearchQuery())
			search.objectType = this.state.advancedSearch.objectType.toUpperCase()
		} else {
			search.query = JSON.stringify({text: this.props.location.query.text })
		}

		API.send('/api/savedSearches/new', search, {disableSubmits: true})
			.then(response => {
				if (response.code) throw response.code
				this.setState({
					success: 'Search successfully saved!',
					saveSearch: {show: false}
				})
				window.scrollTo(0, 0)
			}).catch(response => {
				this.setState({
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
	closeSaveModal() {
		this.setState({saveSearch: {show: false}})
	}

	@autobind
	onSelectQueryType(type) {
		this.setState({queryType: type}, () => this.loadData())
	}

}
