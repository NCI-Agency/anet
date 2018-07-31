import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Grid, Row, Col} from 'react-bootstrap'
import autobind from 'autobind-decorator'

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

import {Element} from 'react-scroll'
class App extends Page {

	static propTypes = {
		...pagePropTypes,
		pageProps: PropTypes.object,
		searchProps: PropTypes.object,
	}

	constructor(props) {
		super(props)

		this.state = {
			pageProps: props.pageProps,
			currentUser: new Person(),
			settings: {},
			organizations: [],
			floatingMenu: false
		}

		Object.assign(this.state, this.processData(window.ANET_DATA))
	}

	componentDidMount() {
		super.componentDidMount()
		// We want to hide the floating menu on navigation events
		this.unlistenHistory = this.props.history.listen((location, action) => {
			this.showFloatingMenu(false)
		})
	}

	componentWillUnmount() {
		super.componentWillUnmount()
		this.unlistenHistory()
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

	@autobind
	showFloatingMenu(floatingMenu) {
		this.setState({floatingMenu: floatingMenu})
	}

	render() {
		const routing = <Switch>
			<Route exact path="/" component={Home} />
			<Route path="/search" component={Search} />
			<Route path="/rollup" component={RollupShow} />
			<Route path="/graphiql" component={GraphiQL} />
			<Route path="/help" component={Help} />
			<Route
				path="/reports"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={ReportNew} />
					<Route path={`${url}/:id/edit`} component={ReportEdit} />
					<Route path={`${url}/:id/min`} component={ReportMinimal} />
					<Route path={`${url}/mine`} component={MyReports} />
					<Route path={`${url}/:id`} component={ReportShow} />
				</Switch>
			)}
			/>
			<Route
				path="/people"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={PersonNew} />
					<Route path={`${url}/:id/edit`} component={PersonEdit} />
					<Route path={`${url}/:id`} component={PersonShow} />
				</Switch>
			)}
			/>
			<Route
				path="/organizations"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={OrganizationNew} />
					<Route path={`${url}/:id/edit`} component={OrganizationEdit} />
					<Route path={`${url}/:id/:action?`} component={OrganizationShow} />
				</Switch>
			)}
			/>
			<Route
				path="/locations"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={LocationNew} />
					<Route path={`${url}/:id/edit`} component={LocationEdit} />
					<Route path={`${url}/:id`} component={LocationShow} />
				</Switch>
			)}
			/>
			<Route
				path="/positions"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={PositionNew} />
					<Route path={`${url}/:id/edit`} component={PositionEdit} />
					<Route path={`${url}/:id`} component={PositionShow} />
				</Switch>
			)}
			/>
			<Route
				path="/tasks"
				render={({ match: { url } }) => (
				<Switch>
					<Route path={`${url}/new`} component={TaskNew} />
					<Route path={`${url}/:id/edit`} component={TaskEdit} />
					<Route path={`${url}/:id`} component={TaskShow} />
				</Switch>
			)}
			/>
			<Route
				path="/admin"
				render={({ match: { url } }) => (
				<Switch>
					<Route exact path={`${url}/`} component={AdminIndex} />
					<Route path={`${url}/mergePeople`} component={MergePeople} />
					<Route exact path={`${url}/authorizationGroups`} component={AuthorizationGroups} />
					<Route path={`${url}/authorizationGroups/new`} component={AuthorizationGroupNew} />
					<Route path={`${url}/authorizationGroups/:id/edit`} component={AuthorizationGroupEdit} />
					<Route path={`${url}/authorizationGroups/:id`} component={AuthorizationGroupShow} />
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
					<Route path={`${url}/edit`} component={OnboardingEdit} />
				</Switch>
			)}
			/>

			<Route path="*" component={PageMissing} />
		</Switch>

		const primaryWidths = {sm: 12, md: 12, lg: 12}
		return (
			<AppContext.Provider value={{
				appSettings: this.state.settings,
				currentUser: this.state.currentUser,
				loadAppData: this.loadData,
				showFloatingMenu: this.showFloatingMenu,
			}}>
				<div className="anet" style={{ display:'flex', flexDirection:'column'}}>
					<TopBar
						updateTopbarOffset={this.updateTopbarOffset}
						minimalHeader={this.props.pageProps.minimalHeader}
						location={this.props.location}
						toggleMenuAction={() => {
							this.showFloatingMenu(!this.state.floatingMenu)
						}} />

					<LoadingBar showFastActions style={{ backgroundColor: '#29d', marginTop: '-20px' }} />

					<div style={{width:"100%", flex:'1 1 auto', display:'flex', flexDirection:'row', overflowY:'hidden', position:'relative' }}>
						{(this.props.pageProps.useNavigation === true || this.state.floatingMenu === true) &&
						<div className={ this.state.floatingMenu === false ? "hidden-xs nav-fixed" : "nav-overlay"}>
							<Nav organizations={this.state.organizations} />
						</div>
						}
						<div style={{ display:'flex', flexDirection:'column', flex:'1 1 auto'}}>
							<Element className="primary-content" id="main-viewport">
								<div
									className={ this.state.floatingMenu === false ? null : "glass-pane" }
									onClick={() => {
										this.showFloatingMenu(false)
									}} />
								{routing}
							</Element>
						</div>
					</div>
				</div>
			</AppContext.Provider>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	pageProps: state.pageProps,
	searchProps: state.searchProps
})

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(App))
