import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {Route, Switch, Redirect} from 'react-router'

import AppContext from 'components/AppContext'
import asyncComponent from 'components/AsyncComponent'
import {Person} from 'models'

const Home = asyncComponent(() => import('pages/Home'))
const Search = asyncComponent(() => import('pages/Search'))
const RollupShow = asyncComponent(() => import('pages/rollup/Show'))
const GraphiQL = asyncComponent(() => import('pages/GraphiQL'))
const Help = asyncComponent(() => import('pages/Help'))
const PageMissing = asyncComponent(() => import('pages/PageMissing'))

const ReportNew = asyncComponent(() => import('pages/reports/New'))
const ReportShow = asyncComponent(() => import('pages/reports/Show'))
const ReportEdit = asyncComponent(() => import('pages/reports/Edit'))
const ReportMinimal = asyncComponent(() => import('pages/reports/Minimal'))
const MyReports = asyncComponent(() => import('pages/reports/MyReports'))

const PersonShow = asyncComponent(() => import('pages/people/Show'))
const PersonNew = asyncComponent(() => import('pages/people/New'))
const PersonEdit = asyncComponent(() => import('pages/people/Edit'))

const OrganizationShow = asyncComponent(() => import('pages/organizations/Show'))
const OrganizationNew = asyncComponent(() => import('pages/organizations/New'))
const OrganizationEdit = asyncComponent(() => import('pages/organizations/Edit'))

const LocationShow = asyncComponent(() => import('pages/locations/Show'))
const LocationEdit = asyncComponent(() => import('pages/locations/Edit'))
const LocationNew = asyncComponent(() => import('pages/locations/New'))

const PositionShow = asyncComponent(() => import('pages/positions/Show'))
const PositionEdit = asyncComponent(() => import('pages/positions/Edit'))
const PositionNew = asyncComponent(() => import('pages/positions/New'))

const TaskShow = asyncComponent(() => import('pages/tasks/Show'))
const TaskNew = asyncComponent(() => import('pages/tasks/New'))
const TaskEdit = asyncComponent(() => import('pages/tasks/Edit'))

const AdminIndex = asyncComponent(() => import('pages/admin/Index'))
const MergePeople = asyncComponent(() => import('pages/admin/MergePeople'))
const AuthorizationGroups = asyncComponent(() => import('pages/admin/AuthorizationGroups'))
const AuthorizationGroupShow = asyncComponent(() => import('pages/admin/authorizationgroup/Show'))
const AuthorizationGroupEdit = asyncComponent(() => import('pages/admin/authorizationgroup/Edit'))
const AuthorizationGroupNew = asyncComponent(() => import('pages/admin/authorizationgroup/New'))

const InsightsShow = asyncComponent(() => import( 'pages/insights/Show'))

const OnboardingShow = asyncComponent(() => import('pages/onboarding/Show'))
const OnboardingEdit = asyncComponent(() => import('pages/onboarding/Edit'))

class BaseRouting extends Component {
  static propTypes = {
	currentUser: PropTypes.instanceOf(Person),
  }

  render() {
	return (
	<Switch>
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
				<Route path={`${url}/:uuid/edit`} component={ReportEdit} />
				<Route path={`${url}/:uuid/min`} component={ReportMinimal} />
				<Route path={`${url}/mine`} component={MyReports} />
				<Route path={`${url}/:uuid`} component={ReportShow} />
			</Switch>
		)}
		/>
		<Route
			path="/people"
			render={({ match: { url } }) => (
			<Switch>
				<Route path={`${url}/new`} component={PersonNew} />
				<Route path={`${url}/:uuid/edit`} component={PersonEdit} />
				<Route path={`${url}/:uuid`} component={PersonShow} />
			</Switch>
		)}
		/>
		<Route
			path="/organizations"
			render={({ match: { url } }) => (
			<Switch>
				<Route path={`${url}/new`} component={OrganizationNew} />
				<Route path={`${url}/:uuid/edit`} component={OrganizationEdit} />
				<Route path={`${url}/:uuid/:action?`} component={OrganizationShow} />
			</Switch>
		)}
		/>
		<Route
			path="/locations"
			render={({ match: { url } }) => (
			<Switch>
				<Route path={`${url}/new`} component={LocationNew} />
				<Route path={`${url}/:uuid/edit`} component={LocationEdit} />
				<Route path={`${url}/:uuid`} component={LocationShow} />
			</Switch>
		)}
		/>
		<Route
			path="/positions"
			render={({ match: { url } }) => (
			<Switch>
				<Route path={`${url}/new`} component={PositionNew} />
				<Route path={`${url}/:uuid/edit`} component={PositionEdit} />
				<Route path={`${url}/:uuid`} component={PositionShow} />
			</Switch>
		)}
		/>
		<Route
			path="/tasks"
			render={({ match: { url } }) => (
			<Switch>
				<Route path={`${url}/new`} component={TaskNew} />
				<Route path={`${url}/:uuid/edit`} component={TaskEdit} />
				<Route path={`${url}/:uuid`} component={TaskShow} />
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
				<Route path={`${url}/authorizationGroups/:uuid/edit`} component={AuthorizationGroupEdit} />
				<Route path={`${url}/authorizationGroups/:uuid`} component={AuthorizationGroupShow} />
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
				this.props.currentUser.isNewUser() ? (
					<Switch>
						<Route exact path={`${url}/`} component={OnboardingShow} />
						<Route path={`${url}/edit`} component={OnboardingEdit} />
					</Switch>
				) : ( // Redirect to home if user account exists already. Some users bookmark the onboarding - the very first page they hit
					<Redirect to="/"/>
				)
		)}
		/>
		<Route path="*" component={PageMissing} />
	</Switch>
	)
  }
}

const Routing = (props) => (
  <AppContext.Consumer>
	{context =>
	  <BaseRouting currentUser={context.currentUser} {...props} />
	}
  </AppContext.Consumer>
)

export default Routing
