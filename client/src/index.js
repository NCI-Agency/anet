import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

import 'core-js/shim'
import 'locale-compare-polyfill'
import './utils'

import React from 'react'
import ReactDOM from 'react-dom'
import {Router, Route, IndexRoute, browserHistory} from 'react-router'
import {InjectablesProvider} from 'react-injectables'

import App from 'pages/App'
import Home from 'pages/Home'
import Search from 'pages/Search'
import PageMissing from 'pages/PageMissing'

import ReportNew from 'pages/reports/New'
import ReportShow from 'pages/reports/Show'
import ReportEdit from 'pages/reports/Edit'
import ReportMinimal from 'pages/reports/Minimal'
import MyReports from 'pages/reports/MyReports'

import PersonShow from 'pages/people/Show'
import PersonNew from 'pages/people/New'
import PersonEdit from 'pages/people/Edit'

import TaskShow from 'pages/tasks/Show'
import TaskNew from 'pages/tasks/New'
import TaskEdit from 'pages/tasks/Edit'

import OrganizationShow from 'pages/organizations/Show'
import OrganizationNew from 'pages/organizations/New'
import OrganizationEdit from 'pages/organizations/Edit'

import LocationShow from 'pages/locations/Show'
import LocationEdit from 'pages/locations/Edit'
import LocationNew from 'pages/locations/New'

import PositionShow from 'pages/positions/Show'
import PositionEdit from 'pages/positions/Edit'
import PositionNew from 'pages/positions/New'

import RollupShow from 'pages/rollup/Show'

import AdminIndex from 'pages/admin/Index'
import MergePeople from 'pages/admin/MergePeople'
import AuthorizationGroups from 'pages/admin/AuthorizationGroups'

import GraphiQL from 'pages/GraphiQL'

import OnboardingShow from 'pages/onboarding/Show'
import OnboardingEdit from 'pages/onboarding/Edit'

import InsightsShow from  'pages/insights/Show'

import AuthorizationGroupShow from 'pages/admin/authorizationgroup/Show'
import AuthorizationGroupEdit from 'pages/admin/authorizationgroup/Edit'
import AuthorizationGroupNew from 'pages/admin/authorizationgroup/New'

import Help from 'pages/Help'

ReactDOM.render((
	<InjectablesProvider>
		<Router history={browserHistory} onUpdate={jumpToTop}>
			<Route path="/" component={App}>
				<IndexRoute component={Home} />
				<Route path="search" component={Search} />

				<Route path="reports">
					<Route path="new" component={ReportNew} />
					<Route path=":id/edit" component={ReportEdit} />
					<Route path=":id/min" component={ReportMinimal} />
					<Route path="mine" component={MyReports} />
					<Route path=":id" component={ReportShow} />
				</Route>

				<Route path="people">
					<Route path="new" component={PersonNew} />
					<Route path=":id/edit" component={PersonEdit} />
					<Route path=":id" component={PersonShow} />
				</Route>

				<Route path="organizations">
					<Route path="new" component={OrganizationNew} />
					<Route path=":id/edit" component={OrganizationEdit} />
					<Route path=":id(/:action)" component={OrganizationShow} />
				</Route>

				<Route path="locations">
					<Route path="new" component={LocationNew} />
					<Route path=":id/edit" component={LocationEdit} />
					<Route path=":id" component={LocationShow} />
				</Route>

				<Route path="positions">
					<Route path="new" component={PositionNew} />
					<Route path=":id/edit" component={PositionEdit} />
					<Route path=":id" component={PositionShow} />
				</Route>

				<Route path="tasks">
					<Route path="new" component={TaskNew} />
					<Route path=":id/edit" component={TaskEdit} />
					<Route path=":id" component={TaskShow} />
				</Route>

				<Route path="rollup" component={RollupShow} />

				<Route path="graphiql" component={GraphiQL} />

				<Route path="admin/mergePeople" component={MergePeople} />
				<Route path="admin/authorizationGroups" component={AuthorizationGroups} />
				<Route path="admin/authorizationGroups/new" component={AuthorizationGroupNew} />
				<Route path="admin/authorizationGroups(/:id)/edit" component={AuthorizationGroupEdit} />
				<Route path="admin/authorizationGroups(/:id)" component={AuthorizationGroupShow} />
				<Route path="admin" component={AdminIndex} />

				<Route path="onboarding">
					<IndexRoute component={OnboardingShow} />
					<Route path="edit" component={OnboardingEdit} />
				</Route>

				<Route path="help" component={Help} />

				<Route path="insights">
					<Route path=":insight" component={InsightsShow} />
				</Route>

				<Route path="*" component={PageMissing} />
			</Route>
		</Router>
	</InjectablesProvider>
), document.getElementById('root'))

function jumpToTop() {
	window.scrollTo(0,0)
}
