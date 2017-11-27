import React, {PropTypes} from 'react'
import Page from 'components/Page'
import {Grid, Row, FormControl, FormGroup, ControlLabel, Button} from 'react-bootstrap'
import {Link} from 'react-router'
import moment from 'moment'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import History from 'components/History'
import Messages from 'components/Messages'
import Breadcrumbs from 'components/Breadcrumbs'
import SavedSearchTable from 'components/SavedSearchTable'

import GuidedTour from 'components/GuidedTour'
import {userTour, superUserTour} from 'pages/HopscotchTour'

import API from 'api'

export default class Home extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props)
		this.state = {
			tileCounts: [],
			savedSearches: [],
			selectedSearch: null,
		}
	}

	adminQueries(currentUser) {
		return [ this.allDraft(), this.allPending(), this.pendingMe(currentUser), this.allUpcoming() ]
	}

	approverQueries(currentUser) {
		return [ this.pendingMe(currentUser), this.myDraft(currentUser), this.myOrgRecent(currentUser), this.myOrgFuture(currentUser) ]
	}

	advisorQueries(currentUser) {
		return [ this.myDraft(currentUser), this.myPending(currentUser), this.myOrgRecent(currentUser), this.myOrgFuture(currentUser) ]
	}

	allDraft() { return {
		title: "All draft reports",
		query: { state: ["DRAFT", "REJECTED"] }
	}}

	myDraft(currentUser) {
		return {
			title: "My draft reports",
			query: { state: ["DRAFT", "REJECTED"], authorId: currentUser.id }
		}
	}

	myPending(currentUser) {
		return {
			title: "My reports pending approval",
			query: { authorId: currentUser.id, state: ["PENDING_APPROVAL"]}
		}
	}

	pendingMe(currentUser) {
		return {
			title: "Reports pending my approval",
			query: { pendingApprovalOf: currentUser.id }
		}
	}

	allPending() {
		return {
			title: "All reports pending approval",
			query: { state: ["PENDING_APPROVAL"] }
		}
	}

	myOrgRecent(currentUser) {
		if (!currentUser.position || !currentUser.position.organization) { return { query: {}} }
		let lastWeek = moment().subtract(7, 'days').startOf('day').valueOf()
		return {
			title: currentUser.position.organization.shortName + "'s reports in the last 7 days",
			query: {
				advisorOrgId: currentUser.position.organization.id,
				createdAtStart: lastWeek,
				state: ["RELEASED", "CANCELLED", "PENDING_APPROVAL"]
			}
		}
	}

	myOrgFuture(currentUser) {
		if (!currentUser.position || !currentUser.position.organization) { return { query: {}} }
		return {
			title: currentUser.position.organization.shortName + "'s upcoming engagements",
			query: {
				advisorOrgId: currentUser.position.organization.id,
				state: ["FUTURE"],
				sortOrder: 'ASC'
			}
		}
	}

	allUpcoming() {
		return {
			title: "All upcoming engagements",
			query: { state: ["FUTURE"], sortOrder: 'ASC' }
		}
	}

	getQueriesForUser(currentUser) {
		if (currentUser.isAdmin()) {
			return this.adminQueries(currentUser)
		} else if (currentUser.position && currentUser.position.isApprover) {
			return this.approverQueries(currentUser)
		} else {
			return this.advisorQueries(currentUser)
		}
	}

	fetchData(props, context) {
		//If we don't have the currentUser yet (ie page is still loading, don't run these queries)
		let {currentUser} = context
		if (!currentUser || !currentUser._loaded) { return }

		//queries will contain the four queries that will show up on the home tiles
		//Based on the users role. They are all report searches
		let queries = this.getQueriesForUser(currentUser)
		//Run those four queries
		let graphQL = /* GraphQL */`
			tileOne: reportList(f:search, query:$queryOne) { totalCount},
			tileTwo: reportList(f:search, query: $queryTwo) { totalCount},
			tileThree: reportList(f:search, query: $queryThree) { totalCount },
			tileFour: reportList(f:search, query: $queryFour) { totalCount },
			savedSearches: savedSearchs(f:mine) {id, name, objectType, query}`
		let variables = {
			queryOne: queries[0].query,
			queryTwo: queries[1].query,
			queryThree: queries[2].query,
			queryFour: queries[3].query
		}

		API.query(graphQL, variables,
			"($queryOne: ReportSearchQuery, $queryTwo: ReportSearchQuery, $queryThree: ReportSearchQuery, $queryFour: ReportSearchQuery)")
		.then(data => {
			let selectedSearch = data.savedSearches && data.savedSearches.length > 0 ? data.savedSearches[0] : null
			this.setState({
				tileCounts: [data.tileOne.totalCount, data.tileTwo.totalCount, data.tileThree.totalCount, data.tileFour.totalCount],
				savedSearches: data.savedSearches,
				selectedSearch: selectedSearch
			})
		})
	}

	render() {
		let {currentUser} = this.context
		let queries = this.getQueriesForUser(currentUser)

		return (
			<div>
				<div className="pull-right">
					<GuidedTour
						title="Take a guided tour of the home page."
						tour={currentUser.isSuperUser() ? superUserTour : userTour}
						autostart={localStorage.newUser === 'true' && localStorage.hasSeenHomeTour !== 'true'}
						onEnd={() => localStorage.hasSeenHomeTour = 'true'}
					/>
				</div>

				<Breadcrumbs />
				<Messages error={this.state.error} success={this.state.success} />

				<Fieldset className="home-tile-row" title="My ANET snapshot">
					<Grid fluid>
						<Row>
							{queries.map((query, index) =>{
								query.query.type = "reports"
									return <Link to={{pathname: '/search', query: query.query, }} className="col-md-3 home-tile" key={index}>
										<h1>{this.state.tileCounts[index]}</h1>
										{query.title}
									</Link>
							})}
						</Row>
					</Grid>
				</Fieldset>

				<Fieldset title="Saved searches">
					<FormGroup controlId="savedSearchSelect">
						<ControlLabel>Select a saved search</ControlLabel>
						<FormControl componentClass="select" onChange={this.onSaveSearchSelect}>
							{this.state.savedSearches && this.state.savedSearches.map( savedSearch =>
								<option value={savedSearch.id} key={savedSearch.id}>{savedSearch.name}</option>
							)}
						</FormControl>
					</FormGroup>

					{this.state.selectedSearch &&
						<div>
							<div className="pull-right">
								<Button style={{marginRight: 12}} onClick={this.showSearch} >
									Show Search
								</Button>
								<Button bsStyle="danger" bsSize="small" onClick={this.deleteSearch} >
									Delete Search
								</Button>
							</div>
							<SavedSearchTable search={this.state.selectedSearch} />
						</div>
					}
				</Fieldset>
			</div>
		)
	}

	@autobind
	onSaveSearchSelect(event) {
		let id = event && event.target ? event.target.value : event
		let search = this.state.savedSearches.find(el => Number(el.id) === Number(id))
		this.setState({selectedSearch: search})
	}

	@autobind
	showSearch() {
		let search = this.state.selectedSearch
		if (search) {
			let query = JSON.parse(search.query)
			if (search.objectType) {
				query.type = search.objectType.toLowerCase()
			}
			History.push({pathname: '/search', query: query})
		}
	}

	@autobind
	deleteSearch() {
		let search = this.state.selectedSearch
		let index = this.state.savedSearches.findIndex(s => s.id === search.id)
		if (confirm("Are you sure you want to delete '" + search.name + "'?")) {
			API.send(`/api/savedSearches/${search.id}`, {}, {method: 'DELETE'})
				.then(data => {
					let savedSearches = this.state.savedSearches
					savedSearches.splice(index, 1)
					let nextSelect = savedSearches.length > 0 ? savedSearches[0] : null
					this.setState({ savedSearches: savedSearches, selectedSearch : nextSelect })
				}, data => {
					this.setState({success:null, error: data})
				})
		}
	}
}
