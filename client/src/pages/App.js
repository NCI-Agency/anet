import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Grid, Row, Col} from 'react-bootstrap'

import LoadingBar from 'react-redux-loading-bar'
import TopBar from 'components/TopBar'
import Nav from 'components/Nav'

import API from 'api'
import {Person, Organization} from 'models'

import {Route, Switch} from 'react-router'
import Home from 'pages/Home'
import Search from 'pages/Search'
import RollupShow from 'pages/rollup/Show'
import GraphiQL from 'pages/GraphiQL'
import Help from 'pages/Help'
import PageMissing from 'pages/PageMissing'

import ReportNew from 'pages/reports/New'
import ReportShow from 'pages/reports/Show'
import ReportEdit from 'pages/reports/Edit'
import ReportMinimal from 'pages/reports/Minimal'
import MyReports from 'pages/reports/MyReports'

import PersonShow from 'pages/people/Show'
import PersonNew from 'pages/people/New'
import PersonEdit from 'pages/people/Edit'

import OrganizationShow from 'pages/organizations/Show'
import OrganizationNew from 'pages/organizations/New'
import OrganizationEdit from 'pages/organizations/Edit'

import LocationShow from 'pages/locations/Show'
import LocationEdit from 'pages/locations/Edit'
import LocationNew from 'pages/locations/New'

import PositionShow from 'pages/positions/Show'
import PositionEdit from 'pages/positions/Edit'
import PositionNew from 'pages/positions/New'

import TaskShow from 'pages/tasks/Show'
import TaskNew from 'pages/tasks/New'
import TaskEdit from 'pages/tasks/Edit'

import AdminIndex from 'pages/admin/Index'
import MergePeople from 'pages/admin/MergePeople'
import AuthorizationGroups from 'pages/admin/AuthorizationGroups'
import AuthorizationGroupShow from 'pages/admin/authorizationgroup/Show'
import AuthorizationGroupEdit from 'pages/admin/authorizationgroup/Edit'
import AuthorizationGroupNew from 'pages/admin/authorizationgroup/New'

import InsightsShow from  'pages/insights/Show'

import OnboardingShow from 'pages/onboarding/Show'
import OnboardingEdit from 'pages/onboarding/Edit'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

class App extends Page {

	static propTypes = {
		...pagePropTypes,
		pageProps: PropTypes.object,
	}

	constructor(props) {
		super(props)

		this.state = {
			pageProps: props.pageProps,
			currentUser: new Person(),
			settings: {},
			organizations: [],
			topbarOffset: 0
		}

		this.updateTopbarOffset = this.updateTopbarOffset.bind(this)
		Object.assign(this.state, this.processData(window.ANET_DATA))
	}

	updateTopbarOffset(topbarOffset) {
		if (this.state.topbarOffset !== topbarOffset){
			this.setState({ topbarOffset: topbarOffset })
		}
	}

	componentDidUpdate(prevProps, prevState) {
		// TODO: We should decide what to do here, e.g. when to call this.loadData()
		// We do not want the behaviour of our super class Page, as that would
		// mean this.loadData() is called with each change in props or location…
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			person(f:me) {
				id, name, role, emailAddress, rank, status
				position {
					id, name, type, status, isApprover
					organization { id, shortName , allDescendantOrgs { id }}
				}
			}

			adminSettings(f:getAll) {
				key, value
			}

			organizationList(f:getTopLevelOrgs, type: ADVISOR_ORG) {
				list { id, shortName }
			}
		`).then(data => {
			data.person._loaded = true
			this.setState(this.processData(data), () => {
				// if this is a new user, redirect to the create profile page
				if (this.state.currentUser.isNewUser()) {
					this.props.history.replace('/onboarding')
				}
			})
		})

	}

	processData(data) {
		const currentUser = new Person(data.person)
		let organizations = (data.organizationList && data.organizationList.list) || []
		organizations = Organization.fromArray(organizations)
		organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))

		let settings = this.state.settings
		data.adminSettings.forEach(setting => settings[setting.key] = setting.value)

		return {currentUser, settings, organizations}
	}

	render() {
		const routing = <Switch>
			<Route exact path="/" render={(props) => <Home {...props} currentUser={this.state.currentUser} />} />
			<Route path="/search" component={Search} />
			<Route path="/rollup" component={RollupShow} />
			<Route path="/graphiql" component={GraphiQL} />
			<Route path="/help" render={(props) => <Help {...props} currentUser={this.state.currentUser} />} />
			<Route
				path="/reports"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} render={(props) => <ReportNew {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id/edit`} render={(props) => <ReportEdit {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id/min`} component={ReportMinimal} />
					<Route path={`${url}/mine`} render={(props) => <MyReports {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id`} render={(props) => <ReportShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/people"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} render={(props) => <PersonNew {...props} currentUser={this.state.currentUser} loadAppData={this.loadData} />} />
					<Route path={`${url}/:id/edit`} render={(props) => <PersonEdit {...props} currentUser={this.state.currentUser} loadAppData={this.loadData} />} />
					<Route path={`${url}/:id`} render={(props) => <PersonShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/organizations"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} render={(props) => <OrganizationNew {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id/edit`} render={(props) => <OrganizationEdit {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id/:action?`} render={(props) => <OrganizationShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/locations"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={LocationNew} />
					<Route path={`${url}/:id/edit`} component={LocationEdit} />} />
					<Route path={`${url}/:id`} render={(props) => <LocationShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/positions"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} render={(props) => <PositionNew {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id/edit`} render={(props) => <PositionEdit {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id`} render={(props) => <PositionShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/tasks"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} render={(props) => <TaskNew {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id/edit`} render={(props) => <TaskEdit {...props} currentUser={this.state.currentUser} />} />
					<Route path={`${url}/:id`} render={(props) => <TaskShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/admin"
				render={({ match: { url } }) => (
				<Switch>
					<Route exact path={`${url}/`} render={(props) => <AdminIndex {...props} loadAppData={this.loadData} />} />
					<Route path={`${url}/mergePeople`} component={MergePeople} />
					<Route exact path={`${url}/authorizationGroups`} component={AuthorizationGroups} />
					<Route path={`${url}/authorizationGroups/new`} component={AuthorizationGroupNew} />
					<Route path={`${url}/authorizationGroups/:id/edit`} component={AuthorizationGroupEdit} />
					<Route path={`${url}/authorizationGroups/:id`} render={(props) => <AuthorizationGroupShow {...props} currentUser={this.state.currentUser} />} />
				</Switch>
			)}
			/>
			<Route
				path="/insights"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/:insight`} component={InsightsShow} />
				</Switch>
			)}
			/>
			<Route
				path="/onboarding"
				render={({ match: { url } }) => (
				<Switch>
					<Route exact path={`${url}/`} component={OnboardingShow} />
					<Route path={`${url}/edit`} render={(props) => <OnboardingEdit {...props} currentUser={this.state.currentUser} loadAppData={this.loadData} />} />
				</Switch>
			)}
			/>

			<Route path="*" component={PageMissing} />
		</Switch>

		const navWidths = {sm: 4, md: 3, lg: 2}
		const primaryWidths = (this.props.pageProps.useNavigation === true)
				? {sm: 12 - navWidths.sm, md: 12 - navWidths.md, lg: 12 - navWidths.lg}
				: {sm: 12, md: 12, lg: 12}
		return (
			<AppContext.Provider value={{
				appSettings: this.state.settings,
			}}>
				<div className="anet">
					<TopBar
						updateTopbarOffset={this.updateTopbarOffset}
						currentUser={this.state.currentUser}
						minimalHeader={this.props.pageProps.minimalHeader}
						location={this.props.location} />

					<LoadingBar showFastActions style={{ backgroundColor: '#29d', marginTop: '-20px' }} />

					<Grid fluid componentClass="section">
						<Row>
							{this.props.pageProps.useNavigation === true &&
								<Col sm={navWidths.sm} md={navWidths.md} lg={navWidths.lg} className="hide-for-print">
									<Nav
										currentUser={this.state.currentUser}
										organizations={this.state.organizations}
										topbarOffset={this.state.topbarOffset} />
								</Col>
							}
							<Col sm={primaryWidths.sm} md={primaryWidths.md} lg={primaryWidths.lg} className="primary-content">
								{routing}
							</Col>
						</Row>
					</Grid>
				</div>
			</AppContext.Provider>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	pageProps: state.pageProps
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(App))
