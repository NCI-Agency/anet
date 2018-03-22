import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

import 'core-js/shim'
import 'locale-compare-polyfill'
import './utils'

import React from 'react'
import ReactDOM from 'react-dom'
import {Route, Switch} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
//import {InjectablesProvider} from 'react-injectables'  FIXME: React16

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

import API from 'api'
import Help from 'pages/Help'

window.onerror = function(message, url, lineNumber, columnNumber) {
	API.logOnServer('ERROR', url, lineNumber+":"+columnNumber, message)
	return false
  }

ReactDOM.render((
//	<InjectablesProvider> FIXME: React16
		<BrowserRouter onUpdate={jumpToTop}>
			<App>
			<Switch>
				<Route exact path="/" component={Home} />
				<Route path="search" component={Search} />
			</Switch>
			</App>
		</BrowserRouter>
//	</InjectablesProvider>  FIXME: React16
), document.getElementById('root'))

function jumpToTop() {
	window.scrollTo(0,0)
}
