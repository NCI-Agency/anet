import PropTypes from 'prop-types'

import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Grid, Row, FormControl, FormGroup, ControlLabel, Button} from 'react-bootstrap'
import {Link} from 'react-router-dom'
import moment from 'moment'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Messages from 'components/Messages'
import Breadcrumbs from 'components/Breadcrumbs'
import SavedSearchTable from 'components/SavedSearchTable'

import GuidedTour from 'components/GuidedTour'
import {userTour, superUserTour} from 'pages/HopscotchTour'

import {Person, Report} from 'models'

import API from 'api'
import Settings from 'Settings'

import ConfirmDelete from 'components/ConfirmDelete'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import utils from 'utils'

class BaseHome extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)

		this.state = {
			tileCounts: [],
			savedSearches: [],
			selectedSearch: null,
			userAuthGroups: []
		}
	}

	adminQueries(currentUser) {
		return [ this.allDraft(), this.allPending(), this.pendingMe(currentUser), this.allUpcoming(), this.mySensitiveInfo() ]
	}

	approverQueries(currentUser) {
		return [ this.pendingMe(currentUser), this.myDraft(currentUser), this.myOrgRecent(currentUser), this.myOrgFuture(currentUser),
		         this.mySensitiveInfo() ]
	}

	advisorQueries(currentUser) {
		return [ this.myDraft(currentUser), this.myPending(currentUser), this.myOrgRecent(currentUser), this.myOrgFuture(currentUser),
		         this.mySensitiveInfo() ]
	}

	allDraft() { return {
		title: "All draft reports",
		query: { state: [Report.STATE.DRAFT, Report.STATE.REJECTED] }
	}}

	myDraft(currentUser) {
		return {
			title: "My draft reports",
			query: { state: [Report.STATE.DRAFT, Report.STATE.REJECTED], authorId: currentUser.id }
		}
	}

	myPending(currentUser) {
		return {
			title: "My reports pending approval",
			query: { authorId: currentUser.id, state: [Report.STATE.PENDING_APPROVAL]}
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
			query: { state: [Report.STATE.PENDING_APPROVAL] }
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
				state: [Report.STATE.RELEASED, Report.STATE.CANCELLED, Report.STATE.PENDING_APPROVAL]
			}
		}
	}

	myOrgFuture(currentUser) {
		if (!currentUser.position || !currentUser.position.organization) { return { query: {}} }
		return {
			title: currentUser.position.organization.shortName + "'s upcoming engagements",
			query: {
				advisorOrgId: currentUser.position.organization.id,
				state: [Report.STATE.FUTURE],
				sortOrder: 'ASC'
			}
		}
	}

	allUpcoming() {
		return {
			title: "All upcoming engagements",
			query: { state: [Report.STATE.FUTURE], sortOrder: 'ASC' }
		}
	}

	mySensitiveInfo() {
		return {
			title: "Reports with sensitive information",
			query: { state: [Report.STATE.RELEASED], authorizationGroupId: (this.state.userAuthGroups.length ? this.state.userAuthGroups.map(f => f.id) : [-1]) }
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

	fetchData(props) {
		//If we don't have the currentUser yet (ie page is still loading, don't run these queries)
		const { currentUser } = props
		if (!currentUser || !currentUser._loaded) { return }
		// Get current user authorization groups (needed for reports query 5)
		const userAuthGroupsGraphQL = /* GraphQL */`
			userAuthGroups: authorizationGroupList(f:search, query:$queryUserAuthGroups) {totalCount, list { id }}`
		return API.query(
				userAuthGroupsGraphQL,
				{queryUserAuthGroups: {positionId: currentUser.position ? currentUser.position.id : -1}},
				"($queryUserAuthGroups: AuthorizationGroupSearchQuery)")
			.then(data => {
				this.setState({userAuthGroups: data.userAuthGroups.list})
				//queries will contain the five queries that will show up on the home tiles
				//Based on the users role. They are all report searches
				let queries = this.getQueriesForUser(currentUser)
				//Run those five queries
				let graphQL = /* GraphQL */`
					tileOne: reportList(f:search, query:$queryOne) { totalCount},
					tileTwo: reportList(f:search, query: $queryTwo) { totalCount},
					tileThree: reportList(f:search, query: $queryThree) { totalCount },
					tileFour: reportList(f:search, query: $queryFour) { totalCount },
					tileFive: reportList(f:search, query: $queryFive) { totalCount },
					savedSearches: savedSearchs(f:mine) {id, name, objectType, query}`
				let variables = {
					queryOne: queries[0].query,
					queryTwo: queries[1].query,
					queryThree: queries[2].query,
					queryFour: queries[3].query,
					queryFive: queries[4].query
				}
				API.query(graphQL, variables,
					"($queryOne: ReportSearchQuery, $queryTwo: ReportSearchQuery, $queryThree: ReportSearchQuery, $queryFour: ReportSearchQuery," +
					"$queryFive: ReportSearchQuery)")
				.then(data => {
					let selectedSearch = data.savedSearches && data.savedSearches.length > 0 ? data.savedSearches[0] : null
					this.setState({
						tileCounts: [data.tileOne.totalCount, data.tileTwo.totalCount, data.tileThree.totalCount, data.tileFour.totalCount, data.tileFive.totalCount],
						savedSearches: data.savedSearches,
						selectedSearch: selectedSearch
					})
			})
		})
	}

	render() {
		const { currentUser } = this.props
		const alertStyle = {top:132, marginBottom: '1rem', textAlign: 'center'}
		const supportEmail = Settings.SUPPORT_EMAIL_ADDR
		const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ''
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
				{!currentUser.hasAssignedPosition() &&
					<div className="alert alert-warning" style={alertStyle}>
						You are not assigned to a {Settings.fields.advisor.position.name} position.<br/>
						Please contact your organization's super user(s) to assign you to a {Settings.fields.advisor.position.name} position.<br/>
						If you are unsure, you can also contact the support team {supportEmailMessage}.
					</div>
				}
				{currentUser.hasAssignedPosition() && !currentUser.hasActivePosition() &&
					<div className="alert alert-warning" style={alertStyle}>
						Your {Settings.fields.advisor.position.name} position has an inactive status.<br/>
						Please contact your organization's super users to change your position to an active status.<br/>
						If you are unsure, you can also contact the support team {supportEmailMessage}.
					</div>
				}
				<Messages error={this.state.error} success={this.state.success} />

				<Fieldset className="home-tile-row" title="My ANET snapshot">
					<Grid fluid>
						<Row>
							{queries.map((query, index) =>{
								query.query.type = "reports"
									return <Link to={{pathname: '/search', search: utils.formatQueryString(query.query)}} className="home-tile" key={index}>
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
								<ConfirmDelete
									onConfirmDelete={this.onConfirmDelete}
									objectType="search"
									objectDisplay={this.state.selectedSearch.name}
									bsStyle="danger"
									buttonLabel="Delete Search" />
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
			this.props.history.push({
				pathname: '/search',
				search: utils.formatQueryString(query)
			})
		}
	}

	@autobind
	onConfirmDelete() {
		const search = this.state.selectedSearch
		const index = this.state.savedSearches.findIndex(s => s.id === search.id)
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

const Home = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseHome currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(withRouter(Home))
